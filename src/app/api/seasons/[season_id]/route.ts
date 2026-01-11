import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// PUT /api/seasons/[season_id] - 시즌 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { season_id: string } }
) {
  try {
    const seasonId = parseInt(params.season_id);

    if (isNaN(seasonId)) {
      return NextResponse.json(
        { error: '유효하지 않은 시즌 ID입니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { season_name, year, category, start_date, end_date } = body;

    // 필수 필드 검증
    if (!season_name || !year) {
      return NextResponse.json(
        { error: '시즌명과 연도는 필수입니다.' },
        { status: 400 }
      );
    }

    // 연도 유효성 검증
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      return NextResponse.json(
        { error: '연도는 2020년에서 2030년 사이여야 합니다.' },
        { status: 400 }
      );
    }

    // 시즌 존재 여부 확인
    const existingSeason = await prisma.season.findUnique({
      where: { season_id: seasonId },
    });

    if (!existingSeason) {
      return NextResponse.json(
        { error: '시즌을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 시즌명 중복 검증 (자기 자신 제외)
    const duplicateSeason = await prisma.season.findFirst({
      where: {
        season_name,
        season_id: { not: seasonId },
      },
    });

    if (duplicateSeason) {
      return NextResponse.json(
        { error: '동일한 시즌명이 이미 존재합니다.' },
        { status: 400 }
      );
    }

    // 날짜 유효성 검증
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);

      if (start >= end) {
        return NextResponse.json(
          { error: '시작일은 종료일보다 이전이어야 합니다.' },
          { status: 400 }
        );
      }
    }

    // 카테고리 유효성 검증
    const validCategories = [
      'SUPER_LEAGUE',
      'CHALLENGE_LEAGUE',
      'G_LEAGUE',
      'PLAYOFF',
      'SBS_CUP',
      'CHAMPION_MATCH',
      'GIFA_CUP',
      'OTHER',
    ];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리입니다.' },
        { status: 400 }
      );
    }

    // 시즌 수정
    const updatedSeason = await prisma.season.update({
      where: { season_id: seasonId },
      data: {
        season_name,
        year: yearNum,
        category: category || null,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      },
    });

    return NextResponse.json({
      message: '시즌이 성공적으로 수정되었습니다.',
      season: updatedSeason,
    });
  } catch (error) {
    console.error('Error updating season:', error);
    return NextResponse.json(
      {
        error: 'Failed to update season',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/seasons/[season_id] - 시즌 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { season_id: string } }
) {
  try {
    const seasonId = parseInt(params.season_id);

    const season = await prisma.season.findUnique({
      where: { season_id: seasonId },
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
      },
    });

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 });
    }

    return NextResponse.json(season);
  } catch (error) {
    console.error('Error fetching season:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch season',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
