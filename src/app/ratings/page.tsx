import { Metadata } from 'next';

import { Section } from '@/components/ui';
import RatingsClientShell from '@/features/player-ratings/components/RatingsClientShell';

export const metadata: Metadata = {
  title: '골때녀 선수 능력치 평가 - 팬 투표 레이팅 순위',
  description:
    '골 때리는 그녀들 선수들의 능력치를 팬 투표로 평가! 슈팅·패스·수비·스피드 항목별 레이팅과 종합 순위를 확인하세요.',
  keywords: [
    '골때녀 선수 평가',
    '골때리는 그녀들 능력치',
    '골때녀 선수 능력치',
    '골때녀 팬 평가',
    '골때녀 선수 레이팅',
    '골때녀 선수 순위',
    '골때녀 레이팅',
  ],
  alternates: { canonical: '/ratings' },
  robots: { index: false, follow: true },
  openGraph: {
    title: '골때녀 선수 능력치 평가 - 팬 투표 레이팅 순위',
    description:
      '골 때리는 그녀들 선수들의 능력치를 팬 투표로 평가! 슈팅·패스·수비·스피드 항목별 레이팅과 종합 순위를 확인하세요.',
    url: 'https://www.gtndatacenter.com/ratings',
  },
  twitter: {
    card: 'summary',
    title: '골때녀 선수 능력치 평가 - 팬 투표 레이팅 순위',
    description:
      '골 때리는 그녀들 선수들의 능력치를 팬 투표로 평가! 항목별 레이팅과 종합 순위를 확인하세요.',
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
