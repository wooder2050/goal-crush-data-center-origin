import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PersonJsonLd } from '@/components/JsonLd';
import { getInitialPlayerDetailData } from '@/features/players/server';
import { prisma } from '@/lib/prisma';

import PlayerDetailContent from './PlayerDetailContent';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ playerId: string }>;
}

function parsePlayerId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerId } = await params;
  const id = parsePlayerId(playerId);

  if (id == null) {
    return {
      title: '선수를 찾을 수 없습니다',
    };
  }

  const player = await prisma.player.findUnique({
    where: { player_id: id },
    include: {
      player_team_history: {
        orderBy: { created_at: 'desc' },
        take: 1,
        include: {
          team: true,
        },
      },
      player_season_stats: {
        select: { goals: true, assists: true, matches_played: true },
      },
    },
  });

  if (!player) {
    return {
      title: '선수를 찾을 수 없습니다',
    };
  }

  const playerName = player.name;
  const currentTeam = player.player_team_history[0]?.team?.team_name;
  const teamInfo = currentTeam ? ` (${currentTeam})` : '';
  const careerStats = player.player_season_stats.reduce(
    (acc, s) => ({
      goals: acc.goals + (s.goals ?? 0),
      assists: acc.assists + (s.assists ?? 0),
      matches: acc.matches + (s.matches_played ?? 0),
    }),
    { goals: 0, assists: 0, matches: 0 }
  );
  const statsText =
    careerStats.matches > 0
      ? ` 통산 ${careerStats.matches}경기 ${careerStats.goals}골 ${careerStats.assists}도움`
      : '';
  const title = statsText
    ? `${playerName}${teamInfo} -${statsText} | 골때녀 선수 프로필`
    : `${playerName}${teamInfo} | 골때녀 선수 프로필`;
  const description = `골 때리는 그녀들 ${playerName} 선수의 프로필과 통산 기록을 확인하세요.${statsText ? ` ${statsText}.` : ''} 시즌별 득점·어시스트·출전 통계를 제공합니다.`;

  return {
    title,
    description,
    keywords: [
      `${playerName}`,
      `${playerName} 골때녀`,
      `골때녀 ${playerName}`,
      '골때녀 선수',
      '골때리는 그녀들 선수',
      '골 때리는 그녀들 선수 정보',
      '골때녀 선수 정보',
      '골때녀 선수 기록',
    ],
    alternates: { canonical: `/players/${playerId}` },
    openGraph: {
      title,
      description,
      url: `https://www.gtndatacenter.com/players/${playerId}`,
      images: player.profile_image_url
        ? [
            {
              url: player.profile_image_url,
              width: 400,
              height: 400,
              alt: `${playerName} 프로필 이미지`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: player.profile_image_url ? [player.profile_image_url] : undefined,
    },
  };
}

export default async function Page({ params }: Props) {
  const { playerId } = await params;
  const id = parsePlayerId(playerId);
  if (id == null) notFound();

  const initialData = await getInitialPlayerDetailData(id);
  if (!initialData) notFound();

  const player = initialData.player;

  return (
    <>
      <PersonJsonLd
        name={player.name}
        description={`골 때리는 그녀들 ${player.name} 선수`}
        nationality="대한민국"
      />
      <PlayerDetailContent playerId={playerId} initialData={initialData} />
    </>
  );
}
