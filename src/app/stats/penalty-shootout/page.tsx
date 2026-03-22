import { Metadata } from 'next';

import PenaltyShootoutPageContent from '@/features/stats/components/PenaltyShootoutPageContent';

export const metadata: Metadata = {
  title: '골때녀 승부차기 통계 - PK 키커 성공률·골키퍼 선방률 순위',
  description:
    '골 때리는 그녀들 역대 승부차기 통계를 확인하세요. PK 키커 성공률, 골키퍼 선방률, 팀별 승부차기 전적을 한눈에 비교할 수 있습니다.',
  keywords: [
    '골때녀 승부차기',
    '골때녀 PK',
    '골때녀 페널티킥',
    '골때리는 그녀들 승부차기 기록',
    '골때녀 키커 성공률',
    '골때녀 골키퍼 선방률',
    '골때녀 승부차기 순위',
  ],
  alternates: { canonical: '/stats/penalty-shootout' },
  openGraph: {
    title: '골때녀 승부차기 통계 - PK 키커 성공률·골키퍼 선방률 순위',
    description:
      '골 때리는 그녀들 역대 승부차기 통계. PK 키커 성공률, 골키퍼 선방률, 팀별 승부차기 전적을 확인하세요.',
    url: 'https://www.gtndatacenter.com/stats/penalty-shootout',
  },
  twitter: {
    card: 'summary',
    title: '골때녀 승부차기 통계 - PK 키커 성공률·골키퍼 선방률 순위',
    description:
      '골 때리는 그녀들 역대 승부차기 통계. PK 키커 성공률, 골키퍼 선방률, 팀별 승부차기 전적을 확인하세요.',
  },
};

export default function PenaltyShootoutPage() {
  return <PenaltyShootoutPageContent />;
}
