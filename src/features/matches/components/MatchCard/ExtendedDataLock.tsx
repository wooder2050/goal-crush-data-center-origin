'use client';

import { Lock } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  trackExtendedGateLoginClick,
  trackExtendedGateView,
} from '@/lib/analytics';

/** AuthQueryInvalidator가 로그인 성공 시 login_success 이벤트 source로 사용 */
export const LOGIN_SOURCE_STORAGE_KEY = 'gc_login_source';

// 탭 전환으로 컴포넌트가 재마운트돼도 노출 이벤트는 (경기, 위치)당 1회만 전송
const viewedKeys = new Set<string>();

interface ExtendedDataLockProps {
  matchId: number;
  placement: 'ratings_tab' | 'stats_banner';
  /** 로그인 후 복귀할 해시 (예: '#ratings') */
  returnHash?: string;
}

/**
 * 확장 경기 기록(팀 상세 통계·패스 네트워크·선수 평점) 잠금 안내.
 * - ratings_tab: 평점 탭 전체를 대체하는 카드
 * - stats_banner: 통계 탭 상단 한 줄 배너 (맞대결 등 공개 콘텐츠는 그대로 노출)
 */
export default function ExtendedDataLock({
  matchId,
  placement,
  returnHash,
}: ExtendedDataLockProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const key = `${matchId}:${placement}`;
    if (viewedKeys.has(key)) return;
    viewedKeys.add(key);
    trackExtendedGateView({ itemId: String(matchId), placement });
  }, [matchId, placement]);

  const handleLoginClick = () => {
    trackExtendedGateLoginClick({ itemId: String(matchId), placement });
    try {
      sessionStorage.setItem(LOGIN_SOURCE_STORAGE_KEY, 'extended_data');
    } catch {
      // sessionStorage 접근 불가 환경 무시
    }
    setIsAuthModalOpen(true);
  };

  const redirectUrl = `${pathname}${returnHash ?? ''}`;

  const authModal = (
    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={() => setIsAuthModalOpen(false)}
      redirectUrl={redirectUrl}
    />
  );

  if (placement === 'stats_banner') {
    return (
      <>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lock className="h-4 w-4 shrink-0 text-gray-400" />
            <span>
              이 경기는 직접 기록한 팀 상세 통계·패스 네트워크가 있어요.
              로그인하면 볼 수 있습니다.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={handleLoginClick}
          >
            로그인
          </Button>
        </div>
        {authModal}
      </>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Lock className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-base font-semibold text-gray-900">
            선수 평점은 로그인 후 볼 수 있어요
          </p>
          <p className="text-sm text-gray-500">
            직접 기록한 경기 데이터로 계산한 선수별 평점·xT 지표입니다.
            <br />
            로그인하면 바로 이 화면에서 확인할 수 있습니다.
          </p>
          <Button className="mt-1" onClick={handleLoginClick}>
            로그인하고 보기
          </Button>
        </CardContent>
      </Card>
      {authModal}
    </>
  );
}
