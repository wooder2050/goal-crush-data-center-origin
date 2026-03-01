import { Metadata } from 'next';

import ScoringRankingsPageContent from '@/features/stats/components/ScoringRankingsPageContent';

export const metadata: Metadata = {
  title: '골때녀 득점왕·도움왕 순위',
  description:
    '골 때리는 그녀들 역대 득점왕, 도움왕, 공격포인트 순위를 한눈에! 시즌별 득점·어시스트 기록과 선수 랭킹을 실시간 업데이트합니다.',
  keywords: [
    '골때녀 득점왕',
    '골때녀 도움왕',
    '골때녀 득점 순위',
    '골때리는 그녀들 랭킹',
    '골때녀 공격포인트',
  ],
  alternates: { canonical: '/stats/scoring' },
  openGraph: {
    title: '골때녀 득점왕·도움왕 순위 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 역대 득점왕, 도움왕, 공격포인트 순위를 한눈에! 시즌별 득점·어시스트 기록과 선수 랭킹을 실시간 업데이트합니다.',
    url: 'https://www.gtndatacenter.com/stats/scoring',
  },
  twitter: {
    card: 'summary',
    title: '골때녀 득점왕·도움왕 순위 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 역대 득점왕, 도움왕, 공격포인트 순위를 한눈에!',
  },
};

export default function ScoringPage() {
  return <ScoringRankingsPageContent />;
}
