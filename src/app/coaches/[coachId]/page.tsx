import type { Metadata } from 'next';
import React from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import CoachDetailPage from '@/features/coaches/components/CoachDetailPage';
import CoachDetailSkeleton from '@/features/coaches/components/CoachDetailSkeleton';
import { prisma } from '@/lib/prisma';

interface CoachDetailPageWrapperProps {
  params: Promise<{ coachId: string }>;
}

export async function generateMetadata({
  params,
}: CoachDetailPageWrapperProps): Promise<Metadata> {
  const { coachId } = await params;
  const id = parseInt(coachId, 10);

  if (isNaN(id)) {
    return { title: '감독을 찾을 수 없습니다' };
  }

  const coach = await prisma.coach.findUnique({
    where: { coach_id: id },
  });

  if (!coach) {
    return { title: '감독을 찾을 수 없습니다' };
  }

  const title = `${coach.name} 감독`;
  const description = `골 때리는 그녀들 ${coach.name} 감독의 전적, 승률, 전술 스타일을 확인하세요.`;

  return {
    title,
    description,
    alternates: { canonical: `/coaches/${id}` },
    openGraph: {
      title: `${title} | 골때녀 데이터센터`,
      description,
      url: `https://www.gtndatacenter.com/coaches/${id}`,
      images: coach.profile_image_url
        ? [{ url: coach.profile_image_url, width: 400, height: 400 }]
        : undefined,
    },
    twitter: {
      card: 'summary',
      title: `${title} | 골때녀 데이터센터`,
      description,
    },
  };
}

export default async function CoachDetailPageWrapper({
  params,
}: CoachDetailPageWrapperProps) {
  const { coachId } = await params;

  return (
    <GoalWrapper fallback={<CoachDetailSkeleton />}>
      <CoachDetailPage coachId={parseInt(coachId)} />
    </GoalWrapper>
  );
}
