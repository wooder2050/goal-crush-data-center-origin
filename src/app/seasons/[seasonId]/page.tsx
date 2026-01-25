import type { Metadata } from 'next';

import { prisma } from '@/lib/prisma';

import SeasonDetailContent from './SeasonDetailContent';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ seasonId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seasonId } = await params;
  const id = parseInt(seasonId, 10);

  if (isNaN(id)) {
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
  };
}

export default async function Page({ params }: Props) {
  const { seasonId } = await params;
  return <SeasonDetailContent seasonId={seasonId} />;
}
