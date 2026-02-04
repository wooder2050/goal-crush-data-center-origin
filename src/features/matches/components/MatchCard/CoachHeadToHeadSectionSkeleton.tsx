'use client';

import React from 'react';

import { Card } from '@/components/ui';

interface Props {
  className?: string;
}

export default function CoachHeadToHeadSectionSkeleton({
  className = '',
}: Props) {
  return (
    <Card className={`p-3 sm:p-4 ${className}`}>
      {/* 헤더 */}
      <div className="mb-3">
        <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-24 mt-1 animate-pulse"></div>
      </div>

      {/* 감독 정보 + 승리 수 */}
      <div className="flex items-center justify-between mb-3">
        {/* 감독 A */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 animate-pulse" />
          <div>
            <div className="h-3 bg-gray-200 rounded w-12 sm:w-16 animate-pulse mb-1"></div>
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-8 animate-pulse"></div>
          </div>
        </div>

        {/* 중앙 - 총 경기 수 */}
        <div className="text-center">
          <div className="h-3 bg-gray-200 rounded w-10 mx-auto animate-pulse mb-1"></div>
          <div className="h-5 sm:h-6 bg-gray-200 rounded w-6 mx-auto animate-pulse"></div>
        </div>

        {/* 감독 B */}
        <div className="flex items-center gap-2 flex-row-reverse">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="text-right">
            <div className="h-3 bg-gray-200 rounded w-12 sm:w-16 animate-pulse mb-1 ml-auto"></div>
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-8 ml-auto animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* 승률 바 */}
      <div className="h-2 sm:h-2.5 rounded-full bg-gray-200 mb-3 animate-pulse"></div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-gray-50 rounded-lg py-2 px-1">
          <div className="h-3 bg-gray-200 rounded w-10 mx-auto animate-pulse mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-6 mx-auto animate-pulse"></div>
        </div>
        <div className="bg-gray-50 rounded-lg py-2 px-1">
          <div className="h-3 bg-gray-200 rounded w-12 mx-auto animate-pulse mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-8 mx-auto animate-pulse"></div>
        </div>
      </div>
    </Card>
  );
}
