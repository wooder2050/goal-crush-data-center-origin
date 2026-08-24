import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

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
 * Authorization 헤더에서 Bearer 토큰 추출
 */
function getBearerToken(): string | null {
  try {
    const headerStore = headers();
    const auth = headerStore.get('authorization');
    if (!auth) return null;
    // RFC 7235: auth-scheme은 대소문자 비민감
    const match = auth.match(/^bearer\s+(.+)$/i);
    if (match) {
      return match[1];
    }
  } catch {
    // 정적 빌드 시 headers() 호출 불가 - 무시
  }
  return null;
}

/**
 * Bearer 토큰 또는 쿠키 기반으로 Supabase 사용자 가져오기
 * 모바일 앱은 Bearer 토큰, 웹은 쿠키를 사용
 */
export async function getAuthUser() {
  const bearerToken = getBearerToken();

  if (bearerToken) {
    // Bearer 토큰이 있으면 직접 검증
    const supabase = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    return supabase.auth.getUser(bearerToken);
  }

  // 쿠키 기반 인증 (기존 웹 방식)
  const supabase = createClient();
  return supabase.auth.getUser();
}

/**
 * 현재 사용자가 관리자인지 확인 (서버 컴포넌트용)
 */
export async function checkAdminAuth(): Promise<boolean> {
  try {
    const {
      data: { user },
      error,
    } = await getAuthUser();

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
  const {
    data: { user },
    error,
  } = await getAuthUser();

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
 * 확장 경기 기록(로그인 게이트) 응답용 캐시 차단 헤더.
 * 인증 상태에 따라 응답이 달라지므로 어떤 캐시에도 저장되면 안 된다.
 */
export const GATED_NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Cookie, Authorization',
} as const;

export type MemberAuthStatus = 'member' | 'anonymous' | 'invalid';

/**
 * 확장 기록 게이트용 회원 인증 판별.
 * - Bearer 토큰이 있으면 직접 검증: 유효하면 member, 만료·위조면 invalid(401 대상)
 *   → 모바일 앱이 토큰 갱신 필요성을 감지할 수 있어야 하므로 빈 응답으로 삼키지 않는다
 * - Bearer가 없으면 쿠키 세션 확인: 유효하면 member, 없거나 만료면 anonymous
 *   → 브라우저의 오래된 쿠키는 익명으로 강등 (미들웨어가 갱신을 처리)
 */
export async function getMemberAuthStatus(): Promise<MemberAuthStatus> {
  let authHeader: string | null = null;
  try {
    authHeader = headers().get('authorization');
  } catch {
    // 정적 빌드 시 headers() 호출 불가 - 무시
    authHeader = null;
  }

  if (authHeader && /^bearer(\s|$)/i.test(authHeader.trim())) {
    // Bearer 스킴이 제시된 경우: 형식이 잘못됐거나(빈 토큰) 검증 실패면 invalid.
    // "헤더 없음"과 구분해야 빈 Bearer가 익명 200으로 새지 않는다.
    const token = authHeader.trim().replace(/^bearer\s*/i, '');
    if (!token) return 'invalid';

    const supabase = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error) {
      // 인증 서버 장애(네트워크/5xx)는 사용자 인증 실패가 아니다 —
      // 라우트 catch에서 500으로 전파해 앱의 토큰 갱신/로그아웃 오동작을 막는다
      if (isAuthInfraError(error)) throw error;
      return 'invalid';
    }
    return user ? 'member' : 'invalid';
  }

  let supabase: ReturnType<typeof createClient>;
  try {
    supabase = createClient();
  } catch {
    return 'anonymous';
  }
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    if (isAuthInfraError(error)) throw error;
    // 세션 없음/만료 등은 익명으로 강등 (미들웨어가 쿠키 갱신을 처리)
    return 'anonymous';
  }
  return user ? 'member' : 'anonymous';
}

/** Supabase 인증 에러 중 서버 장애(네트워크/5xx) 여부 */
function isAuthInfraError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { name?: string; status?: number };
  if (e.name === 'AuthRetryableFetchError') return true;
  return typeof e.status === 'number' && e.status >= 500;
}

/**
 * requireAdminAuth()가 던진 인증/권한 에러를 HTTP 응답으로 변환
 * 인증 에러가 아니면 null을 반환 (호출부에서 기존 에러 처리 계속)
 */
export function adminAuthErrorResponse(error: unknown): NextResponse | null {
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
  return null;
}

/**
 * 현재 로그인한 사용자 정보 가져오기
 */
export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await getAuthUser();

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
