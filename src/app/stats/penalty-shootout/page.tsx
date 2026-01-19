import { Metadata } from 'next';

import PenaltyShootoutPageContent from '@/features/stats/components/PenaltyShootoutPageContent';

export const metadata: Metadata = {
  title: '승부차기 통계',
  description: '키커 성공률, 골키퍼 선방율 순위 - 골때리는 그녀들',
};

export default function PenaltyShootoutPage() {
  return <PenaltyShootoutPageContent />;
}
