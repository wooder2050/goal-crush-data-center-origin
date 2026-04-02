import { Metadata } from 'next';
import React from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Section } from '@/components/ui';
import CoachesPage from '@/features/coaches/components/CoachesPage';
import CoachesPageSkeleton from '@/features/coaches/components/CoachesPageSkeleton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '골때녀 감독 명단 - 역대 감독별 전적·승률·우승 비교',
  description:
    '골 때리는 그녀들 역대 감독의 통산 전적, 승률, 우승 횟수를 한눈에 비교! 어떤 감독이 가장 많이 이겼을까? 시즌별 지휘 이력과 팀 성적까지 확인하세요.',
  keywords: [
    '골때녀 감독',
    '골때리는 그녀들 감독',
    '골때녀 감독 전적',
    '골때녀 감독 승률',
    '골때녀 감독 누구',
    '골때녀 감독 순위',
  ],
  alternates: { canonical: '/coaches' },
  openGraph: {
    title: '골때녀 감독 명단 - 역대 감독별 전적·승률·우승 비교',
    description:
      '골 때리는 그녀들 역대 감독의 통산 전적, 승률, 우승 횟수를 한눈에 비교! 어떤 감독이 가장 많이 이겼을까? 시즌별 지휘 이력과 팀 성적까지 확인하세요.',
    url: 'https://www.gtndatacenter.com/coaches',
  },
  twitter: {
    card: 'summary',
    title: '골때녀 감독 명단 - 역대 감독별 전적·승률·우승 비교',
    description:
      '골 때리는 그녀들 역대 감독의 통산 전적, 승률, 우승 횟수를 한눈에 비교!',
  },
};

export default function CoachesPageWrapper() {
  return (
    <Section padding="sm" className="pt-2 sm:pt-3">
      <GoalWrapper fallback={<CoachesPageSkeleton />}>
        <CoachesPage />
      </GoalWrapper>
    </Section>
  );
}
