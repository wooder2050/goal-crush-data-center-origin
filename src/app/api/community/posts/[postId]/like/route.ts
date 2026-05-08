import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { addLikeReceivedPoints } from '@/lib/points';
import { prisma } from '@/lib/prisma';

// POST /api/community/posts/[postId]/like - 게시글 좋아요/좋아요 취소
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { postId } = params;
    const body = await request.json();
    const { action } = body; // action: 'like' | 'unlike'
    const actualUserId = currentUser.userId;

    if (!postId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 파라미터가 누락되었습니다.',
        },
        { status: 400 }
      );
    }

    const postIdNum = parseInt(postId);

    // 게시글 존재 여부 확인
    const post = await prisma.communityPost.findUnique({
      where: { post_id: postIdNum },
      select: { post_id: true, is_deleted: true, user_id: true },
    });

    if (!post || post.is_deleted) {
      return NextResponse.json(
        {
          success: false,
          error: '게시글을 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    // 본인 게시글에 좋아요 금지
    if (post.user_id === actualUserId) {
      return NextResponse.json(
        {
          success: false,
          error: '본인이 작성한 게시글에는 좋아요를 할 수 없습니다.',
        },
        { status: 400 }
      );
    }

    if (action === 'like') {
      // 좋아요 추가
      try {
        await prisma.postLike.create({
          data: {
            post_id: postIdNum,
            user_id: actualUserId,
          },
        });

        // 게시글의 좋아요 수 증가
        await prisma.communityPost.update({
          where: { post_id: postIdNum },
          data: {
            likes_count: {
              increment: 1,
            },
          },
        });

        // 좋아요 받기 포인트 지급 (+2pt)
        try {
          await addLikeReceivedPoints(post.user_id, postIdNum);
        } catch (pointError) {
          console.error('포인트 지급 실패:', pointError);
          // 포인트 지급 실패해도 좋아요는 성공으로 처리
        }

        return NextResponse.json({
          success: true,
          data: { liked: true },
          message: '좋아요가 추가되었습니다.',
        });
      } catch (error: unknown) {
        // 이미 좋아요를 누른 경우 (unique constraint violation)
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2002'
        ) {
          return NextResponse.json({
            success: true,
            data: { liked: true },
            message: '이미 좋아요를 누른 게시글입니다.',
          });
        }
        throw error;
      }
    } else if (action === 'unlike') {
      // 좋아요 취소
      const deletedLike = await prisma.postLike.deleteMany({
        where: {
          post_id: postIdNum,
          user_id: actualUserId,
        },
      });

      if (deletedLike.count > 0) {
        // 게시글의 좋아요 수 감소
        await prisma.communityPost.update({
          where: { post_id: postIdNum },
          data: {
            likes_count: {
              decrement: 1,
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: { liked: false },
          message: '좋아요가 취소되었습니다.',
        });
      } else {
        return NextResponse.json({
          success: true,
          data: { liked: false },
          message: '좋아요를 누르지 않은 게시글입니다.',
        });
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 액션입니다.',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('게시글 좋아요 처리 오류 상세:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code:
        error && typeof error === 'object' && 'code' in error
          ? error.code
          : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: '좋아요 처리에 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/community/posts/[postId]/like - 게시글 좋아요 상태 확인
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!postId || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 파라미터가 누락되었습니다.',
        },
        { status: 400 }
      );
    }

    const postIdNum = parseInt(postId);

    // 테스트용: 사용자가 존재하지 않으면 첫 번째 사용자 사용
    let actualUserId = userId;
    if (userId === 'test-user-001') {
      const existingUser = await prisma.user.findFirst({
        where: { is_active: true },
        select: { user_id: true },
      });

      if (!existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: '사용자를 찾을 수 없습니다.',
          },
          { status: 404 }
        );
      }

      actualUserId = existingUser.user_id;
      console.log(
        'GET 요청 - 테스트 사용자 ID를 실제 사용자 ID로 변경:',
        actualUserId
      );
    }

    // 사용자가 해당 게시글에 좋아요를 눌렀는지 확인
    const like = await prisma.postLike.findUnique({
      where: {
        post_id_user_id: {
          post_id: postIdNum,
          user_id: actualUserId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { liked: !!like },
    });
  } catch (error) {
    console.error('게시글 좋아요 상태 확인 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '좋아요 상태 확인에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
