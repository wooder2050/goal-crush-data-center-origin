import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { Position } from '@/types/fantasy';
import {
  FantasyPlayerSelectionWithPlayer,
  GetTeamDetailResponse,
} from '@/types/fantasy-pages';

interface RouteParams {
  params: {
    team_id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const teamId = parseInt(params.team_id);

    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid team_id' }, { status: 400 });
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
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
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
      (selection: FantasyPlayerSelectionWithPlayer, index) => {
        const defaultPositions = ['GK', 'DF', 'MF', 'FW', 'FW'] as const;

        return {
          player_id: selection.player.player_id,
          name: selection.player.name,
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

    const response: GetTeamDetailResponse = {
      fantasyTeam: {
        team_name: fantasyTeam.team_name,
        total_points: fantasyTeam.total_points,
        rank_position: rankPosition,
        total_teams: totalTeams,
      },
      user: {
        name:
          fantasyTeam.user.display_name ||
          fantasyTeam.user.korean_nickname ||
          'Unknown User',
        avatar: fantasyTeam.user.profile_image_url,
      },
      fantasySeason: {
        fantasy_season_id: fantasyTeam.fantasy_season.fantasy_season_id,
        year: fantasyTeam.fantasy_season.year,
        month: fantasyTeam.fantasy_season.month,
        season_name: fantasyTeam.fantasy_season.season.season_name,
        category: fantasyTeam.fantasy_season.season.category,
      },
      players: playersWithPosition,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching team detail:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
