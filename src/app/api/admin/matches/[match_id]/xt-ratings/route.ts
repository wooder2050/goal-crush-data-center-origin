import { NextRequest, NextResponse } from 'next/server';

import { calculateMatchXtRatings } from '@/features/matches/lib/xT/calculateXtRating';
import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function parseMatchId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  return parseInt(raw);
}

// POST /api/admin/matches/[match_id]/xt-ratings - xT 평점 생성
export async function POST(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    // 관리자 권한 확인
    await requireAdminAuth();

    const matchId = parseMatchId(params.match_id);

    if (matchId === null) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    // 이벤트 액션 데이터 확인
    const actionCount = await prisma.matchAction.count({
      where: { match_id: matchId },
    });

    if (actionCount === 0) {
      return NextResponse.json({
        match_id: matchId,
        ratings: [],
        message: '이벤트 액션 데이터가 없습니다.',
      });
    }

    // xT 평점 계산
    const playerResults = await calculateMatchXtRatings(matchId);

    // 기존 삭제 + 새로 저장 트랜잭션
    await prisma.$transaction([
      prisma.playerMatchXtRating.deleteMany({
        where: { match_id: matchId },
      }),
      ...playerResults.map((r) =>
        prisma.playerMatchXtRating.create({
          data: {
            match_id: matchId,
            player_id: r.player_id,
            team_id: r.team_id,
            xt_rating: r.xt_rating,
            total_xt: r.total_xt,
            offensive_xt: r.offensive_xt,
            defensive_xt: r.defensive_xt,
            actions_count: r.actions_count,
            breakdown: JSON.parse(JSON.stringify(r.breakdown)),
          },
        })
      ),
    ]);

    // 저장된 평점 조회 (player/team 정보 포함)
    const saved = await prisma.playerMatchXtRating.findMany({
      where: { match_id: matchId },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
            profile_image_url: true,
          },
        },
        team: {
          select: { team_id: true, team_name: true },
        },
      },
      orderBy: { xt_rating: 'desc' },
    });

    return NextResponse.json({ match_id: matchId, ratings: saved });
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

    console.error('Failed to generate xT ratings:', error);
    return NextResponse.json(
      { error: 'Failed to generate xT ratings' },
      { status: 500 }
    );
  }
}

// GET /api/admin/matches/[match_id]/xt-ratings - xT 평점 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseMatchId(params.match_id);

    if (matchId === null) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const ratings = await prisma.playerMatchXtRating.findMany({
      where: { match_id: matchId },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
            profile_image_url: true,
          },
        },
        team: {
          select: { team_id: true, team_name: true },
        },
      },
      orderBy: { xt_rating: 'desc' },
    });

    return NextResponse.json({ match_id: matchId, ratings });
  } catch (error) {
    console.error('Failed to fetch xT ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch xT ratings' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/matches/[match_id]/xt-ratings - xT 평점 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    // 관리자 권한 확인
    await requireAdminAuth();

    const matchId = parseMatchId(params.match_id);

    if (matchId === null) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const deleted = await prisma.playerMatchXtRating.deleteMany({
      where: { match_id: matchId },
    });

    return NextResponse.json({
      success: true,
      deleted_count: deleted.count,
    });
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

    console.error('Failed to delete xT ratings:', error);
    return NextResponse.json(
      { error: 'Failed to delete xT ratings' },
      { status: 500 }
    );
  }
}
