import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Position } from '@/types/fantasy';
import {
  FantasyPlayerSelectionForEdit,
  FormattedPlayer,
  PlayerData,
  SelectedPlayer,
} from '@/types/fantasy-pages';

interface RouteParams {
  params: {
    season_id: string;
  };
}

// 선수 데이터 포맷팅 함수
const formatPlayer = (player: PlayerData): FormattedPlayer => ({
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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fantasySeasonId = parseInt(params.season_id);

    if (isNaN(fantasySeasonId)) {
      return NextResponse.json({ error: 'Invalid season_id' }, { status: 400 });
    }

    // 판타지 시즌 조회
    const fantasySeason = await prisma.fantasySeason.findUnique({
      where: { fantasy_season_id: fantasySeasonId },
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
      return NextResponse.json(
        { error: 'Fantasy season not found' },
        { status: 404 }
      );
    }

    // 기존 팀이 있는지 확인 (수정 모드이므로 팀이 반드시 있어야 함)
    const existingTeam = await prisma.fantasyTeam.findUnique({
      where: {
        user_id_fantasy_season_id: {
          user_id: user.userId,
          fantasy_season_id: fantasySeasonId,
        },
      },
      include: {
        player_selections: {
          include: {
            player: {
              select: {
                player_id: true,
                name: true,
                profile_image_url: true,
                jersey_number: true,
                player_team_history: {
                  where: { is_active: true },
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
                  take: 1,
                },
                player_season_stats: {
                  where: { season_id: fantasySeason.season.season_id },
                  select: {
                    goals: true,
                    assists: true,
                    matches_played: true,
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: { selection_order: 'asc' },
        },
      },
    });

    // 팀이 없으면 에러 반환
    if (!existingTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // 편성 마감 확인
    const now = new Date();
    const isLocked = now > new Date(fantasySeason.lock_date);

    if (isLocked) {
      return NextResponse.json(
        { error: 'Team editing is locked' },
        { status: 403 }
      );
    }

    // 현재 시즌의 활성 선수들 조회
    const availablePlayers = await prisma.player.findMany({
      include: {
        player_team_history: {
          where: {
            season_id: fantasySeason.season.season_id,
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
          where: { season_id: fantasySeason.season.season_id },
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
                season_id: fantasySeason.season.season_id,
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
              where: { season_id: fantasySeason.season.season_id },
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

    const formattedPlayers = availablePlayers
      .filter((player) => player.player_team_history.length > 0) // 현재 팀이 있는 선수만
      .map(formatPlayer);

    const recommendedPlayers = recommendations
      .map((rec) => formatPlayer(rec.player))
      .filter((player) => player.current_team); // 현재 팀이 있는 추천 선수만

    // 기존 팀의 선수 데이터 포맷팅
    const defaultPositions = ['GK', 'DF', 'MF', 'FW', 'FW'] as const;

    const initialSelectedPlayers: SelectedPlayer[] =
      existingTeam.player_selections.map(
        (selection: FantasyPlayerSelectionForEdit, index) => ({
          player_id: selection.player.player_id,
          name: selection.player.name,
          profile_image_url: selection.player.profile_image_url || undefined,
          jersey_number: selection.player.jersey_number || undefined,
          position:
            (selection.position as Position) || defaultPositions[index] || 'FW',
          current_team: selection.player.player_team_history[0]?.team
            ? {
                team_id: selection.player.player_team_history[0].team.team_id,
                team_name:
                  selection.player.player_team_history[0].team.team_name,
                logo:
                  selection.player.player_team_history[0].team.logo ||
                  undefined,
                primary_color:
                  selection.player.player_team_history[0].team.primary_color ||
                  undefined,
                secondary_color:
                  selection.player.player_team_history[0].team
                    .secondary_color || undefined,
              }
            : undefined,
          season_stats: selection.player.player_season_stats[0]
            ? {
                goals: selection.player.player_season_stats[0].goals || 0,
                assists: selection.player.player_season_stats[0].assists || 0,
                matches_played:
                  selection.player.player_season_stats[0].matches_played || 0,
              }
            : { goals: 0, assists: 0, matches_played: 0 },
        })
      );

    const response = {
      fantasySeason: {
        fantasy_season_id: fantasySeason.fantasy_season_id,
        year: fantasySeason.year,
        month: fantasySeason.month,
        lock_date: fantasySeason.lock_date.toISOString(),
        season: {
          season_name: fantasySeason.season.season_name,
        },
      },
      availablePlayers: formattedPlayers,
      recommendedPlayers,
      initialSelectedPlayers,
      initialTeamName: existingTeam.team_name || '',
      teamId: existingTeam.fantasy_team_id,
      isLocked,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching edit team data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
