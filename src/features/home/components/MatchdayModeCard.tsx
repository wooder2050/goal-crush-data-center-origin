'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { trackSelectContent } from '@/lib/analytics';

import { findMatchdayMatch, isMatchCompleted } from '../matchday';
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

  useEffect(() => {
    setNow(new Date());
  }, []);

  if (!now) return null;

  const match = findMatchdayMatch(matches, now);
  if (!match || !match.home_team || !match.away_team) return null;

  const completed = isMatchCompleted(match);
  const matchState = completed ? 'completed' : 'pre_or_live';
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
            경기 기록과 요약은 내일 오전에 공개됩니다
          </p>
        </>
      )}
    </div>
  );
}
