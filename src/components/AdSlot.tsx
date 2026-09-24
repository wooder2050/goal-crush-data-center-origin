'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { AD_SLOTS, type AdPlacement } from '@/constants/ads';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const AD_SCRIPT_TIMEOUT_MS = 8000;

interface AdSlotProps {
  placement: AdPlacement;
  className?: string;
}

/**
 * 수동 디스플레이 광고 칸.
 *
 * 자동광고는 첫 로드 페이지에만 광고를 채우고 클라이언트 이동 후 페이지엔
 * 거의 뜨지 않는다(GA 4~7월: 랜딩 노출/PV 0.47 vs 사이트 안 이동 0.03).
 * 그래서 경로마다 새 <ins>를 마운트하고 광고를 한 번만 요청한다.
 * - pathname을 key로 써서 같은 레이아웃 안에서 URL만 바뀌어도 새로 마운트
 * - 탭 전환·재렌더로는 재요청하지 않음(사용자가 유발하지 않은 새로고침 금지)
 * - 화면 근처에 보일 때 요청 — 숨겨진 탭(폭 0)에서 요청하면 실패하므로
 */
export function AdSlot({ placement, className }: AdSlotProps) {
  const pathname = usePathname();
  const slot = AD_SLOTS[placement];
  if (!ADSENSE_CLIENT_ID || !slot) return null;

  return (
    <AdSlotInner
      key={pathname}
      clientId={ADSENSE_CLIENT_ID}
      slot={slot}
      className={className}
    />
  );
}

function AdSlotInner({
  clientId,
  slot,
  className,
}: {
  clientId: string;
  slot: string;
  className?: string;
}) {
  const insRef = useRef<HTMLModElement>(null);
  // 광고 스크립트가 차단·실패해 처리되지 않으면 빈 자리(라벨·최소 높이)를 접는다
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const el = insRef.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        if (el.offsetWidth === 0) return;
        observer.disconnect();
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
          // 광고 차단기 등으로 실패해도 페이지 동작엔 영향 없음
        }
        // adsbygoogle.js는 처리한 <ins>에 data-adsbygoogle-status를 붙인다
        timer = setTimeout(() => {
          if (!el.hasAttribute('data-adsbygoogle-status')) setCollapsed(true);
        }, AD_SCRIPT_TIMEOUT_MS);
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  if (collapsed) return null;

  return (
    <aside aria-label="광고" className={cn('ad-slot py-3', className)}>
      <p className="mb-1 text-center text-[11px] text-gray-400">광고</p>
      {/* 실측(2026-09-24): 모바일은 화면 너비와 같은 정사각형, sm 이상은 높이 280px.
          채워질 때 아래 콘텐츠가 밀리지 않도록 그만큼 미리 확보한다 */}
      <div className="min-h-[100vw] sm:min-h-[280px]">
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={clientId}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
