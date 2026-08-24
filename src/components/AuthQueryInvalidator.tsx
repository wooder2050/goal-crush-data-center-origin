'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/components/AuthProvider';
import { LOGIN_SOURCE_STORAGE_KEY } from '@/features/matches/components/MatchCard/ExtendedDataLock';
import { trackLoginSuccess } from '@/lib/analytics';

/**
 * 로그인/로그아웃 시 React Query 캐시를 무효화한다.
 *
 * 확장 경기 기록 API(상세 통계·패스 네트워크·평점·xT)는 인증 상태에 따라
 * 응답이 달라지는데, 쿼리 키에는 인증 상태가 없어 로그인 직후에도
 * 익명 시절의 빈 응답이 캐시로 남는 문제를 막는다.
 *
 * invalidateQueries가 아닌 resetQueries를 쓰는 이유: invalidate는 활성 쿼리만
 * 리페치하고, 전역 refetchOnMount:false 때문에 비활성 캐시는 재마운트 후에도
 * 이전 인증 상태의 데이터를 계속 보여준다. reset은 비활성 캐시 데이터까지
 * 초기화한다. 대상을 선별하지 않는 이유: 인증 의존 쿼리 목록을 중복 관리하면
 * 누락이 생기기 쉽고, 로그인/로그아웃은 드문 이벤트라 비용이 문제되지 않는다.
 */
export function AuthQueryInvalidator() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  // undefined = 초기 로딩 전 (최초 확정값은 무효화하지 않음)
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (loading) return;
    const currentUserId = user?.id ?? null;
    const prev = prevUserIdRef.current;
    prevUserIdRef.current = currentUserId;

    // 첫 확정(페이지 로드 시점)은 스킵, 이후 로그인<->로그아웃 전환 시 무효화
    if (prev !== undefined && prev !== currentUserId) {
      queryClient.resetQueries();
    }

    // 로그인 완료 감지: 잠금 UI에서 유도된 로그인이면 source를 붙여 계측
    // (OAuth 리다이렉트로 페이지가 새로 뜨는 경우 prev===undefined라 위 분기와
    // 무관하게, 세션 플래그 존재 + 로그인 상태로 판정)
    if (currentUserId) {
      try {
        const raw = sessionStorage.getItem(LOGIN_SOURCE_STORAGE_KEY);
        if (raw) {
          sessionStorage.removeItem(LOGIN_SOURCE_STORAGE_KEY);
          // 값 형식: '<source>:<기록 시각 ms>' — 모달을 닫고 한참 뒤 다른
          // 경로로 로그인한 경우의 오집계를 막기 위해 10분 TTL만 인정
          const sep = raw.lastIndexOf(':');
          const source = sep > 0 ? raw.slice(0, sep) : raw;
          const at = sep > 0 ? Number(raw.slice(sep + 1)) : NaN;
          if (Number.isFinite(at) && Date.now() - at < 10 * 60 * 1000) {
            trackLoginSuccess({ source });
          }
        }
      } catch {
        // sessionStorage 접근 불가 환경 무시
      }
    }
  }, [user?.id, loading, queryClient]);

  return null;
}
