import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// prod에서는 테스트 엔드포인트 비활성화
function ensureNotProduction(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const guard = ensureNotProduction();
  if (guard) return guard;

  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 팀 존재 여부 확인
    const team = await prisma.team.findUnique({
      where: { team_id: parseInt(teamId) },
      select: { team_id: true, team_name: true },
    });

    if (!team) {
      return NextResponse.json(
        { error: '팀을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 해당 팀의 모든 게시글 조회
    const posts = await prisma.communityPost.findMany({
      where: {
        team_id: parseInt(teamId),
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        post_id: true,
        title: true,
        content: true,
        created_at: true,
        team_id: true,
        user_id: true,
        user: {
          select: {
            korean_nickname: true,
          },
        },
      },
    });

    // 전체 게시글 수
    const totalCount = await prisma.communityPost.count({
      where: {
        team_id: parseInt(teamId),
      },
    });

    return NextResponse.json({
      team: {
        id: team.team_id,
        name: team.team_name,
      },
      posts,
      totalCount,
      message: `팀 ${team.team_name}의 게시글 ${totalCount}개를 찾았습니다.`,
    });
  } catch (error) {
    console.error('팀 게시글 테스트 조회 오류:', error);
    return NextResponse.json(
      { error: '팀 게시글을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
