import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

// 관리자 권한 확인 함수
async function checkAdminAccess() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 사용자 프로필에서 관리자 권한 확인
  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null; // 권한 확인 통과
}

// POST - 팀 생성
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authError = await checkAdminAccess();
    if (authError) return authError;

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
