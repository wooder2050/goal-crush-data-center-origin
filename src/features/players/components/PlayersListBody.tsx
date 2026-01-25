'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent, CardTitle } from '@/components/ui';
import { getPositionColor } from '@/features/matches/lib/matchUtils';
import type { PlayersPageItem } from '@/features/players/api-prisma';
import SkeletonCard from '@/features/players/components/SkeletonCard';
import SeasonListBadges from '@/features/teams/components/SeasonListBadges';

export default function PlayersListBody({
  items,
  showFillers,
}: {
  items: PlayersPageItem[];
  showFillers: boolean;
}) {
  // responsive fillers to keep the grid edges clean
  const fill2 = (2 - (items.length % 2)) % 2; // mobile (2 cols)
  const fill3 = (3 - (items.length % 3)) % 3; // md (3 cols)
  const fill4 = (4 - (items.length % 4)) % 4; // lg (4 cols)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {items.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 text-center text-sm text-gray-500 py-8">
            검색 결과가 없습니다.
          </div>
        ) : (
          items.map((p) => {
            const hasImage = Boolean(p.profile_image_url);
            const seasonLabels = (p.seasons ?? [])
              .map((s) => s.season_name || (s.year ? `시즌 ${s.year}` : null))
              .filter((x): x is string => Boolean(x));
            const totals = p.totals;
            return (
              <Card
                key={p.player_id}
                className="group overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-1 hover:ring-gray-200"
              >
                <Link href={`/players/${p.player_id}`}>
                  <div className="relative w-full aspect-[3/4] bg-white flex items-center justify-center">
                    {hasImage ? (
                      <Image
                        src={p.profile_image_url || ''}
                        alt={`${p.name} 프로필 이미지`}
                        fill
                        sizes="(max-width: 640px) 100vw, 25vw"
                        className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <div className="text-xs text-gray-600 flex items-center gap-4">
                      <span className="inline-flex items-center gap-1">
                        {p.team?.team_id && p.team?.logo ? (
                          <span className="relative inline-block h-5 w-5 overflow-hidden rounded-full align-middle">
                            <Image
                              src={p.team.logo}
                              alt={`${p.team.team_name} 로고`}
                              fill
                              sizes="20px"
                              className="object-cover"
                            />
                          </span>
                        ) : (
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-700">
                            {(p.team?.team_name ?? '팀').charAt(0)}
                          </span>
                        )}
                        <span>{p.team?.team_name ?? '팀 미정'}</span>
                      </span>
                      <span className="text-gray-300">|</span>
                      {p.position ? (
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${getPositionColor(
                            p.position
                          )}`}
                        >
                          {p.position}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          -
                        </span>
                      )}
                    </div>
                    <CardTitle className="mt-1 text-base font-semibold text-gray-900">
                      {p.jersey_number != null ? (
                        <span className="mr-1 text-gray-500">
                          #{p.jersey_number}
                        </span>
                      ) : null}
                      {p.name}
                    </CardTitle>
                    {totals && (
                      <div className="mt-1 text-xs text-gray-600 space-y-0.5">
                        <div>🗓️ 출전 {totals.appearances ?? 0}</div>
                        <div>
                          ⚽️ 골 {totals.goals ?? 0} · 🤝 도움{' '}
                          {totals.assists ?? 0}
                          {(totals.goals_conceded ?? 0) > 0 && (
                            <> · 🥅 실점 {totals.goals_conceded}</>
                          )}
                        </div>
                      </div>
                    )}
                    {seasonLabels.length > 0 && (
                      <div className="mt-2">
                        <SeasonListBadges
                          labels={seasonLabels}
                          max={3}
                          align="start"
                        />
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            );
          })
        )}

        {showFillers &&
          fill2 > 0 &&
          Array.from({ length: fill2 }).map((_, i) => (
            <SkeletonCard key={`fill-2-${i}`} className="md:hidden" />
          ))}
        {showFillers &&
          fill3 > 0 &&
          Array.from({ length: fill3 }).map((_, i) => (
            <SkeletonCard
              key={`fill-3-${i}`}
              className="hidden md:block lg:hidden"
            />
          ))}
        {showFillers &&
          fill4 > 0 &&
          Array.from({ length: fill4 }).map((_, i) => (
            <SkeletonCard key={`fill-4-${i}`} className="hidden lg:block" />
          ))}
      </div>
    </div>
  );
}
