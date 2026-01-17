import { Metadata } from 'next';

import StarterWinRatePageContent from '@/features/stats/components/StarterWinRatePageContent';

export const metadata: Metadata = {
  title: '선발 출전 승률',
  description: '선발 출전 시 팀 승률 순위 - 골때리는 그녀들',
};

export default function StarterWinRatePage() {
  return <StarterWinRatePageContent />;
}
