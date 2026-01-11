import { Metadata } from 'next';

import TeamRankingsPageContent from '@/features/stats/components/TeamRankingsPageContent';

export const metadata: Metadata = {
  title: '팀 순위',
  description: '팀별 승부 기록과 순위 - 골때리는 그녀들',
};

export default function TeamRankingsPage() {
  return <TeamRankingsPageContent />;
}
