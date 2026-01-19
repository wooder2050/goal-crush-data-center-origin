import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// GET /api/admin/matches/[match_id]/penalties - 특정 경기의 페널티킥 목록 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    // 페널티킥 목록 조회
    const penalties = await prisma.penaltyShootoutDetail.findMany({
      where: { match_id: matchId },
      include: {
        kicker: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
          },
        },
        goalkeeper: {
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
      orderBy: { kicker_order: 'asc' },
    });

    return NextResponse.json(penalties);
  } catch (error) {
    console.error('Failed to fetch penalties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch penalties' },
      { status: 500 }
    );
  }
}

// POST /api/admin/matches/[match_id]/penalties - 페널티킥 추가
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
    const { team_id, player_id, goalkeeper_id, is_scored, order } = data;

    // 필수 필드 검증
    if (
      !team_id ||
      !player_id ||
      !goalkeeper_id ||
      is_scored === undefined ||
      !order
    ) {
      return NextResponse.json(
        {
          error:
            'team_id, player_id, goalkeeper_id, is_scored, and order are required',
        },
        { status: 400 }
      );
    }

    // 키커가 존재하는지 확인
    const player = await prisma.player.findUnique({
      where: { player_id },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // 골키퍼가 존재하는지 확인
    const goalkeeper = await prisma.player.findUnique({
      where: { player_id: goalkeeper_id },
    });

    if (!goalkeeper) {
      return NextResponse.json(
        { error: 'Goalkeeper not found' },
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

    // 같은 팀의 같은 순서의 페널티킥이 이미 있는지 확인
    const existingPenalty = await prisma.penaltyShootoutDetail.findFirst({
      where: {
        match_id: matchId,
        team_id,
        kicker_order: parseInt(order),
      },
    });

    if (existingPenalty) {
      return NextResponse.json(
        { error: 'Penalty with this order already exists for this team' },
        { status: 409 }
      );
    }

    // 페널티킥 생성
    const penalty = await prisma.penaltyShootoutDetail.create({
      data: {
        match_id: matchId,
        team_id,
        kicker_id: player_id,
        goalkeeper_id,
        is_successful: is_scored,
        kicker_order: parseInt(order),
      },
      include: {
        kicker: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
          },
        },
        goalkeeper: {
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

    // 페널티킥 스코어 업데이트
    if (is_scored) {
      const isHomeTeam = team_id === match.home_team_id;

      if (isHomeTeam) {
        await prisma.match.update({
          where: { match_id: matchId },
          data: {
            penalty_home_score: (match.penalty_home_score || 0) + 1,
          },
        });
      } else {
        await prisma.match.update({
          where: { match_id: matchId },
          data: {
            penalty_away_score: (match.penalty_away_score || 0) + 1,
          },
        });
      }
    }

    return NextResponse.json(penalty, { status: 201 });
  } catch (error) {
    console.error('Failed to create penalty:', error);
    return NextResponse.json(
      { error: 'Failed to create penalty' },
      { status: 500 }
    );
  }
}
