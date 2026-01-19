import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// 골때리는 그녀들 경기 시간 (전반 13분 + 후반 13분 = 26분)
const MATCH_DURATION_MINUTES = 26;

// GET /api/admin/matches/[match_id]/substitutions - 특정 경기의 교체 목록 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    // 교체 목록 조회
    const substitutions = await prisma.substitution.findMany({
      where: { match_id: matchId },
      include: {
        player_in: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
          },
        },
        player_out: {
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
      orderBy: { substitution_time: 'asc' },
    });

    return NextResponse.json(substitutions);
  } catch (error) {
    console.error('Failed to fetch substitutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch substitutions' },
      { status: 500 }
    );
  }
}

// POST /api/admin/matches/[match_id]/substitutions - 교체 추가
export async function POST(
  request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const data = await request.json();
    const {
      team_id,
      player_in_id,
      player_out_id,
      substitution_time,
      description,
    } = data;

    // 필수 필드 검증
    if (
      !team_id ||
      !player_in_id ||
      !player_out_id ||
      substitution_time === undefined
    ) {
      return NextResponse.json(
        {
          error:
            'team_id, player_in_id, player_out_id, and substitution_time are required',
        },
        { status: 400 }
      );
    }

    // 투입 선수가 존재하는지 확인
    const playerIn = await prisma.player.findUnique({
      where: { player_id: player_in_id },
    });

    if (!playerIn) {
      return NextResponse.json(
        { error: 'Player in not found' },
        { status: 404 }
      );
    }

    // 교체 선수가 존재하는지 확인
    const playerOut = await prisma.player.findUnique({
      where: { player_id: player_out_id },
    });

    if (!playerOut) {
      return NextResponse.json(
        { error: 'Player out not found' },
        { status: 404 }
      );
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

    // 교체 생성
    const substitution = await prisma.substitution.create({
      data: {
        match_id: matchId,
        team_id,
        player_in_id,
        player_out_id,
        substitution_time,
        substitution_reason: description || null,
      },
      include: {
        player_in: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
          },
        },
        player_out: {
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

    // 투입 선수의 경기 통계 생성 또는 업데이트
    const playerInStats = await prisma.playerMatchStats.findFirst({
      where: {
        match_id: matchId,
        player_id: player_in_id,
      },
    });

    if (!playerInStats) {
      // 투입 선수의 경기 통계가 없는 경우 생성
      const remainingMinutes = Math.max(
        0,
        MATCH_DURATION_MINUTES - substitution_time
      );
      await prisma.playerMatchStats.create({
        data: {
          match_id: matchId,
          player_id: player_in_id,
          team_id,
          goals: 0,
          assists: 0,
          minutes_played: remainingMinutes,
        },
      });
    } else {
      // 이미 있는 경우 출전 시간 업데이트
      const remainingMinutes = Math.max(
        0,
        MATCH_DURATION_MINUTES - substitution_time
      );
      await prisma.playerMatchStats.update({
        where: { stat_id: playerInStats.stat_id },
        data: {
          minutes_played:
            (playerInStats.minutes_played || 0) + remainingMinutes,
        },
      });
    }

    // 교체 선수의 경기 통계 업데이트 (출전 시간 조정)
    const playerOutStats = await prisma.playerMatchStats.findFirst({
      where: {
        match_id: matchId,
        player_id: player_out_id,
      },
    });

    if (playerOutStats) {
      await prisma.playerMatchStats.update({
        where: { stat_id: playerOutStats.stat_id },
        data: {
          minutes_played: substitution_time, // 교체된 시간까지만 출전
        },
      });
    }

    return NextResponse.json(substitution, { status: 201 });
  } catch (error) {
    console.error('Failed to create substitution:', error);
    return NextResponse.json(
      { error: 'Failed to create substitution' },
      { status: 500 }
    );
  }
}
