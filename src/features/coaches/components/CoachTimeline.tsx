'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export interface MergedCareerItem {
  team_id: number;
  team: {
    team_id: number;
    team_name: string;
    logo: string | null;
    primary_color: string | null;
    secondary_color: string | null;
  };
  role: string;
  start_date: Date;
  end_date: Date | null;
  is_current: boolean;
  seasons: string[];
}

interface CoachTimelineProps {
  mergedCareer: MergedCareerItem[];
}

const CoachTimeline: React.FC<CoachTimelineProps> = ({ mergedCareer }) => {
  if (!mergedCareer || mergedCareer.length === 0) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-[14px] text-[#9F9F9F]">팀 이력이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {mergedCareer.map((item, index) => (
        <Link
          key={`${item.team_id}-${index}`}
          href={`/teams/${item.team_id}`}
          className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-gray-50"
        >
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100">
            {item.team?.logo ? (
              <Image
                src={item.team.logo}
                alt={item.team.team_name}
                fill
                sizes="32px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-medium text-gray-400">
                {item.team?.team_name?.charAt(0) ?? '?'}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[14px] font-medium text-gray-900">
                {item.team?.team_name ?? '-'}
              </p>
              {item.is_current && (
                <span className="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                  현재
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#9F9F9F]">
              {new Date(item.start_date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'short',
              })}
              {item.is_current
                ? ' - 현재'
                : item.end_date
                  ? ` - ${new Date(item.end_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })}`
                  : ''}
              <span className="mx-1">·</span>
              {item.role === 'head' || item.role === 'head_coach'
                ? '감독'
                : '코치'}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default CoachTimeline;
