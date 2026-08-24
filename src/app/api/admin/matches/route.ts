import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { adminAuthErrorResponse, requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/matches - 모든 경기 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const seasonId = searchParams.get('season_id');
    const teamId = searchParams.get('team_id');
    const limit = searchParams.get('limit');

    // 필터 조건 구성
    const where: Prisma.MatchWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (seasonId && !isNaN(parseInt(seasonId))) {
      where.season_id = parseInt(seasonId);
    }

    if (teamId && !isNaN(parseInt(teamId))) {
      const id = parseInt(teamId);
      where.OR = [{ home_team_id: id }, { away_team_id: id }];
    }

    // 쿼리 옵션 구성
    const queryOptions: Prisma.MatchFindManyArgs = {
      where,
      include: {
        home_team: { select: { team_id: true, team_name: true, logo: true } },
        away_team: { select: { team_id: true, team_name: true, logo: true } },
        season: { select: { season_id: true, season_name: true } },
      },
      orderBy: {
        match_date: 'desc',
      },
    };

    // 제한 설정
    if (limit && !isNaN(parseInt(limit))) {
      queryOptions.take = parseInt(limit);
    }

    const matches = await prisma.match.findMany(queryOptions);

    return NextResponse.json(matches);
  } catch (error) {
    const authError = adminAuthErrorResponse(error);
    if (authError) return authError;

    console.error('Failed to fetch matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

// POST /api/admin/matches - 새 경기 등록
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await requireAdminAuth();

    const data = await request.json();

    // 필수 필드 검증
    const requiredFields = [
      'season_id',
      'home_team_id',
      'away_team_id',
      'match_date',
    ];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // 홈팀과 원정팀이 같은지 검증
    if (data.home_team_id === data.away_team_id) {
      return NextResponse.json(
        { error: 'Home team and away team cannot be the same' },
        { status: 400 }
      );
    }

    // 경기 생성
    const match = await prisma.match.create({
      data: {
        season_id: data.season_id,
        home_team_id: data.home_team_id,
        away_team_id: data.away_team_id,
        match_date: new Date(data.match_date),
        location: data.location || null,
        status: data.status || 'scheduled',
        description: data.description || null,
        tournament_stage: data.tournament_stage || null,
        group_stage: data.group_stage || null,
      },
      include: {
        home_team: true,
        away_team: true,
        season: true,
      },
    });

    return NextResponse.json(match, { status: 201 });
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

    console.error('Failed to create match:', error);
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    );
  }
}
