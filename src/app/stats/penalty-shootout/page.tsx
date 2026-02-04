import { Metadata } from 'next';

import PenaltyShootoutPageContent from '@/features/stats/components/PenaltyShootoutPageContent';

export const metadata: Metadata = {
  title: '승부차기 통계',
  description:
    '골 때리는 그녀들 승부차기 통계. 키커 성공률, 골키퍼 선방율 순위를 확인하세요.',
  keywords: [
    '골때녀 승부차기',
    '골때녀 페널티킥',
    '골때리는 그녀들 승부차기 기록',
    '골때녀 키커 성공률',
    '골때녀 골키퍼 선방률',
  ],
  alternates: { canonical: '/stats/penalty-shootout' },
  openGraph: {
    title: '승부차기 통계 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 승부차기 통계. 키커 성공률, 골키퍼 선방율 순위를 확인하세요.',
    url: 'https://www.gtndatacenter.com/stats/penalty-shootout',
  },
  twitter: {
    card: 'summary',
    title: '승부차기 통계 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 승부차기 통계. 키커 성공률, 골키퍼 선방율 순위를 확인하세요.',
  },
};

export default function PenaltyShootoutPage() {
  return <PenaltyShootoutPageContent />;
}
