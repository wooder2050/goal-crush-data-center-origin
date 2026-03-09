import { createBrowserClient } from '@supabase/ssr';

import { apiUrl } from './api-url';

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseClient;
}

/**
 * 인증이 필요한 API 호출용 fetch 래퍼.
 * Supabase 세션에서 access_token을 가져와 Authorization 헤더에 자동 주입합니다.
 * apiUrl() 래핑도 자동으로 적용됩니다.
 *
 * @example
 * // 기존: fetch(apiUrl('/api/users/profile'))
 * // 변경: authFetch('/api/users/profile')
 */
export async function authFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const supabase = getSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init?.headers);

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  return fetch(apiUrl(path), {
    ...init,
    headers,
  });
}
