import { Metadata } from 'next';
import React from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Section } from '@/components/ui';
import CoachesPage from '@/features/coaches/components/CoachesPage';
import CoachesPageSkeleton from '@/features/coaches/components/CoachesPageSkeleton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '골때녀 역대 감독 목록 - 전적·승률·우승 기록',
  description:
    '골 때리는 그녀들 역대 감독 정보와 감독별 전적, 승률, 우승 기록을 확인하세요. 시즌별 지휘 이력과 팀 성적을 한눈에 비교할 수 있습니다.',
  keywords: [
    '골때녀 감독',
    '골때리는 그녀들 감독',
    '골때녀 감독 전적',
    '골때녀 감독 승률',
  ],
  alternates: { canonical: '/coaches' },
  openGraph: {
    title: '골때녀 역대 감독 목록 - 전적·승률·우승 기록 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 역대 감독 정보와 감독별 전적, 승률, 우승 기록을 확인하세요. 시즌별 지휘 이력과 팀 성적을 한눈에 비교할 수 있습니다.',
    url: 'https://www.gtndatacenter.com/coaches',
  },
  twitter: {
    card: 'summary',
    title: '골때녀 역대 감독 목록 - 전적·승률·우승 기록 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 역대 감독 정보와 감독별 전적, 승률, 우승 기록을 확인하세요.',
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
