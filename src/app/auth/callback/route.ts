import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { Database } from '@/lib/types/database';

// Supabase 서버 클라이언트 생성 (Vercel 배포 안정성을 위한 직접 구현)
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
            // Server Component에서 호출된 경우 무시
          }
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 착지 페이지 클라이언트에서 GA login/sign_up을 발화하도록 쿼리 부착.
      // 신규 여부: 가입 시각과 마지막 로그인 시각 차이가 작으면 첫 로그인(신규)
      const u = data.user;
      let authParam = 'auth=login-google';
      if (u?.created_at) {
        const created = new Date(u.created_at).getTime();
        const lastSignIn = u.last_sign_in_at
          ? new Date(u.last_sign_in_at).getTime()
          : created;
        if (Math.abs(lastSignIn - created) < 10_000) {
          authParam = 'auth=signup-google';
        }
      }
      const sep = next.includes('?') ? '&' : '?';
      const nextWithAuth = `${next}${sep}${authParam}`;

      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${nextWithAuth}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${nextWithAuth}`);
      } else {
        return NextResponse.redirect(`${origin}${nextWithAuth}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
