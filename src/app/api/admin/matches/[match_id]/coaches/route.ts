import { NextRequest, NextResponse } from 'next/server';

import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/admin/matches/[match_id]/coaches - 경기 감독 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json(
        { error: '유효하지 않은 경기 ID입니다.' },
        { status: 400 }
      );
    }

    const matchCoaches = await prisma.matchCoach.findMany({
      where: { match_id: matchId },
      include: {
        coach: {
          select: {
            coach_id: true,
            name: true,
          },
        },
        team: {
          select: {
            team_id: true,
            team_name: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // head coach first
        { team_id: 'asc' },
      ],
    });

    const coaches = matchCoaches.map((mc) => ({
      id: mc.id.toString(),
      team_id: mc.team_id,
      coach_id: mc.coach_id,
      role: mc.role,
      description: null, // 스키마에 description 필드가 없음
      coach_name: mc.coach?.name || 'Unknown Coach',
      team_name: mc.team?.team_name || 'Unknown Team',
    }));

    return NextResponse.json(coaches);
  } catch (error) {
    console.error('Error fetching match coaches:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch match coaches',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/matches/[match_id]/coaches - 경기 감독 추가
export async function POST(
  request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    // 관리자 권한 확인
    await requireAdminAuth();

    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json(
        { error: '유효하지 않은 경기 ID입니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { team_id, coach_id, role } = body;

    // 필수 필드 검증
    if (!team_id || !coach_id || !role) {
      return NextResponse.json(
        { error: '팀 ID, 감독 ID, 역할은 필수입니다.' },
        { status: 400 }
      );
    }

    // 경기 존재 여부 확인
    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
    });

    if (!match) {
      return NextResponse.json(
        { error: '경기를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 팀 존재 여부 확인
    const team = await prisma.team.findUnique({
      where: { team_id },
    });

    if (!team) {
      return NextResponse.json(
        { error: '팀을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 감독 존재 여부 확인
    const coach = await prisma.coach.findUnique({
      where: { coach_id },
    });

    if (!coach) {
      return NextResponse.json(
        { error: '감독을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 동일한 팀의 동일한 역할 감독이 이미 있는지 확인
    const existingCoach = await prisma.matchCoach.findFirst({
      where: {
        match_id: matchId,
        team_id,
        role,
      },
    });

    if (existingCoach) {
      return NextResponse.json(
        { error: '해당 팀의 동일한 역할 감독이 이미 존재합니다.' },
        { status: 400 }
      );
    }

    // 감독 데이터 생성
    const newMatchCoach = await prisma.matchCoach.create({
      data: {
        match_id: matchId,
        team_id,
        coach_id,
        role,
      },
      include: {
        coach: {
          select: {
            coach_id: true,
            name: true,
          },
        },
        team: {
          select: {
            team_id: true,
            team_name: true,
          },
        },
      },
    });

    const result = {
      id: newMatchCoach.id.toString(),
      team_id: newMatchCoach.team_id,
      coach_id: newMatchCoach.coach_id,
      role: newMatchCoach.role,
      description: null, // 스키마에 description 필드가 없음
      coach_name: newMatchCoach.coach?.name || 'Unknown Coach',
      team_name: newMatchCoach.team?.team_name || 'Unknown Team',
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === '인증이 필요합니다' ||
        error.message === '관리자 권한이 필요합니다')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '인증이 필요합니다' ? 401 : 403 }
      );
    }

    console.error('Error creating match coach:', error);
    return NextResponse.json(
      {
        error: 'Failed to create match coach',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
