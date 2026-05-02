import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// GET /api/admin/matches/[match_id] - 특정 경기 상세 조회 (관리자용)
export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
      include: {
        home_team: true,
        away_team: true,
        season: true,
        home_coach: true,
        away_coach: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('Failed to fetch match:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match' },
      { status: 500 }
    );
  }
}

// 경기 정보 업데이트 공통 로직
async function updateMatch(matchId: number, data: Record<string, unknown>) {
  // 경기 존재 여부 확인
  const existingMatch = await prisma.match.findUnique({
    where: { match_id: matchId },
  });

  if (!existingMatch) {
    return null;
  }

  // 경기 정보 업데이트
  const updatedMatch = await prisma.match.update({
    where: { match_id: matchId },
    data: {
      home_score: data.home_score !== undefined ? data.home_score : undefined,
      away_score: data.away_score !== undefined ? data.away_score : undefined,
      penalty_home_score:
        data.penalty_home_score !== undefined
          ? data.penalty_home_score
          : undefined,
      penalty_away_score:
        data.penalty_away_score !== undefined
          ? data.penalty_away_score
          : undefined,
      status: (data.status as string) || undefined,
      match_date: data.match_date
        ? new Date(data.match_date as string)
        : undefined,
      location: data.location !== undefined ? data.location : undefined,
      description:
        data.description !== undefined ? data.description : undefined,
      tournament_stage:
        data.tournament_stage !== undefined ? data.tournament_stage : undefined,
      group_stage:
        data.group_stage !== undefined ? data.group_stage : undefined,
      highlight_url:
        data.highlight_url !== undefined ? data.highlight_url : undefined,
      full_video_url:
        data.full_video_url !== undefined ? data.full_video_url : undefined,
      is_sides_swapped:
        data.is_sides_swapped !== undefined ? data.is_sides_swapped : undefined,
      rating_nationwide:
        data.rating_nationwide !== undefined
          ? data.rating_nationwide
          : undefined,
      rating_metropolitan:
        data.rating_metropolitan !== undefined
          ? data.rating_metropolitan
          : undefined,
      broadcast_time:
        data.broadcast_time !== undefined ? data.broadcast_time : undefined,
    },
    include: {
      home_team: true,
      away_team: true,
      season: true,
    },
  });

  return updatedMatch;
}

// PUT /api/admin/matches/[match_id] - 경기 정보 업데이트 (관리자용)
export async function PUT(
  request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const data = await request.json();
    const updatedMatch = await updateMatch(matchId, data);

    if (!updatedMatch) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    revalidatePath('/', 'layout');
    revalidatePath(`/matches/${matchId}`);

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error('Failed to update match:', error);
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/matches/[match_id] - 경기 정보 업데이트 (관리자용)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const data = await request.json();
    const updatedMatch = await updateMatch(matchId, data);

    if (!updatedMatch) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    revalidatePath('/', 'layout');
    revalidatePath(`/matches/${matchId}`);

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error('Failed to update match:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update match', detail: message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/matches/[match_id] - 경기 삭제 (관리자용)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    // 경기 존재 여부 확인
    const existingMatch = await prisma.match.findUnique({
      where: { match_id: matchId },
    });

    if (!existingMatch) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // 관련 데이터 삭제 (cascade 설정이 되어 있지만 명시적으로 삭제)
    await prisma.$transaction([
      prisma.goal.deleteMany({ where: { match_id: matchId } }),
      prisma.assist.deleteMany({ where: { match_id: matchId } }),
      prisma.substitution.deleteMany({ where: { match_id: matchId } }),
      prisma.playerMatchStats.deleteMany({ where: { match_id: matchId } }),
      prisma.penaltyShootoutDetail.deleteMany({ where: { match_id: matchId } }),
      prisma.matchCoach.deleteMany({ where: { match_id: matchId } }),
      prisma.match.delete({ where: { match_id: matchId } }),
    ]);

    return NextResponse.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Failed to delete match:', error);
    return NextResponse.json(
      { error: 'Failed to delete match' },
      { status: 500 }
    );
  }
}
