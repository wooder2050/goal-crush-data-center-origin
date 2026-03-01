import type { Metadata } from 'next';

import { PlayersPage } from '@/features/players';
import { getInitialPlayersData } from '@/features/players/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '골때녀 전체 선수 목록·프로필·기록',
  description:
    '골 때리는 그녀들 전체 선수 프로필, 시즌별 득점·어시스트 기록, 출전 통계를 한눈에 확인하세요. 팀별·포지션별 선수 검색도 가능합니다.',
  keywords: [
    '골때녀 선수',
    '골때리는 그녀들 선수',
    '골 때리는 그녀들 선수 정보',
    '골때녀 선수 정보',
    '골때녀 득점 순위',
    '골때녀 선수 기록',
    '골때녀 선수 통계',
    '골때녀 출연진',
  ],
  alternates: { canonical: '/players' },
  openGraph: {
    title: '골때녀 전체 선수 목록·프로필·기록 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 전체 선수 프로필, 시즌별 득점·어시스트 기록, 출전 통계를 한눈에 확인하세요.',
    url: 'https://www.gtndatacenter.com/players',
  },
  twitter: {
    card: 'summary',
    title: '골때녀 전체 선수 목록·프로필·기록 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 전체 선수 프로필, 시즌별 득점·어시스트 기록, 출전 통계를 한눈에 확인하세요.',
  },
};

export default async function Page() {
  const initialData = await getInitialPlayersData();
  return <PlayersPage initialData={initialData} />;
}
