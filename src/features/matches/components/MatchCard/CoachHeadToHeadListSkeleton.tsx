'use client';

import React from 'react';

import { Card } from '@/components/ui';

interface Props {
  className?: string;
}

export default function CoachHeadToHeadListSkeleton({ className = '' }: Props) {
  return (
    <Card className={`p-3 sm:p-4 ${className}`}>
      {/* 헤더 */}
      <div className="mb-3">
        <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-24 mt-1 animate-pulse"></div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-gray-50 rounded-lg overflow-hidden">
            {/* 경기 정보 헤더 */}
            <div className="px-3 py-1.5 flex items-center justify-between border-b border-gray-100">
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>

            {/* 경기 결과 */}
            <div className="flex items-center justify-between px-2 sm:px-3 py-2 sm:py-3">
              {/* 홈 감독 */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-200 animate-pulse" />
                <div className="min-w-0 flex-1">
                  <div className="h-3 bg-gray-200 rounded w-12 animate-pulse mb-1"></div>
                  <div className="h-2.5 bg-gray-200 rounded w-10 animate-pulse"></div>
                </div>
              </div>

              {/* 스코어 */}
              <div className="flex items-center gap-2 px-2 sm:px-4">
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-4 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-2 animate-pulse"></div>
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-4 animate-pulse"></div>
              </div>

              {/* 원정 감독 */}
              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <div className="min-w-0 flex-1 text-right">
                  <div className="h-3 bg-gray-200 rounded w-12 ml-auto animate-pulse mb-1"></div>
                  <div className="h-2.5 bg-gray-200 rounded w-10 ml-auto animate-pulse"></div>
                </div>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-200 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
