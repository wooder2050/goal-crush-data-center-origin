'use client';

import React from 'react';

import { Card, CardContent } from '@/components/ui/card';

interface DetailMatchCardSkeletonProps {
  className?: string;
}

export default function DetailMatchCardSkeleton({
  className = '',
}: DetailMatchCardSkeletonProps) {
  return (
    <Card className={className}>
      <CardContent className="px-0 py-2 sm:p-4">
        <div className="animate-pulse space-y-4">
          {/* MatchHeader 스켈레톤 */}
          <div className="flex items-center justify-between px-3 sm:px-0">
            <div className="h-5 w-48 rounded bg-gray-200" />
            <div className="h-4 w-28 rounded bg-gray-200" />
          </div>

          {/* MatchScoreHeader 스켈레톤 */}
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gray-200 sm:h-12 sm:w-12" />
              <div className="h-4 w-20 rounded bg-gray-200" />
            </div>
            <div className="h-10 w-16 rounded bg-gray-200" />
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gray-200 sm:h-12 sm:w-12" />
              <div className="h-4 w-20 rounded bg-gray-200" />
            </div>
          </div>

          {/* 탭 바 스켈레톤 */}
          <div className="flex gap-0 border-b border-gray-200">
            <div className="h-11 flex-1 border-b-2 border-gray-300 bg-gray-50" />
            <div className="h-11 flex-1" />
            <div className="h-11 flex-1" />
            <div className="h-11 flex-1" />
          </div>

          {/* 탭 콘텐츠 스켈레톤 */}
          <div className="space-y-3 px-3 sm:px-0">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-3 w-full rounded bg-gray-200" />
            <div className="h-3 w-11/12 rounded bg-gray-200" />
            <div className="h-3 w-10/12 rounded bg-gray-200" />
            <div className="mt-4 h-4 w-28 rounded bg-gray-200" />
            <div className="h-3 w-full rounded bg-gray-200" />
            <div className="h-3 w-9/12 rounded bg-gray-200" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
