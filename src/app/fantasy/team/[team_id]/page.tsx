import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { Position } from '@/types/fantasy';

import TeamDetailClient from './TeamDetailClient';

interface PageProps {
  params: {
    team_id: string;
  };
}

export default async function TeamDetailPage({ params }: PageProps) {
  const teamId = parseInt(params.team_id);

  if (isNaN(teamId)) {
    notFound();
  }

  // 팀 정보 조회 (누구나 접근 가능)
  const fantasyTeam = await prisma.fantasyTeam.findUnique({
    where: { fantasy_team_id: teamId },
    include: {
      user: {
        select: {
          korean_nickname: true,
          display_name: true,
          profile_image_url: true,
        },
      },
      fantasy_season: {
        include: {
          season: {
            select: {
              season_name: true,
              category: true,
            },
          },
        },
      },
      player_selections: {
        include: {
          player: {
            select: {
              player_id: true,
              name: true,
              profile_image_url: true,
            },
          },
          match_performances: {
            select: {
              total_points: true,
              goal_points: true,
              assist_points: true,
            },
          },
        },
        orderBy: { points_earned: 'desc' },
      },
    },
  });

  if (!fantasyTeam) {
    notFound();
  }

  // 순위 계산
  const betterTeamsCount = await prisma.fantasyTeam.count({
    where: {
      fantasy_season_id: fantasyTeam.fantasy_season_id,
      OR: [
        { total_points: { gt: fantasyTeam.total_points } },
        {
          total_points: fantasyTeam.total_points,
          created_at: { lt: fantasyTeam.created_at },
        },
      ],
    },
  });

  const totalTeams = await prisma.fantasyTeam.count({
    where: { fantasy_season_id: fantasyTeam.fantasy_season_id },
  });

  const rankPosition = betterTeamsCount + 1;

  // 선수들을 포지션별로 정리 (데이터베이스에서 가져온 포지션 사용)
  const playersWithPosition = fantasyTeam.player_selections.map(
    (selection, index) => {
      const defaultPositions = ['GK', 'DF', 'MF', 'FW', 'FW'] as const;

      return {
        ...selection.player,
        profile_image_url: selection.player.profile_image_url || undefined,
        points_earned: selection.points_earned,
        position:
          (selection.position as Position) || defaultPositions[index] || 'FW',
        season_stats: {
          goals: Math.round(
            selection.match_performances.reduce(
              (sum, perf) => sum + (perf.goal_points || 0) / 4,
              0
            )
          ),
          assists: Math.round(
            selection.match_performances.reduce(
              (sum, perf) => sum + (perf.assist_points || 0) / 2,
              0
            )
          ),
          matches_played: selection.match_performances.length,
        },
      };
    }
  );

  return (
    <TeamDetailClient
      fantasyTeam={{
        team_name: fantasyTeam.team_name,
        total_points: fantasyTeam.total_points,
        rank_position: rankPosition,
        total_teams: totalTeams,
      }}
      user={{
        name: fantasyTeam.user.display_name || fantasyTeam.user.korean_nickname,
        avatar: fantasyTeam.user.profile_image_url || undefined,
      }}
      fantasySeason={{
        fantasy_season_id: fantasyTeam.fantasy_season.fantasy_season_id,
        year: fantasyTeam.fantasy_season.year,
        month: fantasyTeam.fantasy_season.month,
        season_name: fantasyTeam.fantasy_season.season.season_name,
        category: fantasyTeam.fantasy_season.season.category,
      }}
      players={playersWithPosition}
    />
  );
}
