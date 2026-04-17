import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SeasonJsonLd } from '@/components/JsonLd';
import { getInitialSeasonDetailData } from '@/features/seasons/server';
import { prisma } from '@/lib/prisma';

import SeasonDetailContent from './SeasonDetailContent';

export const dynamic = 'force-dynamic';

function parseSeasonId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

interface Props {
  params: Promise<{ seasonId: string }>;
  searchParams: Promise<{ tab?: string }>;
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
  const title = `${seasonName} 순위·결과 | 골때녀 데이터센터`;
  const description = `골 때리는 그녀들 ${seasonName} 전체 경기 결과·팀 순위·득점 랭킹·어시스트 랭킹. 실시간 업데이트되는 순위표와 팀별 성적을 확인하세요.`;

  return {
    title,
    description,
    keywords: [
      `${seasonName}`,
      `${seasonName} 순위`,
      `${seasonName} 순위표`,
      '골때녀 순위',
      '골때리는 그녀들 순위',
      '골 때리는 그녀들 순위',
      '골때녀 순위표',
      '골때리는 그녀들 순위표',
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

export default async function Page({ params, searchParams }: Props) {
  const { seasonId } = await params;
  const { tab } = await searchParams;
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
        initialTab={tab}
      />
    </>
  );
}
