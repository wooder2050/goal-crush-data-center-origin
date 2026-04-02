import type { Metadata } from 'next';

import { HomePageDashboard } from '@/features/home';
import { getHomePageData } from '@/features/home/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    absolute: '골때녀 데이터 센터 - 골 때리는 그녀들 경기결과·선수·팀 통계',
  },
  description:
    '골 때리는 그녀들(골때녀)의 모든 경기 결과, 선수 기록, 팀 순위를 한눈에! 시즌별 순위표, 득점 순위, 맞대결 기록, 선수 프로필까지 확인하세요.',
  openGraph: {
    title: '골때녀 데이터 센터 - 골 때리는 그녀들 경기결과·선수·팀 통계',
    description:
      '골 때리는 그녀들(골때녀)의 모든 경기 결과, 선수 기록, 팀 순위를 한눈에! 시즌별 순위표, 득점 순위, 맞대결 기록, 선수 프로필까지 확인하세요.',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: '골때녀 데이터 센터 - 골 때리는 그녀들 경기결과·선수·팀 통계',
    description:
      '골 때리는 그녀들(골때녀)의 모든 경기 결과, 선수 기록, 팀 순위를 한눈에! 시즌별 순위표, 득점 순위, 맞대결 기록, 선수 프로필까지 확인하세요.',
  },
  alternates: {
    canonical: '/',
    languages: {
      ko: '/',
      en: '/en',
    },
  },
};

export default async function Page() {
  const initialData = await getHomePageData();
  return <HomePageDashboard initialData={initialData} />;
}
