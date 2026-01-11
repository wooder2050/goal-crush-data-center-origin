import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  GetRankingsResponse,
  GetUserRankingResponse,
} from '@/types/fantasy-pages';

interface RouteParams {
  params: {
    season_id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const fantasySeasonId = parseInt(params.season_id);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const getUserRanking = searchParams.get('user_ranking') === 'true';

    if (isNaN(fantasySeasonId)) {
      return NextResponse.json({ error: 'Invalid season_id' }, { status: 400 });
    }

    // 사용자 랭킹만 요청하는 경우
    if (getUserRanking) {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const userTeam = await prisma.fantasyTeam.findUnique({
        where: {
          user_id_fantasy_season_id: {
            user_id: user.userId,
            fantasy_season_id: fantasySeasonId,
          },
        },
      });

      if (!userTeam) {
        return NextResponse.json({ userRanking: null });
      }

      // 현재 사용자보다 높은 점수의 팀 수 계산
      const betterTeamsCount = await prisma.fantasyTeam.count({
        where: {
          fantasy_season_id: fantasySeasonId,
          OR: [
            { total_points: { gt: userTeam.total_points } },
            {
              total_points: userTeam.total_points,
              created_at: { lt: userTeam.created_at },
            },
          ],
        },
      });

      const userRankingResponse: GetUserRankingResponse = {
        fantasy_team_id: userTeam.fantasy_team_id,
        team_name: userTeam.team_name,
        total_points: userTeam.total_points,
        rank_position: betterTeamsCount + 1,
      };

      return NextResponse.json({ userRanking: userRankingResponse });
    }

    // 판타지 시즌 정보 조회
    const fantasySeason = await prisma.fantasySeason.findUnique({
      where: { fantasy_season_id: fantasySeasonId },
      include: {
        season: {
          select: {
            season_name: true,
            category: true,
          },
        },
        _count: {
          select: {
            fantasy_teams: true,
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

    // 랭킹 데이터 조회
    const skip = (page - 1) * limit;
    const rankings = await prisma.fantasyTeam.findMany({
      where: { fantasy_season_id: fantasySeasonId },
      include: {
        user: {
          select: {
            user_id: true,
            korean_nickname: true,
            display_name: true,
            profile_image_url: true,
          },
        },
        player_selections: {
          include: {
            player: {
              select: {
                name: true,
                profile_image_url: true,
              },
            },
          },
          orderBy: { points_earned: 'desc' },
          take: 3, // 상위 3명만
        },
      },
      orderBy: [{ total_points: 'desc' }, { created_at: 'asc' }],
      skip,
      take: limit,
    });

    // 순위 추가
    const rankedTeams = rankings.map((team, index) => ({
      fantasy_team_id: team.fantasy_team_id,
      team_name: team.team_name,
      total_points: team.total_points,
      rank_position: skip + index + 1,
      user: team.user,
      fantasy_team: {
        team_name: team.team_name,
        player_selections: team.player_selections,
      },
    }));

    const totalTeams = await prisma.fantasyTeam.count({
      where: { fantasy_season_id: fantasySeasonId },
    });

    const response: GetRankingsResponse = {
      fantasy_season: fantasySeason,
      rankings: rankedTeams,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalTeams / limit),
        total_teams: totalTeams,
        per_page: limit,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching fantasy rankings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
