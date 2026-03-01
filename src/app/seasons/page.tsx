import type { Metadata } from 'next';

import { SeasonsPage } from '@/features/seasons';
import { getInitialSeasonsPageData } from '@/features/seasons/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '시즌 - 골때녀 순위표 및 리그 결과',
  description:
    '골 때리는 그녀들 시즌별 순위표, 경기 결과, 팀 순위를 확인하세요. G리그, 슈퍼리그, 챌린지리그 등 모든 시즌 데이터를 제공합니다.',
  keywords: [
    '골때녀 순위',
    '골때리는 그녀들 순위',
    '골 때리는 그녀들 순위',
    '골때녀 순위표',
    '골때리는 그녀들 순위표',
    '골 때리는 그녀들 순위표',
    '골때녀 시즌',
    '골때녀 리그',
    '골때녀 G리그',
    '골때녀 슈퍼리그',
  ],
  alternates: { canonical: '/seasons' },
  openGraph: {
    title: '시즌 - 골때녀 순위표 및 리그 결과',
    description:
      '골 때리는 그녀들 시즌별 순위표, 경기 결과, 팀 순위를 확인하세요.',
    url: 'https://www.gtndatacenter.com/seasons',
  },
};

export default async function Page() {
  const initialData = await getInitialSeasonsPageData();
  return <SeasonsPage initialData={initialData} />;
}
