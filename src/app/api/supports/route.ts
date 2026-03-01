import { NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/supports - 사용자의 응원 목록 조회
export async function GET(request: NextRequest) {
  try {
    const {
      data: { user },
      error,
    } = await getAuthUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (matchId) {
      // 특정 경기에 대한 사용자의 응원 조회
      const support = await prisma.matchSupport.findFirst({
        where: {
          user_id: userId,
          match_id: parseInt(matchId),
        },
        include: {
          team: {
            select: {
              team_id: true,
              team_name: true,
              logo: true,
              primary_color: true,
              secondary_color: true,
            },
          },
        },
      });

      return NextResponse.json({ support });
    } else {
      // 사용자의 모든 응원 목록 조회
      const supports = await prisma.matchSupport.findMany({
        where: {
          user_id: userId,
        },
        include: {
          team: {
            select: {
              team_id: true,
              team_name: true,
              logo: true,
              primary_color: true,
              secondary_color: true,
            },
          },
          match: {
            select: {
              match_id: true,
              match_date: true,
              status: true,
              home_team: {
                select: {
                  team_id: true,
                  team_name: true,
                  logo: true,
                },
              },
              away_team: {
                select: {
                  team_id: true,
                  team_name: true,
                  logo: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return NextResponse.json({ supports });
    }
  } catch (error) {
    console.error('Error fetching supports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/supports - 새로운 응원 추가
export async function POST(request: NextRequest) {
  try {
    const {
      data: { user },
      error,
    } = await getAuthUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const body = await request.json();
    const { matchId, teamId, supportType = 'cheer', message } = body;

    if (!matchId || !teamId) {
      return NextResponse.json(
        { error: 'Match ID and Team ID are required' },
        { status: 400 }
      );
    }

    // 경기가 존재하는지 확인
    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
      include: {
        home_team: { select: { team_id: true } },
        away_team: { select: { team_id: true } },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // 선택한 팀이 해당 경기에 참여하는지 확인
    const isValidTeam =
      teamId === match.home_team?.team_id ||
      teamId === match.away_team?.team_id;

    if (!isValidTeam) {
      return NextResponse.json(
        { error: 'Team is not participating in this match' },
        { status: 400 }
      );
    }

    // 경기가 이미 시작되었는지 확인 (응원은 경기 시작 전에만 가능)
    const now = new Date();
    if (match.match_date < now && match.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Cannot support after match has started' },
        { status: 400 }
      );
    }

    // 기존 응원이 있다면 업데이트, 없다면 생성
    // 기존 응원 확인
    const existingSupport = await prisma.matchSupport.findFirst({
      where: {
        user_id: userId,
        match_id: matchId,
      },
    });

    const support = existingSupport
      ? await prisma.matchSupport.update({
          where: {
            support_id: existingSupport.support_id,
          },
          data: {
            team_id: teamId,
            support_type: supportType,
            message: message || null,
            updated_at: new Date(),
          },
          include: {
            team: {
              select: {
                team_id: true,
                team_name: true,
                logo: true,
                primary_color: true,
                secondary_color: true,
              },
            },
          },
        })
      : await prisma.matchSupport.create({
          data: {
            user_id: userId,
            match_id: matchId,
            team_id: teamId,
            support_type: supportType,
            message: message || null,
          },
          include: {
            team: {
              select: {
                team_id: true,
                team_name: true,
                logo: true,
                primary_color: true,
                secondary_color: true,
              },
            },
          },
        });

    return NextResponse.json({ support }, { status: 201 });
  } catch (error) {
    console.error('Error creating support:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/supports - 응원 취소
export async function DELETE(request: NextRequest) {
  try {
    const {
      data: { user },
      error,
    } = await getAuthUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    // 경기가 이미 시작되었는지 확인
    const match = await prisma.match.findUnique({
      where: { match_id: parseInt(matchId) },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const now = new Date();
    if (match.match_date < now && match.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Cannot cancel support after match has started' },
        { status: 400 }
      );
    }

    // 응원 삭제
    await prisma.matchSupport.deleteMany({
      where: {
        user_id: userId,
        match_id: parseInt(matchId),
      },
    });

    return NextResponse.json({ message: 'Support cancelled successfully' });
  } catch (error) {
    console.error('Error deleting support:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
