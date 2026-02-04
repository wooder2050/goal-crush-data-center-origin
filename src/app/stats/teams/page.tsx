import { Metadata } from 'next';

import TeamRankingsPageContent from '@/features/stats/components/TeamRankingsPageContent';

export const metadata: Metadata = {
  title: '팀 순위',
  description:
    '골 때리는 그녀들 팀별 승부 기록, 승점, 득실차 순위를 확인하세요. 시즌별 팀 성적을 비교해보세요.',
  keywords: [
    '골때녀 팀 순위',
    '골때녀 팀 성적',
    '골때리는 그녀들 팀',
    '골때녀 승점',
    '골때녀 득실차',
  ],
  alternates: { canonical: '/stats/teams' },
  openGraph: {
    title: '팀 순위 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 팀별 승부 기록, 승점, 득실차 순위를 확인하세요.',
    url: 'https://www.gtndatacenter.com/stats/teams',
  },
  twitter: {
    card: 'summary',
    title: '팀 순위 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 팀별 승부 기록, 승점, 득실차 순위를 확인하세요.',
  },
};

export default function TeamRankingsPage() {
  return <TeamRankingsPageContent />;
}
