'use client';

import React from 'react';

import { Card } from '@/components/ui';

interface Props {
  className?: string;
}

export default function FeaturedPlayersSectionSkeleton({
  className = '',
}: Props) {
  return (
    <Card className={`p-3 sm:p-4 ${className}`}>
      <div className="mb-3 text-sm font-semibold text-gray-800">
        <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 홈팀 선수 스켈레톤 */}
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-2 font-medium">
            <div className="h-3 bg-gray-200 rounded w-20 mx-auto animate-pulse"></div>
          </div>
          <div className="relative w-full h-56 sm:h-72 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
          <div className="space-y-1">
            <div className="h-4 bg-gray-200 rounded w-24 mx-auto animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mx-auto animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-20 mx-auto animate-pulse"></div>
          </div>
        </div>

        {/* 원정팀 선수 스켈레톤 */}
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-2 font-medium">
            <div className="h-3 bg-gray-200 rounded w-20 mx-auto animate-pulse"></div>
          </div>
          <div className="relative w-full h-56 sm:h-72 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
          <div className="space-y-1">
            <div className="h-4 bg-gray-200 rounded w-24 mx-auto animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mx-auto animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-20 mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    </Card>
  );
}
