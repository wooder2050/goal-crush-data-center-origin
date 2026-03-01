import { NextRequest } from 'next/server';
import { z } from 'zod';

import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 닉네임 검증 스키마
const nicknameSchema = z.object({
  korean_nickname: z
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다')
    .max(10, '닉네임은 최대 10자까지 가능합니다')
    .regex(
      /^[가-힣a-zA-Z0-9\s]+$/,
      '닉네임은 한글, 영문, 숫자만 사용 가능합니다'
    ),
});

/**
 * 현재 사용자의 프로필 조회
 */
export async function GET() {
  try {
    const {
      data: { user },
      error,
    } = await getAuthUser();

    if (error || !user) {
      return Response.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const userId = user.id;

    const dbUser = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        korean_nickname: true,
        display_name: true,
        profile_image_url: true,
        bio: true,
        is_active: true,
        is_admin: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!dbUser) {
      return Response.json({ user: null, hasNickname: false });
    }

    return Response.json({
      user: dbUser,
      hasNickname:
        !!dbUser?.korean_nickname &&
        !dbUser.korean_nickname.startsWith('임시사용자'),
    });
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    return Response.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * 사용자 프로필 생성/업데이트
 */
export async function PUT(request: NextRequest) {
  try {
    const {
      data: { user },
      error,
    } = await getAuthUser();

    if (error || !user) {
      return Response.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const userId = user.id;

    const body = await request.json();
    const validatedData = nicknameSchema.parse(body);

    // 닉네임 중복 체크
    const existingUser = await prisma.user.findFirst({
      where: {
        korean_nickname: validatedData.korean_nickname,
        user_id: { not: userId },
      },
    });

    if (existingUser) {
      return Response.json(
        { error: '이미 사용중인 닉네임입니다' },
        { status: 400 }
      );
    }

    // 사용자 프로필 생성/업데이트
    const updatedUser = await prisma.user.upsert({
      where: { user_id: userId },
      update: {
        korean_nickname: validatedData.korean_nickname,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        korean_nickname: validatedData.korean_nickname,
      },
      select: {
        user_id: true,
        korean_nickname: true,
        display_name: true,
        profile_image_url: true,
        bio: true,
        is_active: true,
        is_admin: true,
        created_at: true,
        updated_at: true,
      },
    });

    return Response.json({
      user: updatedUser,
      message: '프로필이 성공적으로 저장되었습니다',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error('프로필 저장 오류:', error);
    return Response.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * 닉네임 중복 체크
 */
export async function POST(request: NextRequest) {
  try {
    const {
      data: { user },
      error,
    } = await getAuthUser();

    if (error || !user) {
      return Response.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const userId = user.id;

    const { korean_nickname } = await request.json();

    if (!korean_nickname || typeof korean_nickname !== 'string') {
      return Response.json({ error: '닉네임을 입력해주세요' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        korean_nickname,
        user_id: { not: userId },
      },
    });

    return Response.json({
      isAvailable: !existingUser,
      message: existingUser
        ? '이미 사용중인 닉네임입니다'
        : '사용 가능한 닉네임입니다',
    });
  } catch (error) {
    console.error('닉네임 중복 체크 오류:', error);
    return Response.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
