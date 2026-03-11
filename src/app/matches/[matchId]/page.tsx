import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SportsEventJsonLd } from '@/components/JsonLd';
import { getInitialMatchDetailData } from '@/features/matches/server';
import { prisma } from '@/lib/prisma';

import MatchDetailPageContent from './MatchDetailPageContent';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ matchId: string }>;
}

function parseMatchId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchId } = await params;
  const id = parseMatchId(matchId);

  if (id == null) {
    return {
      title: '경기를 찾을 수 없습니다',
    };
  }

  const match = await prisma.match.findUnique({
    where: { match_id: id },
    include: {
      home_team: true,
      away_team: true,
      season: true,
    },
  });

  if (!match) {
    return {
      title: '경기를 찾을 수 없습니다',
    };
  }

  const homeTeamName = match.home_team?.team_name || '홈팀';
  const awayTeamName = match.away_team?.team_name || '원정팀';
  const seasonName = match.season?.season_name || '';
  const matchDate = match.match_date
    ? new Date(match.match_date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // 스코어 정보
  const hasScore = match.home_score !== null && match.away_score !== null;
  const scoreText = hasScore
    ? `${match.home_score} : ${match.away_score}`
    : '경기 예정';

  const title = `${homeTeamName} vs ${awayTeamName} (${scoreText}) - 골때녀 경기 결과`;
  const description = hasScore
    ? `${seasonName} ${homeTeamName} vs ${awayTeamName} 경기 결과 ${match.home_score}:${match.away_score}. ${matchDate} 진행된 경기의 상세 스탯, 라인업, 득점 기록을 확인하세요.`
    : `${seasonName} ${homeTeamName} vs ${awayTeamName} 경기 정보. ${matchDate} 예정된 경기의 라인업, 맞대결 기록을 확인하세요.`;

  const ogImage = match.home_team?.logo || match.away_team?.logo;

  return {
    title,
    description,
    keywords: [
      `${homeTeamName} vs ${awayTeamName}`,
      `${homeTeamName} ${awayTeamName}`,
      `골때녀 ${homeTeamName}`,
      `골때녀 ${awayTeamName}`,
      '골때녀 경기 결과',
      '골때리는 그녀들 경기',
      '골 때리는 그녀들 경기 결과',
      '골때녀 경기 스탯',
      seasonName,
    ].filter(Boolean),
    alternates: { canonical: `/matches/${matchId}` },
    openGraph: {
      title,
      description,
      url: `https://www.gtndatacenter.com/matches/${matchId}`,
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 400,
              height: 400,
              alt: `${homeTeamName} vs ${awayTeamName}`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function Page({ params }: Props) {
  const { matchId } = await params;
  const id = parseMatchId(matchId);
  if (id == null) notFound();

  const initialData = await getInitialMatchDetailData(id);
  if (!initialData) notFound();

  const match = initialData.match;
  const homeTeamName = match.home_team?.team_name || '홈팀';
  const awayTeamName = match.away_team?.team_name || '원정팀';
  const matchDate = match.match_date
    ? new Date(match.match_date).toISOString()
    : undefined;

  return (
    <>
      <SportsEventJsonLd
        name={`${homeTeamName} vs ${awayTeamName}`}
        startDate={matchDate || ''}
        homeTeam={homeTeamName}
        awayTeam={awayTeamName}
      />
      <MatchDetailPageContent matchId={matchId} initialData={initialData} />
    </>
  );
}
