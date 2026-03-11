import type { Metadata } from 'next';

import { PlayersPage } from '@/features/players';
import { getInitialPlayersData } from '@/features/players/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '골때녀 선수 명단 - 시즌별 기록·득점·어시스트 총정리',
  description:
    '골 때리는 그녀들 전체 선수 프로필과 시즌별 득점·어시스트·출전 기록을 한눈에! 팀별·포지션별 검색으로 원하는 선수를 빠르게 찾아보세요.',
  keywords: [
    '골때녀 선수',
    '골때리는 그녀들 선수',
    '골 때리는 그녀들 선수 정보',
    '골때녀 선수 정보',
    '골때녀 득점 순위',
    '골때녀 선수 기록',
    '골때녀 선수 통계',
    '골때녀 출연진',
    '골때녀 선수 목록',
  ],
  alternates: { canonical: '/players' },
  openGraph: {
    title: '골때녀 선수 명단 - 시즌별 기록·득점·어시스트 총정리',
    description:
      '골 때리는 그녀들 전체 선수 프로필과 시즌별 득점·어시스트·출전 기록을 한눈에! 팀별·포지션별 검색으로 원하는 선수를 빠르게 찾아보세요.',
    url: 'https://www.gtndatacenter.com/players',
  },
  twitter: {
    card: 'summary',
    title: '골때녀 선수 명단 - 시즌별 기록·득점·어시스트 총정리',
    description:
      '골 때리는 그녀들 전체 선수 프로필과 시즌별 기록을 한눈에! 팀별·포지션별 검색 가능.',
  },
};

export default async function Page() {
  const initialData = await getInitialPlayersData();
  return <PlayersPage initialData={initialData} />;
}
