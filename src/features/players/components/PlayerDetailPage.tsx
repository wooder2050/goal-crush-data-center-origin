'use client';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Card, CardContent, Grid, Section } from '@/components/ui';
import PlayerDetailContent from '@/features/players/components/PlayerDetailContent';
import type { Player } from '@/lib/types';

export default function PlayerDetailPage({
  playerId,
  initialPlayer,
}: {
  playerId: number | null;
  initialPlayer?: Player;
}) {
  const isPending = playerId == null;

  const Skeleton = (
    <div className="space-y-6">
      <div className="h-7 w-44 rounded bg-gray-100 animate-pulse" />
      <Grid cols={4} gap="lg">
        {/* 선수 프로필 스켈레톤 */}
        <Card className="col-span-4 md:col-span-2 overflow-hidden">
          <div className="h-64 w-full animate-pulse bg-gray-100" />
          <CardContent>
            <div className="mt-3 h-5 w-1/2 rounded bg-gray-100 animate-pulse" />
            <div className="mt-2 h-4 w-1/3 rounded bg-gray-100 animate-pulse" />
          </CardContent>
        </Card>

        {/* 기본 정보 스켈레톤 */}
        <Card className="col-span-4 md:col-span-2">
          <CardContent>
            <div className="mt-3 space-y-3">
              <div className="h-4 w-2/3 rounded bg-gray-100 animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-gray-100 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* 능력치 평가 스켈레톤 */}
        <Card className="col-span-4">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-32 rounded bg-gray-100 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-8 w-20 rounded bg-gray-100 animate-pulse" />
                <div className="h-8 w-24 rounded bg-gray-100 animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
                <div className="h-6 w-16 rounded bg-gray-100 animate-pulse" />
              </div>
              {/* 레이더 차트 스켈레톤 */}
              <div className="h-64 w-full rounded bg-gray-100 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
                <div className="h-12 w-full rounded bg-gray-100 animate-pulse" />
                <div className="h-12 w-full rounded bg-gray-100 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>
    </div>
  );

  return (
    <Section padding="sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">선수 상세 정보</h1>
      </div>
      {isPending ? (
        Skeleton
      ) : initialPlayer ? (
        <PlayerDetailContent
          playerId={playerId!}
          initialPlayer={initialPlayer}
        />
      ) : (
        <GoalWrapper fallback={Skeleton}>
          <PlayerDetailContent playerId={playerId!} />
        </GoalWrapper>
      )}
    </Section>
  );
}
