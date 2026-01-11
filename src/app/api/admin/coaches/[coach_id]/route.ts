import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

// 감독 수정 스키마
const updateCoachSchema = z.object({
  name: z.string().min(1, '감독명을 입력해주세요').max(255).optional(),
  birth_date: z.string().optional(),
  nationality: z.string().max(50).optional(),
  profile_image_url: z.string().url().optional(),
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

interface RouteParams {
  params: {
    coach_id: string;
  };
}

// PUT - 감독 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // 관리자 권한 확인
    const authError = await checkAdminAccess();
    if (authError) return authError;

    const coachId = parseInt(params.coach_id);
    if (isNaN(coachId)) {
      return NextResponse.json(
        { error: '올바르지 않은 감독 ID입니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // 입력값 유효성 검사
    const validatedData = updateCoachSchema.parse(body);

    // 감독 존재 확인
    const existingCoach = await prisma.coach.findUnique({
      where: { coach_id: coachId },
    });

    if (!existingCoach) {
      return NextResponse.json(
        { error: '해당 감독을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 감독명이 변경되는 경우 중복 확인
    if (validatedData.name && validatedData.name !== existingCoach.name) {
      const duplicateCoach = await prisma.coach.findFirst({
        where: { name: validatedData.name },
      });

      if (duplicateCoach) {
        return NextResponse.json(
          { error: '이미 존재하는 감독명입니다.' },
          { status: 400 }
        );
      }
    }

    // 감독 정보 수정
    const updateData: {
      name?: string;
      birth_date?: Date | null;
      nationality?: string;
      profile_image_url?: string;
    } = {
      name: validatedData.name,
      nationality: validatedData.nationality,
      profile_image_url: validatedData.profile_image_url,
      birth_date: validatedData.birth_date
        ? new Date(validatedData.birth_date)
        : null,
    };

    const updatedCoach = await prisma.coach.update({
      where: { coach_id: coachId },
      data: updateData,
    });

    return NextResponse.json(updatedCoach);
  } catch (error) {
    console.error('감독 수정 중 오류:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '감독 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE - 감독 삭제
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    // 관리자 권한 확인
    const authError = await checkAdminAccess();
    if (authError) return authError;

    const coachId = parseInt(params.coach_id);
    if (isNaN(coachId)) {
      return NextResponse.json(
        { error: '올바르지 않은 감독 ID입니다.' },
        { status: 400 }
      );
    }

    // 감독 존재 확인
    const existingCoach = await prisma.coach.findUnique({
      where: { coach_id: coachId },
    });

    if (!existingCoach) {
      return NextResponse.json(
        { error: '해당 감독을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 연관된 데이터 확인 (경기, 팀 이력 등)
    const relatedData = await prisma.$transaction([
      prisma.match.count({
        where: {
          OR: [{ home_coach_id: coachId }, { away_coach_id: coachId }],
        },
      }),
      prisma.matchCoach.count({
        where: { coach_id: coachId },
      }),
      prisma.teamCoachHistory.count({
        where: { coach_id: coachId },
      }),
    ]);

    const [matchCount, matchCoachCount, teamHistoryCount] = relatedData;

    if (matchCount > 0 || matchCoachCount > 0 || teamHistoryCount > 0) {
      return NextResponse.json(
        {
          error: '연관된 경기나 팀 기록이 있어 삭제할 수 없습니다.',
          details: {
            matches: matchCount,
            matchCoaches: matchCoachCount,
            teamHistory: teamHistoryCount,
          },
        },
        { status: 400 }
      );
    }

    // 감독 삭제
    await prisma.coach.delete({
      where: { coach_id: coachId },
    });

    return NextResponse.json({ message: '감독이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('감독 삭제 중 오류:', error);

    return NextResponse.json(
      { error: '감독 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
