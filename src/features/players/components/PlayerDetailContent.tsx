'use client';
import { Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import type {
  getPlayerByIdPrisma,
  getPlayerSummaryPrisma,
} from '@/features/players/api-prisma';
import { POSITION_LABELS } from '@/lib/player-stats-utils';
import { isLightColor, shortenSeasonName } from '@/lib/utils';

import AttackPointsCard from './AttackPointsCard';
import CurrentSeasonCard from './CurrentSeasonCard';
import GoalkeeperStatsSection from './GoalkeeperStatsSection';
import MatchLogCard from './MatchLogCard';
import PassMapCard from './PassMapCard';
import PlayerAboutCard from './PlayerAboutCard';
import { PlayerDataProvider } from './PlayerDataProvider';
import { PlayerSummaryProvider } from './PlayerSummaryProvider';
import PlayerTraitsCard from './PlayerTraitsCard';
import PlayerTrophiesCard from './PlayerTrophiesCard';
import PositionPitch from './PositionPitch';
import SeasonDetailedStatsCard from './SeasonDetailedStatsCard';

type PlayerData = Awaited<ReturnType<typeof getPlayerByIdPrisma>>;
type PlayerSummaryData = Awaited<ReturnType<typeof getPlayerSummaryPrisma>>;

type PositionFreq = { position: string; matches: number };

type TeamHistoryItem = {
  team_id: number | null;
  team_name: string | null;
  logo: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active?: boolean;
};

function getMatchOutcome(gm: {
  is_home: boolean;
  home_score: number | null;
  away_score: number | null;
  penalty_home_score?: number | null;
  penalty_away_score?: number | null;
}): 'WIN' | 'DRAW' | 'LOSS' | 'PK_WIN' | 'PK_LOSS' | null {
  const hs = gm.home_score;
  const as_ = gm.away_score;
  if (hs == null || as_ == null) return null;
  const diff = gm.is_home ? hs - as_ : as_ - hs;
  if (diff > 0) return 'WIN';
  if (diff < 0) return 'LOSS';
  if (gm.penalty_home_score != null && gm.penalty_away_score != null) {
    const pkDiff = gm.is_home
      ? gm.penalty_home_score - gm.penalty_away_score
      : gm.penalty_away_score - gm.penalty_home_score;
    if (pkDiff > 0) return 'PK_WIN';
    if (pkDiff < 0) return 'PK_LOSS';
  }
  return 'DRAW';
}

export default function PlayerDetailContent({
  playerId,
  initialPlayer,
}: {
  playerId: number;
  initialPlayer?: NonNullable<PlayerData>;
}) {
  return (
    <PlayerDataProvider playerId={playerId} initialData={initialPlayer}>
      {(player) => (
        <PlayerSummaryProvider playerId={playerId}>
          {(summary) => (
            <PlayerDetailContentInner
              player={player}
              summary={summary}
              playerId={playerId}
            />
          )}
        </PlayerSummaryProvider>
      )}
    </PlayerDataProvider>
  );
}

function PlayerDetailContentInner({
  player,
  summary,
  playerId,
}: {
  player: NonNullable<PlayerData>;
  summary: NonNullable<PlayerSummaryData>;
  playerId: number;
}) {
  const [hasTraits, setHasTraits] = useState<boolean | null>(null);
  const profile = player?.profile_image_url ?? null;
  const name = player?.name ?? '-';
  const jersey = player?.jersey_number;
  const totals = summary?.totals ?? {
    goals: 0,
    assists: 0,
    appearances: 0,
    goals_conceded: 0,
  };
  const totalPenaltyGoals = useMemo(
    () =>
      (summary?.seasons ?? []).reduce(
        (acc, s) => acc + (s.penalty_goals ?? 0),
        0
      ),
    [summary?.seasons]
  );
  const seasons: string[] = useMemo(
    () =>
      (summary?.seasons ?? []).map(
        (s) => s.season_name ?? `시즌 ${s.year ?? ''}`
      ),
    [summary?.seasons]
  );
  const positions: PositionFreq[] = useMemo(
    () =>
      (summary?.positions_frequency ?? [])
        .slice()
        .sort((a, b) => b.matches - a.matches),
    [summary?.positions_frequency]
  );

  // GK/필드 겸용 판단
  const { isPrimaryGK, hasGKExperience, hasFieldExperience } = useMemo(() => {
    const totalMatches = positions.reduce((s, p) => s + p.matches, 0);
    const gkMatches = positions.find((p) => p.position === 'GK')?.matches ?? 0;
    const fieldMatches = totalMatches - gkMatches;
    const gkPct = totalMatches > 0 ? gkMatches / totalMatches : 0;
    return {
      isPrimaryGK: positions.length > 0 && positions[0].position === 'GK',
      hasGKExperience: gkPct >= 0.15, // GK 15% 이상이면 골키퍼 경험 있음
      hasFieldExperience: fieldMatches > 0 && gkPct < 0.85, // 필드 출전이 있고 GK 85% 미만
    };
  }, [positions]);

  // Merge team histories by team_name
  const mergedTeamHistory: TeamHistoryItem[] = useMemo(() => {
    const teamHistoryRaw: TeamHistoryItem[] = (summary?.team_history ??
      []) as TeamHistoryItem[];
    const map = new Map<string, { row: TeamHistoryItem; index: number }>();
    teamHistoryRaw.forEach((t, idx) => {
      const key = (t.team_name ?? '-').trim();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          row: {
            team_id: t.team_id ?? null,
            team_name: t.team_name ?? null,
            logo: t.logo ?? null,
            primary_color: t.primary_color ?? null,
            secondary_color: t.secondary_color ?? null,
            start_date: t.start_date ?? null,
            end_date: t.is_active ? null : (t.end_date ?? null),
            is_active: t.is_active === true,
          },
          index: idx,
        });
      } else {
        const r = existing.row;
        r.logo = r.logo ?? t.logo ?? null;
        r.primary_color = r.primary_color ?? t.primary_color ?? null;
        r.secondary_color = r.secondary_color ?? t.secondary_color ?? null;
        r.start_date =
          [r.start_date, t.start_date].filter(Boolean).sort()[0] || null;
        if (t.is_active) {
          r.is_active = true;
          r.end_date = null;
        } else if (!r.is_active) {
          r.end_date =
            [r.end_date, t.end_date].filter(Boolean).sort().pop() || null;
        }
      }
    });
    return Array.from(map.values())
      .sort((a, b) => {
        // 현재 활동 중인 팀을 맨 위로
        if (a.row.is_active && !b.row.is_active) return -1;
        if (!a.row.is_active && b.row.is_active) return 1;
        // 그 외에는 end_date 기준 내림차순 (최신 종료일이 위로)
        const aEnd = a.row.end_date ?? '';
        const bEnd = b.row.end_date ?? '';
        if (aEnd !== bEnd) return bEnd.localeCompare(aEnd);
        // end_date가 같으면 start_date 기준 내림차순
        const aStart = a.row.start_date ?? '';
        const bStart = b.row.start_date ?? '';
        return bStart.localeCompare(aStart);
      })
      .map((v) => v.row);
  }, [summary?.team_history]);

  const isSingleTeam = mergedTeamHistory.length === 1;
  const singleTeam = isSingleTeam ? mergedTeamHistory[0] : null;

  const activeTeam =
    mergedTeamHistory.find((t) => t.is_active) ?? mergedTeamHistory[0] ?? null;
  // 헤더 배경: 거의 흰색(brightness > 240)이면 secondary 사용
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
  // 차트/뱃지용 팀 컬러: primary가 밝으면 secondary 사용
  const teamAccent = isLightColor(activeTeam?.primary_color)
    ? activeTeam?.secondary_color && !isLightColor(activeTeam.secondary_color)
      ? activeTeam.secondary_color
      : '#3B82F6'
    : activeTeam?.primary_color || '#3B82F6';

  const seasonRows = useMemo(
    () =>
      [...(summary?.seasons ?? [])].reverse().map((s) => ({
        key: `${s.season_id ?? ''}-${s.team_id ?? ''}`,
        season: s.season_name ?? `시즌 ${s.year ?? ''}`,
        team: s.team_name ?? '-',
        team_logo: s?.team_logo ?? null,
        appearances: s.appearances ?? 0,
        goals: s.goals ?? 0,
        penalty_goals: s.penalty_goals ?? 0,
        assists: s.assists ?? 0,
        positions: s.positions ?? [],
      })),
    [summary?.seasons]
  );

  const goalMatches = useMemo(
    () => (summary?.goal_matches ?? []).slice(),
    [summary?.goal_matches]
  );

  // Team stats aggregation by team_id (handles team name changes across seasons)
  const teamStats = useMemo(() => {
    const map = new Map<
      number,
      { appearances: number; goals: number; latestName: string }
    >();
    for (const s of summary?.seasons ?? []) {
      const tid = s.team_id ?? 0;
      const existing = map.get(tid) ?? {
        appearances: 0,
        goals: 0,
        latestName: s.team_name ?? '-',
      };
      existing.appearances += s.appearances ?? 0;
      existing.goals += s.goals ?? 0;
      existing.latestName = s.team_name ?? existing.latestName;
      map.set(tid, existing);
    }
    return map;
  }, [summary?.seasons]);

  const mappedGoalMatches = useMemo(
    () =>
      goalMatches.map((gm) => ({
        match_id: gm.match_id,
        date: gm.match_date,
        season: gm.season_name,
        opponent_name: gm.opponent_name ?? '-',
        opponent_logo: gm.opponent_logo ?? null,
        result: (() => {
          const o = getMatchOutcome(gm);
          if (o === 'WIN' || o === 'PK_WIN') return 'W' as const;
          if (o === 'LOSS' || o === 'PK_LOSS') return 'L' as const;
          return 'D' as const;
        })(),
        home_score: gm.home_score,
        away_score: gm.away_score,
        penalty_home_score: gm.penalty_home_score ?? null,
        penalty_away_score: gm.penalty_away_score ?? null,
        player_goals: gm.player_goals,
      })),
    [goalMatches]
  );

  return (
    <div className="mx-auto max-w-[1280px]">
      {/* Top row: Header card + Traits (side by side on desktop) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Header + Info + Position (single card) */}
        <div className="lg:col-span-2">
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
                  {profile ? (
                    <Image
                      src={profile}
                      alt={name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-xl font-medium"
                      style={{
                        color: headerSub,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                      }}
                    >
                      {name[0]}
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
                    {name}
                  </h2>
                  <div className="mt-2 flex items-center gap-1.5">
                    {activeTeam?.logo && (
                      <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full">
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
                      {activeTeam?.team_name ?? '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info grid (left) + Position pitch (right) — 50:50 */}
            <div className="flex">
              {/* Left: Info + Stats 2-col grid */}
              <div className="w-full divide-y divide-gray-100 lg:w-1/2">
                {/* Row 1: 등번호 + 포지션 */}
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  {typeof jersey === 'number' && (
                    <div className="px-6 py-4 sm:px-8">
                      <p className="text-[16px] text-gray-900">{jersey}</p>
                      <p className="text-[14px] font-medium text-[#9F9F9F]">
                        등번호
                      </p>
                    </div>
                  )}
                  {positions.length > 0 && (
                    <div className="px-6 py-4 sm:px-8">
                      <p className="text-[16px] text-gray-900">
                        {positions[0].position}
                      </p>
                      <p className="text-[14px] font-medium text-[#9F9F9F]">
                        포지션
                      </p>
                    </div>
                  )}
                </div>
                {/* Row 2: 득점 + 어시스트 */}
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  <div className="px-6 py-4 sm:px-8">
                    <p className="text-[16px] text-gray-900">
                      {totals.goals}
                      {totalPenaltyGoals > 0 && (
                        <span className="text-[10px] font-normal text-gray-400">
                          ({totalPenaltyGoals})
                        </span>
                      )}
                    </p>
                    <p className="text-[14px] font-medium text-[#9F9F9F]">
                      득점
                    </p>
                  </div>
                  <div className="px-6 py-4 sm:px-8">
                    <p className="text-[16px] text-gray-900">
                      {totals.assists}
                    </p>
                    <p className="text-[14px] font-medium text-[#9F9F9F]">
                      어시스트
                    </p>
                  </div>
                </div>
                {/* Row 3: 시즌 + 경기 */}
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  <div className="px-6 py-4 sm:px-8">
                    <p className="text-[16px] text-gray-900">
                      {seasons.length}
                    </p>
                    <p className="text-[14px] font-medium text-[#9F9F9F]">
                      시즌
                    </p>
                  </div>
                  <div className="px-6 py-4 sm:px-8">
                    <p className="text-[16px] text-gray-900">
                      {totals.appearances}
                    </p>
                    <p className="text-[14px] font-medium text-[#9F9F9F]">
                      경기
                    </p>
                  </div>
                </div>
                {/* Row 4: 실점 (골키퍼만) */}
                {(totals.goals_conceded ?? 0) > 0 && (
                  <div className="grid grid-cols-2 divide-x divide-gray-100">
                    <div className="px-6 py-4 sm:px-8">
                      <p className="text-[16px] text-gray-900">
                        {totals.goals_conceded}
                      </p>
                      <p className="text-[14px] font-medium text-[#9F9F9F]">
                        실점
                      </p>
                    </div>
                    <div />
                  </div>
                )}
              </div>

              {/* Right: Position pitch (desktop only) — 50% */}
              {positions.length > 0 && (
                <div className="hidden w-1/2 border-l border-gray-100 lg:block">
                  <div className="flex justify-between gap-4 px-6 py-4">
                    <div>
                      <p className="text-[16px] font-medium text-gray-900">
                        포지션
                      </p>
                      <p
                        className="mt-2 text-[16px] font-medium"
                        style={{ color: teamAccent }}
                      >
                        기본
                      </p>
                      <p className="text-[14px] text-gray-900">
                        {POSITION_LABELS[positions[0].position] ??
                          positions[0].position}
                      </p>
                      {positions.length > 1 && (
                        <>
                          <p className="mt-3 text-[14px] text-[#9F9F9F]">
                            기타
                          </p>
                          <p className="text-[14px] text-gray-900">
                            {positions
                              .slice(1)
                              .map(
                                (p) => POSITION_LABELS[p.position] ?? p.position
                              )
                              .join(', ')}
                          </p>
                        </>
                      )}
                    </div>
                    <PositionPitch
                      positions={positions.map((p) => p.position)}
                      teamColor={teamAccent}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Traits + Career (no traits) or Traits only */}
        <div className="space-y-4 lg:col-span-1">
          <PlayerTraitsCard
            playerId={playerId}
            teamColor={teamAccent}
            onHasData={setHasTraits}
          />
          {/* traits가 없으면 경력만 상단 우측에 배치 */}
          {hasTraits === false && (
            <CareerCard
              mergedTeamHistory={mergedTeamHistory}
              isSingleTeam={isSingleTeam}
              singleTeam={singleTeam}
              teamStats={teamStats}
              seasonRows={seasonRows}
            />
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left Column (2/3) */}
        <div className="space-y-4 lg:col-span-2">
          {/* Current Season Stats */}
          <CurrentSeasonCard playerId={playerId} />

          {/* Compare */}
          <Link
            href={`/stats/player-compare?player1=${playerId}`}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[#F0F0F0] bg-white py-3.5 text-[14px] font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <Users className="h-4 w-4" />
            다른 선수와 비교
          </Link>

          {/* Match Log */}
          <MatchLogCard playerId={playerId} />

          {/* Pass Map */}
          <PassMapCard
            playerId={playerId}
            teamColor={
              activeTeam?.primary_color &&
              !isNearWhite(activeTeam.primary_color)
                ? activeTeam.primary_color
                : teamAccent
            }
          />

          {/* Season Detailed Stats (bar graphs) */}
          <SeasonDetailedStatsCard playerId={playerId} />

          {/* About */}
          <PlayerAboutCard about={player?.about} />
        </div>

        {/* Right Column — Career + Attack Points/GK Stats + Trophies */}
        <div className="space-y-4 lg:col-span-1">
          {/* traits가 있으면 경력을 하단에 표시 (없으면 상단에 이미 표시됨) */}
          {hasTraits !== false && (
            <CareerCard
              mergedTeamHistory={mergedTeamHistory}
              isSingleTeam={isSingleTeam}
              singleTeam={singleTeam}
              teamStats={teamStats}
              seasonRows={seasonRows}
            />
          )}

          {/* 공격포인트/골키퍼 통계 — 겸용 선수는 둘 다 표시 */}
          {hasGKExperience && <GoalkeeperStatsSection playerId={playerId} />}
          {hasFieldExperience && (
            <AttackPointsCard
              playerId={playerId}
              goalMatches={mappedGoalMatches}
            />
          )}
          {/* GK 전용이고 필드 경험 없으면 GK만, 반대도 마찬가지 */}
          {!hasGKExperience &&
            !hasFieldExperience &&
            positions.length > 0 &&
            (isPrimaryGK ? (
              <GoalkeeperStatsSection playerId={playerId} />
            ) : (
              <AttackPointsCard
                playerId={playerId}
                goalMatches={mappedGoalMatches}
              />
            ))}

          {/* Trophies */}
          <PlayerTrophiesCard playerId={playerId} />
        </div>
      </div>
    </div>
  );
}

// ========== Career Card with Tabs ==========

function CareerCard({
  mergedTeamHistory,
  isSingleTeam,
  singleTeam,
  teamStats,
  seasonRows,
}: {
  mergedTeamHistory: TeamHistoryItem[];
  isSingleTeam: boolean;
  singleTeam: TeamHistoryItem | null;
  teamStats: Map<
    number,
    { appearances: number; goals: number; latestName: string }
  >;
  seasonRows: {
    key: string;
    season: string;
    team: string;
    team_logo: string | null;
    appearances: number;
    goals: number;
    penalty_goals: number;
    assists: number;
    positions: string[];
  }[];
}) {
  const [activeTab, setActiveTab] = useState<'club' | 'season'>('club');
  const [expandedClub, setExpandedClub] = useState(false);
  const [expandedSeason, setExpandedSeason] = useState(false);

  const INITIAL_COUNT = 5;
  const clubList =
    isSingleTeam && singleTeam ? [singleTeam] : mergedTeamHistory;
  const visibleClubs = expandedClub
    ? clubList
    : clubList.slice(0, INITIAL_COUNT);
  const visibleSeasons = expandedSeason
    ? seasonRows
    : seasonRows.slice(0, INITIAL_COUNT);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      {/* Header */}
      <div className="px-6 py-4">
        <p className="text-[18px] font-medium text-gray-900">경력</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-6">
        <button
          onClick={() => setActiveTab('club')}
          className={`relative pb-3 pr-6 text-[16px] font-medium ${
            activeTab === 'club' ? 'text-gray-900' : 'text-[#9F9F9F]'
          }`}
        >
          클럽
          {activeTab === 'club' && (
            <span
              className="absolute bottom-0 left-0 h-[2px] w-8 rounded-full"
              style={{ backgroundColor: '#4CAF50' }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('season')}
          className={`relative pb-3 pr-6 text-[16px] font-medium ${
            activeTab === 'season' ? 'text-gray-900' : 'text-[#9F9F9F]'
          }`}
        >
          시즌
          {activeTab === 'season' && (
            <span
              className="absolute bottom-0 left-0 h-[2px] w-8 rounded-full"
              style={{ backgroundColor: '#4CAF50' }}
            />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-3">
        {activeTab === 'club' && (
          <div>
            <div className="mb-2 flex items-center justify-end px-2">
              <div className="flex shrink-0" style={{ width: '72px' }}>
                <span className="w-9 text-right text-[10px] text-gray-400">
                  경기
                </span>
                <span className="w-9 text-right text-[10px] text-gray-400">
                  골
                </span>
              </div>
            </div>
            <div className="space-y-1">
              {visibleClubs.map((t, idx) => (
                <div
                  key={`${t.team_name ?? '-'}-${idx}`}
                  className="flex items-center justify-between px-2 py-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {t.logo ? (
                      <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={t.logo}
                          alt="팀"
                          fill
                          sizes="28px"
                          className="object-cover"
                        />
                      </span>
                    ) : (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[10px]">
                        {(t.team_name ?? '?').charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[14px] text-gray-900">
                        {t.team_name ?? '-'}
                      </p>
                      <p className="text-[14px] text-[#9F9F9F]">
                        {(t.start_date ?? '—').slice(0, 7)} ~{' '}
                        {t.is_active
                          ? '현재'
                          : (t.end_date?.slice(0, 7) ?? '-')}
                      </p>
                    </div>
                  </div>
                  {(() => {
                    const st = teamStats.get(t.team_id ?? 0);
                    return st ? (
                      <div className="flex shrink-0" style={{ width: '72px' }}>
                        <span className="w-9 text-right text-[14px] text-gray-900">
                          {st.appearances}
                        </span>
                        <span className="w-9 text-right text-[14px] text-gray-900">
                          {st.goals}
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
              ))}
            </div>
            {clubList.length > INITIAL_COUNT && (
              <button
                onClick={() => setExpandedClub((v) => !v)}
                className="mt-1 w-full py-2 text-center text-[14px] font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                {expandedClub
                  ? '간략히 보기'
                  : `더보기 (${clubList.length - INITIAL_COUNT})`}
              </button>
            )}
          </div>
        )}

        {activeTab === 'season' && (
          <div>
            <div className="mb-2 flex items-center justify-end px-2">
              <div className="flex shrink-0" style={{ width: '108px' }}>
                <span className="w-9 text-right text-[10px] text-gray-400">
                  경기
                </span>
                <span className="w-9 text-right text-[10px] text-gray-400">
                  골
                </span>
                <span className="w-9 text-right text-[10px] text-gray-400">
                  도움
                </span>
              </div>
            </div>
            <div className="space-y-1">
              {visibleSeasons.map((r) => (
                <div
                  key={r.key}
                  className="flex items-center justify-between px-2 py-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {r.team_logo ? (
                      <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={r.team_logo}
                          alt="팀"
                          fill
                          sizes="28px"
                          className="object-cover"
                        />
                      </span>
                    ) : (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[10px]">
                        {(r.team ?? '?').charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[14px] text-gray-900">
                        {shortenSeasonName(r.season)}
                      </p>
                      <p className="text-[14px] text-[#9F9F9F]">{r.team}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0" style={{ width: '108px' }}>
                    <span className="w-9 text-right text-[14px] text-gray-900">
                      {r.appearances}
                    </span>
                    <span className="w-9 text-right text-[14px] text-gray-900">
                      {r.goals}
                    </span>
                    <span className="w-9 text-right text-[14px] text-gray-900">
                      {r.assists}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {seasonRows.length > INITIAL_COUNT && (
              <button
                onClick={() => setExpandedSeason((v) => !v)}
                className="mt-1 w-full py-2 text-center text-[14px] font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                {expandedSeason
                  ? '간략히 보기'
                  : `더보기 (${seasonRows.length - INITIAL_COUNT})`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
