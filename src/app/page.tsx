import type { Metadata } from 'next';

import { HomePageDashboard } from '@/features/home';
import { getHomePageData } from '@/features/home/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    absolute: '2026 골때녀 순위·경기결과·선수 통계 | 골때녀 데이터센터',
  },
  description:
    '골 때리는 그녀들 2026 G리그 순위표, 경기 결과, 선수 스탯을 실시간 제공합니다. 골때녀 리부트 팀 순위부터 득점·도움·평점 랭킹, 선수 프로필까지 한곳에서 확인하세요.',
  keywords: [
    '골때녀 순위',
    '2026 골때녀 순위',
    '골때녀 리부트 순위',
    '골때녀 g리그 순위',
    '골때녀 데이터',
    '골때녀 경기결과',
    '골때녀 선수 통계',
    '골 때리는 그녀들 순위',
    '골때녀 득점 순위',
    '골때녀 팀 순위',
  ],
  openGraph: {
    title: '2026 골때녀 순위·경기결과·선수 통계 | 골때녀 데이터센터',
    description:
      '골 때리는 그녀들 2026 G리그 순위표, 경기 결과, 선수 스탯을 실시간 제공. 팀 순위부터 득점·도움·평점 랭킹까지 한곳에서.',
    type: 'website',
    url: 'https://www.gtndatacenter.com',
    siteName: '골때녀 데이터센터',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: '2026 골때녀 순위·경기결과·선수 통계 | 골때녀 데이터센터',
    description:
      '골 때리는 그녀들 2026 G리그 순위표, 경기 결과, 선수 스탯을 실시간 제공. 팀 순위부터 득점·도움·평점 랭킹까지.',
  },
  alternates: {
    canonical: 'https://www.gtndatacenter.com',
  },
};

export default async function Page() {
  const initialData = await getHomePageData();
  return <HomePageDashboard initialData={initialData} />;
}
