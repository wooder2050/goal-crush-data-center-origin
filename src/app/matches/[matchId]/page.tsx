import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SportsEventJsonLd } from '@/components/JsonLd';
import { getInitialMatchDetailData } from '@/features/matches/server';
import { prisma } from '@/lib/prisma';

import MatchDetailPageContent from './MatchDetailPageContent';

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
      goals: {
        include: { player: { select: { name: true } } },
        orderBy: { goal_time: 'asc' },
      },
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
  const scoreText = hasScore ? `${match.home_score}:${match.away_score}` : '';

  // 득점자 정보 (자책골 제외)
  const scorerNames = (match.goals ?? [])
    .filter((g) => g.goal_type !== 'own_goal')
    .map((g) => g.player?.name)
    .filter(Boolean) as string[];
  const uniqueScorers = Array.from(new Set(scorerNames));
  const scorersText =
    uniqueScorers.length > 3
      ? uniqueScorers.slice(0, 3).join(', ') +
        ` 외 ${uniqueScorers.length - 3}명`
      : uniqueScorers.join(', ');

  const title = hasScore
    ? `${homeTeamName} vs ${awayTeamName} 경기 결과 ${scoreText} - ${seasonName}`
    : `${homeTeamName} vs ${awayTeamName} - ${seasonName}${matchDate ? ` (${matchDate})` : ''}`;
  const description = hasScore
    ? `골 때리는 그녀들 ${seasonName} ${homeTeamName} vs ${awayTeamName} 경기 결과 ${scoreText} (${matchDate}).${scorersText ? ` 득점: ${scorersText}.` : ''} 선수별 평점·상세 스탯 확인.`
    : `골 때리는 그녀들 ${seasonName} ${homeTeamName} vs ${awayTeamName}. ${matchDate} 예정. 라인업·맞대결 기록을 확인하세요.`;

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
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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
        location={match.location || undefined}
        description={`골 때리는 그녀들 ${(match as { season?: { season_name?: string } }).season?.season_name ?? ''} - ${homeTeamName} vs ${awayTeamName}`}
        seasonName={
          (match as { season?: { season_name?: string } }).season
            ?.season_name ?? undefined
        }
        status={
          (match.status as 'scheduled' | 'completed' | 'cancelled') ??
          'scheduled'
        }
        homeScore={match.home_score}
        awayScore={match.away_score}
      />
      <MatchDetailPageContent matchId={matchId} initialData={initialData} />
    </>
  );
}
