'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl('/api/stats/power-ranking?limit=5'))
      .then((r) => r.json())
      .then((d) => {
        setRankings(d.rankings ?? []);
        setIsFallback(d.is_fallback ?? false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">파워랭킹</CardTitle>
            {isFallback && (
              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                지난 시즌
              </span>
            )}
          </div>
          <Link
            href="/stats/power-ranking"
            className="text-xs text-[#ff4800] hover:underline"
          >
            전체 순위 보기
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
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
                        {row.team_name}
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
      </CardContent>
    </Card>
  );
}
