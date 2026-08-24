import { NextRequest, NextResponse } from 'next/server';

import { buildMatchPassMap } from '@/features/matches/server/pass-map';
import { GATED_NO_STORE_HEADERS, getMemberAuthStatus } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/matches/[match_id]/pass-map - 패스 네트워크 (로그인 회원 전용)
// 비로그인: 200 + [] (데이터 없는 경기와 동일하게 처리)
// 잘못된/만료 Bearer: 401 (앱이 토큰 갱신을 감지해야 함)
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

    const auth = await getMemberAuthStatus();
    if (auth === 'invalid') {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401, headers: GATED_NO_STORE_HEADERS }
      );
    }
    if (auth === 'anonymous') {
      return NextResponse.json([], { headers: GATED_NO_STORE_HEADERS });
    }

    const result = await buildMatchPassMap(matchId);
    return NextResponse.json(result, { headers: GATED_NO_STORE_HEADERS });
  } catch (error) {
    console.error('패스맵 조회 오류:', error);
    return NextResponse.json(
      { error: '패스맵 데이터를 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}
