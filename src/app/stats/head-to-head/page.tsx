import { Metadata } from 'next';

import HeadToHeadPageContent from '@/features/stats/components/HeadToHeadPageContent';
import { getInitialHeadToHeadData } from '@/features/stats/server';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '골때녀 팀 맞대결·상대전적 통계 - 역대 팀 간 전적 비교',
  description:
    '골 때리는 그녀들 두 팀 간의 상대 전적과 맞대결 통계를 확인하세요. 역대 승패 기록, 득점 현황, 최근 경기 결과를 한눈에 비교할 수 있습니다.',
  keywords: [
    '골때녀 맞대결',
    '골때녀 상대전적',
    '골때녀 전적',
    '골때리는 그녀들 팀 통계',
    '골때녀 경기 기록',
    '골때녀 팀 비교',
  ],
  alternates: { canonical: '/stats/head-to-head' },
  openGraph: {
    title: '골때녀 팀 맞대결·상대전적 통계 - 역대 팀 간 전적 비교',
    description:
      '골 때리는 그녀들 두 팀 간의 상대 전적과 맞대결 통계를 한눈에 비교하세요.',
    url: 'https://www.gtndatacenter.com/stats/head-to-head',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '골때녀 팀 맞대결·상대전적 통계 - 역대 팀 간 전적 비교',
    description:
      '골 때리는 그녀들 두 팀 간의 상대 전적과 맞대결 통계를 한눈에 비교하세요.',
  },
};

export default async function HeadToHeadStatsPage() {
  const initialData = await getInitialHeadToHeadData();
  return (
    <>
      <h1 className="sr-only">팀 맞대결 상대전적 통계</h1>
      <HeadToHeadPageContent initialTeams={initialData.teams} />
    </>
  );
}
