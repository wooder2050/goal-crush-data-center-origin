'use client';
import { format } from 'date-fns';
import Image from 'next/image';

import { Card, CardContent, Grid } from '@/components/ui';
import { getPositionColor } from '@/features/matches/lib/matchUtils';
import { PlayerAbilitySummary } from '@/features/player-ratings/components/PlayerAbilitySummary';
import type {
  getPlayerByIdPrisma,
  getPlayerSummaryPrisma,
} from '@/features/players/api-prisma';
import { shortenSeasonName } from '@/lib/utils';

import GoalkeeperStatsSection from './GoalkeeperStatsSection';
import { PlayerDataProvider } from './PlayerDataProvider';
import { PlayerSummaryProvider } from './PlayerSummaryProvider';

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

export default function PlayerDetailContent({
  playerId,
}: {
  playerId: number;
}) {
  const handleRatePlayer = () => {
    window.location.href = `/players/${playerId}/rate`;
  };

  const handleViewAllRatings = () => {
    window.location.href = `/players/${playerId}/ratings`;
  };

  return (
    <PlayerDataProvider playerId={playerId}>
      {(player) => (
        <PlayerSummaryProvider playerId={playerId}>
          {(summary) => (
            <PlayerDetailContentInner
              player={player}
              summary={summary}
              playerId={playerId}
              handleRatePlayer={handleRatePlayer}
              handleViewAllRatings={handleViewAllRatings}
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
  handleRatePlayer,
  handleViewAllRatings,
}: {
  player: NonNullable<PlayerData>;
  summary: NonNullable<PlayerSummaryData>;
  playerId: number;
  handleRatePlayer: () => void;
  handleViewAllRatings: () => void;
}) {
  const profile = player?.profile_image_url ?? null;
  const name = player?.name ?? '-';
  const jersey = player?.jersey_number;
  const totals = summary?.totals ?? {
    goals: 0,
    assists: 0,
    appearances: 0,
    goals_conceded: 0,
  };
  const totalPenaltyGoals = (summary?.seasons ?? []).reduce(
    (acc, s) => acc + (s.penalty_goals ?? 0),
    0
  );
  const seasons: string[] = (summary?.seasons ?? []).map(
    (s) => s.season_name ?? `시즌 ${s.year ?? ''}`
  );
  const positions: PositionFreq[] = (summary?.positions_frequency ?? [])
    .slice()
    .sort((a, b) => b.matches - a.matches);
  const teamHistoryRaw: TeamHistoryItem[] = (summary?.team_history ??
    []) as TeamHistoryItem[];

  // Merge team histories by team_name
  const mergedTeamHistory: TeamHistoryItem[] = (() => {
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
      .sort((a, b) => a.index - b.index)
      .map((v) => v.row);
  })();

  const isSingleTeam = mergedTeamHistory.length === 1;
  const singleTeam = isSingleTeam ? mergedTeamHistory[0] : null;

  const displayTeamLogo = isSingleTeam
    ? (singleTeam?.logo ?? null)
    : (mergedTeamHistory[0]?.logo ?? null);
  const displayIsActive = isSingleTeam ? singleTeam?.is_active === true : false;

  // Jersey color from active team (or first)
  const activeTeam =
    mergedTeamHistory.find((t) => t.is_active) ?? mergedTeamHistory[0] ?? null;
  const jerseyInlineStyle = activeTeam
    ? {
        backgroundColor: activeTeam.primary_color ?? '#111',
        color: activeTeam.secondary_color ?? '#fff',
        borderColor: activeTeam.secondary_color ?? '#111',
      }
    : {};

  const seasonRows = [...(summary?.seasons ?? [])].reverse().map((s) => ({
    key: `${s.season_id ?? ''}-${s.team_id ?? ''}`,
    season: s.season_name ?? `시즌 ${s.year ?? ''}`,
    team: s.team_name ?? '-',
    team_logo: s?.team_logo ?? null,
    appearances: s.appearances ?? 0,
    goals: s.goals ?? 0,
    penalty_goals: s.penalty_goals ?? 0,
    assists: s.assists ?? 0,
    positions: s.positions ?? [],
  }));

  const goalMatches = (summary?.goal_matches ?? []).slice();

  const getMatchOutcome = (
    gm: NonNullable<(typeof summary)['goal_matches']>[number]
  ): 'WIN' | 'DRAW' | 'LOSS' | null => {
    const hs = gm.home_score;
    const as = gm.away_score;
    if (hs == null || as == null) return null;
    const diff = gm.is_home ? hs - as : as - hs;
    if (diff > 0) return 'WIN';
    if (diff < 0) return 'LOSS';
    return 'DRAW';
  };

  const outcomeStyle = (o: 'WIN' | 'DRAW' | 'LOSS') =>
    o === 'WIN'
      ? 'bg-green-100 text-green-700 border-green-200'
      : o === 'LOSS'
        ? 'bg-red-100 text-red-700 border-red-200'
        : 'bg-gray-100 text-gray-700 border-gray-200';

  const outcomeLabel = (o: 'WIN' | 'DRAW' | 'LOSS') =>
    o === 'WIN' ? '승' : o === 'LOSS' ? '패' : '무';

  return (
    <Grid cols={12} gap="lg">
      {/* Left: Large media area (narrower on md+) */}
      <Card className="col-span-12 md:col-span-5 overflow-hidden">
        <div className="w-full bg-white p-3 md:p-8">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[720px]">
            {profile ? (
              <Image
                src={profile}
                alt="프로필 이미지"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-contain"
                priority
              />
            ) : (
              <div className="h-full w-full bg-gray-100" />
            )}
          </div>
        </div>
      </Card>

      {/* Right: Information panel (wider on md+) */}
      <Card className="col-span-12 md:col-span-7">
        <CardContent className="px-0 sm:px-6 overflow-x-hidden">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              {typeof jersey === 'number' && (
                <span
                  className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1 text-xs font-bold rounded border"
                  style={jerseyInlineStyle}
                >
                  {jersey}
                </span>
              )}
              <h2 className="text-xl sm:text-2xl font-semibold leading-tight">
                {name}
              </h2>
            </div>

            <div className="rounded-md border divide-y">
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-gray-600">⚽ 득점</span>
                <span className="font-semibold text-gray-900">
                  {totals.goals}
                  {totalPenaltyGoals > 0 ? (
                    <span className="ml-1 text-[10px] text-gray-500">
                      (PK {totalPenaltyGoals})
                    </span>
                  ) : null}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-gray-600">🏃 출전</span>
                <span className="font-semibold text-gray-900">
                  {totals.appearances}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-gray-600">🎯 어시스트</span>
                <span className="font-semibold text-gray-900">
                  {totals.assists}
                </span>
              </div>
              {(totals.goals_conceded ?? 0) > 0 && (
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-gray-600">🥅 실점</span>
                  <span className="font-semibold text-gray-900">
                    {totals.goals_conceded}
                  </span>
                </div>
              )}
            </div>

            {/* Participated seasons */}
            <div>
              <div className="mb-2 text-sm font-medium text-gray-700">
                참여 시즌
              </div>
              {seasons.length === 0 ? (
                <div className="text-xs text-gray-500">기록 없음</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {seasons.map((label, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded border px-2 py-1 text-xs text-gray-700 bg-gray-50"
                    >
                      {shortenSeasonName(label)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Positions (by frequency) */}
            <div>
              <div className="mb-2 text-sm font-medium text-gray-700">
                포지션
              </div>
              {positions.length === 0 ? (
                <div className="text-xs text-gray-500">기록 없음</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {positions.map((p) => (
                    <span
                      key={p.position}
                      className={`inline-flex items-center rounded border border-current px-2 py-1 text-xs ${getPositionColor(p.position)}`}
                    >
                      {p.position}{' '}
                      <span
                        className={`ml-1 text-xs ${getPositionColor(p.position)}`}
                      >
                        ({p.matches})
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Affiliation or team history */}
            <div>
              {isSingleTeam ? (
                <div className="rounded-md border px-4 py-3 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <span className="text-gray-600">소속팀</span>
                  <span className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                    {displayTeamLogo ? (
                      <span className="relative h-5 w-5 overflow-hidden rounded-full flex-shrink-0">
                        <Image
                          src={displayTeamLogo}
                          alt="팀 로고"
                          fill
                          sizes="20px"
                          className="object-cover"
                        />
                      </span>
                    ) : (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-700">
                        {(singleTeam?.team_name ?? '?').charAt(0)}
                      </span>
                    )}
                    <span className="font-semibold text-gray-900 truncate max-w-[60vw] sm:max-w-none">
                      {singleTeam?.team_name ?? '-'}
                    </span>
                    {displayIsActive && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-700">
                        현재
                      </span>
                    )}
                    <span className="sm:ml-2 text-xs text-gray-500 whitespace-nowrap">
                      {(singleTeam?.start_date ?? '—').slice(0, 10)} ~{' '}
                      {displayIsActive
                        ? '현재'
                        : singleTeam?.end_date
                          ? singleTeam.end_date.slice(0, 10)
                          : '-'}
                    </span>
                  </span>
                </div>
              ) : (
                <>
                  <div className="mb-2 text-sm font-medium text-gray-700">
                    소속팀 이력 (최신 → 과거)
                  </div>
                  <ul className="space-y-2">
                    {mergedTeamHistory.map((t, idx) => (
                      <li
                        key={`${t.team_name ?? '-'}-${idx}`}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 rounded border px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                          {t.logo ? (
                            <span className="relative  h-5 w-5 overflow-hidden rounded-full flex-shrink-0">
                              <Image
                                src={t.logo}
                                alt="팀 로고"
                                fill
                                sizes="20px"
                                className="object-cover"
                              />
                            </span>
                          ) : (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-700">
                              {(t.team_name ?? '?').charAt(0)}
                            </span>
                          )}
                          <span className="truncate text-sm text-gray-800 max-w-full">
                            {t.team_name ?? '-'}
                            {t.is_active ? (
                              <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-700">
                                현재
                              </span>
                            ) : null}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap sm:ml-2">
                          {(t.start_date ?? '—').slice(0, 10)} ~{' '}
                          {t.is_active
                            ? '현재'
                            : t.end_date
                              ? t.end_date.slice(0, 10)
                              : '-'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Season-by-season stats */}
            <div>
              <div className="mb-2 text-sm font-medium text-gray-700">
                시즌별 기록
              </div>
              {seasonRows.length === 0 ? (
                <div className="text-xs text-gray-500">기록 없음</div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="sm:hidden space-y-2">
                    {seasonRows.map((r) => (
                      <div key={r.key} className="rounded-md border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-gray-600">
                            {shortenSeasonName(r.season)}
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            {r.team_logo ? (
                              <span className="relative h-5 w-5 overflow-hidden rounded-full flex-shrink-0">
                                <Image
                                  src={r.team_logo}
                                  alt="팀 로고"
                                  fill
                                  sizes="20px"
                                  className="object-cover"
                                />
                              </span>
                            ) : (
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[9px] text-gray-700">
                                {(r.team ?? '-').charAt(0)}
                              </span>
                            )}
                            <span className="truncate text-sm font-medium">
                              {r.team}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-gray-600">
                            포지션:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {r.positions.length === 0 ? (
                              <span className="text-gray-400 text-[11px]">
                                -
                              </span>
                            ) : (
                              r.positions.map((pos) => (
                                <span
                                  key={pos}
                                  className={`inline-flex items-center rounded border border-current px-1.5 py-0.5 text-[10px] ${getPositionColor(pos)}`}
                                >
                                  {pos}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <div className="rounded bg-gray-50 border px-2 py-1 text-center">
                            <div className="text-[11px] text-gray-600">
                              출전
                            </div>
                            <div className="text-sm font-semibold">
                              {r.appearances}
                            </div>
                          </div>
                          <div className="rounded bg-gray-50 border px-2 py-1 text-center">
                            <div className="text-[11px] text-gray-600">
                              득점
                            </div>
                            <div className="text-sm font-semibold">
                              {r.goals}
                              {r.penalty_goals > 0 ? (
                                <span className="ml-1 text-[10px] text-gray-500">
                                  (PK {r.penalty_goals})
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="rounded bg-gray-50 border px-2 py-1 text-center">
                            <div className="text-[11px] text-gray-600">
                              어시스트
                            </div>
                            <div className="text-sm font-semibold">
                              {r.assists}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto rounded-md border">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">
                            시즌
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            소속팀
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            포지션
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            🏃 출전
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            ⚽ 득점
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            🎯 어시스트
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {seasonRows.map((r) => (
                          <tr key={r.key} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              {shortenSeasonName(r.season)}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                {r.team_logo ? (
                                  <span className="relative h-5 w-5 overflow-hidden rounded-full flex-shrink-0">
                                    <Image
                                      src={r.team_logo}
                                      alt="팀 로고"
                                      fill
                                      sizes="20px"
                                      className="object-cover"
                                    />
                                  </span>
                                ) : (
                                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[9px] text-gray-700">
                                    {(r.team ?? '-').charAt(0)}
                                  </span>
                                )}
                                <span>{r.team}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {r.positions.length === 0 ? (
                                  <span className="text-gray-400">-</span>
                                ) : (
                                  r.positions.map((pos) => (
                                    <span
                                      key={pos}
                                      className={`inline-flex items-center rounded border border-current px-1.5 py-0.5 text-[10px] ${getPositionColor(pos)}`}
                                    >
                                      {pos}
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {r.appearances}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {r.goals}
                              {r.penalty_goals > 0 ? (
                                <span className="ml-1 text-[10px] text-gray-500">
                                  (PK {r.penalty_goals})
                                </span>
                              ) : null}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {r.assists}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Goal records */}
            <div>
              <div className="mb-2 text-sm font-medium text-gray-700">
                골 기록
              </div>
              {goalMatches.length === 0 ? (
                <div className="text-xs text-gray-500">골 기록 없음</div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="sm:hidden space-y-2">
                    {goalMatches.map((gm) => (
                      <div key={gm.match_id} className="rounded-md border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs text-gray-600">
                            {gm.match_date
                              ? format(new Date(gm.match_date), 'yy.MM.dd')
                              : '-'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {gm.season_name
                              ? shortenSeasonName(gm.season_name)
                              : '-'}
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2">
                            {gm.opponent_logo ? (
                              <span className="relative h-5 w-5 overflow-hidden rounded-full flex-shrink-0">
                                <Image
                                  src={gm.opponent_logo}
                                  alt="상대 로고"
                                  fill
                                  sizes="20px"
                                  className="object-cover"
                                />
                              </span>
                            ) : (
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[9px] text-gray-700">
                                {(gm.opponent_name ?? '-').charAt(0)}
                              </span>
                            )}
                            <span className="truncate text-sm">
                              {gm.opponent_name ?? '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            {gm.team_logo ? (
                              <span className="relative h-5 w-5 overflow-hidden rounded-full flex-shrink-0">
                                <Image
                                  src={gm.team_logo}
                                  alt="팀 로고"
                                  fill
                                  sizes="20px"
                                  className="object-cover"
                                />
                              </span>
                            ) : (
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[9px] text-gray-700">
                                {(gm.team_name ?? '-').charAt(0)}
                              </span>
                            )}
                            <span className="truncate text-sm">
                              {gm.team_name ?? '-'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-sm font-semibold">
                            {gm.home_score ?? '-'} : {gm.away_score ?? '-'}
                          </div>
                          {(() => {
                            const o = getMatchOutcome(gm);
                            return o ? (
                              <span
                                className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] ${outcomeStyle(o)}`}
                              >
                                {outcomeLabel(o)}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <div className="mt-1 text-right text-[11px] text-gray-600">
                          득점: {gm.player_goals}
                          {gm.penalty_goals && gm.penalty_goals > 0 ? (
                            <span className="ml-1 text-[10px] text-gray-500">
                              (PK {gm.penalty_goals})
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto rounded-md border">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">
                            날짜
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            시즌
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            상대
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            소속팀
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            ⚽ 득점
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            스코어
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {goalMatches.map((gm) => (
                          <tr key={gm.match_id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              {gm.match_date
                                ? format(new Date(gm.match_date), 'yy.MM.dd')
                                : '-'}
                            </td>
                            <td className="px-3 py-2">
                              {gm.season_name
                                ? shortenSeasonName(gm.season_name)
                                : '-'}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                {gm.opponent_logo ? (
                                  <span className="relative h-5 w-5 overflow-hidden rounded-full flex-shrink-0">
                                    <Image
                                      src={gm.opponent_logo}
                                      alt="상대 로고"
                                      fill
                                      sizes="20px"
                                      className="object-cover"
                                    />
                                  </span>
                                ) : (
                                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[9px] text-gray-700">
                                    {(gm.opponent_name ?? '-').charAt(0)}
                                  </span>
                                )}
                                <span>{gm.opponent_name ?? '-'}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                {gm.team_logo ? (
                                  <span className="relative h-5 w-5 overflow-hidden rounded-full flex-shrink-0">
                                    <Image
                                      src={gm.team_logo}
                                      alt="팀 로고"
                                      fill
                                      sizes="20px"
                                      className="object-cover"
                                    />
                                  </span>
                                ) : (
                                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[9px] text-gray-700">
                                    {(gm.team_name ?? '-').charAt(0)}
                                  </span>
                                )}
                                <span>{gm.team_name ?? '-'}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              {gm.player_goals}
                              {gm.penalty_goals && gm.penalty_goals > 0 ? (
                                <span className="ml-1 text-[10px] text-gray-500">
                                  (PK {gm.penalty_goals})
                                </span>
                              ) : null}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span>
                                {gm.home_score ?? '-'} : {gm.away_score ?? '-'}
                              </span>
                              {(() => {
                                const o = getMatchOutcome(gm);
                                return o ? (
                                  <span
                                    className={`ml-2 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] ${outcomeStyle(o)}`}
                                  >
                                    {outcomeLabel(o)}
                                  </span>
                                ) : null;
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            {/* Goalkeeper stats */}
            <GoalkeeperStatsSection playerId={playerId} />
            {/* Player Ability Summary */}
            <div>
              <PlayerAbilitySummary
                playerId={playerId}
                onRatePlayer={handleRatePlayer}
                onViewAllRatings={handleViewAllRatings}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Grid>
  );
}
