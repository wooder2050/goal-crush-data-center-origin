import type { Metadata } from 'next';

import { EnglishDashboard } from '@/features/home/components/EnglishDashboard';
import { getHomePageData } from '@/features/home/server';
import { withRetry } from '@/lib/retry';

export const revalidate = 600;

export const metadata: Metadata = {
  title: {
    absolute:
      'Kick a Goal Data Center — Stats, Scores & Player Records (SBS 골때녀)',
  },
  description:
    'The ultimate stats hub for SBS Kick a Goal (골 때리는 그녀들). Browse every match score, player profile, goal rankings, and team standings across all seasons.',
  keywords: [
    'Kick a Goal',
    'Kick a Goal stats',
    'SBS Kick a Goal',
    '골때리는 그녀들',
    'Korean women football variety show',
    'Kick a Goal player stats',
    'Kick a Goal results',
  ],
  openGraph: {
    title:
      'Kick a Goal Data Center — Stats, Scores & Player Records (SBS 골때녀)',
    description:
      'The ultimate stats hub for SBS Kick a Goal (골 때리는 그녀들). Browse every match score, player profile, goal rankings, and team standings across all seasons.',
    url: '/en',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Kick a Goal Data Center — Stats, Scores & Player Records (SBS 골때녀)',
    description:
      'The ultimate stats hub for SBS Kick a Goal (골 때리는 그녀들). Browse every match score, player profile, goal rankings, and team standings across all seasons.',
  },
  alternates: {
    canonical: '/en',
    languages: {
      ko: '/',
      en: '/en',
    },
  },
  robots: { index: false, follow: true },
};

export default async function EnglishPage() {
  // 빌드 프리렌더 시 DB 순단 방어 — 페이지 레벨만 재시도 (API 라우트는 영향 없음)
  const data = await withRetry(() => getHomePageData());
  return <EnglishDashboard data={data} />;
}
