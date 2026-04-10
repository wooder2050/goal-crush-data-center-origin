'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Section } from '@/components/ui';
import { apiUrl } from '@/lib/api-url';
import { shortenSeasonName } from '@/lib/utils';

type RankingRow = {
  rank: number;
  player_id: number;
  name: string;
  profile_image_url: string | null;
  jersey_number: number | null;
  team_name: string;
  team_logo: string | null;
  team_color: string | null;
  position: string;
  power_index: number;
  matches: number;
  goals: number;
  assists: number;
  win_rate: number;
  avg_stats_rating: number | null;
  avg_xt_rating: number | null;
  action_per_match: number;
  clean_sheets: number;
  save_pct: number | null;
};

type PowerRankingData = {
  rankings: RankingRow[];
  season: { season_id: number; season_name: string } | null;
};

const POSITION_STYLES: Record<string, string> = {
  GK: 'bg-amber-400 text-white',
  DF: 'bg-blue-400 text-white',
  MF: 'bg-emerald-400 text-white',
  FW: 'bg-rose-400 text-white',
};

type PositionFilter = 'ALL' | 'FW' | 'MF' | 'DF' | 'GK';

export default function PowerRankingPageContent() {
  const [data, setData] = useState<PowerRankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PositionFilter>('ALL');

  useEffect(() => {
    fetch(apiUrl('/api/stats/power-ranking?limit=100'))
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === 'ALL'
      ? (data?.rankings ?? [])
      : (data?.rankings ?? []).filter(
          (r) => r.position.split('/')[0] === filter
        );

  return (
    <Section padding="sm">
      <div className="mx-auto max-w-[960px] flex flex-col h-[calc(100dvh-64px)]">
        {/* Sticky header + filter */}
        <div className="shrink-0 pb-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">파워랭킹</h1>
            {data?.season && (
              <p className="mt-1 text-[14px] text-[#9F9F9F]">
                {shortenSeasonName(data.season.season_name)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: 'ALL', label: '전체' },
                { key: 'FW', label: 'FW' },
                { key: 'MF', label: 'MF' },
                { key: 'DF', label: 'DF' },
                { key: 'GK', label: 'GK' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable rankings list */}
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide rounded-2xl border border-[#F0F0F0] bg-white">
          {loading ? (
            <div className="space-y-0 divide-y divide-gray-100">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 animate-pulse"
                >
                  <div className="h-4 w-5 bg-gray-200 rounded" />
                  <div className="h-10 w-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                  </div>
                  <div className="h-8 w-12 bg-gray-200 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-[14px] text-[#9F9F9F]">
              데이터가 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((row, idx) => (
                <RankingRowItem
                  key={row.player_id}
                  row={row}
                  displayRank={filter === 'ALL' ? row.rank : idx + 1}
                />
              ))}
            </div>
          )}

          {/* Formula explanation — inside scroll area */}
          {!loading && filtered.length > 0 && (
            <div className="border-t border-gray-100 px-6 py-5">
              <p className="text-[14px] font-semibold text-gray-900 mb-2">
                파워 인덱스란?
              </p>
              <p className="text-[13px] leading-[1.8] text-[#9F9F9F]">
                파워 인덱스(PI)는 득점·도움·경기 평점·승률·액션 점수를 포지션별
                가중치로 종합한 0~100점 스케일의 선수 순위입니다. 공격수는 공격
                포인트에, 수비수는 클린시트에, 골키퍼는 세이브 성공률과 실점에
                더 높은 가중치가 적용되어 모든 포지션이 공정하게 평가됩니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function RankingRowItem({
  row,
  displayRank,
}: {
  row: RankingRow;
  displayRank: number;
}) {
  const positions = row.position.split('/');

  return (
    <Link
      href={`/players/${row.player_id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
    >
      {/* Rank */}
      <span
        className={`w-6 text-center text-[14px] font-bold ${
          displayRank <= 3 ? 'text-gray-900' : 'text-[#9F9F9F]'
        }`}
      >
        {displayRank}
      </span>

      {/* Profile */}
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {row.profile_image_url ? (
          <Image
            src={row.profile_image_url}
            alt={row.name}
            fill
            sizes="44px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-400">
            {row.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[14px] font-medium text-gray-900">
            {row.name}
          </p>
          <div className="flex items-center gap-0.5 shrink-0">
            {positions.map((pos) => (
              <span
                key={pos}
                className={`rounded px-1 py-px text-[10px] font-semibold ${POSITION_STYLES[pos] ?? 'bg-gray-300 text-white'}`}
              >
                {pos}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {row.team_logo && (
            <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full">
              <Image
                src={row.team_logo}
                alt=""
                fill
                sizes="16px"
                className="object-cover"
              />
            </div>
          )}
          <span className="truncate text-[12px] text-[#9F9F9F]">
            {row.team_name}
          </span>
        </div>
      </div>

      {/* Stats summary */}
      <div className="hidden sm:flex items-center gap-3 shrink-0 text-[12px] text-[#9F9F9F]">
        <span>{row.matches}경기</span>
        <span>{row.goals}골</span>
        <span>{row.assists}도움</span>
        <span>승률 {row.win_rate}%</span>
      </div>

      {/* Power Index */}
      <div
        className="shrink-0 flex items-center justify-center rounded-lg px-2.5 py-1.5 min-w-[48px]"
        style={{
          backgroundColor:
            displayRank === 1
              ? (row.team_color ?? '#111')
              : displayRank <= 3
                ? '#111827'
                : '#F3F4F6',
          color: displayRank <= 3 ? '#fff' : '#111827',
        }}
      >
        <span className="text-[14px] font-bold">{row.power_index}</span>
      </div>
    </Link>
  );
}
