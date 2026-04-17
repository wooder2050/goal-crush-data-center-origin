import { Metadata } from 'next';

import StarterWinRatePageContent from '@/features/stats/components/StarterWinRatePageContent';

export const metadata: Metadata = {
  title: '선발 출전 승률',
  description:
    '골 때리는 그녀들 선수별 선발 출전 시 팀 승률 순위를 확인하세요. 어떤 선수가 출전했을 때 팀이 더 잘 이기는지 분석합니다.',
  keywords: [
    '골때녀 선발 승률',
    '골때녀 출전 기록',
    '골때리는 그녀들 선수 통계',
    '골때녀 승률 분석',
  ],
  alternates: { canonical: '/stats/starter-win-rate' },
  openGraph: {
    title: '선발 출전 승률 | 골때녀 데이터센터',
    description:
      '골 때리는 그녀들 선수별 선발 출전 시 팀 승률 순위를 확인하세요.',
    url: 'https://www.gtndatacenter.com/stats/starter-win-rate',
  },
  twitter: {
    card: 'summary',
    title: '선발 출전 승률 | 골때녀 데이터센터',
    description:
      '골 때리는 그녀들 선수별 선발 출전 시 팀 승률 순위를 확인하세요.',
  },
};

export default function StarterWinRatePage() {
  return <StarterWinRatePageContent />;
}
