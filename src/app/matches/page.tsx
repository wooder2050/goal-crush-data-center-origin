import type { Metadata } from 'next';

import { getMatchesArchiveData } from '@/features/matches/server';

import MatchesArchiveContent from './MatchesArchiveContent';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '경기 기록',
  description:
    '골 때리는 그녀들 전체 경기 기록. 최근 경기 결과, 예정 경기, 시즌별 경기 아카이브를 확인하세요.',
  keywords: [
    '골때녀 경기',
    '골때녀 경기결과',
    '골때녀 경기 기록',
    '골 때리는 그녀들 경기',
  ],
  alternates: { canonical: '/matches' },
  openGraph: {
    title: '경기 기록 | 골때녀 데이터센터',
    description:
      '골 때리는 그녀들 전체 경기 기록. 최근 결과, 예정 경기, 시즌별 아카이브.',
    url: 'https://www.gtndatacenter.com/matches',
  },
};

export default async function MatchesPage() {
  const { seasons, recentMatches, upcomingMatches } =
    await getMatchesArchiveData();

  return (
    <MatchesArchiveContent
      seasons={seasons}
      recentMatches={recentMatches}
      upcomingMatches={upcomingMatches}
    />
  );
}
