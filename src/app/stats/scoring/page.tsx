import { Metadata } from 'next';

import ScoringRankingsPageContent from '@/features/stats/components/ScoringRankingsPageContent';

export const metadata: Metadata = {
  title: '득점 랭킹',
  description:
    '골 때리는 그녀들 득점왕, 도움왕, 공격포인트 순위를 확인하세요. 시즌별 득점 기록과 선수 랭킹을 제공합니다.',
  keywords: [
    '골때녀 득점왕',
    '골때녀 도움왕',
    '골때녀 득점 순위',
    '골때리는 그녀들 랭킹',
    '골때녀 공격포인트',
  ],
  alternates: { canonical: '/stats/scoring' },
  openGraph: {
    title: '득점 랭킹 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 득점왕, 도움왕, 공격포인트 순위를 확인하세요.',
    url: 'https://www.gtndatacenter.com/stats/scoring',
  },
  twitter: {
    card: 'summary',
    title: '득점 랭킹 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 득점왕, 도움왕, 공격포인트 순위를 확인하세요.',
  },
};

export default function ScoringPage() {
  return <ScoringRankingsPageContent />;
}
