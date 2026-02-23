import { Metadata } from 'next';

import FantasyTeams from '@/features/fantasy/components/FantasyTeams';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: '판타지',
  description:
    '골 때리는 그녀들 판타지 리그에 참여하세요. 나만의 드림팀을 구성하고 다른 팬들과 순위를 겨뤄보세요.',
  keywords: [
    '골때녀 판타지',
    '골때녀 판타지 리그',
    '골때리는 그녀들 판타지',
    '골때녀 드림팀',
  ],
  alternates: { canonical: '/fantasy' },
  openGraph: {
    title: '판타지 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 판타지 리그에 참여하세요. 나만의 드림팀을 구성하고 다른 팬들과 순위를 겨뤄보세요.',
    url: 'https://www.gtndatacenter.com/fantasy',
  },
  twitter: {
    card: 'summary',
    title: '판타지 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 판타지 리그에 참여하세요. 나만의 드림팀을 구성하고 다른 팬들과 순위를 겨뤄보세요.',
  },
};

export default async function FantasyPage() {
  const user = await getCurrentUser();

  return <FantasyTeams user={user} />;
}
