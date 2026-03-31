'use client';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Section } from '@/components/ui';
import PlayerDetailContent from '@/features/players/components/PlayerDetailContent';
import type { Player } from '@/lib/types';

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-gray-100 ${className ?? ''}`} />
  );
}

function PlayerDetailSkeleton() {
  return (
    <div
      className="mx-auto max-w-[1280px]"
      role="status"
      aria-label="선수 상세 정보 로딩 중"
    >
      {/* Top row: Header + Traits */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Header card */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
            {/* Banner */}
            <div className="px-6 pb-5 pt-8 sm:px-8">
              <div className="flex items-center gap-4">
                <SkeletonBlock className="h-20 w-20 !rounded-full" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-7 w-40" />
                  <SkeletonBlock className="h-4 w-24" />
                </div>
              </div>
            </div>
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-px border-t border-gray-100">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="px-6 py-4">
                  <SkeletonBlock className="h-5 w-10" />
                  <SkeletonBlock className="mt-1 h-3 w-14" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Traits / Career */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white p-6">
            <SkeletonBlock className="h-5 w-24" />
            <SkeletonBlock className="mt-2 h-3 w-40" />
            <SkeletonBlock className="mx-auto mt-6 h-48 w-48 !rounded-full" />
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Current Season */}
          <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
            <div className="border-b border-gray-100 px-6 py-4">
              <SkeletonBlock className="h-5 w-28" />
            </div>
            <div className="grid grid-cols-4 gap-px">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="py-5 text-center">
                  <SkeletonBlock className="mx-auto h-5 w-8" />
                  <SkeletonBlock className="mx-auto mt-1 h-3 w-12" />
                </div>
              ))}
            </div>
          </div>

          {/* Compare button */}
          <SkeletonBlock className="h-12 w-full !rounded-2xl" />

          {/* Match Log */}
          <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
            <div className="px-6 py-4">
              <SkeletonBlock className="h-5 w-20" />
            </div>
            <div className="space-y-0 divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <SkeletonBlock className="h-4 w-14" />
                  <SkeletonBlock className="h-4 w-16" />
                  <SkeletonBlock className="h-4 flex-1" />
                  <SkeletonBlock className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>

          {/* Pass Map */}
          <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
            <div className="border-b border-gray-100 px-6 py-4">
              <SkeletonBlock className="h-5 w-16" />
            </div>
            <div className="flex flex-col sm:flex-row">
              <div className="flex-1 p-4">
                <SkeletonBlock className="aspect-[2/1] w-full" />
              </div>
              <div className="flex flex-1 flex-col gap-4 p-4 sm:border-l sm:border-gray-100">
                <div className="flex justify-around">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="text-center">
                      <SkeletonBlock className="mx-auto h-6 w-10" />
                      <SkeletonBlock className="mx-auto mt-1 h-3 w-12" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <SkeletonBlock key={i} className="h-8 w-20 !rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Season Detailed Stats */}
          <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
            <div className="border-b border-gray-100 px-6 py-4">
              <SkeletonBlock className="h-5 w-20" />
            </div>
            <div className="space-y-3 px-5 py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="h-4 w-10" />
                  <SkeletonBlock className="h-2 w-[45%]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4 lg:col-span-1">
          {/* Career */}
          <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
            <div className="px-6 py-4">
              <SkeletonBlock className="h-5 w-12" />
            </div>
            <div className="space-y-3 px-4 py-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <SkeletonBlock className="h-7 w-7 !rounded-full" />
                  <div className="flex-1 space-y-1">
                    <SkeletonBlock className="h-4 w-28" />
                    <SkeletonBlock className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attack Points / GK Stats */}
          <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
            <div className="px-6 py-4">
              <SkeletonBlock className="h-5 w-24" />
            </div>
            <div className="space-y-0 divide-y divide-gray-100">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-4 py-3">
                  <SkeletonBlock className="h-3 w-full" />
                  <SkeletonBlock className="mt-2 h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>

          {/* Trophies */}
          <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
            <div className="px-6 py-4">
              <SkeletonBlock className="h-5 w-14" />
            </div>
            <div className="px-4 pb-4">
              <SkeletonBlock className="h-20 w-full !rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayerDetailPage({
  playerId,
  initialPlayer,
}: {
  playerId: number | null;
  initialPlayer?: Player;
}) {
  return (
    <Section padding="sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">선수 상세 정보</h1>
      </div>
      {(() => {
        if (playerId == null) return <PlayerDetailSkeleton />;
        if (initialPlayer) {
          return (
            <PlayerDetailContent
              playerId={playerId}
              initialPlayer={initialPlayer}
            />
          );
        }
        return (
          <GoalWrapper fallback={<PlayerDetailSkeleton />}>
            <PlayerDetailContent playerId={playerId} />
          </GoalWrapper>
        );
      })()}
    </Section>
  );
}
