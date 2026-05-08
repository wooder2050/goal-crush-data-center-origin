import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// prod에서는 테스트 엔드포인트 비활성화
function ensureNotProduction(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
  return null;
}

// GET /api/test/view-count - 게시글 조회수 확인
export async function GET() {
  const guard = ensureNotProduction();
  if (guard) return guard;

  try {
    // 모든 게시글의 조회수 확인
    const posts = await prisma.communityPost.findMany({
      select: {
        post_id: true,
        title: true,
        views_count: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 10,
    });

    // 조회 기록 확인
    const viewRecords = await prisma.postViewRecord.findMany({
      select: {
        record_id: true,
        post_id: true,
        user_id: true,
        session_id: true,
        ip_address: true,
        viewed_at: true,
      },
      orderBy: {
        viewed_at: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        posts,
        viewRecords,
        totalPosts: posts.length,
        totalViewRecords: viewRecords.length,
      },
    });
  } catch (error) {
    console.error('조회수 확인 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '조회수 확인에 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
