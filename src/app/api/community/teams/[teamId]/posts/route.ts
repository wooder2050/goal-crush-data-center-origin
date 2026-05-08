import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params;
    const { searchParams } = new URL(request.url);

    console.log('팀 게시글 API 호출:', {
      teamId,
      searchParams: Object.fromEntries(searchParams),
    });

    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // 팀 존재 여부 확인
    const team = await prisma.team.findUnique({
      where: { team_id: parseInt(teamId) },
      select: { team_id: true },
    });

    if (!team) {
      console.log('팀을 찾을 수 없음:', teamId);
      return NextResponse.json(
        { error: '팀을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log('팀 확인됨:', team);

    // 게시글 목록 조회
    const posts = await prisma.communityPost.findMany({
      where: {
        team_id: parseInt(teamId),
        is_deleted: false,
      },
      orderBy: {
        created_at: 'desc',
      },
      skip: offset,
      take: limit,
      select: {
        post_id: true,
        title: true,
        content: true,
        created_at: true,
        updated_at: true,
        user: {
          select: {
            korean_nickname: true,
            profile_image_url: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    console.log('조회된 게시글 수:', posts.length);

    // 전체 게시글 수 조회
    const totalCount = await prisma.communityPost.count({
      where: {
        team_id: parseInt(teamId),
        is_deleted: false,
      },
    });

    console.log('전체 게시글 수:', totalCount);

    const formattedPosts = posts.map((post) => ({
      id: post.post_id.toString(),
      title: post.title,
      content: post.content,
      created_at: post.created_at,
      updated_at: post.updated_at,
      user_nickname: post.user.korean_nickname,
      user_avatar: post.user.profile_image_url,
      likes_count: post._count.likes,
      comments_count: post._count.comments,
    }));

    console.log('포맷된 게시글:', formattedPosts.length);

    return NextResponse.json({
      data: formattedPosts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('팀 게시글 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '팀 게시글 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
