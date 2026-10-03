import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SeasonJsonLd } from '@/components/JsonLd';
import { getInitialSeasonDetailData } from '@/features/seasons/server';
import { prisma } from '@/lib/prisma';
import { CUP_CATEGORIES } from '@/lib/tournament';

import SeasonDetailContent from './SeasonDetailContent';
import SeasonSsrSummaryBlock from './SeasonSsrSummary';

export const revalidate = 600;

function parseSeasonId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

interface Props {
  params: Promise<{ seasonId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seasonId } = await params;
  const id = parseSeasonId(seasonId);

  if (id === null) {
    return {
      title: '시즌을 찾을 수 없습니다',
    };
  }

  const season = await prisma.season.findUnique({
    where: { season_id: id },
  });

  if (!season) {
    return {
      title: '시즌을 찾을 수 없습니다',
    };
  }

  const seasonName = season.season_name;
  // 컵 대회는 승점 순위표가 아니라 대진표·라운드 결과가 핵심 — 페이지가 실제로 보여주는 것만 약속한다
  const isCup = CUP_CATEGORIES.includes(season.category ?? '');
  const title = isCup
    ? `${seasonName} 대진표·경기 결과`
    : `${seasonName} 순위·결과`;
  const description = isCup
    ? `골 때리는 그녀들 ${seasonName} 대진표·라운드별 경기 결과·승부차기 기록과 득점·어시스트 랭킹을 확인하세요.`
    : `골 때리는 그녀들 ${seasonName} 전체 경기 결과·팀 순위·득점 랭킹·어시스트 랭킹. 방송 후 갱신되는 순위표와 팀별 성적을 확인하세요.`;

  return {
    title,
    description,
    keywords: [
      `${seasonName}`,
      `${seasonName} 순위`,
      `${seasonName} 순위표`,
      `${seasonName} 경기결과`,
      `${seasonName} 대진표`,
      '골때녀 순위',
      '골때리는 그녀들 순위',
      '골 때리는 그녀들 순위',
      '골때녀 순위표',
      '골때리는 그녀들 순위표',
      '골때녀 경기결과',
      '골때녀 G리그 순위',
      '골때녀 B조 순위',
    ],
    alternates: { canonical: `/seasons/${seasonId}` },
    openGraph: {
      title,
      description,
      url: `https://www.gtndatacenter.com/seasons/${seasonId}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function Page({ params }: Props) {
  const { seasonId } = await params;
  const id = parseSeasonId(seasonId);

  if (id === null) notFound();

  const initialData = await getInitialSeasonDetailData(id);

  if (!initialData) notFound();

  const season = initialData.season;

  return (
    <>
      <SeasonJsonLd
        name={season.season_name}
        description={`골 때리는 그녀들 ${season.season_name} 전체 경기 결과·팀 순위`}
        startDate={
          season.start_date
            ? new Date(season.start_date).toISOString().split('T')[0]
            : undefined
        }
        endDate={
          season.end_date
            ? new Date(season.end_date).toISOString().split('T')[0]
            : undefined
        }
        url={`https://www.gtndatacenter.com/seasons/${seasonId}`}
      />
      <SeasonDetailContent
        seasonId={seasonId}
        initialData={initialData}
        ssrSummary={
          <SeasonSsrSummaryBlock
            season={season}
            summary={initialData.summary}
          />
        }
      />
    </>
  );
}
