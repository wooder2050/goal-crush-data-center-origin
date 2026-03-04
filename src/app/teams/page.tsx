import type { Metadata } from 'next';

import { getInitialTeamsData } from '@/features/teams/server';

import TeamsPageClient from './TeamsPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '골때녀 전체 팀 목록·스쿼드·성적',
  description:
    '골 때리는 그녀들 전체 팀 정보를 확인하세요. 팀별 스쿼드, 시즌 성적, 승률, 득실점 통계를 제공합니다.',
  keywords: [
    '골때녀 팀',
    '골때리는 그녀들 팀',
    '골때녀 스쿼드',
    '골때녀 팀 성적',
    '골때녀 팀 순위',
    '골때녀 팀 승률',
  ],
  alternates: { canonical: '/teams' },
  openGraph: {
    title: '골때녀 전체 팀 목록·스쿼드·성적 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 전체 팀 정보를 확인하세요. 팀별 스쿼드, 시즌 성적, 승률, 득실점 통계를 제공합니다.',
    url: 'https://www.gtndatacenter.com/teams',
  },
  twitter: {
    card: 'summary',
    title: '골때녀 전체 팀 목록·스쿼드·성적 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 전체 팀 정보를 확인하세요. 팀별 스쿼드, 시즌 성적, 승률, 득실점 통계를 제공합니다.',
  },
};

export default async function TeamsPage() {
  const initialData = await getInitialTeamsData();
  return <TeamsPageClient initialData={initialData} />;
}
