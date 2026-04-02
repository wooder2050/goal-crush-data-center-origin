import { Metadata } from 'next';

import ScoringRankingsPageContent from '@/features/stats/components/ScoringRankingsPageContent';

export const metadata: Metadata = {
  title: '골때녀 득점 순위 - 역대 득점왕·도움왕·공격포인트 랭킹',
  description:
    '골 때리는 그녀들 역대 최다 득점자는 누구? 득점왕·도움왕·공격포인트 순위를 시즌별로 비교하고, 선수별 누적 기록과 랭킹 변동을 확인하세요.',
  keywords: [
    '골때녀 득점왕',
    '골때녀 도움왕',
    '골때녀 득점 순위',
    '골때리는 그녀들 랭킹',
    '골때녀 공격포인트',
    '골때녀 어시스트 순위',
    '골때녀 골 순위',
    '골때녀 최다골',
    '골때녀 득점 기록',
  ],
  alternates: { canonical: '/stats/scoring' },
  openGraph: {
    title: '골때녀 득점 순위 - 역대 득점왕·도움왕·공격포인트 랭킹',
    description:
      '골 때리는 그녀들 역대 최다 득점자는 누구? 득점왕·도움왕·공격포인트 순위를 시즌별로 비교하고, 선수별 누적 기록과 랭킹 변동을 확인하세요.',
    url: 'https://www.gtndatacenter.com/stats/scoring',
  },
  twitter: {
    card: 'summary',
    title: '골때녀 득점 순위 - 역대 득점왕·도움왕·공격포인트 랭킹',
    description:
      '골 때리는 그녀들 역대 최다 득점자는 누구? 득점왕·도움왕·공격포인트 순위를 시즌별로 비교!',
  },
};

export default function ScoringPage() {
  return <ScoringRankingsPageContent />;
}
