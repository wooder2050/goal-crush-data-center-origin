'use client';

import { useState } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Card, CardContent, CardHeader, Section } from '@/components/ui';
import { AllRatingsProvider } from '@/features/player-ratings/components/AllRatingsProvider';
import { RatingsContent } from '@/features/player-ratings/components/RatingsContent';

export default function RatingsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const ratingsPerPage = 12;

  const handleSortChange = (newSort: 'recent' | 'popular') => {
    setSortBy(newSort);
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로
  };

  const Skeleton = (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded bg-gray-100 animate-pulse" />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 rounded bg-gray-100 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-8 w-16 rounded bg-gray-100 animate-pulse" />
              <div className="h-8 w-16 rounded bg-gray-100 animate-pulse" />
              <div className="h-8 w-16 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-48 rounded bg-gray-100 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
                        <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
                      <div className="h-16 w-full rounded bg-gray-100 animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Section padding="sm" className="min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">선수 평가 모음</h1>
        <p className="text-gray-600 mt-2">
          모든 선수들의 능력치 평가를 확인해보세요
        </p>
      </div>

      <GoalWrapper fallback={Skeleton}>
        <AllRatingsProvider
          page={currentPage}
          limit={ratingsPerPage}
          sortBy={sortBy}
        >
          {(data) => (
            <RatingsContent
              data={data}
              currentPage={currentPage}
              ratingsPerPage={ratingsPerPage}
              sortBy={sortBy}
              handleSortChange={handleSortChange}
              setCurrentPage={setCurrentPage}
            />
          )}
        </AllRatingsProvider>
      </GoalWrapper>
    </Section>
  );
}
