'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import type { CoachSeasonRecord } from '@/features/teams/server';
import { shortenSeasonName } from '@/lib/utils';

interface TeamCoachStatsCardProps {
  coachSeasonRecords: CoachSeasonRecord[];
  teamColor?: string;
}

const CHART_HEIGHT = 140;
const BADGE_AREA_TOP = 10;
const BADGE_AREA_BOTTOM = 55;

function useVisibleCount() {
  const [count, setCount] = useState(6);
  useEffect(() => {
    const update = () => setCount(window.innerWidth < 640 ? 3 : 6);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return count;
}

export default function TeamCoachStatsCard({
  coachSeasonRecords,
  teamColor = '#3B82F6',
}: TeamCoachStatsCardProps) {
  const visibleCount = useVisibleCount();
  const maxStart = Math.max(coachSeasonRecords.length - visibleCount, 0);
  const [startIdx, setStartIdx] = useState(maxStart);

  // visibleCount 변경 시 항상 최신 시즌으로 리셋
  useEffect(() => {
    setStartIdx(Math.max(coachSeasonRecords.length - visibleCount, 0));
  }, [visibleCount, coachSeasonRecords.length]);

  if (coachSeasonRecords.length === 0) return null;

  const visible = coachSeasonRecords.slice(startIdx, startIdx + visibleCount);

  const canPrev = startIdx > 0;
  const canNext = startIdx + visibleCount < coachSeasonRecords.length;

  // Y position: 100% win rate → top, 0% → bottom
  const getTop = (winRate: number) => {
    const range = CHART_HEIGHT - BADGE_AREA_TOP - BADGE_AREA_BOTTOM;
    return BADGE_AREA_TOP + range * (1 - winRate / 100);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      <div className="px-6 py-4">
        <p className="text-[18px] font-medium text-gray-900">감독 승률</p>
        <p className="text-[13px] text-[#9F9F9F]">경기당 승점</p>
      </div>

      {/* Chart area */}
      <div className="relative px-2">
        {canPrev && (
          <button
            onClick={() => setStartIdx((s) => Math.max(s - 1, 0))}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-colors hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
        )}
        {canNext && (
          <button
            onClick={() =>
              setStartIdx((s) =>
                Math.min(s + 1, coachSeasonRecords.length - visibleCount)
              )
            }
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-colors hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        )}

        {/* Gray background chart box */}
        <div
          className="mx-6 rounded-xl bg-gray-50 overflow-visible"
          style={{ height: CHART_HEIGHT }}
        >
          <div className="relative flex h-full">
            {visible.map((r, i) => {
              const top = getTop(r.win_rate);
              return (
                <div
                  key={`${r.season_name}-${r.coach_id}-${i}`}
                  className="group relative flex-1 rounded-lg transition-colors hover:bg-gray-100/80 cursor-pointer"
                >
                  {/* Tooltip on hover */}
                  <div
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-20 hidden group-hover:flex flex-col items-center"
                    style={{ top: top - 75 }}
                  >
                    <div className="rounded-lg bg-white px-4 py-2 shadow-lg border border-gray-200 flex flex-col items-center w-max">
                      <p className="text-[15px] font-medium text-gray-900 whitespace-nowrap">
                        {shortenSeasonName(r.season_name)}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] font-bold text-gray-900 whitespace-nowrap">
                        <span>
                          <span className="mr-0.5 rounded bg-green-500 px-1.5 py-0.5 text-[12px] text-white">
                            승
                          </span>{' '}
                          {r.wins}
                        </span>
                        <span>
                          <span className="mr-0.5 rounded bg-red-500 px-1.5 py-0.5 text-[12px] text-white">
                            패
                          </span>{' '}
                          {r.losses}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-1.5 rotate-45 bg-white border-b border-r border-gray-200 -mt-1" />
                  </div>

                  <div
                    className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
                    style={{ top }}
                  >
                    {/* Win rate badge */}
                    <span
                      className="rounded-md px-3 py-1 text-[14px] font-bold text-white whitespace-nowrap"
                      style={{ backgroundColor: teamColor }}
                    >
                      {r.win_rate}%
                    </span>
                    {/* PPG */}
                    <span className="mt-1 rounded-md bg-white px-2.5 py-0.5 text-[13px] font-medium text-gray-500 whitespace-nowrap shadow-sm">
                      {r.ppg} 승점
                    </span>
                  </div>
                  {/* Thin vertical line from below ppg box to bottom */}
                  <div
                    className="absolute left-1/2 bottom-0 w-0.5 -translate-x-1/2 rounded-full"
                    style={{
                      height: Math.max(CHART_HEIGHT - top - 60, 0),
                      backgroundColor: teamColor,
                      opacity: 0.3,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Coach profiles + season names */}
      <div className="px-8 py-3">
        <div className="flex justify-center gap-2">
          {visible.map((r, i) => (
            <div
              key={`coach-${r.season_name}-${r.coach_id}-${i}`}
              className="flex flex-1 flex-col items-center"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
                {r.profile_image_url ? (
                  <Image
                    src={r.profile_image_url}
                    alt={r.coach_name}
                    fill
                    sizes="48px"
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] font-medium text-gray-400">
                    {r.coach_name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="mt-1.5 text-[13px] font-medium text-gray-700 truncate max-w-full text-center">
                {r.coach_name}
              </span>
              <span className="text-[11px] text-[#9F9F9F] truncate max-w-full text-center">
                {shortenSeasonName(r.season_name)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
