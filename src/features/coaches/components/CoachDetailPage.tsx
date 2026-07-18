'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Section } from '@/components/ui';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { trackSelectContent } from '@/lib/analytics';
import { formatKstMonthDay, kstDayDiff } from '@/lib/kst';
import { isLightColor, shortenSeasonName } from '@/lib/utils';

import { fetchCoachFull } from '../api-prisma';
import CoachAboutCard from './CoachAboutCard';
import CoachDetailSkeleton from './CoachDetailSkeleton';
import CoachSeasonStats from './CoachSeasonStats';

interface CoachDetailPageProps {
  coachId: number;
}

function CoachDetailPageInner({ coachId }: CoachDetailPageProps) {
  const { data: full } = useGoalSuspenseQuery(fetchCoachFull, [coachId]);
  const coach = full?.coach;
  const overview = full?.overview;
  const currentTeamVerified = full?.current_team_verified;
  const trophies = overview?.trophies;

  // 현재 팀(또는 최신 팀) 기준 경기 결과 통계
  const currentTeamStats = useMemo(() => {
    const targetTeamId =
      currentTeamVerified?.team_id ??
      coach?.team_coach_history?.[0]?.team_id ??
      null;
    if (!targetTeamId || !coach?.match_coaches) return null;

    const matches = coach.match_coaches.filter(
      (mc) =>
        mc.team_id === targetTeamId &&
        (mc.role === 'head' || mc.role === 'head_coach') &&
        mc.match.home_score != null &&
        mc.match.away_score != null
    );
    if (matches.length === 0) return null;

    let wins = 0;
    let pkWins = 0;
    let pkLosses = 0;
    let losses = 0;
    let counted = 0;

    for (const mc of matches) {
      const m = mc.match;
      if (m.home_score == null || m.away_score == null) continue;
      const isHome = m.home_team_id === targetTeamId;
      const teamScore = isHome ? m.home_score : m.away_score;
      const oppScore = isHome ? m.away_score : m.home_score;

      if (teamScore > oppScore) {
        wins++;
        counted++;
      } else if (teamScore < oppScore) {
        losses++;
        counted++;
      } else {
        // 동점 → 승부차기 결과가 있는 경기만 카운트
        const pkTeam = isHome ? m.penalty_home_score : m.penalty_away_score;
        const pkOpp = isHome ? m.penalty_away_score : m.penalty_home_score;
        if (pkTeam != null && pkOpp != null) {
          if (pkTeam > pkOpp) pkWins++;
          else if (pkTeam < pkOpp) pkLosses++;
          counted++;
        }
        // PK 결과 없는 동점 경기는 아직 미방영이므로 제외
      }
    }

    if (counted === 0) return null;

    return {
      teamId: targetTeamId,
      teamName:
        currentTeamVerified?.team_name ??
        coach.team_coach_history?.[0]?.team?.team_name ??
        '-',
      matches: counted,
      wins,
      pkWins,
      pkLosses,
      losses,
    };
  }, [coach?.match_coaches, coach?.team_coach_history, currentTeamVerified]);

  // Derive team color from current team or last team in history
  const activeTeam = useMemo(() => {
    const history = coach?.team_coach_history ?? [];
    // current_team_verified가 있으면 history에서 해당 팀을 찾음
    if (currentTeamVerified) {
      const found = history.find(
        (h) => h.team_id === currentTeamVerified.team_id
      );
      if (found?.team) {
        return {
          team_id: found.team.team_id,
          team_name: currentTeamVerified.team_name,
          logo: currentTeamVerified.logo,
          primary_color: found.team.primary_color ?? null,
          secondary_color: found.team.secondary_color ?? null,
        };
      }
      return {
        team_id: currentTeamVerified.team_id,
        team_name: currentTeamVerified.team_name,
        logo: currentTeamVerified.logo,
        primary_color: null as string | null,
        secondary_color: null as string | null,
      };
    }
    // 현재 팀이 없으면 가장 최근 history에서 가져옴
    const latest = history[0];
    if (latest?.team) {
      return {
        team_id: latest.team.team_id,
        team_name: latest.team.team_name,
        logo: latest.team.logo ?? null,
        primary_color: latest.team.primary_color ?? null,
        secondary_color: latest.team.secondary_color ?? null,
      };
    }
    return null;
  }, [coach?.team_coach_history, currentTeamVerified]);

  // 경력 병합: 같은 team_id가 연속되면 하나로 합침
  const mergedCareer = useMemo(() => {
    const history = coach?.team_coach_history ?? [];
    if (history.length === 0) return [];

    // history는 이미 start_date desc 정렬됨
    type MergedItem = {
      team_id: number;
      team: (typeof history)[0]['team'];
      role: string;
      start_date: Date;
      end_date: Date | null;
      is_current: boolean;
      seasons: string[];
    };

    const merged: MergedItem[] = [];
    const normalizeRole = (r: string) =>
      r === 'head' || r === 'head_coach' ? 'head' : r;

    for (const item of history) {
      const prev = merged[merged.length - 1];
      if (
        prev &&
        prev.team_id === item.team_id &&
        normalizeRole(prev.role) === normalizeRole(item.role)
      ) {
        prev.start_date = item.start_date;
        if (item.season?.season_name) {
          prev.seasons.push(shortenSeasonName(item.season.season_name));
        }
      } else {
        merged.push({
          team_id: item.team_id,
          team: item.team,
          role: item.role,
          start_date: item.start_date,
          end_date: item.end_date,
          is_current: item.is_current === true,
          seasons: item.season?.season_name
            ? [shortenSeasonName(item.season.season_name)]
            : [],
        });
      }
    }
    return merged;
  }, [coach?.team_coach_history]);

  if (!coach) {
    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white p-12 text-center">
          <p className="text-red-500">감독 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const isNearWhite = (hex: string | null | undefined) =>
    isLightColor(hex, 240);
  const headerBg = isNearWhite(activeTeam?.primary_color)
    ? activeTeam?.secondary_color && !isNearWhite(activeTeam.secondary_color)
      ? activeTeam.secondary_color
      : '#1F2937'
    : activeTeam?.primary_color || '#1F2937';
  const light = isLightColor(headerBg);
  const headerText = light ? '#111827' : '#FFFFFF';
  const headerSub = light ? '#4B5563' : 'rgba(255,255,255,0.7)';

  const totalMatches = overview?.total_matches ?? coach.match_coaches.length;
  const totals = (overview?.season_stats ?? []).reduce(
    (acc: { wins: number; losses: number; matches: number }, s) => ({
      wins: acc.wins + (s.wins ?? 0),
      losses: acc.losses + (s.losses ?? 0),
      matches: acc.matches + (s.matches_played ?? 0),
    }),
    { wins: 0, losses: 0, matches: 0 }
  );
  const winRate =
    totals.matches > 0 ? Math.round((totals.wins / totals.matches) * 100) : 0;

  return (
    <Section padding="sm">
      <div className="mb-6">
        <Link
          href="/coaches"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          감독 목록
        </Link>
        <h1 className="text-2xl font-bold">감독 상세 정보</h1>
      </div>
      <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left column: Header card + tabs */}
          <div className="order-1 space-y-4 lg:order-none lg:col-span-2">
            {/* Header card */}
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
              {/* Team color banner */}
              <div
                className="px-6 pb-5 pt-8 sm:px-8"
                style={{ backgroundColor: headerBg }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full"
                    style={{ border: `2px solid ${headerSub}` }}
                  >
                    {coach.profile_image_url ? (
                      <Image
                        src={coach.profile_image_url}
                        alt={`${coach.name} 프로필`}
                        fill
                        sizes="80px"
                        className="object-cover object-top"
                        priority
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-xl font-medium"
                        style={{
                          color: headerSub,
                          backgroundColor: 'rgba(0,0,0,0.1)',
                        }}
                      >
                        {coach.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2
                      className="truncate font-medium"
                      style={{
                        color: headerText,
                        fontSize: '28px',
                        lineHeight: '28px',
                      }}
                    >
                      {coach.name}
                    </h2>
                    <div className="mt-2 flex items-center gap-1.5">
                      {activeTeam?.logo && (
                        <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full ring-1 ring-white/60">
                          <Image
                            src={activeTeam.logo}
                            alt="팀"
                            fill
                            sizes="16px"
                            className="object-cover"
                          />
                        </span>
                      )}
                      <span
                        className="truncate"
                        style={{ color: headerSub, fontSize: '14px' }}
                      >
                        {activeTeam?.team_name ??
                          (currentTeamVerified
                            ? currentTeamVerified.team_name
                            : '소속 없음')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info section — FotMob style: 기본정보(좌) + 현재팀 통계(우) */}
              <div className="flex flex-col divide-y divide-gray-100 sm:flex-row sm:divide-x sm:divide-y-0">
                {/* Left: 기본 정보 + 전체 통계 */}
                <div className="flex-1 divide-y divide-gray-100">
                  <div className="grid grid-cols-2 divide-x divide-gray-100">
                    <div className="px-6 py-4 sm:px-8">
                      <p className="text-[16px] text-gray-900">
                        {totalMatches}경기
                      </p>
                      <p className="text-[13px] text-[#9F9F9F]">
                        {totals.wins}승 {totals.losses}패 · 승률 {winRate}%
                      </p>
                    </div>
                    <div className="px-6 py-4 sm:px-8">
                      <p className="text-[16px] text-gray-900">
                        {coach.nationality ?? '-'}
                      </p>
                      <p className="text-[13px] text-[#9F9F9F]">국적</p>
                    </div>
                  </div>
                </div>

                {/* Right: 현재 팀 통계 */}
                {currentTeamStats && (
                  <div className="flex-1 px-6 py-5 sm:px-8">
                    <p className="text-[15px] font-medium text-gray-900">
                      {currentTeamStats.teamName}
                    </p>
                    <div className="mt-3 flex items-start gap-5">
                      <div className="text-center">
                        <p className="text-[28px] font-medium leading-none text-gray-900">
                          {currentTeamStats.matches}
                        </p>
                        <p className="mt-1 text-[12px] text-[#9F9F9F]">경기</p>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-[56px] shrink-0 text-[12px] text-gray-600">
                            승리
                          </span>
                          <span className="w-6 text-right text-[12px] font-medium text-gray-900">
                            {currentTeamStats.wins}
                          </span>
                          <div className="h-2 flex-1 rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-green-500"
                              style={{
                                width: `${currentTeamStats.matches > 0 ? (currentTeamStats.wins / currentTeamStats.matches) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-[56px] shrink-0 text-[12px] text-gray-600">
                            PK승
                          </span>
                          <span className="w-6 text-right text-[12px] font-medium text-gray-900">
                            {currentTeamStats.pkWins}
                          </span>
                          <div className="h-2 flex-1 rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-blue-400"
                              style={{
                                width: `${currentTeamStats.matches > 0 ? (currentTeamStats.pkWins / currentTeamStats.matches) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-[56px] shrink-0 text-[12px] text-gray-600">
                            PK패
                          </span>
                          <span className="w-6 text-right text-[12px] font-medium text-gray-900">
                            {currentTeamStats.pkLosses}
                          </span>
                          <div className="h-2 flex-1 rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-orange-400"
                              style={{
                                width: `${currentTeamStats.matches > 0 ? (currentTeamStats.pkLosses / currentTeamStats.matches) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-[56px] shrink-0 text-[12px] text-gray-600">
                            패배
                          </span>
                          <span className="w-6 text-right text-[12px] font-medium text-gray-900">
                            {currentTeamStats.losses}
                          </span>
                          <div className="h-2 flex-1 rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-red-500"
                              style={{
                                width: `${currentTeamStats.matches > 0 ? (currentTeamStats.losses / currentTeamStats.matches) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Trophies row */}
              {trophies && trophies.items.length > 0 && (
                <div className="border-t border-gray-100 px-6 py-4 sm:px-8">
                  <p className="text-[13px] text-[#9F9F9F]">우승 기록</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {trophies.items.map((it) => (
                      <span
                        key={it.season_id}
                        className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[13px] font-medium text-amber-800"
                      >
                        🏆{' '}
                        {shortenSeasonName(
                          it.season_name.replace(/골때리는 그녀들/g, '').trim()
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Current team link */}
              {currentTeamVerified && (
                <Link
                  href={`/teams/${currentTeamVerified.team_id}`}
                  className="flex items-center gap-3 border-t border-gray-100 px-6 py-4 transition-colors hover:bg-gray-50 sm:px-8"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
                    {currentTeamVerified.logo ? (
                      <Image
                        src={currentTeamVerified.logo}
                        alt={currentTeamVerified.team_name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-400">
                        {currentTeamVerified.team_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-medium text-gray-900">
                      {currentTeamVerified.team_name}
                    </p>
                    <p className="text-[13px] text-[#9F9F9F]">현재 소속 팀</p>
                  </div>
                </Link>
              )}
            </div>

            {/* Win rate by team chart */}
            {overview && overview.season_stats.length > 0 && (
              <CoachWinRateByTeam
                seasonStats={overview.season_stats}
                teamHistory={coach.team_coach_history}
              />
            )}

            {/* Next match */}
            <CoachNextMatchCard
              nextMatch={full?.next_match}
              currentTeamId={currentTeamVerified?.team_id}
            />

            {/* Match history */}
            <CoachMatchHistory matches={coach.match_coaches} />

            {/* Season stats */}
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
              <div className="px-6 py-4">
                <p className="text-[18px] font-medium text-gray-900">
                  시즌별 통계
                </p>
              </div>
              <CoachSeasonStats
                coachId={coachId}
                stats={overview?.season_stats}
              />
            </div>

            {/* About card */}
            <CoachAboutCard about={coach.about} />
          </div>

          {/* Right column: Career */}
          <div className="order-2 space-y-4 lg:order-none lg:col-span-1">
            {/* Career card */}
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
              <div className="border-b border-gray-100 px-6 py-4">
                <p className="text-[16px] font-medium text-gray-900">경력</p>
              </div>
              <div className="divide-y divide-gray-100">
                {mergedCareer.map((item, idx) => (
                  <Link
                    key={`${item.team_id}-${idx}`}
                    href={`/teams/${item.team_id}`}
                    className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100">
                      {item.team?.logo ? (
                        <Image
                          src={item.team.logo}
                          alt={item.team.team_name}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-medium text-gray-400">
                          {item.team?.team_name?.charAt(0) ?? '?'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-medium text-gray-900">
                          {item.team?.team_name ?? '-'}
                        </p>
                        {item.is_current && (
                          <span className="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                            현재
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[#9F9F9F]">
                        {new Date(item.start_date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                        })}
                        {item.is_current
                          ? ' - 현재'
                          : item.end_date
                            ? ` - ${new Date(item.end_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })}`
                            : ''}
                        <span className="mx-1">·</span>
                        {item.role === 'head' || item.role === 'head_coach'
                          ? '감독'
                          : '코치'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Trophies by team card */}
            {trophies && trophies.items.length > 0 && (
              <CoachTrophiesByTeam trophies={trophies} />
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

/** 감독의 현재 팀 기준 다음 미완료 경기 카드 — 경기 프리뷰·감독 맞대결 딥링크 제공 */
function CoachNextMatchCard({
  nextMatch,
  currentTeamId,
}: {
  nextMatch: import('@/lib/types/database').CoachNextMatch | null | undefined;
  currentTeamId: number | null | undefined;
}) {
  // D-day는 시간 의존이라 마운트 후에만 계산 (하이드레이션 불일치 방지)
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  if (!now || !nextMatch || currentTeamId == null) return null;

  const isHome = nextMatch.home_team_id === currentTeamId;
  const ownTeam = isHome ? nextMatch.home_team : nextMatch.away_team;
  const opponent = isHome ? nextMatch.away_team : nextMatch.home_team;
  if (!ownTeam || !opponent) return null;

  const dday = kstDayDiff(nextMatch.match_date, now);
  if (dday < 0) return null;

  const track = (destination: string) =>
    trackSelectContent({ module: 'coach_next_match', destination });

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <p className="text-[18px] font-medium text-gray-900">다음 경기</p>
        <span className="text-sm font-semibold text-amber-600">
          {dday === 0 ? 'D-day' : `D-${dday}`}
        </span>
      </div>
      <div className="px-6 pb-5">
        <p className="text-sm text-gray-700">
          {formatKstMonthDay(nextMatch.match_date)} · {ownTeam.team_name}{' '}
          <span className="text-gray-400">vs</span> {opponent.team_name}
        </p>
        <div className="mt-3 flex gap-2">
          <Link
            href={`/matches/${nextMatch.match_id}#summary`}
            onClick={() => track('match_preview')}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            경기 프리뷰
          </Link>
          <Link
            href={`/matches/${nextMatch.match_id}#stats`}
            onClick={() => track('coach_h2h')}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            감독 맞대결 전적
          </Link>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;

function CoachMatchHistory({
  matches,
}: {
  matches: import('@/lib/types/database').CoachDetail['match_coaches'];
}) {
  // 최신순 정렬, head/head_coach role만, 결과 확정 경기만
  const sorted = useMemo(() => {
    return [...matches]
      .filter((mc) => {
        if (mc.role !== 'head' && mc.role !== 'head_coach') return false;
        const m = mc.match;
        if (m.home_score == null || m.away_score == null) return false;
        // 동점인데 PK 결과 없는 경기는 미방영이므로 제외
        if (
          m.home_score === m.away_score &&
          m.penalty_home_score == null &&
          m.penalty_away_score == null
        )
          return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.match.match_date).getTime() -
          new Date(a.match.match_date).getTime()
      );
  }, [matches]);

  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const visible = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (sorted.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      <div className="px-6 py-4">
        <p className="text-[18px] font-medium text-gray-900">경기 통계</p>
      </div>

      <div className="divide-y divide-gray-100">
        {visible.map((mc) => {
          const m = mc.match;
          const isHome = m.home_team_id === mc.team_id;
          const teamScore = isHome ? m.home_score! : m.away_score!;
          const oppScore = isHome ? m.away_score! : m.home_score!;
          const opponent = isHome ? m.away_team : m.home_team;
          const pkTeam = isHome ? m.penalty_home_score : m.penalty_away_score;
          const pkOpp = isHome ? m.penalty_away_score : m.penalty_home_score;

          let result: 'W' | 'L' | 'D' = 'D';
          let resultLabel = '무';
          if (teamScore > oppScore) {
            result = 'W';
            resultLabel = '승';
          } else if (teamScore < oppScore) {
            result = 'L';
            resultLabel = '패';
          } else if (pkTeam != null && pkOpp != null) {
            if (pkTeam > pkOpp) {
              result = 'W';
              resultLabel = 'PK승';
            } else if (pkTeam < pkOpp) {
              result = 'L';
              resultLabel = 'PK패';
            }
          }

          const resultColor =
            result === 'W'
              ? 'bg-green-500'
              : result === 'L'
                ? 'bg-red-500'
                : 'bg-gray-400';

          const date = new Date(m.match_date);
          const isThisYear = date.getFullYear() === new Date().getFullYear();
          const dateStr = isThisYear
            ? `${date.getMonth() + 1}월 ${date.getDate()}일`
            : `${date.getFullYear().toString().slice(2)}.${date.getMonth() + 1}.${date.getDate()}`;

          const scoreText = `${m.home_score} - ${m.away_score}`;
          const pkText =
            m.penalty_home_score != null && m.penalty_away_score != null
              ? ` (${m.penalty_home_score}-${m.penalty_away_score})`
              : '';

          return (
            <Link
              key={mc.id}
              href={`/matches/${m.match_id}`}
              className="flex items-center gap-2 px-4 py-2.5 transition-colors hover:bg-gray-50 sm:px-6 sm:gap-3"
            >
              {/* Result dot */}
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${resultColor}`}
              />
              {/* Date */}
              <span className="w-[52px] shrink-0 text-[12px] text-[#9F9F9F] sm:w-[60px] sm:text-[13px]">
                {dateStr}
              </span>
              {/* Opponent */}
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                {opponent?.logo && (
                  <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={opponent.logo}
                      alt={opponent.team_name}
                      fill
                      sizes="20px"
                      className="object-cover"
                    />
                  </span>
                )}
                <span className="truncate text-[13px] text-gray-900 sm:text-[14px]">
                  {opponent?.team_name ?? '-'}
                </span>
              </div>
              {/* Result label */}
              <span
                className={`shrink-0 text-[12px] font-medium sm:text-[13px] ${
                  result === 'W'
                    ? 'text-green-600'
                    : result === 'L'
                      ? 'text-red-600'
                      : 'text-gray-500'
                }`}
              >
                {resultLabel}
              </span>
              {/* Score */}
              <span className="w-[50px] shrink-0 text-right text-[13px] font-medium text-gray-900 sm:w-[70px] sm:text-[14px]">
                {scoreText}
                {pkText && (
                  <span className="text-[10px] text-gray-400 sm:text-[11px]">
                    {pkText}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
            className="flex items-center gap-1 text-[13px] font-medium text-gray-600 transition-colors hover:text-gray-900 disabled:text-gray-300"
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </button>
          <span className="text-[12px] text-[#9F9F9F]">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1 text-[13px] font-medium text-gray-600 transition-colors hover:text-gray-900 disabled:text-gray-300"
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function CoachTrophiesByTeam({
  trophies,
}: {
  trophies: import('@/lib/types/database').CoachTrophies;
}) {
  // 팀별로 그룹핑
  const grouped = useMemo(() => {
    const map = new Map<
      number,
      {
        team_id: number;
        team_name: string;
        team_logo: string | null;
        items: Array<{ season_id: number; season_name: string }>;
      }
    >();

    for (const it of trophies.items) {
      const teamId = it.team_id ?? 0;
      const existing = map.get(teamId);
      if (existing) {
        existing.items.push({
          season_id: it.season_id,
          season_name: it.season_name,
        });
      } else {
        map.set(teamId, {
          team_id: teamId,
          team_name: it.team_name ?? 'Unknown',
          team_logo: it.team_logo ?? null,
          items: [{ season_id: it.season_id, season_name: it.season_name }],
        });
      }
    }

    return Array.from(map.values());
  }, [trophies.items]);

  if (grouped.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      <div className="border-b border-gray-100 px-6 py-4">
        <p className="text-[16px] font-medium text-gray-900">
          트로피 ({trophies.total})
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {grouped.map((g) => (
          <div key={g.team_id} className="px-6 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-gray-100">
                {g.team_logo ? (
                  <Image
                    src={g.team_logo}
                    alt={g.team_name}
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-gray-400">
                    {g.team_name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-[14px] font-medium text-gray-900">
                {g.team_name}
              </span>
            </div>
            <div className="mt-2 ml-[38px] flex flex-wrap gap-1.5">
              {g.items.map((it) => (
                <span
                  key={it.season_id}
                  className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[12px] font-medium text-amber-800"
                >
                  🏆{' '}
                  {shortenSeasonName(
                    it.season_name.replace(/골때리는 그녀들/g, '').trim()
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CHART_HEIGHT = 140;
const BADGE_AREA_TOP = 10;
const BADGE_AREA_BOTTOM = 55;

type TeamHistoryEntry = {
  team_id: number;
  team: {
    team_id: number;
    team_name: string;
    logo: string | null;
    primary_color: string | null;
    secondary_color: string | null;
  };
};

function CoachWinRateByTeam({
  seasonStats,
  teamHistory,
}: {
  seasonStats: NonNullable<
    ReturnType<typeof import('../api-prisma').fetchCoachFull> extends Promise<
      infer T
    >
      ? T
      : never
  >['overview']['season_stats'];
  teamHistory: TeamHistoryEntry[];
}) {
  // 팀 색상 맵 (team_id → color)
  const teamColorMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const h of teamHistory) {
      if (h.team && !map.has(h.team_id)) {
        const pc = h.team.primary_color;
        const sc = h.team.secondary_color;
        const color = isLightColor(pc)
          ? sc && !isLightColor(sc)
            ? sc
            : '#3B82F6'
          : pc || '#3B82F6';
        map.set(h.team_id, color);
      }
    }
    return map;
  }, [teamHistory]);

  // 시즌 순서대로 연속 팀 병합 (연속되지 않으면 별도 항목)
  const chartItems = useMemo(() => {
    type Item = {
      key: string;
      team_id: number;
      team_name: string;
      logo: string | null;
      color: string;
      matches: number;
      wins: number;
      losses: number;
    };
    const items: Item[] = [];

    // seasonStats는 season_id asc 정렬됨
    // 멀티팀 시즌은 각 팀별로 별도 항목 (통계는 시즌 전체를 팀 수로 균등 분배하지 않고 첫 팀에만 귀속)
    for (const s of seasonStats) {
      const teams = s.teams_detailed ?? [];
      if (teams.length === 0) continue;

      // 단일 팀 시즌 또는 첫 번째 팀
      for (let ti = 0; ti < teams.length; ti++) {
        const t = teams[ti];
        const prev = items[items.length - 1];
        if (prev && prev.team_id === t.team_id) {
          // 연속 같은 팀 → 병합 (첫 번째 팀만 통계 합산)
          if (ti === 0) {
            prev.matches += s.matches_played ?? 0;
            prev.wins += s.wins ?? 0;
            prev.losses += s.losses ?? 0;
          }
        } else {
          items.push({
            key: `${t.team_id}-${s.season_id}`,
            team_id: t.team_id,
            team_name: t.team_name,
            logo: t.logo,
            color: teamColorMap.get(t.team_id) ?? '#1F2937',
            matches: ti === 0 ? (s.matches_played ?? 0) : 0,
            wins: ti === 0 ? (s.wins ?? 0) : 0,
            losses: ti === 0 ? (s.losses ?? 0) : 0,
          });
        }
      }
    }

    return items.map((it) => ({
      ...it,
      win_rate: it.matches > 0 ? Math.round((it.wins / it.matches) * 100) : 0,
      ppg: it.matches > 0 ? ((it.wins * 3) / it.matches).toFixed(1) : '0.0',
    }));
  }, [seasonStats, teamColorMap]);

  const [startIdx, setStartIdx] = useState(() =>
    Math.max(
      chartItems.length -
        (typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 6),
      0
    )
  );
  const visibleCount =
    typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 6;
  const visible = chartItems.slice(startIdx, startIdx + visibleCount);
  const canPrev = startIdx > 0;
  const canNext = startIdx + visibleCount < chartItems.length;

  if (chartItems.length === 0) return null;

  const getTop = (winRate: number) => {
    const range = CHART_HEIGHT - BADGE_AREA_TOP - BADGE_AREA_BOTTOM;
    return BADGE_AREA_TOP + range * (1 - winRate / 100);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      <div className="px-6 py-4">
        <p className="text-[18px] font-medium text-gray-900">팀별 승률</p>
        <p className="text-[13px] text-[#9F9F9F]">경기당 승점</p>
      </div>

      <div className="relative px-2">
        {canPrev && (
          <button
            onClick={() => setStartIdx((s) => Math.max(s - 1, 0))}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-colors hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
        )}
        {canNext && (
          <button
            onClick={() =>
              setStartIdx((s) =>
                Math.min(s + 1, chartItems.length - visibleCount)
              )
            }
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-colors hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        )}

        <div
          className="mx-6 rounded-xl bg-gray-50 overflow-visible"
          style={{ height: CHART_HEIGHT }}
        >
          <div className="relative flex h-full">
            {visible.map((t) => {
              const top = getTop(t.win_rate);
              return (
                <div
                  key={t.key}
                  className="group relative flex-1 rounded-lg transition-colors hover:bg-gray-100/80 cursor-pointer"
                >
                  {/* Tooltip */}
                  <div
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-20 hidden group-hover:flex flex-col items-center"
                    style={{ top: top - 75 }}
                  >
                    <div className="rounded-lg bg-white px-4 py-2 shadow-lg border border-gray-200 flex flex-col items-center w-max">
                      <p className="text-[15px] font-medium text-gray-900 whitespace-nowrap">
                        {t.team_name}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] font-bold text-gray-900 whitespace-nowrap">
                        <span>
                          <span className="mr-0.5 rounded bg-green-500 px-1.5 py-0.5 text-[12px] text-white">
                            승
                          </span>{' '}
                          {t.wins}
                        </span>
                        <span>
                          <span className="mr-0.5 rounded bg-red-500 px-1.5 py-0.5 text-[12px] text-white">
                            패
                          </span>{' '}
                          {t.losses}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-1.5 rotate-45 bg-white border-b border-r border-gray-200 -mt-1" />
                  </div>

                  <div
                    className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
                    style={{ top }}
                  >
                    <span
                      className="rounded-md px-3 py-1 text-[14px] font-bold text-white whitespace-nowrap"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.win_rate}%
                    </span>
                    <span className="mt-1 rounded-md bg-white px-2.5 py-0.5 text-[13px] font-medium text-gray-500 whitespace-nowrap shadow-sm">
                      {t.ppg} 승점
                    </span>
                  </div>
                  <div
                    className="absolute left-1/2 bottom-0 w-0.5 -translate-x-1/2 rounded-full"
                    style={{
                      height: Math.max(CHART_HEIGHT - top - 60, 0),
                      backgroundColor: t.color,
                      opacity: 0.3,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team logos + names */}
      <div className="px-8 py-3">
        <div className="flex">
          {visible.map((t) => (
            <Link
              key={`logo-${t.key}`}
              href={`/teams/${t.team_id}`}
              className="flex flex-1 flex-col items-center transition-opacity hover:opacity-80"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
                {t.logo ? (
                  <Image
                    src={t.logo}
                    alt={t.team_name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] font-medium text-gray-400">
                    {t.team_name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="mt-1.5 text-[13px] font-medium text-gray-700 truncate max-w-full text-center">
                {t.team_name}
              </span>
              <span className="text-[11px] text-[#9F9F9F]">
                {t.matches}경기
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const CoachDetailPage: React.FC<CoachDetailPageProps> = ({ coachId }) => {
  return (
    <GoalWrapper fallback={<CoachDetailSkeleton />}>
      <CoachDetailPageInner coachId={coachId} />
    </GoalWrapper>
  );
};

export default CoachDetailPage;
