'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import {
  describePowerRankingScope,
  type PowerRankingScope,
} from '@/features/stats/powerRankingScope';
import { apiUrl } from '@/lib/api-url';

type RankingRow = {
  rank: number;
  player_id: number;
  name: string;
  profile_image_url: string | null;
  team_name: string;
  team_logo: string | null;
  team_color: string | null;
  position: string;
  power_index: number;
  /** 이 선수의 집계 경기 수 (평점이 있는 출전만) */
  matches: number;
};

const POSITION_STYLES: Record<string, string> = {
  GK: 'bg-amber-400 text-white',
  DF: 'bg-blue-400 text-white',
  MF: 'bg-emerald-400 text-white',
  FW: 'bg-rose-400 text-white',
};

export default function PowerRankingWidget() {
  const [rankings, setRankings] = useState<RankingRow[]>([]);
  const [isFallback, setIsFallback] = useState(false);
  const [seasonName, setSeasonName] = useState<string | null>(null);
  const [scope, setScope] = useState<PowerRankingScope | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl('/api/stats/power-ranking?limit=3'))
      .then((r) => r.json())
      .then((d) => {
        setRankings(d.rankings ?? []);
        setIsFallback(d.is_fallback ?? false);
        setSeasonName(d.season?.season_name ?? null);
        setScope(d.scope ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const scopeText = describePowerRankingScope(seasonName, scope);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">파워랭킹</CardTitle>
          <Link
            href="/stats/power-ranking"
            className="text-xs text-[#ff4800] hover:underline"
          >
            전체 순위 보기
          </Link>
        </div>
        {/* 집계 범위: 시즌 전체가 아니라 평점이 기록된 일부 경기 기준 */}
        {!loading && scopeText.title && (
          <div className="mt-1 space-y-0.5">
            <p
              className={`text-xs font-medium ${isFallback ? 'text-amber-700' : 'text-gray-600'}`}
            >
              {scopeText.title}
            </p>
            {scopeText.detail && (
              <p className="text-[11px] text-gray-400">{scopeText.detail}</p>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 animate-pulse">
                <div className="h-4 w-4 bg-gray-200 rounded" />
                <div className="h-9 w-9 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-3 w-14 bg-gray-200 rounded" />
                </div>
                <div className="h-6 w-10 bg-gray-200 rounded-md" />
              </div>
            ))}
          </div>
        ) : rankings.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            데이터가 없습니다.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {rankings.map((row) => {
              const posStyle =
                POSITION_STYLES[row.position] ?? 'bg-gray-300 text-white';

              return (
                <Link
                  key={row.player_id}
                  href={`/players/${row.player_id}`}
                  className="flex items-center gap-2.5 py-2 group"
                >
                  {/* Rank */}
                  <span
                    className={`w-4 text-center text-xs font-bold ${
                      row.rank <= 3 ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {row.rank}
                  </span>

                  {/* Profile */}
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100">
                    {row.profile_image_url ? (
                      <Image
                        src={row.profile_image_url}
                        alt={row.name}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-medium text-gray-400">
                        {row.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm font-medium text-gray-900 group-hover:text-[#ff4800] transition-colors">
                        {row.name}
                      </span>
                      <span
                        className={`shrink-0 rounded px-1 py-px text-[9px] font-semibold ${posStyle}`}
                      >
                        {row.position}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {row.team_logo && (
                        <div className="relative h-3.5 w-3.5 shrink-0 overflow-hidden rounded-full">
                          <Image
                            src={row.team_logo}
                            alt={row.team_name || ''}
                            fill
                            sizes="14px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <span className="truncate text-[11px] text-gray-400">
                        {row.team_name} · {row.matches}경기
                      </span>
                    </div>
                  </div>

                  {/* Power Index */}
                  {row.rank === 1 ? (
                    <span
                      className="shrink-0 inline-flex items-center justify-center min-w-[2rem] rounded-full px-2 py-0.5 text-xs font-bold text-white"
                      style={{
                        backgroundColor: row.team_color ?? '#111',
                      }}
                    >
                      {row.power_index}
                    </span>
                  ) : (
                    <span className="shrink-0 text-sm font-bold text-gray-900 tabular-nums">
                      {row.power_index}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
        {!loading && rankings.length > 0 && (
          <Link
            href="/stats/power-ranking"
            className="mt-2 block text-center text-[11px] text-gray-400 hover:text-gray-600"
          >
            평점 기록 경기 기준 · 집계 범위 보기
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
