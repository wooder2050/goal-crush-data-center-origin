import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 팀 생성 스키마
const createTeamSchema = z.object({
  team_name: z.string().min(1, '팀명을 입력해주세요').max(100),
  founded_year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
  description: z.string().max(500).optional(),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  logo: z.string().url().optional(),
});

// POST - 팀 생성
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await requireAdminAuth();

    const body = await request.json();

    // 입력값 유효성 검사
    const validatedData = createTeamSchema.parse(body);

    // 팀명 중복 확인
    const existingTeam = await prisma.team.findUnique({
      where: { team_name: validatedData.team_name },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: '이미 존재하는 팀명입니다.' },
        { status: 400 }
      );
    }

    // 팀 생성
    const team = await prisma.team.create({
      data: {
        team_name: validatedData.team_name,
        founded_year: validatedData.founded_year,
        description: validatedData.description,
        primary_color: validatedData.primary_color || '#000000',
        secondary_color: validatedData.secondary_color || '#FFFFFF',
        logo: validatedData.logo,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(team, { status: 201 });
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

    console.error('팀 생성 중 오류:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '팀 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
