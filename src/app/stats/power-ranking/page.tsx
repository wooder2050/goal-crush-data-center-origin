import { Metadata } from 'next';

import PowerRankingPageContent from '@/features/stats/components/PowerRankingPageContent';

export const metadata: Metadata = {
  title: '골때녀 파워랭킹 - 이번 시즌 선수 종합 순위',
  description:
    '골 때리는 그녀들 이번 시즌 파워랭킹! 득점·도움·평점·승률·액션 점수를 포지션별 가중치로 종합한 선수 순위를 확인하세요.',
  keywords: [
    '골때녀 파워랭킹',
    '골때녀 선수 순위',
    '골때리는 그녀들 랭킹',
    '골때녀 시즌 순위',
    '골때녀 MVP',
  ],
  alternates: { canonical: '/stats/power-ranking' },
  openGraph: {
    title: '골때녀 파워랭킹 - 이번 시즌 선수 종합 순위',
    description:
      '골 때리는 그녀들 이번 시즌 파워랭킹! 득점·도움·평점·승률·액션 점수를 포지션별 가중치로 종합한 선수 순위를 확인하세요.',
    url: 'https://www.gtndatacenter.com/stats/power-ranking',
  },
};

export default function PowerRankingPage() {
  return <PowerRankingPageContent />;
}
