import type { Metadata } from 'next';

import GoalkeeperRankingsPageContent from '@/features/stats/components/GoalkeeperRankingsPageContent';

export const metadata: Metadata = {
  title: '골키퍼 랭킹 - 골때녀 통계',
  description:
    '골 때리는 그녀들 골키퍼 통계. 선방률, 클린시트, 실점, 무실점 경기 등 골키퍼별 상세 기록을 확인하세요.',
  keywords: [
    '골때녀 골키퍼',
    '골때녀 골키퍼 랭킹',
    '골때녀 선방률',
    '골때녀 클린시트',
    '골때리는 그녀들 골키퍼',
    '골 때리는 그녀들 골키퍼 통계',
    '골때녀 골키퍼 순위',
    '골때녀 무실점',
  ],
  alternates: { canonical: '/stats/goalkeepers' },
  openGraph: {
    title: '골키퍼 랭킹 - 골때녀 통계',
    description:
      '골 때리는 그녀들 골키퍼 통계. 선방률, 클린시트, 실점, 무실점 경기 등 골키퍼별 상세 기록을 확인하세요.',
    url: 'https://www.gtndatacenter.com/stats/goalkeepers',
  },
  twitter: {
    card: 'summary',
    title: '골키퍼 랭킹 - 골때녀 통계',
    description:
      '골 때리는 그녀들 골키퍼 통계. 선방률, 클린시트, 실점, 무실점 경기 등 골키퍼별 상세 기록을 확인하세요.',
  },
};

export default function GoalkeeperStatsPage() {
  return <GoalkeeperRankingsPageContent />;
}
