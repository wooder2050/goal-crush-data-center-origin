import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// prod에서는 테스트 엔드포인트 비활성화
function ensureNotProduction(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
  return null;
}

// GET /api/test - 데이터베이스 연결 및 기본 쿼리 테스트
export async function GET() {
  const guard = ensureNotProduction();
  if (guard) return guard;

  try {
    console.log('🧪 테스트 API 시작...');

    // 1. 사용자 수 확인
    const userCount = await prisma.user.count();
    console.log('사용자 수:', userCount);

    // 2. 첫 번째 사용자 정보 조회
    const firstUser = await prisma.user.findFirst({
      where: { is_active: true },
      select: { user_id: true, korean_nickname: true },
    });
    console.log('첫 번째 사용자:', firstUser);

    // 3. 게시글 수 확인
    const postCount = await prisma.communityPost.count();
    console.log('게시글 수:', postCount);

    // 4. 팀 수 확인
    const teamCount = await prisma.team.count();
    console.log('팀 수:', teamCount);

    return NextResponse.json({
      success: true,
      data: {
        userCount,
        firstUser,
        postCount,
        teamCount,
        message: '데이터베이스 연결 및 기본 쿼리 테스트 완료',
      },
    });
  } catch (error) {
    console.error('❌ 테스트 API 오류:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: '테스트 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
