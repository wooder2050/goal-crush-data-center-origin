'use client';

import Image from 'next/image';
import Link from 'next/link';

import type {
  TeamFormation,
  TeamFormationPosition,
  TeamRecentMatch,
} from '@/features/teams/server';
import { shortenSeasonName } from '@/lib/utils';

// PositionPitch와 동일한 좌표 (풀 피치 기준, 상단이 공격 방향)
const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  FW: { x: 85, y: 45 },
  MF: { x: 85, y: 90 },
  DF: { x: 85, y: 150 },
  GK: { x: 85, y: 205 },
};

interface TeamFormationCardProps {
  formation: TeamFormation;
  recentForm: TeamRecentMatch[];
  teamId: number;
  teamColor: string;
}

export default function TeamFormationCard({
  formation,
  recentForm,
  teamId,
  teamColor,
}: TeamFormationCardProps) {
  if (formation.positions.length === 0 && recentForm.length === 0) {
    return null;
  }

  const bg = '#EFEFEF';
  const line = '#FFFFFF';

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      {formation.positions.length > 0 && (
        <>
          <div className="px-6 py-4">
            <p className="text-[18px] font-medium text-gray-900">선발 포지션</p>
            {formation.season_name && (
              <p className="text-[13px] text-[#9F9F9F]">
                {shortenSeasonName(formation.season_name)}
              </p>
            )}
          </div>

          <div className="px-4 pb-4">
            <div
              className="relative mx-auto"
              style={{ aspectRatio: '170 / 230' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                viewBox="0 0 170 230"
                fill="none"
                role="img"
                aria-label="선발 포지션"
              >
                <rect width="170" height="230" rx="6" fill={bg} />
                <rect
                  x="10"
                  y="10"
                  width="150"
                  height="210"
                  stroke={line}
                  strokeWidth="1.5"
                />
                <line
                  x1="10"
                  y1="115"
                  x2="160"
                  y2="115"
                  stroke={line}
                  strokeWidth="1.5"
                />
                <circle
                  cx="85"
                  cy="115"
                  r="22"
                  stroke={line}
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle cx="85" cy="115" r="2" fill={line} />
                <rect
                  x="34"
                  y="10"
                  width="102"
                  height="44"
                  stroke={line}
                  strokeWidth="1.5"
                  fill="none"
                />
                <rect
                  x="54"
                  y="10"
                  width="62"
                  height="22"
                  stroke={line}
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle cx="85" cy="40" r="2" fill={line} />
                <rect
                  x="34"
                  y="176"
                  width="102"
                  height="44"
                  stroke={line}
                  strokeWidth="1.5"
                  fill="none"
                />
                <rect
                  x="54"
                  y="198"
                  width="62"
                  height="22"
                  stroke={line}
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle cx="85" cy="190" r="2" fill={line} />
              </svg>

              {/* Player badges on pitch */}
              {(() => {
                const grouped = new Map<string, TeamFormationPosition[]>();
                for (const p of formation.positions) {
                  const arr = grouped.get(p.position) ?? [];
                  arr.push(p);
                  grouped.set(p.position, arr);
                }
                return formation.positions.map((p: TeamFormationPosition) => {
                  const coord = POSITION_COORDS[p.position];
                  if (!coord) return null;
                  const group = grouped.get(p.position) ?? [p];
                  const idx = group.indexOf(p);
                  const count = group.length;
                  let offsetX = 0;
                  if (count === 2) {
                    offsetX = idx === 0 ? -25 : 25;
                  } else if (count >= 3) {
                    offsetX = (idx - (count - 1) / 2) * 35;
                  }
                  const leftPct = ((coord.x + offsetX) / 170) * 100;
                  const topPct = (coord.y / 230) * 100;
                  return (
                    <Link
                      key={`${p.position}-${p.player_id}`}
                      href={`/players/${p.player_id}`}
                      className="absolute flex flex-col items-center gap-0.5 transition-transform hover:scale-110"
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div
                        className="relative h-14 w-14 overflow-hidden rounded-full border-2"
                        style={{
                          borderColor: teamColor,
                          backgroundColor: '#fff',
                        }}
                      >
                        {p.profile_image_url ? (
                          <Image
                            src={p.profile_image_url}
                            alt={p.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center text-sm font-bold text-white"
                            style={{ backgroundColor: teamColor }}
                          >
                            {p.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="max-w-[70px] truncate text-center text-[10px] font-medium text-gray-700">
                        {p.name}
                      </span>
                      <span
                        className="rounded px-1.5 py-px text-[9px] font-medium text-white"
                        style={{ backgroundColor: teamColor }}
                      >
                        {p.position}
                      </span>
                    </Link>
                  );
                });
              })()}
            </div>
          </div>
        </>
      )}

      {/* Recent form */}
      {recentForm.length > 0 && (
        <RecentFormRow teamId={teamId} recentMatches={recentForm} />
      )}
    </div>
  );
}

function RecentFormRow({
  teamId,
  recentMatches,
}: {
  teamId: number;
  recentMatches: TeamRecentMatch[];
}) {
  const results = recentMatches.slice(0, 10).map((m) => {
    const isHome = m.home_team_id === teamId;
    const myTeam = isHome ? m.home_team : m.away_team;
    const opponent = isHome ? m.away_team : m.home_team;
    const teamScore = isHome ? m.home_score : m.away_score;
    const opponentScore = isHome ? m.away_score : m.home_score;

    if (teamScore === null || opponentScore === null)
      return {
        matchId: m.match_id,
        result: 'N' as const,
        teamScore: 0,
        opponentScore: 0,
        myTeam,
        opponent,
        matchDate: m.match_date,
        seasonName: m.season_name,
      };

    let result: 'W' | 'L' | 'N' = 'N';
    if (teamScore > opponentScore) {
      result = 'W';
    } else if (teamScore < opponentScore) {
      result = 'L';
    } else if (m.penalty_home_score != null && m.penalty_away_score != null) {
      const pkTeam = isHome ? m.penalty_home_score : m.penalty_away_score;
      const pkOpp = isHome ? m.penalty_away_score : m.penalty_home_score;
      result = pkTeam > pkOpp ? 'W' : 'L';
    }

    return {
      matchId: m.match_id,
      result,
      teamScore,
      opponentScore,
      myTeam,
      opponent,
      matchDate: m.match_date,
      seasonName: m.season_name,
    };
  });

  const wins = results.filter((r) => r.result === 'W').length;
  const losses = results.filter((r) => r.result === 'L').length;

  const scoreBg = (result: 'W' | 'L' | 'N') =>
    result === 'W'
      ? 'bg-green-500'
      : result === 'L'
        ? 'bg-red-500'
        : 'bg-gray-400';

  const TeamLogo = ({ logo, name }: { logo: string | null; name: string }) =>
    logo ? (
      <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
        <Image
          src={logo}
          alt={name}
          fill
          sizes="24px"
          className="object-cover"
        />
      </div>
    ) : (
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[9px] text-gray-500">
        {name.charAt(0)}
      </div>
    );

  return (
    <div className="border-t border-gray-100 px-4 py-4">
      <div className="flex items-center justify-between mb-3 px-2">
        <p className="text-[14px] font-medium text-gray-900">최근 10경기</p>
        <span className="text-[13px] text-[#9F9F9F]">
          <span className="text-green-600 font-medium">{wins}승</span>
          <span className="mx-0.5">·</span>
          <span className="text-red-600 font-medium">{losses}패</span>
        </span>
      </div>
      <div className="space-y-1">
        {results.map((r, i) => {
          const date = r.matchDate ? new Date(r.matchDate) : null;
          const dateStr = date
            ? `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
            : '';
          return (
            <Link
              key={i}
              href={`/matches/${r.matchId}`}
              className="block rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors"
            >
              {/* Season + Date */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[#9F9F9F] truncate">
                  {r.seasonName ? shortenSeasonName(r.seasonName) : ''}
                </span>
                <span className="text-[11px] text-[#9F9F9F]">{dateStr}</span>
              </div>
              {/* Match row */}
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center justify-end gap-1.5 min-w-0">
                  <span className="truncate text-[12px] font-medium text-gray-700">
                    {r.myTeam?.team_name ?? '-'}
                  </span>
                  <TeamLogo
                    logo={r.myTeam?.logo ?? null}
                    name={r.myTeam?.team_name ?? '-'}
                  />
                </div>
                <div
                  className={`flex items-center justify-center rounded-md px-2.5 py-1 min-w-[48px] ${scoreBg(r.result)}`}
                >
                  <span className="text-[13px] font-bold text-white">
                    {r.teamScore} - {r.opponentScore}
                  </span>
                </div>
                <div className="flex flex-1 items-center gap-1.5 min-w-0">
                  <TeamLogo
                    logo={r.opponent?.logo ?? null}
                    name={r.opponent?.team_name ?? '-'}
                  />
                  <span className="truncate text-[12px] font-medium text-gray-700">
                    {r.opponent?.team_name ?? '-'}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
