import { NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/community/posts/[postId]/likes - 게시글 좋아요 토글
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const {
      data: { user },
      error: authError,
    } = await getAuthUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const postId = parseInt(params.postId);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: '올바르지 않은 게시글 ID입니다.' },
        { status: 400 }
      );
    }

    // 게시글 존재 확인
    const post = await prisma.communityPost.findFirst({
      where: {
        post_id: postId,
        is_deleted: false,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 기존 좋아요 확인
    const existingLike = await prisma.postLike.findUnique({
      where: {
        post_id_user_id: {
          post_id: postId,
          user_id: user.id,
        },
      },
    });

    let isLiked = false;
    let likesCount = 0;

    if (existingLike) {
      // 좋아요 취소
      await prisma.postLike.delete({
        where: {
          like_id: existingLike.like_id,
        },
      });
      isLiked = false;
    } else {
      // 좋아요 추가
      await prisma.postLike.create({
        data: {
          post_id: postId,
          user_id: user.id,
        },
      });
      isLiked = true;

      // 게시글 작성자에게 포인트 지급 (좋아요 받음)
      if (post.user_id !== user.id) {
        await prisma.userPoint.create({
          data: {
            user_id: post.user_id,
            points_change: 2,
            point_type: 'like_received',
            reference_id: postId,
            description: '게시글 좋아요 받음',
          },
        });

        // 게시글 작성자에게 알림 생성
        await prisma.userNotification.create({
          data: {
            user_id: post.user_id,
            notification_type: 'like',
            title: '게시글에 좋아요를 받았습니다',
            message: `${user.email}님이 회원님의 게시글을 좋아합니다.`,
            reference_type: 'post',
            reference_id: postId,
          },
        });
      }
    }

    // 최신 좋아요 수 조회
    const updatedPost = await prisma.communityPost.findUnique({
      where: { post_id: postId },
      select: { likes_count: true },
    });

    likesCount = updatedPost?.likes_count || 0;

    return NextResponse.json({
      isLiked,
      likesCount,
      message: isLiked ? '좋아요를 눌렀습니다.' : '좋아요를 취소했습니다.',
    });
  } catch (error) {
    console.error('게시글 좋아요 오류:', error);
    return NextResponse.json(
      { error: '좋아요 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// GET /api/community/posts/[postId]/likes - 게시글 좋아요 상태 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const {
      data: { user },
    } = await getAuthUser();

    const postId = parseInt(params.postId);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: '올바르지 않은 게시글 ID입니다.' },
        { status: 400 }
      );
    }

    // 게시글 좋아요 수 조회
    const post = await prisma.communityPost.findUnique({
      where: { post_id: postId },
      select: { likes_count: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    let isLiked = false;

    // 로그인한 사용자의 좋아요 상태 확인
    if (user) {
      const userLike = await prisma.postLike.findUnique({
        where: {
          post_id_user_id: {
            post_id: postId,
            user_id: user.id,
          },
        },
      });
      isLiked = !!userLike;
    }

    return NextResponse.json({
      isLiked,
      likesCount: post.likes_count,
    });
  } catch (error) {
    console.error('게시글 좋아요 상태 조회 오류:', error);
    return NextResponse.json(
      { error: '좋아요 상태를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
