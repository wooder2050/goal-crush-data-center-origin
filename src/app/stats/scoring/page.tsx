import { Metadata } from 'next';

import ScoringRankingsPageContent from '@/features/stats/components/ScoringRankingsPageContent';

export const metadata: Metadata = {
  title: '득점 랭킹',
  description: '골, 도움, 공격포인트 순위 - 골때리는 그녀들',
};

export default function ScoringPage() {
  return <ScoringRankingsPageContent />;
}
