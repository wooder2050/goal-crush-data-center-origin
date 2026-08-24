import { NextRequest, NextResponse } from 'next/server';

import { buildMatchPassMap } from '@/features/matches/server/pass-map';
import { adminAuthErrorResponse, requireAdminAuth } from '@/lib/auth';

// GET /api/admin/matches/[match_id]/actions/pass-map - 패스맵 데이터 (관리자용)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ match_id: string }> }
) {
  try {
    await requireAdminAuth();

    const { match_id } = await params;
    const matchId = parseInt(match_id, 10);

    if (isNaN(matchId)) {
      return NextResponse.json(
        { error: '유효하지 않은 경기 ID입니다.' },
        { status: 400 }
      );
    }

    const result = await buildMatchPassMap(matchId);
    return NextResponse.json(result);
  } catch (error) {
    const authError = adminAuthErrorResponse(error);
    if (authError) return authError;

    console.error('패스맵 조회 오류:', error);
    return NextResponse.json(
      { error: '패스맵 데이터를 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}
