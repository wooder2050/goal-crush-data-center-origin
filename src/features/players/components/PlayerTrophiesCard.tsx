'use client';

import Image from 'next/image';

import { useGoalQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';
import { shortenSeasonName } from '@/lib/utils';

interface Trophy {
  season_id: number;
  season_name: string;
  year: number | null;
  category: string | null;
}

interface TeamTrophies {
  team_id: number;
  team_name: string;
  logo: string | null;
  trophies: Trophy[];
}

interface PlayerTrophiesResponse {
  player_id: number;
  total: number;
  trophies: TeamTrophies[];
}

function getCategoryLabel(category: string | null): string | null {
  switch (category) {
    case 'SUPER_LEAGUE':
      return '슈퍼리그';
    case 'G_LEAGUE':
      return 'G리그';
    case 'SBS_CUP':
      return 'SBS컵';
    case 'CHAMPION_MATCH':
      return '챔피언 매치';
    case 'GIFA_CUP':
      return 'GIFA컵';
    default:
      return null;
  }
}

async function fetchPlayerTrophies(
  playerId: number
): Promise<PlayerTrophiesResponse> {
  const res = await fetch(apiUrl(`/api/players/${playerId}/trophies`));
  if (!res.ok) throw new Error('Failed to fetch trophies');
  return res.json();
}

export default function PlayerTrophiesCard({ playerId }: { playerId: number }) {
  const { data } = useGoalQuery(fetchPlayerTrophies, [playerId], {
    staleTime: 10 * 60 * 1000,
  });

  if (!data || data.total === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      <div className="px-6 py-4">
        <p className="text-[18px] font-medium text-gray-900">트로피</p>
      </div>

      <div className="space-y-3 px-4 pb-4">
        {data.trophies.map((team) => (
          <TeamTrophyGroup key={team.team_id} team={team} />
        ))}
      </div>
    </div>
  );
}

function TeamTrophyGroup({ team }: { team: TeamTrophies }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      {/* Team header row — 배경색으로 구분 */}
      <div className="flex items-center gap-2.5 bg-gray-50 px-4 py-2.5">
        {team.logo ? (
          <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
            <Image
              src={team.logo}
              alt={team.team_name}
              fill
              sizes="24px"
              className="object-cover"
            />
          </span>
        ) : (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-600">
            {team.team_name.charAt(0)}
          </span>
        )}
        <p className="text-[14px] font-medium text-gray-900">
          {team.team_name}
        </p>
      </div>

      {/* Trophy rows */}
      <div className="divide-y divide-gray-100">
        {team.trophies.map((t) => {
          const categoryLabel = getCategoryLabel(t.category);
          return (
            <div
              key={t.season_id}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <span className="shrink-0 text-[16px]" aria-hidden="true">
                🏆
              </span>
              <p className="text-[14px] text-gray-900">
                {categoryLabel
                  ? `${categoryLabel} 우승`
                  : `${shortenSeasonName(t.season_name)} 우승`}
              </p>
              <p className="ml-auto shrink-0 text-[12px] text-gray-500">
                {shortenSeasonName(t.season_name)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
