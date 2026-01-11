import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 판타지 시즌 생성 스키마
const createFantasySeasonSchema = z.object({
  season_id: z.number(),
  year: z.number(),
  month: z.number().min(1).max(12),
});

// GET - 활성 판타지 시즌 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const activeOnly = searchParams.get('active') === 'true';

    const where: Record<string, unknown> = {};

    if (year) where.year = parseInt(year);
    if (month) where.month = parseInt(month);
    if (activeOnly) where.is_active = true;

    const fantasySeasons = await prisma.fantasySeason.findMany({
      where,
      include: {
        season: {
          select: {
            season_name: true,
            category: true,
          },
        },
        _count: {
          select: {
            fantasy_teams: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return NextResponse.json(fantasySeasons);
  } catch (error) {
    console.error('판타지 시즌 조회 중 오류:', error);
    return NextResponse.json(
      { error: '판타지 시즌을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST - 판타지 시즌 생성 (관리자용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createFantasySeasonSchema.parse(body);

    const { season_id, year, month } = validatedData;

    // 중복 시즌 확인
    const existingSeason = await prisma.fantasySeason.findUnique({
      where: {
        season_id_year_month: {
          season_id,
          year,
          month,
        },
      },
    });

    if (existingSeason) {
      return NextResponse.json(
        { error: '이미 해당 월의 판타지 시즌이 존재합니다.' },
        { status: 400 }
      );
    }

    // 월간 시즌 날짜 계산 (한국 시간 기준)
    const startDate = getMonthlySeasonDates(year, month).start;
    const endDate = getMonthlySeasonDates(year, month).end;
    const lockDate = getMonthlySeasonDates(year, month).lock;

    const fantasySeason = await prisma.fantasySeason.create({
      data: {
        season_id,
        year,
        month,
        start_date: startDate,
        end_date: endDate,
        lock_date: lockDate,
        is_active: true,
      },
      include: {
        season: {
          select: {
            season_name: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(fantasySeason, { status: 201 });
  } catch (error) {
    console.error('판타지 시즌 생성 중 오류:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '판타지 시즌 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 월간 시즌 날짜 계산 함수 (Asia/Seoul 기준)
function getMonthlySeasonDates(year: number, month: number) {
  // 해당 월 첫 번째 월요일 찾기 (편성 시작일)
  const firstDay = new Date(year, month - 1, 1);
  const firstMonday = new Date(firstDay);
  const dayOfWeek = firstDay.getDay();

  let daysToAdd;
  if (dayOfWeek === 1) {
    // 이미 월요일
    daysToAdd = 0;
  } else if (dayOfWeek === 0) {
    // 일요일이면 1일 더하기
    daysToAdd = 1;
  } else {
    // 월요일까지 남은 일수
    daysToAdd = 8 - dayOfWeek;
  }

  firstMonday.setDate(firstDay.getDate() + daysToAdd);

  // 편성 시작일 (첫 번째 월요일 00:00 KST)
  const start = new Date(firstMonday);
  start.setUTCHours(15, 0, 0, 0); // UTC+9에서 00:00 = UTC에서 15:00 (전날)

  // 편성 마감일 (세 번째 화요일 23:59 KST)
  const end = new Date(firstMonday);
  end.setDate(firstMonday.getDate() + 15); // 세 번째 화요일
  end.setUTCHours(14, 59, 59, 999); // UTC+9에서 23:59 = UTC에서 14:59

  // 잠금 시작일 (세 번째 수요일 00:00 KST)
  const lock = new Date(firstMonday);
  lock.setDate(firstMonday.getDate() + 16); // 세 번째 수요일
  lock.setUTCHours(15, 0, 0, 0); // UTC+9에서 00:00 = UTC에서 15:00 (전날)

  return { start, end, lock };
}
