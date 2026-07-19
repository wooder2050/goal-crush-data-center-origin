import type { Metadata } from 'next';

import { PlayersPage } from '@/features/players';
import { getInitialPlayersData } from '@/features/players/server';
import { withRetry } from '@/lib/retry';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '골때녀 선수 명단 - 역대 출연진 프로필·득점·어시스트 기록',
  description:
    '골 때리는 그녀들 역대 전체 선수 프로필, 득점·어시스트·출전 기록을 한눈에 비교하세요. 시즌별·팀별·포지션별 검색으로 원하는 선수를 빠르게 찾을 수 있습니다.',
  keywords: [
    '골때녀 선수',
    '골때녀 출연진',
    '골때녀 멤버',
    '골때리는 그녀들 선수',
    '골 때리는 그녀들 선수 정보',
    '골때녀 선수 정보',
    '골때녀 득점 순위',
    '골때녀 선수 기록',
    '골때녀 선수 통계',
    '골때녀 선수 목록',
    '골때녀 선수 누구',
    '골때녀 선수 프로필',
    '골때녀 아야카',
    '골때녀 정다은',
  ],
  alternates: { canonical: '/players' },
  openGraph: {
    title: '골때녀 선수 명단 - 역대 출연진 프로필·득점·어시스트 기록',
    description:
      '골 때리는 그녀들 역대 전체 선수 프로필, 득점·어시스트·출전 기록을 한눈에 비교하세요. 시즌별·팀별·포지션별 검색으로 원하는 선수를 빠르게 찾을 수 있습니다.',
    url: 'https://www.gtndatacenter.com/players',
  },
  twitter: {
    card: 'summary',
    title: '골때녀 선수 명단 - 역대 출연진 프로필·득점·어시스트 기록',
    description:
      '골 때리는 그녀들 역대 전체 선수 프로필, 득점·어시스트·출전 기록을 한눈에 비교하세요.',
  },
};

export default async function Page() {
  // 빌드 프리렌더 시 DB 순단 방어 — 페이지 레벨만 재시도 (API 라우트는 영향 없음)
  const initialData = await withRetry(() => getInitialPlayersData());
  return <PlayersPage initialData={initialData} />;
}
