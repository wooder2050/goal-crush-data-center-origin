import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  createFantasyTeamSchema,
  validateTeamComposition,
} from '@/types/fantasy';

export const dynamic = 'force-dynamic';

// GET - 사용자의 판타지 팀 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = user.userId;

    const { searchParams } = new URL(request.url);
    const fantasySeasonId = searchParams.get('fantasy_season_id');

    // fantasy_season_id가 없으면 사용자의 모든 팀 반환
    if (!fantasySeasonId) {
      // 사용자 확인
      const dbUser = await prisma.user.findUnique({
        where: { user_id: userId },
      });

      if (!dbUser) {
        return NextResponse.json(
          { error: '사용자를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // 사용자의 모든 판타지 팀 조회
      const fantasyTeams = await prisma.fantasyTeam.findMany({
        where: { user_id: userId },
        include: {
          fantasy_season: {
            select: {
              fantasy_season_id: true,
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
        orderBy: {
          fantasy_season: {
            year: 'desc',
          },
        },
      });

      return NextResponse.json(fantasyTeams);
    }

    // 사용자 확인
    const dbUser = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const fantasyTeam = await prisma.fantasyTeam.findUnique({
      where: {
        user_id_fantasy_season_id: {
          user_id: userId,
          fantasy_season_id: parseInt(fantasySeasonId),
        },
      },
      include: {
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

// POST - 판타지 팀 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = user.userId;

    const body = await request.json();
    const validatedData = createFantasyTeamSchema.parse(body);

    const { fantasy_season_id, team_name, player_selections } = validatedData;
    const player_ids = player_selections.map((sel) => sel.player_id);

    // 사용자 확인
    const dbUser = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 판타지 시즌 확인
    const fantasySeason = await prisma.fantasySeason.findUnique({
      where: { fantasy_season_id },
    });

    if (!fantasySeason) {
      return NextResponse.json(
        { error: '판타지 시즌을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 기존 팀 확인
    const existingTeam = await prisma.fantasyTeam.findUnique({
      where: {
        user_id_fantasy_season_id: {
          user_id: userId,
          fantasy_season_id,
        },
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: '이미 해당 시즌의 판타지 팀이 존재합니다.' },
        { status: 400 }
      );
    }

    // 선수 정보 조회 및 검증
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

    if (players.length !== player_ids.length) {
      return NextResponse.json(
        { error: '일부 선수를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

    // 팀 편성 규칙 검증
    const playerSelections = players.map((player) => ({
      player_id: player.player_id,
      team_id: player.player_team_history[0]?.team?.team_id,
      name: player.name,
      position: undefined, // 포지션 정보는 필요시 추가
    }));

    const validation = validateTeamComposition(playerSelections);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: '팀 편성 규칙 위반', details: validation.errors },
        { status: 400 }
      );
    }

    // 트랜잭션으로 팀 생성
    const result = await prisma.$transaction(async (tx) => {
      // 판타지 팀 생성
      const fantasyTeam = await tx.fantasyTeam.create({
        data: {
          user_id: userId,
          fantasy_season_id,
          team_name,
          is_locked: false,
        },
      });

      // 선수 선택 생성
      const playerSelectionsData = await Promise.all(
        player_selections.map((selection, index) =>
          tx.fantasyPlayerSelection.create({
            data: {
              fantasy_team_id: fantasyTeam.fantasy_team_id,
              player_id: selection.player_id,
              position: selection.position,
              selection_order: index + 1,
            },
          })
        )
      );

      return { fantasyTeam, playerSelections: playerSelectionsData };
    });

    // 생성된 팀 정보 조회
    const createdTeam = await prisma.fantasyTeam.findUnique({
      where: { fantasy_team_id: result.fantasyTeam.fantasy_team_id },
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

    return NextResponse.json(createdTeam, { status: 201 });
  } catch (error) {
    console.error('판타지 팀 생성 중 오류:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '판타지 팀 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
