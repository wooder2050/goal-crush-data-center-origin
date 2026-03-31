'use client';

import Image from 'next/image';

import { useGoalQuery } from '@/hooks/useGoalQuery';
import { shortenSeasonName } from '@/lib/utils';

interface CurrentSeasonData {
  season_id: number;
  season_name: string;
  team: { team_id: number; team_name: string; logo: string | null } | null;
  is_goalkeeper: boolean;
  matches: number;
  starters: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  clean_sheets: number;
  goals_conceded: number;
  pk_saves: number;
  avg_rating: number | null;
  avg_xt_rating: number | null;
}

async function fetchCurrentSeason(
  playerId: number
): Promise<{ data: CurrentSeasonData | null }> {
  const res = await fetch(
    `/api/stats/player-current-season?player_id=${playerId}`
  );
  if (!res.ok) throw new Error('Failed to fetch current season');
  return res.json();
}

function RatingBadge({ value }: { value: number | null }) {
  if (!value) return <p className="text-[16px] font-medium text-gray-400">-</p>;
  const bg =
    value >= 9.0
      ? 'bg-[#14A0FF]'
      : value >= 7.0
        ? 'bg-[#33C771]'
        : 'bg-[#FF963F]';
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[14px] font-bold text-white ${bg}`}
    >
      {value.toFixed(2)}
    </span>
  );
}

export default function CurrentSeasonCard({ playerId }: { playerId: number }) {
  const { data } = useGoalQuery(fetchCurrentSeason, [playerId], {
    staleTime: 5 * 60 * 1000,
  });

  const stats = data?.data;

  if (!stats) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-2">
          {stats.team?.logo && (
            <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full">
              <Image
                src={stats.team.logo}
                alt="팀"
                fill
                sizes="20px"
                className="object-cover"
              />
            </span>
          )}
          <span className="text-[16px] font-medium text-gray-900">
            {shortenSeasonName(stats.season_name)}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      {stats.is_goalkeeper ? (
        <GoalkeeperStats stats={stats} />
      ) : (
        <FieldPlayerStats stats={stats} />
      )}
    </div>
  );
}

function FieldPlayerStats({ stats }: { stats: CurrentSeasonData }) {
  return (
    <>
      <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        <StatCell label="득점" value={stats.goals} />
        <StatCell label="어시스트" value={stats.assists} />
        <StatCell label="선발" value={stats.starters} />
        <StatCell label="경기" value={stats.matches} />
      </div>
      <div className="grid grid-cols-4 divide-x divide-gray-100">
        <div className="py-5 text-center">
          <RatingBadge value={stats.avg_rating} />
          <p className="mt-1 text-[14px] font-medium text-[#9F9F9F]">평점</p>
        </div>
        <div className="py-5 text-center">
          <RatingBadge value={stats.avg_xt_rating} />
          <p className="mt-1 text-[14px] font-medium text-[#9F9F9F]">xT 평점</p>
        </div>
        <CardCell
          label="경고"
          count={stats.yellow_cards}
          color="bg-yellow-400"
        />
        <CardCell label="퇴장" count={stats.red_cards} color="bg-red-500" />
      </div>
    </>
  );
}

function GoalkeeperStats({ stats }: { stats: CurrentSeasonData }) {
  return (
    <>
      <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        <StatCell label="클린 시트" value={stats.clean_sheets} />
        <StatCell label="실점 수" value={stats.goals_conceded} />
        <StatCell label="PK 선방" value={stats.pk_saves} />
        <div className="py-5 text-center">
          <RatingBadge value={stats.avg_rating} />
          <p className="mt-1 text-[14px] font-medium text-[#9F9F9F]">평점</p>
        </div>
      </div>
      <div className="grid grid-cols-4 divide-x divide-gray-100">
        <StatCell label="경기" value={stats.matches} />
        <div className="py-5 text-center">
          <RatingBadge value={stats.avg_xt_rating} />
          <p className="mt-1 text-[14px] font-medium text-[#9F9F9F]">xT 평점</p>
        </div>
        <CardCell
          label="경고"
          count={stats.yellow_cards}
          color="bg-yellow-400"
        />
        <CardCell label="퇴장" count={stats.red_cards} color="bg-red-500" />
      </div>
    </>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="py-5 text-center">
      <p className="text-[16px] font-medium text-gray-900">{value}</p>
      <p className="mt-1 text-[14px] font-medium text-[#9F9F9F]">{label}</p>
    </div>
  );
}

function CardCell({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="py-5 text-center">
      <p className="flex items-center justify-center gap-1 text-[16px] font-medium text-gray-900">
        <span
          className={`inline-block h-3 w-2.5 rounded-sm ${color}`}
          aria-hidden="true"
        />
        {count}
      </p>
      <p className="mt-1 text-[14px] font-medium text-[#9F9F9F]">{label}</p>
    </div>
  );
}
