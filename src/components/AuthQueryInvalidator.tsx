'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/components/AuthProvider';

/**
 * 로그인/로그아웃 시 React Query 캐시를 무효화한다.
 *
 * 확장 경기 기록 API(상세 통계·패스 네트워크·평점·xT)는 인증 상태에 따라
 * 응답이 달라지는데, 쿼리 키에는 인증 상태가 없어 로그인 직후에도
 * 익명 시절의 빈 응답이 캐시로 남는 문제를 막는다.
 *
 * 대상 쿼리를 선별하지 않고 전체 무효화하는 이유: 인증 의존 쿼리 목록을
 * 여기서 중복 관리하면 누락이 생기기 쉽고, 로그인/로그아웃은 드문 이벤트라
 * 전체 리페치 비용이 문제되지 않는다.
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
      queryClient.invalidateQueries();
    }
  }, [user?.id, loading, queryClient]);

  return null;
}
