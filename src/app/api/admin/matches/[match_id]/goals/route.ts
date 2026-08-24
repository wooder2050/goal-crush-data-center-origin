import { NextRequest, NextResponse } from 'next/server';

import { adminAuthErrorResponse, requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/matches/[match_id]/goals - 특정 경기의 골 목록 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    await requireAdminAuth();

    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    // 골 목록 조회
    const goals = await prisma.goal.findMany({
      where: { match_id: matchId },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
          },
        },
      },
      orderBy: { goal_time: 'asc' },
    });

    // 각 골에 팀 정보 추가
    const goalsWithTeam = await Promise.all(
      goals.map(async (goal) => {
        const playerStats = await prisma.playerMatchStats.findFirst({
          where: {
            match_id: matchId,
            player_id: goal.player_id,
          },
          include: {
            team: {
              select: {
                team_id: true,
                team_name: true,
              },
            },
          },
        });

        return {
          ...goal,
          team: playerStats?.team || null,
        };
      })
    );

    return NextResponse.json(goalsWithTeam);
  } catch (error) {
    const authError = adminAuthErrorResponse(error);
    if (authError) return authError;

    console.error('Failed to fetch goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST /api/admin/matches/[match_id]/goals - 골 추가
export async function POST(
  request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    // 관리자 권한 확인
    await requireAdminAuth();

    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const data = await request.json();
    const { player_id, goal_time, goal_type, description } = data;

    // 필수 필드 검증
    if (!player_id || goal_time === undefined) {
      return NextResponse.json(
        { error: 'player_id and goal_time are required' },
        { status: 400 }
      );
    }

    // 선수가 존재하는지 확인
    const player = await prisma.player.findUnique({
      where: { player_id },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // 경기가 존재하는지 확인
    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // 해당 선수가 경기 라인업에 등록되어 있는지 확인
    const playerMatchStats = await prisma.playerMatchStats.findFirst({
      where: {
        match_id: matchId,
        player_id,
      },
    });

    if (!playerMatchStats) {
      return NextResponse.json(
        {
          error:
            'Player must be registered in lineup before scoring goals. Please add the player to lineup first.',
        },
        { status: 400 }
      );
    }

    // 골 생성
    const goal = await prisma.goal.create({
      data: {
        match_id: matchId,
        player_id,
        goal_time,
        goal_type: goal_type || 'regular',
        description: description || null,
      },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
          },
        },
      },
    });

    // 선수의 경기 통계 업데이트 (자책골은 goals에 포함하지 않음)
    const isOwnGoal = (goal_type || 'regular') === 'own_goal';
    if (!isOwnGoal) {
      await prisma.playerMatchStats.update({
        where: { stat_id: playerMatchStats.stat_id },
        data: {
          goals: (playerMatchStats.goals || 0) + 1,
          updated_at: new Date(),
        },
      });

      // 시즌 통계 업데이트
      if (match.season_id) {
        const seasonStats = await prisma.playerSeasonStats.findFirst({
          where: {
            player_id,
            season_id: match.season_id,
          },
        });

        if (seasonStats) {
          await prisma.playerSeasonStats.update({
            where: {
              stat_id: seasonStats.stat_id,
            },
            data: {
              goals: (seasonStats.goals || 0) + 1,
            },
          });
        }
      }
    }

    // 스코어는 스코어 탭에서 수동으로 관리하므로 자동 업데이트하지 않음

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === '인증이 필요합니다' ||
        error.message === '관리자 권한이 필요합니다')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '인증이 필요합니다' ? 401 : 403 }
      );
    }

    console.error('Failed to create goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
