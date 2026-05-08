import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PersonJsonLd } from '@/components/JsonLd';
import { getInitialPlayerDetailData } from '@/features/players/server';
import { prisma } from '@/lib/prisma';

import PlayerDetailContent from './PlayerDetailContent';

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
      ? `통산 ${careerStats.matches}경기 ${careerStats.goals}골 ${careerStats.assists}도움`
      : '';
  const title = statsText
    ? `${playerName} - ${statsText}`
    : `${playerName}${teamInfo}`;
  const description = statsText
    ? `골 때리는 그녀들${currentTeam ? ` ${currentTeam}` : ''} ${playerName} 선수의 ${statsText}. 시즌별 스탯·최근 경기 출전 이력. 2026 G리그 포함 전 시즌 데이터 제공.`
    : `골 때리는 그녀들${currentTeam ? ` ${currentTeam}` : ''} ${playerName} 선수의 프로필과 경기 기록. 시즌별 득점·어시스트·출전 통계를 제공합니다.`;

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

  // 구조화 데이터용 추가 정보 조회
  const [teamHistory, seasonStats, positions] = await Promise.all([
    prisma.playerTeamHistory.findFirst({
      where: { player_id: id },
      orderBy: { created_at: 'desc' },
      include: { team: { select: { team_name: true } } },
    }),
    prisma.playerSeasonStats.findMany({
      where: { player_id: id },
      select: { goals: true, assists: true, matches_played: true },
    }),
    prisma.playerPosition.findFirst({
      where: { player_id: id },
      orderBy: { created_at: 'desc' },
      select: { position: true },
    }),
  ]);

  const currentTeamName = teamHistory?.team?.team_name;
  const careerStats = seasonStats.reduce(
    (acc, s) => ({
      matches: acc.matches + (s.matches_played ?? 0),
      goals: acc.goals + (s.goals ?? 0),
      assists: acc.assists + (s.assists ?? 0),
    }),
    { matches: 0, goals: 0, assists: 0 }
  );

  return (
    <>
      <PersonJsonLd
        name={player.name}
        description={`골 때리는 그녀들${currentTeamName ? ` ${currentTeamName}` : ''} ${player.name} 선수`}
        nationality={player.nationality || '대한민국'}
        birthDate={
          player.birth_date
            ? new Date(player.birth_date).toISOString().split('T')[0]
            : undefined
        }
        image={player.profile_image_url || undefined}
        url={`https://www.gtndatacenter.com/players/${playerId}`}
        teamName={currentTeamName || undefined}
        position={positions?.position || undefined}
        height={player.height_cm || undefined}
        stats={careerStats.matches > 0 ? careerStats : undefined}
      />
      <PlayerDetailContent playerId={playerId} initialData={initialData} />
    </>
  );
}
