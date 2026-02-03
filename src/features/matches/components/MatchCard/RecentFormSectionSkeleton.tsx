'use client';

import React from 'react';

import { Card } from '@/components/ui';

interface Props {
  className?: string;
}

const TeamFormSkeleton = () => (
  <div className="flex-1">
    {/* 팀 헤더 */}
    <div className="flex items-center gap-2 mb-2">
      {/* 팀 로고 */}
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
      {/* 팀명 */}
      <div className="w-16 sm:w-20 h-4 bg-gray-200 rounded animate-pulse flex-1" />
      {/* 승/패 요약 */}
      <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
    </div>

    {/* 최근 경기 목록 */}
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-1.5 sm:gap-2">
          {/* 승/패 배지 */}
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
          {/* 스코어 */}
          <div className="w-8 sm:w-10 h-4 bg-gray-200 rounded animate-pulse" />
          {/* 상대팀 */}
          <div className="w-16 sm:w-24 h-3 bg-gray-200 rounded animate-pulse flex-1" />
        </div>
      ))}
    </div>
  </div>
);

export default function RecentFormSectionSkeleton({ className = '' }: Props) {
  return (
    <Card className={`p-3 sm:p-4 ${className}`}>
      <div className="mb-3">
        <div className="text-sm text-gray-700 font-semibold">
          최근 5경기 성적
        </div>
        <div className="mt-0.5 text-[11px] text-gray-500">
          현재 경기 이전 기준
        </div>
      </div>

      {/* 모바일: 세로 배치, 태블릿 이상: 가로 배치 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
        {/* 홈팀 */}
        <TeamFormSkeleton />

        {/* 구분선 - 모바일: 가로선, 태블릿 이상: 세로선 */}
        <div className="h-px sm:h-auto sm:w-px bg-gray-200" />

        {/* 원정팀 */}
        <TeamFormSkeleton />
      </div>
    </Card>
  );
}
