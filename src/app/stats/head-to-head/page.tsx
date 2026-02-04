import { Metadata } from 'next';

import HeadToHeadPageContent from '@/features/stats/components/HeadToHeadPageContent';

export const metadata: Metadata = {
  title: '팀 맞대결 통계',
  description:
    '골 때리는 그녀들 두 팀 간의 상대 전적과 맞대결 통계를 확인하세요. 승부 기록, 득점 현황, 최근 경기 결과를 한눈에 볼 수 있습니다.',
  keywords: [
    '골때녀 맞대결',
    '골때녀 상대전적',
    '골때리는 그녀들 팀 통계',
    '골때녀 경기 기록',
  ],
  alternates: { canonical: '/stats/head-to-head' },
  openGraph: {
    title: '팀 맞대결 통계 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 두 팀 간의 상대 전적과 맞대결 통계를 확인하세요.',
    url: 'https://www.gtndatacenter.com/stats/head-to-head',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '팀 맞대결 통계 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 두 팀 간의 상대 전적과 맞대결 통계를 확인하세요.',
  },
};

export default function HeadToHeadStatsPage() {
  return <HeadToHeadPageContent />;
}
