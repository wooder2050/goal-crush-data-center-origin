import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const rankingQuerySchema = z.object({
  fantasy_season_id: z.string().transform((val) => parseInt(val)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
});

// GET - 월간 판타지 랭킹 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const { fantasy_season_id, page, limit } =
      rankingQuerySchema.parse(queryParams);

    // 판타지 시즌 확인
    const fantasySeason = await prisma.fantasySeason.findUnique({
      where: { fantasy_season_id },
      select: {
        fantasy_season_id: true,
        year: true,
        month: true,
        is_active: true,
        season: {
          select: {
            season_name: true,
            category: true,
          },
        },
      },
    });

    if (!fantasySeason) {
      return NextResponse.json(
        { error: '판타지 시즌을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const skip = (page - 1) * limit;

    // 랭킹 데이터 조회 (실시간 계산)
    const rankings = await prisma.fantasyTeam.findMany({
      where: { fantasy_season_id },
      include: {
        user: {
          select: {
            korean_nickname: true,
            display_name: true,
            profile_image_url: true,
          },
        },
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
              },
            },
          },
          orderBy: { selection_order: 'asc' },
        },
      },
      orderBy: [
        { total_points: 'desc' },
        { created_at: 'asc' }, // 동점자 처리 (먼저 생성한 팀이 높은 순위)
      ],
      skip,
      take: limit,
    });

    // 전체 팀 수 조회
    const totalTeams = await prisma.fantasyTeam.count({
      where: { fantasy_season_id },
    });

    // 랭킹에 순위 추가
    const rankedTeams = rankings.map((team, index) => ({
      ...team,
      rank_position: skip + index + 1,
    }));

    // 페이지네이션 정보
    const pagination = {
      current_page: page,
      total_pages: Math.ceil(totalTeams / limit),
      total_teams: totalTeams,
      per_page: limit,
    };

    return NextResponse.json({
      fantasy_season: fantasySeason,
      rankings: rankedTeams,
      pagination,
    });
  } catch (error) {
    console.error('판타지 랭킹 조회 중 오류:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '잘못된 쿼리 파라미터입니다.', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '랭킹을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST - 월간 랭킹 스냅샷 생성 (관리자용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fantasy_season_id } = body;

    if (!fantasy_season_id) {
      return NextResponse.json(
        { error: 'fantasy_season_id가 필요합니다.' },
        { status: 400 }
      );
    }

    // 판타지 시즌 확인
    const fantasySeason = await prisma.fantasySeason.findUnique({
      where: { fantasy_season_id: parseInt(fantasy_season_id) },
    });

    if (!fantasySeason) {
      return NextResponse.json(
        { error: '판타지 시즌을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 기존 랭킹 스냅샷 삭제
    await prisma.fantasyRanking.deleteMany({
      where: { fantasy_season_id: parseInt(fantasy_season_id) },
    });

    // 현재 랭킹 조회
    const currentRankings = await prisma.fantasyTeam.findMany({
      where: { fantasy_season_id: parseInt(fantasy_season_id) },
      orderBy: [{ total_points: 'desc' }, { created_at: 'asc' }],
    });

    // 랭킹 스냅샷 생성
    const rankingSnapshots = currentRankings.map((team, index) => ({
      fantasy_season_id: parseInt(fantasy_season_id),
      user_id: team.user_id,
      fantasy_team_id: team.fantasy_team_id,
      rank_position: index + 1,
      total_points: team.total_points,
    }));

    await prisma.fantasyRanking.createMany({
      data: rankingSnapshots,
    });

    return NextResponse.json({
      message: '랭킹 스냅샷이 생성되었습니다.',
      total_teams: rankingSnapshots.length,
    });
  } catch (error) {
    console.error('랭킹 스냅샷 생성 중 오류:', error);
    return NextResponse.json(
      { error: '랭킹 스냅샷 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
