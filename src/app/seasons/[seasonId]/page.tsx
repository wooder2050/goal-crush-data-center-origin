import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

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
  const title = `${seasonName} - 골때녀 순위표 및 경기 결과`;
  const description = `골 때리는 그녀들 ${seasonName} 순위표, 경기 결과, 팀별 성적을 확인하세요.`;

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

export default async function Page({ params }: Props) {
  const { seasonId } = await params;
  const id = parseSeasonId(seasonId);

  if (id === null) notFound();

  const initialData = await getInitialSeasonDetailData(id);

  if (!initialData) notFound();

  return <SeasonDetailContent seasonId={seasonId} initialData={initialData} />;
}
