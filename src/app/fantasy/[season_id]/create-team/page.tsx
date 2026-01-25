import { notFound, redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SelectedPlayer } from '@/types/fantasy-pages';

import CreateTeamClient from './CreateTeamClient';

// 선수 데이터와 AI 추천 가져오기
async function getPlayersData(seasonId: number, fantasySeasonId: number) {
  // 현재 시즌의 활성 선수들 조회
  const availablePlayers = await prisma.player.findMany({
    include: {
      player_team_history: {
        where: {
          season_id: seasonId,
          is_active: true,
        },
        include: {
          team: {
            select: {
              team_id: true,
              team_name: true,
              logo: true,
              primary_color: true,
              secondary_color: true,
            },
          },
        },
      },
      player_season_stats: {
        where: { season_id: seasonId },
        select: {
          goals: true,
          assists: true,
          matches_played: true,
        },
      },
    },
  });

  // AI 추천 선수들 조회
  const recommendations = await prisma.fantasyAIRecommendation.findMany({
    where: { fantasy_season_id: fantasySeasonId },
    include: {
      player: {
        include: {
          player_team_history: {
            where: {
              season_id: seasonId,
              is_active: true,
            },
            include: {
              team: {
                select: {
                  team_id: true,
                  team_name: true,
                  logo: true,
                  primary_color: true,
                  secondary_color: true,
                },
              },
            },
          },
          player_season_stats: {
            where: { season_id: seasonId },
            select: {
              goals: true,
              assists: true,
              matches_played: true,
            },
          },
        },
      },
    },
    orderBy: { recommendation_score: 'desc' },
    take: 20,
  });

  // 데이터 포맷팅 - 공통 타입 정의
  type PlayerData = {
    player_id: number;
    name: string;
    profile_image_url: string | null;
    jersey_number: number | null;
    player_team_history: Array<{
      team: {
        team_id: number;
        team_name: string;
        logo: string | null;
        primary_color: string | null;
        secondary_color: string | null;
      } | null;
    }>;
    player_season_stats: Array<{
      goals: number | null;
      assists: number | null;
      matches_played: number | null;
    }>;
  };

  const formatPlayer = (player: PlayerData) => ({
    player_id: player.player_id,
    name: player.name,
    profile_image_url: player.profile_image_url || undefined,
    jersey_number: player.jersey_number || undefined,
    current_team: player.player_team_history[0]?.team
      ? {
          team_id: player.player_team_history[0].team.team_id,
          team_name: player.player_team_history[0].team.team_name,
          logo: player.player_team_history[0].team.logo || undefined,
          primary_color:
            player.player_team_history[0].team.primary_color || undefined,
          secondary_color:
            player.player_team_history[0].team.secondary_color || undefined,
        }
      : undefined,
    season_stats: player.player_season_stats[0]
      ? {
          goals: player.player_season_stats[0].goals || 0,
          assists: player.player_season_stats[0].assists || 0,
          matches_played: player.player_season_stats[0].matches_played || 0,
        }
      : { goals: 0, assists: 0, matches_played: 0 },
  });

  const formattedPlayers = availablePlayers
    .filter((player) => player.player_team_history.length > 0) // 현재 팀이 있는 선수만
    .map(formatPlayer);

  const recommendedPlayers = recommendations
    .map((rec) => formatPlayer(rec.player))
    .filter((player) => player.current_team); // 현재 팀이 있는 추천 선수만

  return { availablePlayers: formattedPlayers, recommendedPlayers };
}

interface Params {
  season_id: string;
}

export default async function CreateTeamPage({ params }: { params: Params }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  const seasonId = parseInt(params.season_id);

  if (isNaN(seasonId)) {
    notFound();
  }

  // 판타지 시즌 조회
  const fantasySeason = await prisma.fantasySeason.findUnique({
    where: { fantasy_season_id: seasonId },
    include: {
      season: {
        select: {
          season_id: true,
          season_name: true,
          category: true,
        },
      },
    },
  });

  if (!fantasySeason) {
    notFound();
  }

  // 이미 팀이 있는지 확인 (생성 모드에서는 팀이 있으면 리다이렉트)
  const existingTeam = await prisma.fantasyTeam.findUnique({
    where: {
      user_id_fantasy_season_id: {
        user_id: user.userId,
        fantasy_season_id: seasonId,
      },
    },
  });

  // 이미 팀이 있으면 my-team으로 리다이렉트
  if (existingTeam) {
    redirect(`/fantasy/${seasonId}/my-team`);
  }

  // 편성 마감 확인 (UI 표시용, 더 이상 리다이렉트하지 않음)
  const now = new Date();
  const isLocked = now > new Date(fantasySeason.lock_date);

  // 선수 데이터 가져오기
  const { availablePlayers, recommendedPlayers } = await getPlayersData(
    fantasySeason.season.season_id,
    seasonId
  );

  // 생성 모드에서는 초기값이 비어있음
  const initialSelectedPlayers: SelectedPlayer[] = [];
  const initialTeamName = '';

  return (
    <CreateTeamClient
      seasonId={seasonId}
      availablePlayers={availablePlayers}
      recommendedPlayers={recommendedPlayers}
      initialSelectedPlayers={initialSelectedPlayers}
      initialTeamName={initialTeamName}
      isLocked={isLocked}
    />
  );
}
