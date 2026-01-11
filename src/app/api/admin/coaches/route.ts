import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 감독 생성 스키마
const createCoachSchema = z.object({
  name: z.string().min(1, '감독명을 입력해주세요').max(255),
  birth_date: z.string().optional(),
  nationality: z.string().max(50).optional(),
  profile_image_url: z.string().url().optional(),
});

// POST - 감독 생성
export async function POST(request: NextRequest) {
  try {
    // 권한 확인 생략 (다른 admin/stats 엔드포인트와 동일)

    const body = await request.json();

    // 입력값 유효성 검사
    const validatedData = createCoachSchema.parse(body);

    // 감독명 중복 확인
    const existingCoach = await prisma.coach.findFirst({
      where: { name: validatedData.name },
    });

    if (existingCoach) {
      return NextResponse.json(
        { error: '이미 존재하는 감독명입니다.' },
        { status: 400 }
      );
    }

    // 감독 생성
    const coach = await prisma.coach.create({
      data: {
        name: validatedData.name,
        birth_date: validatedData.birth_date
          ? new Date(validatedData.birth_date)
          : null,
        nationality: validatedData.nationality,
        profile_image_url: validatedData.profile_image_url,
      },
    });

    return NextResponse.json(coach, { status: 201 });
  } catch (error) {
    console.error('감독 생성 중 오류:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '감독 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
