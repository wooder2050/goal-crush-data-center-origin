'use client';

import React from 'react';

import { Card } from '@/components/ui';

interface Props {
  className?: string;
}

export default function KeyPlayersSectionSkeleton({ className = '' }: Props) {
  return (
    <Card className={`p-3 sm:p-4 ${className}`}>
      <div className="mb-3 text-sm font-semibold text-gray-800">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 홈팀 키플레이어 스켈레톤 */}
        <div>
          <div className="text-xs text-gray-600 mb-2 font-medium">
            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
                <div className="text-xs text-gray-500">
                  <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 원정팀 키플레이어 스켈레톤 */}
        <div>
          <div className="text-xs text-gray-600 mb-2 font-medium">
            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
                <div className="text-xs text-gray-500">
                  <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
