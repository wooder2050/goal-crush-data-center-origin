'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { trackLogin, trackSignUp } from '@/lib/analytics';

/**
 * OAuth(구글) 로그인 콜백이 리다이렉트하며 붙인 `?auth=login-google` /
 * `?auth=signup-google` 쿼리를 소비해 GA login/sign_up 이벤트를 발화한다.
 * (서버 콜백 라우트에서는 gtag를 쏠 수 없어 착지 페이지에서 처리)
 * 발화 후 쿼리는 history.replaceState로 제거해 새로고침·공유 시 중복을 막는다.
 */
export function OAuthAuthTracker() {
  const searchParams = useSearchParams();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    const auth = searchParams.get('auth');
    if (auth !== 'login-google' && auth !== 'signup-google') return;
    firedRef.current = true;

    if (auth === 'signup-google') {
      trackSignUp('google');
      trackLogin('google'); // 가입은 로그인도 겸함
    } else {
      trackLogin('google');
    }

    // URL에서 auth 파라미터 제거 (중복 발화·공유 방지)
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      window.history.replaceState(
        window.history.state,
        '',
        url.pathname + url.search + url.hash
      );
    } catch {
      // URL 조작 불가 환경 무시
    }
  }, [searchParams]);

  return null;
}
