import { NextRequest, NextResponse } from 'next/server';

import { buildMatchPassMap } from '@/features/matches/server/pass-map';

export const dynamic = 'force-dynamic';

// GET /api/matches/[match_id]/pass-map - 패스 네트워크 (public)
export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id, 10);

    if (isNaN(matchId)) {
      return NextResponse.json(
        { error: '유효하지 않은 경기 ID입니다.' },
        { status: 400 }
      );
    }

    const result = await buildMatchPassMap(matchId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('패스맵 조회 오류:', error);
    return NextResponse.json(
      { error: '패스맵 데이터를 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}
