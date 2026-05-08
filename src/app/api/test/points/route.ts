import { NextRequest, NextResponse } from 'next/server';

import {
  addCommentCreatePoints,
  addLikeReceivedPoints,
  addPostCreatePoints,
  getUserPointHistory,
  getUserTotalPoints,
} from '@/lib/points';
import { prisma } from '@/lib/prisma';

// prod에서는 테스트 엔드포인트 비활성화
function ensureNotProduction(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
  return null;
}

// GET /api/test/points - 포인트 시스템 테스트
export async function GET() {
  const guard = ensureNotProduction();
  if (guard) return guard;

  try {
    // 첫 번째 활성 사용자 찾기
    const user = await prisma.user.findFirst({
      where: { is_active: true },
      select: { user_id: true, korean_nickname: true },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '테스트할 사용자를 찾을 수 없습니다.',
      });
    }

    // 현재 포인트 상태 확인
    const currentPoints = await getUserTotalPoints(user.user_id);
    const pointHistory = await getUserPointHistory(user.user_id, 10);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          user_id: user.user_id,
          korean_nickname: user.korean_nickname,
        },
        currentPoints,
        pointHistory,
        message: '포인트 시스템이 정상적으로 작동하고 있습니다.',
      },
    });
  } catch (error) {
    console.error('포인트 시스템 테스트 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '포인트 시스템 테스트에 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/test/points - 포인트 테스트 (게시글 작성 시뮬레이션)
export async function POST(request: NextRequest) {
  const guard = ensureNotProduction();
  if (guard) return guard;

  try {
    const body = await request.json();
    const { action, userId } = body;

    if (!action || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'action과 userId가 필요합니다.',
        },
        { status: 400 }
      );
    }

    let pointsAdded = 0;
    let description = '';

    switch (action) {
      case 'post_create':
        await addPostCreatePoints(userId, 999); // 테스트용 post_id
        pointsAdded = 10;
        description = '게시글 작성';
        break;

      case 'comment_create':
        await addCommentCreatePoints(userId, 999); // 테스트용 comment_id
        pointsAdded = 5;
        description = '댓글 작성';
        break;

      case 'like_received':
        await addLikeReceivedPoints(userId, 999); // 테스트용 post_id
        pointsAdded = 2;
        description = '좋아요 받기';
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: '유효하지 않은 액션입니다.',
          },
          { status: 400 }
        );
    }

    // 업데이트된 포인트 확인
    const newTotalPoints = await getUserTotalPoints(userId);

    return NextResponse.json({
      success: true,
      data: {
        action,
        pointsAdded,
        description,
        newTotalPoints,
        message: `${description} 포인트 ${pointsAdded}pt가 지급되었습니다.`,
      },
    });
  } catch (error) {
    console.error('포인트 테스트 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '포인트 테스트에 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
