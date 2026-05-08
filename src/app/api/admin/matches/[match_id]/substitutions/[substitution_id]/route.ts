import { NextRequest, NextResponse } from 'next/server';

import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/admin/matches/[match_id]/substitutions/[substitution_id] - 교체 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ match_id: string; substitution_id: string }> }
) {
  try {
    // 관리자 권한 확인
    await requireAdminAuth();

    const { match_id, substitution_id } = await params;
    const matchId = parseInt(match_id);
    const substitutionId = parseInt(substitution_id);

    if (isNaN(matchId) || isNaN(substitutionId)) {
      return NextResponse.json(
        { error: 'Invalid match ID or substitution ID' },
        { status: 400 }
      );
    }

    // 교체 기록이 존재하는지 확인
    const substitution = await prisma.substitution.findFirst({
      where: {
        substitution_id: substitutionId,
        match_id: matchId,
      },
    });

    if (!substitution) {
      return NextResponse.json(
        { error: 'Substitution not found' },
        { status: 404 }
      );
    }

    // 교체 삭제
    await prisma.substitution.delete({
      where: { substitution_id: substitutionId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
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

    console.error('Failed to delete substitution:', error);
    return NextResponse.json(
      { error: 'Failed to delete substitution' },
      { status: 500 }
    );
  }
}
