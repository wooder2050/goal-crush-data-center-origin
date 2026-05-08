import { NextRequest, NextResponse } from 'next/server';

import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/matches/[match_id]/lineups - 특정 경기의 라인업 목록 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    // 라인업 목록 조회 (PlayerMatchStats를 라인업으로 사용)
    const lineups = await prisma.playerMatchStats.findMany({
      where: { match_id: matchId },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
          },
        },
        team: {
          select: {
            team_id: true,
            team_name: true,
          },
        },
      },
      orderBy: [{ team_id: 'asc' }, { position: 'asc' }],
    });

    return NextResponse.json(lineups);
  } catch (error) {
    console.error('Failed to fetch lineups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lineups' },
      { status: 500 }
    );
  }
}

// POST /api/admin/matches/[match_id]/lineups - 라인업 추가
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
    const {
      player_id,
      team_id,
      position,
      secondary_position,
      position_change_minute,
      minutes_played,
      goals_conceded,
    } = data;

    // 필수 필드 검증
    if (!player_id || !team_id || !position) {
      return NextResponse.json(
        { error: 'player_id, team_id, and position are required' },
        { status: 400 }
      );
    }

    // secondary_position 유효성 검증
    const VALID_POSITIONS = ['GK', 'DF', 'MF', 'FW'];
    const sanitizedSecondaryPosition =
      secondary_position && VALID_POSITIONS.includes(secondary_position)
        ? secondary_position
        : null;

    // 선수가 존재하는지 확인
    const player = await prisma.player.findUnique({
      where: { player_id },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // 팀이 존재하는지 확인
    const team = await prisma.team.findUnique({
      where: { team_id },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // 경기가 존재하는지 확인
    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // 해당 경기에 이미 같은 선수가 라인업에 있는지 확인
    const existingLineup = await prisma.playerMatchStats.findFirst({
      where: {
        match_id: matchId,
        player_id,
      },
    });

    let lineup;

    if (existingLineup) {
      // 기존 라인업이 있으면 업데이트
      lineup = await prisma.playerMatchStats.update({
        where: {
          stat_id: existingLineup.stat_id,
        },
        data: {
          team_id,
          position,
          secondary_position:
            secondary_position !== undefined
              ? sanitizedSecondaryPosition
              : existingLineup.secondary_position,
          position_change_minute:
            position_change_minute !== undefined
              ? position_change_minute
              : existingLineup.position_change_minute,
          minutes_played: minutes_played ?? existingLineup.minutes_played ?? 0,
          goals_conceded:
            goals_conceded !== undefined
              ? goals_conceded
              : existingLineup.goals_conceded,
          updated_at: new Date(),
        },
        include: {
          player: {
            select: {
              player_id: true,
              name: true,
              jersey_number: true,
            },
          },
          team: {
            select: {
              team_id: true,
              team_name: true,
            },
          },
        },
      });
    } else {
      // 새로운 라인업 생성
      lineup = await prisma.playerMatchStats.create({
        data: {
          match_id: matchId,
          player_id,
          team_id,
          position,
          secondary_position: sanitizedSecondaryPosition,
          position_change_minute: position_change_minute ?? null,
          minutes_played: minutes_played ?? 0,
          goals_conceded: goals_conceded ?? null,
        },
        include: {
          player: {
            select: {
              player_id: true,
              name: true,
              jersey_number: true,
            },
          },
          team: {
            select: {
              team_id: true,
              team_name: true,
            },
          },
        },
      });
    }

    // 시즌 통계 생성/업데이트 (골/어시스트 추가 시 시즌 통계 업데이트가 가능하도록)
    // upsert를 사용하여 race condition 방지
    if (match.season_id) {
      await prisma.playerSeasonStats.upsert({
        where: {
          player_id_season_id_team_id: {
            player_id,
            season_id: match.season_id,
            team_id,
          },
        },
        update: {
          // 기존 데이터가 있으면 아무것도 업데이트하지 않음
          updated_at: new Date(),
        },
        create: {
          player_id,
          season_id: match.season_id,
          team_id,
          matches_played: 0, // 실제 출전 경기수는 regenerate에서 계산
          goals: 0,
          assists: 0,
          yellow_cards: 0,
          red_cards: 0,
          minutes_played: 0,
          saves: 0,
        },
      });
    }

    return NextResponse.json(lineup, { status: 201 });
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

    console.error('Failed to create lineup:', error);
    return NextResponse.json(
      { error: 'Failed to create lineup' },
      { status: 500 }
    );
  }
}
