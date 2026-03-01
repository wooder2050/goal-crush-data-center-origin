import { Metadata } from 'next';

import { Section } from '@/components/ui';
import RatingsClientShell from '@/features/player-ratings/components/RatingsClientShell';

export const metadata: Metadata = {
  title: '선수 평가',
  description:
    '골 때리는 그녀들 선수들의 능력치 평가를 확인하세요. 팬들이 직접 평가한 선수 능력치를 모아볼 수 있습니다.',
  alternates: { canonical: '/ratings' },
  openGraph: {
    title: '선수 평가 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 선수들의 능력치 평가를 확인하세요. 팬들이 직접 평가한 선수 능력치를 모아볼 수 있습니다.',
    url: 'https://www.gtndatacenter.com/ratings',
  },
  twitter: {
    card: 'summary',
    title: '선수 평가 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 선수들의 능력치 평가를 확인하세요. 팬들이 직접 평가한 선수 능력치를 모아볼 수 있습니다.',
  },
};

export default function RatingsPage() {
  return (
    <Section padding="sm" className="min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">선수 평가 모음</h1>
        <p className="text-gray-600 mt-2">
          모든 선수들의 능력치 평가를 확인해보세요
        </p>
      </div>

      <RatingsClientShell />
    </Section>
  );
}
