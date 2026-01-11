import { Metadata } from 'next';

import HeadToHeadPageContent from '@/features/stats/components/HeadToHeadPageContent';

export const metadata: Metadata = {
  title: '팀 맞대결 통계 | Goal Crush',
  description:
    '두 팀 간의 상대 전적과 맞대결 통계를 확인하세요. 승부 기록, 득점 현황, 최근 경기 결과를 한눈에 볼 수 있습니다.',
  keywords: ['맞대결', '상대전적', '팀 통계', '축구 분석', '경기 기록'],
  openGraph: {
    title: '팀 맞대결 통계 | Goal Crush',
    description: '두 팀 간의 상대 전적과 맞대결 통계를 확인하세요.',
    type: 'website',
  },
};

export default function HeadToHeadStatsPage() {
  return <HeadToHeadPageContent />;
}
