import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { prisma } from './prisma';
import { Database } from './types/database';

function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
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
}

/**
 * 현재 사용자가 관리자인지 확인 (서버 컴포넌트용)
 */
export async function checkAdminAuth(): Promise<boolean> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return false;
    }

    // 개발 환경에서는 모든 로그인 사용자를 관리자로 처리
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // 데이터베이스에서 사용자의 is_admin 필드 확인
    const dbUser = await prisma.user.findUnique({
      where: { user_id: user.id },
      select: { is_admin: true },
    });

    return dbUser?.is_admin ?? false;
  } catch (error) {
    console.error('관리자 권한 확인 오류:', error);
    return false;
  }
}

/**
 * API 라우트에서 관리자 권한 확인
 */
export async function requireAdminAuth() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('인증이 필요합니다');
  }

  // 개발 환경에서는 모든 로그인 사용자를 관리자로 처리
  if (process.env.NODE_ENV === 'development') {
    return user;
  }

  // 데이터베이스에서 사용자의 is_admin 필드 확인
  const dbUser = await prisma.user.findUnique({
    where: { user_id: user.id },
    select: {
      user_id: true,
      korean_nickname: true,
      is_admin: true,
    },
  });

  if (!dbUser?.is_admin) {
    throw new Error('관리자 권한이 필요합니다');
  }

  // Supabase User 객체를 반환
  return user;
}

/**
 * 현재 로그인한 사용자 정보 가져오기
 */
export async function getCurrentUser() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // 데이터베이스에서 사용자 정보 확인/생성
    let dbUser = await prisma.user.findUnique({
      where: { user_id: user.id },
      select: {
        user_id: true,
        korean_nickname: true,
        display_name: true,
        profile_image_url: true,
        is_admin: true,
      },
    });

    // 사용자가 DB에 없으면 생성
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          user_id: user.id,
          korean_nickname:
            user.user_metadata?.korean_nickname ||
            user.email?.split('@')[0] ||
            'User',
          display_name: user.user_metadata?.display_name,
          profile_image_url: user.user_metadata?.avatar_url,
        },
        select: {
          user_id: true,
          korean_nickname: true,
          display_name: true,
          profile_image_url: true,
          is_admin: true,
        },
      });
    }

    return {
      userId: dbUser.user_id,
      koreanNickname: dbUser.korean_nickname,
      displayName: dbUser.display_name,
      profileImageUrl: dbUser.profile_image_url,
      isAdmin: dbUser.is_admin || false,
    };
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error);
    return null;
  }
}

/**
 * API 라우트에서 사용할 관리자 권한 확인 미들웨어
 */
export function withAdminAuth<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      await requireAdminAuth();
      return handler(...args);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '권한이 없습니다';
      return new Response(JSON.stringify({ error: message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
