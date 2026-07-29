'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { trackSelectContent, trackViewContent } from '@/lib/analytics';

import { findMatchdayMatch, isMatchCompleted, isSameKstDay } from '../matchday';
import type { HomeMatch } from '../types';

interface MatchdayModeCardProps {
  matches: HomeMatch[];
}

/**
 * 매치데이 모드 카드 — 경기일 KST 18:00 ~ 다음날 12:00에만 노출.
 * 방송 전·중: "궁금한 것 3개" 딥링크 + 다음날 업데이트 예고
 * 경기 기록 반영 후: 결과 + 요약 CTA
 * 시간 판정은 클라이언트에서만 수행 (ISR 캐시·하이드레이션 불일치 방지).
 */
export default function MatchdayModeCard({ matches }: MatchdayModeCardProps) {
  const [now, setNow] = useState<Date | null>(null);

  // 18시/12시 경계를 넘겨도 열려 있는 페이지가 갱신되도록 1분마다 재판정
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const match = now ? findMatchdayMatch(matches, now) : null;
  const completed = match ? isMatchCompleted(match) : false;
  const matchState = completed ? 'completed' : 'pre_or_live';
  const matchId = match ? match.match_id : null;
  const impressionKey =
    match && match.home_team && match.away_team
      ? `${match.match_id}:${matchState}`
      : null;

  const cardRef = useRef<HTMLDivElement | null>(null);
  const sentImpressions = useRef<Set<string>>(new Set());

  // 카드가 화면에 절반 이상 실제로 보였을 때 key당 1회 기록 —
  // select_content(클릭)와 짝지어 CTR 계산용. 경기 상태가 바뀌면(기록 반영)
  // 다른 카드가 보이는 것이므로 새 key로 다시 기록한다.
  useEffect(() => {
    if (!impressionKey || sentImpressions.current.has(impressionKey)) return;
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (sentImpressions.current.has(impressionKey)) return;
        sentImpressions.current.add(impressionKey);
        trackViewContent({
          module: 'matchday',
          itemId: matchId !== null ? String(matchId) : undefined,
          matchState,
        });
        observer.disconnect();
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [impressionKey, matchId, matchState]);

  if (!now || !match || !match.home_team || !match.away_team) return null;

  const home = match.home_team;
  const away = match.away_team;

  const track = (destination: string) =>
    trackSelectContent({ module: 'matchday', destination, matchState });

  const questions = [
    {
      label: '두 팀, 역대 누가 강했나?',
      href: `/stats/head-to-head?team1=${home.team_id}&team2=${away.team_id}`,
      destination: 'team_h2h',
    },
    {
      label: '두 감독의 맞대결 전적은?',
      href: `/matches/${match.match_id}#stats`,
      destination: 'coach_h2h',
    },
    {
      label: '오늘 주목할 선수는?',
      href: `/matches/${match.match_id}#summary`,
      destination: 'key_players',
    },
  ];

  return (
    <div
      id="matchday"
      ref={cardRef}
      className="mb-4 rounded-xl border border-gray-900 bg-gray-900 px-4 py-4 text-white"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">
          Matchday
        </span>
        {!completed && (
          <span className="text-xs text-gray-400">
            실시간 스코어는 제공하지 않습니다
          </span>
        )}
      </div>

      <p className="mt-2 text-base font-bold sm:text-lg">
        {home.team_name}
        {completed ? (
          <span className="mx-2 text-amber-400">
            {match.home_score}:{match.away_score}
            {match.penalty_home_score !== null &&
              match.penalty_away_score !== null && (
                <span className="ml-1 text-xs font-normal text-gray-300">
                  (승부차기 {match.penalty_home_score}:
                  {match.penalty_away_score})
                </span>
              )}
          </span>
        ) : (
          <span className="mx-2 text-gray-400">vs</span>
        )}
        {away.team_name}
      </p>

      {completed ? (
        <Link
          href={`/matches/${match.match_id}`}
          onClick={() => track('match_result')}
          className="mt-3 inline-flex items-center gap-1 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-amber-300"
        >
          경기 결과·요약 보기
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {questions.map((q) => (
              <Link
                key={q.destination}
                href={q.href}
                onClick={() => track(q.destination)}
                className="flex-1 rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-100 transition-colors hover:bg-gray-700"
              >
                {q.label}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            {isSameKstDay(match.match_date, now)
              ? '경기 기록과 요약은 내일 오전에 공개됩니다'
              : '경기 기록과 요약은 오전 중 공개됩니다'}
          </p>
        </>
      )}
    </div>
  );
}
