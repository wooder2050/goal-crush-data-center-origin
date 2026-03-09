import { useCallback, useEffect, useRef } from 'react';

import { useAuth } from '@/components/AuthProvider';
import { apiUrl } from '@/lib/api-url';

interface UsePostViewTrackingOptions {
  postId: string | number;
  enabled?: boolean;
  onViewTracked?: (isNewView: boolean) => void;
}

/**
 * 게시글 조회 추적을 위한 커스텀 훅
 * - 중복 조회 방지 (24시간 내)
 * - 독립 방문자만 카운트
 * - 로컬 스토리지 기반 중복 방지
 */
export const usePostViewTracking = ({
  postId,
  enabled = true,
  onViewTracked,
}: UsePostViewTrackingOptions) => {
  const { user } = useAuth();
  const hasTracked = useRef(false);
  const trackingPromise = useRef<Promise<void> | null>(null);

  // 로컬 스토리지 키 생성
  const getStorageKey = useCallback(() => {
    const userId = user?.id || 'anonymous';
    return `post_view_${postId}_${userId}`;
  }, [postId, user?.id]);

  // 조회 추적 API 호출
  const trackView = useCallback(async () => {
    if (hasTracked.current || trackingPromise.current) {
      return;
    }

    try {
      hasTracked.current = true;

      const response = await fetch(apiUrl(`/api/community/posts/${postId}/view`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const isNewView = result.isNewView;

        // 로컬 스토리지에 조회 기록 저장 (24시간 유효)
        const storageKey = getStorageKey();
        const viewData = {
          timestamp: Date.now(),
          isNewView,
        };
        localStorage.setItem(storageKey, JSON.stringify(viewData));

        onViewTracked?.(isNewView);
      }
    } catch (error) {
      console.error('조회 추적 실패:', error);
      // 에러 발생 시 추적 상태 리셋
      hasTracked.current = false;
    } finally {
      trackingPromise.current = null;
    }
  }, [postId, getStorageKey, onViewTracked]);

  // 컴포넌트 마운트 시 조회 추적
  useEffect(() => {
    if (!enabled || hasTracked.current) {
      return;
    }

    // 로컬 스토리지에서 이전 조회 기록 확인
    const storageKey = getStorageKey();
    const storedView = localStorage.getItem(storageKey);

    if (storedView) {
      try {
        const viewData = JSON.parse(storedView);
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        // 24시간 내 조회 기록이 있으면 추적하지 않음
        if (viewData.timestamp > oneDayAgo) {
          hasTracked.current = true;
          onViewTracked?.(viewData.isNewView);
          return;
        } else {
          // 24시간이 지난 기록은 삭제
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error('저장된 조회 기록 파싱 실패:', error);
        localStorage.removeItem(storageKey);
      }
    }

    // 새로운 조회 추적
    trackingPromise.current = trackView();
  }, [enabled, getStorageKey, trackView, onViewTracked]);

  // 수동으로 조회 추적 실행 (필요한 경우)
  const manualTrackView = useCallback(() => {
    if (!hasTracked.current) {
      return trackView();
    }
  }, [trackView]);

  return {
    trackView: manualTrackView,
    hasTracked: hasTracked.current,
  };
};
