import { Users } from 'lucide-react';
import { Metadata } from 'next';

import { PlayerComparePageContent } from '@/features/stats/components/PlayerComparePageContent';

export const metadata: Metadata = {
  title: '골때녀 선수 비교 - 기록 비교·통산 성적 맞대결',
  description:
    '골 때리는 그녀들 선수 기록을 나란히 비교! 두 선수의 골, 도움, 출장, 공격포인트를 한눈에 비교하세요.',
  keywords: [
    '골때녀 선수 비교',
    '골때리는 그녀들 선수 비교',
    '골때녀 기록 비교',
    '골때녀 통계 비교',
  ],
  alternates: { canonical: '/stats/player-compare' },
  openGraph: {
    title: '골때녀 선수 비교 - 기록 비교·통산 성적 맞대결 | 골때녀 데이터센터',
    description:
      '골 때리는 그녀들 선수 기록을 나란히 비교! 두 선수의 골, 도움, 출장, 공격포인트를 한눈에 비교하세요.',
    url: 'https://www.gtndatacenter.com/stats/player-compare',
  },
  twitter: {
    card: 'summary',
    title: '골때녀 선수 비교 - 기록 비교·통산 성적 맞대결 | 골때녀 데이터센터',
    description:
      '골 때리는 그녀들 선수 기록을 나란히 비교! 두 선수의 골, 도움, 출장, 공격포인트를 한눈에 비교하세요.',
  },
};

export default function PlayerComparePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              선수 비교
            </h1>
          </div>
          <p className="text-base sm:text-lg text-gray-600">
            두 선수의 기록을 나란히 비교해보세요
          </p>
        </div>
      </div>

      <PlayerComparePageContent />
    </div>
  );
}
