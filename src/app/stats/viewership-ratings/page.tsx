import type { Metadata } from 'next';

import ViewershipRatingsPageContent from '@/features/stats/components/ViewershipRatingsPageContent';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '시청률 통계',
  description:
    '골 때리는 그녀들 역대 시청률 추이와 시청률 TOP 경기를 확인하세요. 시즌별 전국/수도권 시청률 데이터를 제공합니다.',
  keywords: [
    '골때녀 시청률',
    '골때리는 그녀들 시청률',
    '골때녀 시청률 추이',
    '골때녀 시청률 순위',
  ],
  alternates: { canonical: '/stats/viewership-ratings' },
  openGraph: {
    title: '시청률 통계 | 골때녀 데이터센터',
    description:
      '골 때리는 그녀들 역대 시청률 추이와 시청률 TOP 경기. 시즌별 전국/수도권 시청률 데이터.',
    url: 'https://www.gtndatacenter.com/stats/viewership-ratings',
  },
};

export default function ViewershipRatingsPage() {
  return <ViewershipRatingsPageContent />;
}
