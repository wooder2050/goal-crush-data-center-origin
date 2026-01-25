import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  updateFantasyTeamSchema,
  validateTeamComposition,
} from '@/types/fantasy';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    team_id: string;
  };
}

// GET - 특정 판타지 팀 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const teamId = parseInt(params.team_id);

    if (isNaN(teamId)) {
      return NextResponse.json(
        { error: '유효하지 않은 팀 ID입니다.' },
        { status: 400 }
      );
    }

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
          select: {
            year: true,
            month: true,
            start_date: true,
            end_date: true,
            lock_date: true,
            is_active: true,
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
    });

    if (!fantasyTeam) {
      return NextResponse.json(
        { error: '판타지 팀을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(fantasyTeam);
  } catch (error) {
    console.error('판타지 팀 조회 중 오류:', error);
    return NextResponse.json(
      { error: '판타지 팀을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT - 판타지 팀 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  console.log('🔧 PUT /api/fantasy/teams/[team_id] 시작');

  try {
    console.log('1️⃣ 사용자 인증 확인 중...');
    const user = await getCurrentUser();

    if (!user) {
      console.log('❌ 인증 실패');
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = user.userId;
    console.log('✅ 사용자 인증 성공:', userId);

    const teamId = parseInt(params.team_id);
    console.log('2️⃣ 팀 ID 파싱:', { teamId, raw: params.team_id });

    if (isNaN(teamId)) {
      console.log('❌ 잘못된 팀 ID');
      return NextResponse.json(
        { error: '유효하지 않은 팀 ID입니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('3️⃣ 요청 바디 파싱:', JSON.stringify(body, null, 2));

    const validatedData = updateFantasyTeamSchema.parse(body);
    console.log('✅ 스키마 검증 성공');

    // 기존 팀 조회
    const existingTeam = await prisma.fantasyTeam.findUnique({
      where: { fantasy_team_id: teamId },
      include: {
        fantasy_season: true,
        player_selections: {
          include: {
            player: {
              include: {
                player_team_history: {
                  where: { is_active: true },
                  include: {
                    team: {
                      select: {
                        team_id: true,
                        team_name: true,
                      },
                    },
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!existingTeam) {
      return NextResponse.json(
        { error: '판타지 팀을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 팀 소유자 확인
    console.log('5️⃣ 팀 소유자 확인:', {
      ownerId: existingTeam.user_id,
      userId,
    });
    if (existingTeam.user_id !== userId) {
      console.log('❌ 권한 없음: 소유자가 아님');
      return NextResponse.json(
        { error: '팀을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }
    console.log('✅ 소유자 확인 완료');

    // 잠금 상태 확인
    console.log('6️⃣ 잠금 상태 확인:', existingTeam.is_locked);
    if (existingTeam.is_locked) {
      console.log('❌ 팀이 잠금됨');
      return NextResponse.json(
        { error: '잠금된 팀은 수정할 수 없습니다.' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // 팀명 수정
    if (validatedData.team_name !== undefined) {
      updateData.team_name = validatedData.team_name;
    }

    // 선수 명단 수정
    if (validatedData.player_selections) {
      console.log('8️⃣ 선수 명단 수정 시작');
      const player_ids = validatedData.player_selections.map(
        (sel) => sel.player_id
      );
      console.log('선수 ID 목록:', player_ids);

      // 선수 정보 조회 및 검증
      console.log('선수 정보 조회 중...');
      const players = await prisma.player.findMany({
        where: { player_id: { in: player_ids } },
        include: {
          player_team_history: {
            where: { is_active: true },
            include: {
              team: {
                select: {
                  team_id: true,
                  team_name: true,
                },
              },
            },
            take: 1,
          },
        },
      });

      console.log(
        '조회된 선수 수:',
        players.length,
        '요청된 선수 수:',
        player_ids.length
      );

      if (players.length !== player_ids.length) {
        console.log('❌ 선수 조회 실패: 일부 선수를 찾을 수 없음');
        const foundPlayerIds = players.map((p) => p.player_id);
        const missingPlayerIds = player_ids.filter(
          (id) => !foundPlayerIds.includes(id)
        );
        console.log('누락된 선수 ID:', missingPlayerIds);

        return NextResponse.json(
          {
            error: '일부 선수를 찾을 수 없습니다.',
            missing_player_ids: missingPlayerIds,
          },
          { status: 400 }
        );
      }

      console.log('✅ 모든 선수 조회 성공');

      // 팀 편성 규칙 검증
      const playerSelections = players.map((player) => {
        const requestedSelection = validatedData.player_selections!.find(
          (sel) => sel.player_id === player.player_id
        );
        return {
          player_id: player.player_id,
          team_id: player.player_team_history[0]?.team?.team_id,
          name: player.name,
          position: requestedSelection?.position,
        };
      });

      const validation = validateTeamComposition(playerSelections);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: '팀 편성 규칙 위반', details: validation.errors },
          { status: 400 }
        );
      }

      // 트랜잭션으로 선수 명단 업데이트
      await prisma.$transaction(async (tx) => {
        // 기존 선수 선택 삭제
        await tx.fantasyPlayerSelection.deleteMany({
          where: { fantasy_team_id: teamId },
        });

        // 새로운 선수 선택 생성
        await Promise.all(
          validatedData.player_selections!.map((selection, index) =>
            tx.fantasyPlayerSelection.create({
              data: {
                fantasy_team_id: teamId,
                player_id: selection.player_id,
                position: selection.position || undefined,
                selection_order: index + 1,
              },
            })
          )
        );

        // 팀 정보 업데이트
        if (Object.keys(updateData).length > 0) {
          await tx.fantasyTeam.update({
            where: { fantasy_team_id: teamId },
            data: updateData,
          });
        }
      });
    } else if (Object.keys(updateData).length > 0) {
      // 팀명만 수정하는 경우
      await prisma.fantasyTeam.update({
        where: { fantasy_team_id: teamId },
        data: updateData,
      });
    }

    // 업데이트된 팀 정보 조회
    const updatedTeam = await prisma.fantasyTeam.findUnique({
      where: { fantasy_team_id: teamId },
      include: {
        fantasy_season: {
          select: {
            year: true,
            month: true,
            start_date: true,
            end_date: true,
            lock_date: true,
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
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('판타지 팀 수정 중 오류:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }

    // 더 구체적인 에러 메시지 제공
    const errorMessage =
      error instanceof Error
        ? `판타지 팀 수정 중 오류: ${error.message}`
        : '판타지 팀 수정 중 알 수 없는 오류가 발생했습니다.';

    return NextResponse.json(
      {
        error: errorMessage,
        debug:
          process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE - 판타지 팀 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = user.userId;

    const teamId = parseInt(params.team_id);

    if (isNaN(teamId)) {
      return NextResponse.json(
        { error: '유효하지 않은 팀 ID입니다.' },
        { status: 400 }
      );
    }

    // 기존 팀 조회
    const existingTeam = await prisma.fantasyTeam.findUnique({
      where: { fantasy_team_id: teamId },
      include: { fantasy_season: true },
    });

    if (!existingTeam) {
      return NextResponse.json(
        { error: '판타지 팀을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 팀 소유자 확인
    if (existingTeam.user_id !== userId) {
      return NextResponse.json(
        { error: '팀을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 잠금 상태 확인
    if (existingTeam.is_locked) {
      return NextResponse.json(
        { error: '잠금된 팀은 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 팀 삭제 (Cascade로 player_selections도 함께 삭제됨)
    await prisma.fantasyTeam.delete({
      where: { fantasy_team_id: teamId },
    });

    return NextResponse.json({ message: '판타지 팀이 삭제되었습니다.' });
  } catch (error) {
    console.error('판타지 팀 삭제 중 오류:', error);
    return NextResponse.json(
      { error: '판타지 팀 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
