import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui';

import type { PlayerStatRow } from '../types';

interface PlayerCompareBannerProps {
  topScorers: PlayerStatRow[];
  topAssists: PlayerStatRow[];
}

export default function PlayerCompareBanner({
  topScorers,
  topAssists,
}: PlayerCompareBannerProps) {
  const scorer = topScorers[0];
  const assister = topAssists[0];

  if (!scorer?.player_id || !assister?.player_id) return null;
  // 같은 선수면 의미 없으므로 숨김
  if (scorer.player_id === assister.player_id) return null;

  return (
    <Link
      href={`/stats/player-compare?player1=${scorer.player_id}&player2=${assister.player_id}`}
    >
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">
              득점왕 vs 도움왕
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-gray-700">
              비교하기
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <div className="flex items-center justify-between">
            {/* Scorer */}
            <div className="flex items-center gap-2.5">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
                {scorer.player_image ? (
                  <Image
                    src={scorer.player_image}
                    alt={scorer.player_name ?? ''}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-400">
                    {scorer.player_name?.[0]}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">
                  {scorer.player_name}
                </p>
                <p className="text-xs text-gray-500">{scorer.goals}골</p>
              </div>
            </div>

            <span className="shrink-0 px-2 text-sm font-black text-gray-300">
              VS
            </span>

            {/* Assister */}
            <div className="flex flex-row-reverse items-center gap-2.5">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
                {assister.player_image ? (
                  <Image
                    src={assister.player_image}
                    alt={assister.player_name ?? ''}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-400">
                    {assister.player_name?.[0]}
                  </div>
                )}
              </div>
              <div className="min-w-0 text-right">
                <p className="truncate text-sm font-bold text-gray-900">
                  {assister.player_name}
                </p>
                <p className="text-xs text-gray-500">{assister.assists}도움</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
