import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { addPostCreatePoints } from '@/lib/points';
import { prisma } from '@/lib/prisma';

// GET /api/community/posts - 게시글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const teamId = searchParams.get('team_id');
    const sortBy = searchParams.get('sortBy') || 'recent';

    // 페이지네이션 계산
    const skip = (page - 1) * limit;

    // 필터 조건 구성
    const whereClause: {
      is_deleted: boolean;
      category?: string;
      team_id?: number;
    } = {
      is_deleted: false,
    };

    if (category && category !== 'all') {
      whereClause.category = category;
    }

    if (teamId) {
      whereClause.team_id = parseInt(teamId);
    }

    // 정렬 조건 구성
    const orderByClause =
      sortBy === 'popular'
        ? [
            { views_count: 'desc' as const },
            { likes_count: 'desc' as const },
            { comments_count: 'desc' as const },
            { created_at: 'desc' as const },
          ]
        : { created_at: 'desc' as const };

    // 게시글 목록 조회
    const [posts, totalCount] = await Promise.all([
      prisma.communityPost.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: limit,
        select: {
          post_id: true,
          title: true,
          content: true,
          category: true,
          team_id: true,
          created_at: true,
          updated_at: true,
          likes_count: true,
          comments_count: true,
          views_count: true,
          user: {
            select: {
              korean_nickname: true,
              profile_image_url: true,
            },
          },
          team: {
            select: {
              team_name: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      }),
      prisma.communityPost.count({
        where: whereClause,
      }),
    ]);

    // 응답 데이터 구성
    const transformedPosts = posts.map((post) => ({
      post_id: post.post_id.toString(),
      title: post.title,
      content: post.content,
      category: post.category,
      team_id: post.team_id?.toString(),
      team_name: post.team?.team_name,
      created_at: post.created_at,
      updated_at: post.updated_at,
      user_nickname: post.user.korean_nickname,
      user_profile_image: post.user.profile_image_url,
      comment_count: post._count.comments,
      like_count: post._count.likes,
      views_count: post.views_count || 0,
    }));

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;

    return NextResponse.json({
      success: true,
      data: {
        posts: transformedPosts,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          limit,
        },
      },
    });
  } catch (error) {
    console.error('게시글 목록 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '게시글 목록을 조회하는 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// POST /api/community/posts - 새 게시글 작성
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }
    const user = { user_id: currentUser.userId };

    const body = await request.json();
    const { title, content, category, team_id } = body;

    // 필수 필드 검증
    if (!title || !content || !category) {
      return NextResponse.json(
        {
          success: false,
          error: '제목, 내용, 카테고리는 필수입니다.',
        },
        { status: 400 }
      );
    }

    // 카테고리 유효성 검증
    const validCategories = ['general', 'match', 'team', 'data', 'prediction'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 카테고리입니다.',
        },
        { status: 400 }
      );
    }

    // 게시글 생성
    const newPost = await prisma.communityPost.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category,
        team_id: team_id ? parseInt(team_id) : null,
        user_id: user.user_id,
        is_pinned: false,
        is_deleted: false,
      },
    });

    // 게시글 작성 포인트 지급 (+10pt)
    try {
      await addPostCreatePoints(user.user_id, newPost.post_id);
    } catch (pointError) {
      console.error('포인트 지급 실패:', pointError);
      // 포인트 지급 실패해도 게시글 작성은 성공으로 처리
    }

    // 생성된 게시글 정보 조회
    const createdPost = await prisma.communityPost.findUnique({
      where: { post_id: newPost.post_id },
      include: {
        user: {
          select: {
            korean_nickname: true,
            profile_image_url: true,
          },
        },
        team: {
          select: {
            team_name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        post_id: createdPost!.post_id,
        title: createdPost!.title,
        content: createdPost!.content,
        category: createdPost!.category,
        team_id: createdPost!.team_id,
        team_name: createdPost!.team?.team_name,
        created_at: createdPost!.created_at.toISOString(),
        updated_at: createdPost!.updated_at.toISOString(),
        user_nickname: createdPost!.user.korean_nickname,
        user_profile_image: createdPost!.user.profile_image_url,
        comment_count: createdPost!.comments_count,
        like_count: createdPost!.likes_count,
      },
      message: '게시글이 성공적으로 작성되었습니다.',
    });
  } catch (error) {
    console.error('게시글 작성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '게시글 작성에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
