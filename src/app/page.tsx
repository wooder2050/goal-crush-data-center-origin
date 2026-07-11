import type { Metadata } from 'next';

import { FAQPageJsonLd } from '@/components/JsonLd';
import { HomePageDashboard } from '@/features/home';
import { getHomePageData } from '@/features/home/server';

export const revalidate = 600;

export const metadata: Metadata = {
  title: {
    absolute: '골때녀 일정·경기결과·순위·선수 기록 | 골때녀 데이터센터',
  },
  description:
    '골 때리는 그녀들 최신 경기 일정과 결과, 팀 순위, 선수별 골·도움 기록을 한눈에 확인하세요. 제2회 GIFA컵 진행 중 — 시즌·대회별 기록과 출연진 프로필까지 제공합니다.',
  keywords: [
    '골때녀 일정',
    '골때녀 GIFA컵',
    '골때녀 기파컵',
    '2026 골때녀 GIFA컵',
    '골때녀 GIFA컵 일정',
    '골때녀 순위',
    '골때녀 현재 순위',
    '2026 골때녀 순위',
    '골때녀 데이터',
    '골때녀 경기결과',
    '골때녀 어제 경기 결과',
    '골때녀 선수 통계',
    '골 때리는 그녀들 순위',
    '골때녀 득점 순위',
    '골때녀 팀 순위',
    '골때녀 출연진',
    '골때녀 순위표',
  ],
  openGraph: {
    title: '골때녀 일정·경기결과·순위·선수 기록 | 골때녀 데이터센터',
    description:
      '골 때리는 그녀들 최신 경기 일정과 결과, 팀 순위, 선수별 골·도움 기록을 한눈에. 제2회 GIFA컵 진행 중.',
    type: 'website',
    url: 'https://www.gtndatacenter.com',
    siteName: '골때녀 데이터센터',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: '골때녀 일정·경기결과·순위·선수 기록 | 골때녀 데이터센터',
    description:
      '골 때리는 그녀들 최신 경기 일정과 결과, 팀 순위, 선수별 골·도움 기록을 한눈에. 제2회 GIFA컵 진행 중.',
  },
  alternates: {
    canonical: 'https://www.gtndatacenter.com',
  },
};

export default async function Page() {
  const initialData = await getHomePageData();
  return (
    <>
      <FAQPageJsonLd
        faqs={[
          {
            question: '골때녀 GIFA컵 일정은?',
            answer:
              '골 때리는 그녀들 2026 제2회 GIFA컵은 7월 8일 개막합니다. 골때녀 데이터센터에서 대진과 경기 일정, 경기 결과를 매 경기 종료 후 실시간으로 업데이트합니다.',
          },
          {
            question: '골때녀 경기 결과는 어디서 확인하나요?',
            answer:
              '골때녀 데이터센터에서 모든 시즌의 경기 결과를 확인할 수 있습니다. 득점자, 어시스트, 선수 평점, 상세 스탯(패스 성공률, 슈팅, 인터셉트 등)까지 제공합니다.',
          },
          {
            question: '골때녀 출연진(선수) 정보는?',
            answer:
              '골때녀 데이터센터의 선수 페이지에서 전체 출연진의 프로필, 포지션, 통산 기록(경기 수, 골, 도움), 시즌별 스탯을 확인할 수 있습니다.',
          },
          {
            question: '골때녀 데이터센터는 무엇인가요?',
            answer:
              '골때녀 데이터센터(gtndatacenter.com)는 SBS 예능 골 때리는 그녀들의 팬이 만든 비공식 데이터 사이트입니다. 경기 결과, 선수 통계, 팀 순위, 파워랭킹 등 종합적인 데이터를 제공합니다.',
          },
        ]}
      />
      <h1 className="sr-only">
        골때녀 데이터센터 - 골 때리는 그녀들 경기 일정, 결과, 순위, 선수 기록
      </h1>
      <p className="sr-only">
        골 때리는 그녀들(골때녀) 2026 제2회 GIFA컵의 경기 일정과 대진, 최신 경기
        결과, 선수별 득점·도움·평점 랭킹을 실시간으로 제공하는 팬 데이터
        사이트입니다. 모든 시즌의 경기 기록, 선수 프로필, 감독 정보, 상대 전적을
        확인하세요.
      </p>
      <HomePageDashboard initialData={initialData} />
    </>
  );
}
