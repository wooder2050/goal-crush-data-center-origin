import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

// 허용된 CORS Origin 목록 (환경변수로 관리)
const ALLOWED_ORIGINS = (
  process.env.CORS_ALLOWED_ORIGINS || 'https://www.gtndatacenter.com'
)
  .split(',')
  .map((o) => o.trim());

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

function setCorsHeaders(response: NextResponse, origin: string): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  response.headers.set('Access-Control-Max-Age', '86400');
  response.headers.set('Vary', 'Origin');
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');

  // API 경로의 CORS preflight 요청 처리
  if (pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    if (origin && isAllowedOrigin(origin)) {
      const response = new NextResponse(null, { status: 204 });
      return setCorsHeaders(response, origin);
    }
    return new NextResponse(null, { status: 204 });
  }

  // API 경로에 Bearer 토큰이 있으면 쿠키 기반 세션 갱신을 건너뜀
  if (
    pathname.startsWith('/api/') &&
    request.headers.get('authorization')?.match(/^bearer\s+/i)
  ) {
    const response = NextResponse.next({ request });
    if (origin && isAllowedOrigin(origin)) {
      setCorsHeaders(response, origin);
    }
    return response;
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value }) =>
            supabaseResponse.cookies.set(name, value)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 보호된 라우트들
  const protectedPaths = ['/supports', '/admin', '/profile'];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('redirect_url', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so: NextResponse.next({ request })
  // 2. Copy over the cookies, like so: response.cookies.getAll().forEach(...)
  // 3. Change the response's status code if needed, like so: response.status = 200
  // 4. Set headers, if needed, like so: response.headers.set(...)

  // API 경로에 CORS 헤더 추가
  if (pathname.startsWith('/api/') && origin && isAllowedOrigin(origin)) {
    setCorsHeaders(supabaseResponse, origin);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
