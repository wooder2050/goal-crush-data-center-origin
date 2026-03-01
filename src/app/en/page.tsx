import type { Metadata } from 'next';

import { EnglishDashboard } from '@/features/home/components/EnglishDashboard';
import { getHomePageData } from '@/features/home/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    absolute:
      'Kick a Goal Stats — Match Results, Player Rankings & Team Standings',
  },
  description:
    'All match results, player records, and team standings for SBS Kick a Goal (골 때리는 그녀들) at a glance. Check season standings, top scorers, and head-to-head records.',
  alternates: {
    canonical: '/en',
    languages: {
      ko: '/',
      en: '/en',
    },
  },
};

export default async function EnglishPage() {
  const data = await getHomePageData();
  return <EnglishDashboard data={data} />;
}
