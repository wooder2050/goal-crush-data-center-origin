import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { addCommentCreatePoints } from '@/lib/points';
import { prisma } from '@/lib/prisma';

// POST /api/community/posts/[postId]/comments - 댓글 작성
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
    const { content, parent_comment_id } = body;
    const actualUserId = currentUser.userId;

    if (!postId || !content) {
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
      select: { post_id: true, is_deleted: true },
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

    // 댓글 생성
    const newComment = await prisma.postComment.create({
      data: {
        post_id: postIdNum,
        user_id: actualUserId,
        content: content.trim(),
        parent_comment_id: parent_comment_id || null,
        is_deleted: false,
      },
      include: {
        user: {
          select: {
            korean_nickname: true,
            profile_image_url: true,
          },
        },
      },
    });

    // 게시글의 댓글 수 증가
    await prisma.communityPost.update({
      where: { post_id: postIdNum },
      data: {
        comments_count: {
          increment: 1,
        },
      },
    });

    // 댓글 작성 포인트 지급 (+5pt)
    try {
      await addCommentCreatePoints(actualUserId, newComment.comment_id);
    } catch (pointError) {
      console.error('포인트 지급 실패:', pointError);
      // 포인트 지급 실패해도 댓글 작성은 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      data: {
        comment_id: newComment.comment_id,
        content: newComment.content,
        created_at: newComment.created_at.toISOString(),
        user_nickname: newComment.user.korean_nickname,
        user_profile_image: newComment.user.profile_image_url,
        is_deleted: newComment.is_deleted,
      },
      message: '댓글이 작성되었습니다.',
    });
  } catch (error) {
    console.error('댓글 작성 오류 상세:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: '댓글 작성에 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
