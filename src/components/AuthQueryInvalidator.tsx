'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/components/AuthProvider';

/**
 * 로그인/로그아웃 시 React Query 캐시를 초기화한다.
 *
 * 프로필·판타지 팀 등 인증 의존 쿼리는 키에 사용자 ID가 없어, 같은 브라우저에서
 * 계정이 바뀌면 이전 계정의 캐시가 그대로 보일 수 있다.
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

    // 첫 확정(페이지 로드 시점)은 스킵, 이후 로그인<->로그아웃 전환 시 초기화
    if (prev !== undefined && prev !== currentUserId) {
      queryClient.resetQueries();
    }
  }, [user?.id, loading, queryClient]);

  return null;
}
