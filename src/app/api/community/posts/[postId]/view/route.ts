import { NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/community/posts/[postId]/view - 게시글 조회 추적
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = parseInt(params.postId);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: '올바르지 않은 게시글 ID입니다.' },
        { status: 400 }
      );
    }

    // 게시글 존재 여부 확인
    const post = await prisma.communityPost.findUnique({
      where: { post_id: postId },
      select: { post_id: true, is_deleted: true },
    });

    if (!post || post.is_deleted) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사용자 인증 상태 확인
    const {
      data: { user },
      error: authError,
    } = await getAuthUser();

    // 클라이언트 정보 추출
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // 세션 ID 생성 (사용자 ID가 있으면 사용, 없으면 IP + User-Agent 기반 해시)
    let sessionId: string;
    let userId: string | undefined;

    if (user && !authError) {
      userId = user.id;
      sessionId = user.id; // 로그인한 사용자는 사용자 ID를 세션 ID로 사용
    } else {
      // 익명 사용자의 경우 IP + User-Agent 기반 세션 ID 생성
      const sessionData = `${ip}-${userAgent}`;
      sessionId = Buffer.from(sessionData).toString('base64').substring(0, 32);
    }

    // 중복 조회 확인 (24시간 내)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const existingView = await prisma.postViewRecord.findFirst({
      where: {
        post_id: postId,
        OR: [
          { user_id: userId }, // 로그인한 사용자의 경우
          { session_id: sessionId }, // 익명 사용자의 경우
        ],
        viewed_at: { gte: oneDayAgo },
      },
    });

    if (existingView) {
      // 24시간 내 이미 조회한 경우 조회수 증가하지 않음
      return NextResponse.json({
        success: true,
        message: '이미 조회한 게시글입니다.',
        isNewView: false,
      });
    }

    // 새로운 조회 기록 생성
    await prisma.postViewRecord.create({
      data: {
        post_id: postId,
        user_id: userId,
        session_id: sessionId,
        ip_address: ip,
        user_agent: userAgent,
        viewed_at: new Date(),
      },
    });

    // 조회수 증가
    await prisma.communityPost.update({
      where: { post_id: postId },
      data: { views_count: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      message: '조회가 성공적으로 기록되었습니다.',
      isNewView: true,
    });
  } catch (error) {
    console.error('게시글 조회 추적 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '조회 추적에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
