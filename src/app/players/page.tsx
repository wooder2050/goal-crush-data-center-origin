import type { Metadata } from 'next';

import { PlayersPage } from '@/features/players';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '선수 - 골때녀 선수 정보 및 기록',
  description:
    '골 때리는 그녀들 선수 정보, 시즌별 기록, 득점 순위, 어시스트 순위를 확인하세요. 모든 선수의 상세 프로필과 경기 통계를 제공합니다.',
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
    title: '선수 - 골때녀 선수 정보 및 기록',
    description:
      '골 때리는 그녀들 선수 정보, 시즌별 기록, 득점 순위를 확인하세요.',
    url: 'https://www.gtndatacenter.com/players',
  },
};

export default function Page() {
  return <PlayersPage />;
}
