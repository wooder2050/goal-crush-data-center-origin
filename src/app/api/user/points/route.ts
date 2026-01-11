import { NextRequest, NextResponse } from 'next/server';

import { getUserPointHistory, getUserTotalPoints } from '@/lib/points';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/user/points - 사용자 포인트 정보 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }

    // 사용자 존재 여부 확인
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { user_id: true, korean_nickname: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    // 총 포인트와 포인트 히스토리 조회
    const [totalPoints, pointHistory] = await Promise.all([
      getUserTotalPoints(userId),
      getUserPointHistory(userId, 20),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          user_id: user.user_id,
          korean_nickname: user.korean_nickname,
        },
        totalPoints,
        pointHistory,
      },
    });
  } catch (error) {
    console.error('포인트 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '포인트 조회에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
