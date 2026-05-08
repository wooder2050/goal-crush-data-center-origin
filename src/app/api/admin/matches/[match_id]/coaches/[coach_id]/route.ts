import { NextRequest, NextResponse } from 'next/server';

import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// DELETE /api/admin/matches/[match_id]/coaches/[coach_id] - 경기 감독 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { match_id: string; coach_id: string } }
) {
  try {
    // 관리자 권한 확인
    await requireAdminAuth();

    const matchId = parseInt(params.match_id);
    const coachId = parseInt(params.coach_id);

    if (isNaN(matchId) || isNaN(coachId)) {
      return NextResponse.json(
        { error: '유효하지 않은 경기 ID 또는 감독 ID입니다.' },
        { status: 400 }
      );
    }

    // 감독 데이터 존재 여부 확인
    const existingCoach = await prisma.matchCoach.findFirst({
      where: {
        match_id: matchId,
        id: coachId,
      },
    });

    if (!existingCoach) {
      return NextResponse.json(
        { error: '해당 경기 감독을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 감독 데이터 삭제
    await prisma.matchCoach.delete({
      where: { id: coachId },
    });

    return NextResponse.json({
      message: '경기 감독이 삭제되었습니다.',
      deletedCoach: {
        id: coachId,
        match_id: matchId,
        team_id: existingCoach.team_id,
        role: existingCoach.role,
      },
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

    console.error('Error deleting match coach:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete match coach',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
