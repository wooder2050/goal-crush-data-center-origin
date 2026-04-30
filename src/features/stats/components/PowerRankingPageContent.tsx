'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Section } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiUrl } from '@/lib/api-url';
import { shortenSeasonName } from '@/lib/utils';

type BreakdownEntry = {
  label: string;
  normalized: number;
  weight: number;
  contribution: number;
  raw_value: string;
};

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
  breakdown: BreakdownEntry[];
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
  const [selectedPlayer, setSelectedPlayer] = useState<RankingRow | null>(null);

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
                  onSelect={setSelectedPlayer}
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

      {/* Player Detail Modal */}
      <PlayerDetailModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </Section>
  );
}

function RankingRowItem({
  row,
  displayRank,
  onSelect,
}: {
  row: RankingRow;
  displayRank: number;
  onSelect: (row: RankingRow) => void;
}) {
  const positions = row.position.split('/');

  return (
    <button
      onClick={() => onSelect(row)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
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
                alt={row.team_name || ''}
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
    </button>
  );
}

function PlayerDetailModal({
  player,
  onClose,
}: {
  player: RankingRow | null;
  onClose: () => void;
}) {
  if (!player) return null;

  const primaryPos = player.position.split('/')[0];
  const totalContribution = player.breakdown.reduce(
    (s, b) => s + b.contribution,
    0
  );

  return (
    <Dialog open={!!player} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[440px] p-0 gap-0 rounded-2xl overflow-hidden [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
              {player.profile_image_url ? (
                <Image
                  src={player.profile_image_url}
                  alt={player.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-base font-medium text-gray-400">
                  {player.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-[15px] flex items-center gap-1.5">
                <span className="truncate">{player.name}</span>
                {player.position.split('/').map((pos) => (
                  <span
                    key={pos}
                    className={`rounded px-1 py-px text-[10px] font-semibold ${POSITION_STYLES[pos] ?? 'bg-gray-300 text-white'}`}
                  >
                    {pos}
                  </span>
                ))}
              </DialogTitle>
              <div className="flex items-center gap-1.5 mt-0.5">
                {player.team_logo && (
                  <div className="relative h-3.5 w-3.5 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={player.team_logo}
                      alt={player.team_name || ''}
                      fill
                      sizes="14px"
                      className="object-cover"
                    />
                  </div>
                )}
                <span className="text-[12px] text-[#9F9F9F]">
                  {player.team_name} · {player.matches}경기
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
        </DialogHeader>

        {/* PI Score */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-baseline gap-2">
            <span
              className="text-[32px] font-bold"
              style={{ color: player.team_color ?? '#111827' }}
            >
              {player.power_index}
            </span>
            <span className="text-[13px] text-[#9F9F9F]">/ 100</span>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="px-5 pb-3">
          <p className="text-[12px] font-semibold text-[#9F9F9F] uppercase tracking-wide mb-2">
            PI 계산 상세 ({primaryPos} 가중치)
          </p>
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_52px_52px_56px] bg-gray-50 px-3 py-1.5 text-[11px] font-medium text-[#9F9F9F]">
              <span>지표</span>
              <span className="text-right">정규화</span>
              <span className="text-right">가중치</span>
              <span className="text-right">기여</span>
            </div>
            {/* Table rows */}
            {player.breakdown.map((b) => (
              <div
                key={b.label}
                className="grid grid-cols-[1fr_52px_52px_56px] px-3 py-2 border-t border-gray-50 items-center"
              >
                <div>
                  <span className="text-[13px] text-gray-900">{b.label}</span>
                  <span className="ml-1.5 text-[11px] text-[#BFBFBF]">
                    {b.raw_value}
                  </span>
                </div>
                <span className="text-[13px] text-gray-600 text-right tabular-nums">
                  {b.normalized.toFixed(2)}
                </span>
                <span className="text-[13px] text-gray-600 text-right tabular-nums">
                  {b.weight}
                </span>
                <span className="text-[13px] font-semibold text-gray-900 text-right tabular-nums">
                  {b.contribution.toFixed(1)}
                </span>
              </div>
            ))}
            {/* Total row */}
            <div className="grid grid-cols-[1fr_52px_52px_56px] px-3 py-2 border-t border-gray-200 bg-gray-50">
              <span className="text-[13px] font-semibold text-gray-900">
                합계
              </span>
              <span />
              <span className="text-[13px] text-gray-600 text-right tabular-nums">
                100
              </span>
              <span
                className="text-[13px] font-bold text-right tabular-nums"
                style={{ color: player.team_color ?? '#111827' }}
              >
                {totalContribution.toFixed(1)}
              </span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[#BFBFBF] leading-relaxed">
            정규화: 각 지표를 0~1 범위로 변환한 값. 기여 = 정규화 × 가중치.
            경기별 PI를 계산한 뒤 평균을 낸 값입니다.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <Link
            href={`/players/${player.player_id}`}
            className="block w-full text-center py-2.5 rounded-xl bg-gray-100 text-[13px] font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            선수 상세 페이지
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
