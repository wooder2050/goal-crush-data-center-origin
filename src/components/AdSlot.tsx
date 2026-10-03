'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { AD_SLOTS, type AdPlacement } from '@/constants/ads';
import { trackAdPlacementImpression } from '@/lib/analytics';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    adsbygoogle?: unknown[] & { loaded?: boolean };
  }
}

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
/** 화면 아래 이 거리 안에 들어오면 <ins>를 붙인다 — 정확히 보일 때 시작하면 늦다 */
const PRELOAD_MARGIN = '300px 0px';
/** 이 시간 안에 adsbygoogle.js가 로드되지 않으면 차단된 것으로 보고 자리를 접는다 */
const AD_SCRIPT_TIMEOUT_MS = 8000;
/** 광고 '자리'가 보였다고 볼 기준 — 50% 이상이 1초 연속. 애드센스 Active View와는 다른 지표 */
const VIEWABLE_RATIO = 0.5;
const VIEWABLE_MS = 1000;

/**
 * 자리가 아직 화면 아래(사용자가 보기 전)인지. 이때 접어야 보이는 콘텐츠가 밀리지 않는다.
 * 이미 보이거나 지나간 자리를 접으면 화면이 당겨지므로(CLS) 빈 자리로 둔다
 */
function isBelowViewport(el: HTMLElement | null) {
  return !!el && el.getBoundingClientRect().top > window.innerHeight;
}

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
 * - pathname을 key로 써서 같은 레이아웃 안에서 URL만 바뀌어도 새로 마운트.
 *   쿼리·탭·필터 변경으로는 재요청하지 않는다(사용자가 유발하지 않은 새로고침 금지)
 * - 자리(외곽)만 먼저 그리고, 화면 근처에 오면 <ins>를 붙여 1회 요청한다.
 *   push({})는 대상 요소를 지정하지 않으므로 아직 요청할 때가 아닌 <ins>를 DOM에 두지 않는다
 * - 폭 0(숨김 탭 등)에서는 요청하지 않고 폭이 생기면 재시도한다
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
      placement={placement}
      className={className}
    />
  );
}

function AdSlotInner({
  clientId,
  slot,
  placement,
  className,
}: {
  clientId: string;
  slot: string;
  placement: AdPlacement;
  className?: string;
}) {
  const boxRef = useRef<HTMLElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [mounted, setMounted] = useState(false);
  // 채워지지 않은 광고 — 라벨을 감춘다("광고"라고 표시할 광고가 없음)
  const [unfilled, setUnfilled] = useState(false);
  // 자리 자체를 접음 — 보고 있는 화면이 밀리지 않도록 자리가 화면 아래에 있을 때만
  const [collapsed, setCollapsed] = useState(false);

  // 1) 화면 근처에 들어오면 <ins> 마운트
  useEffect(() => {
    const box = boxRef.current;
    if (!box || mounted) return;
    if (typeof IntersectionObserver === 'undefined') {
      setMounted(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setMounted(true);
      },
      { rootMargin: PRELOAD_MARGIN }
    );
    io.observe(box);
    return () => io.disconnect();
  }, [mounted]);

  // 2) 마운트된 <ins>에 1회만 요청 — StrictMode 이중 실행·중복 push 방지
  useEffect(() => {
    if (!mounted || pushed.current) return;
    const el = insRef.current;
    if (!el) return;

    const tryPush = () => {
      if (pushed.current) return true;
      if (el.hasAttribute('data-adsbygoogle-status')) {
        pushed.current = true;
        return true;
      }
      if (el.getBoundingClientRect().width === 0) return false;
      pushed.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // 광고 차단기 등으로 실패해도 페이지 동작엔 영향 없음. 재시도하지 않는다
      }
      return true;
    };

    if (tryPush()) return;
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      if (tryPush()) ro.disconnect();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);

  // 3) 채움 상태 — 애드센스가 붙이는 data-ad-status(filled / unfilled / unfill-optimized)를 읽는다.
  //    처리 표시(data-adsbygoogle-status)는 채움 여부가 아니다
  useEffect(() => {
    if (!mounted) return;
    const el = insRef.current;
    if (!el) return;

    const read = () => {
      const status = el.getAttribute('data-ad-status');
      if (!status) return;
      const notFilled = status !== 'filled';
      setUnfilled(notFilled);
      if (notFilled && isBelowViewport(boxRef.current)) setCollapsed(true);
    };
    read();
    const mo =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(read);
    mo?.observe(el, { attributes: true, attributeFilter: ['data-ad-status'] });

    // 로더 자체가 로드되지 않으면(차단기·네트워크) 상태가 영영 붙지 않으므로 접는다.
    // 느리게 로드된 경우를 차단으로 오판하지 않도록 loaded 플래그만 본다
    const timer = setTimeout(() => {
      if (!window.adsbygoogle?.loaded) {
        setUnfilled(true);
        if (isBelowViewport(boxRef.current)) setCollapsed(true);
      }
    }, AD_SCRIPT_TIMEOUT_MS);

    return () => {
      mo?.disconnect();
      clearTimeout(timer);
    };
  }, [mounted]);

  // 4) 광고 자리 노출 이벤트 — 50% 이상이 1초 연속 보일 때 경로당 1회.
  //    빈 자리 도달도 포함하며 실제 광고 노출·수익 지표가 아니다
  useEffect(() => {
    const box = boxRef.current;
    if (!box || typeof IntersectionObserver === 'undefined') return;

    let fired = false;
    let visible = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const clear = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };
    const sync = () => {
      if (fired) return;
      if (!visible || document.visibilityState !== 'visible') {
        clear();
        return;
      }
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        if (fired || !visible || document.visibilityState !== 'visible') return;
        fired = true;
        trackAdPlacementImpression(placement);
        stop();
      }, VIEWABLE_MS);
    };

    const io = new IntersectionObserver(
      (entries) => {
        // 한 콜백에 진입·이탈이 함께 올 수 있어 마지막 기록만 현재 상태로 본다
        const latest = entries[entries.length - 1];
        if (!latest) return;
        visible =
          latest.isIntersecting && latest.intersectionRatio >= VIEWABLE_RATIO;
        sync();
      },
      { threshold: [VIEWABLE_RATIO] }
    );
    const onVisibility = () => sync();
    function stop() {
      io.disconnect();
      clear();
      document.removeEventListener('visibilitychange', onVisibility);
    }

    io.observe(box);
    document.addEventListener('visibilitychange', onVisibility);
    return stop;
  }, [placement]);

  if (collapsed) return null;

  return (
    <aside
      ref={boxRef}
      aria-label="광고"
      data-ad-placement={placement}
      className={cn('ad-slot py-3', className)}
    >
      <p
        className={cn(
          'mb-1 text-center text-[11px] text-gray-400',
          unfilled && 'invisible'
        )}
      >
        광고
      </p>
      {/* 실측(2026-09-24): 모바일은 화면 너비와 같은 정사각형, sm 이상은 높이 280px.
          채워질 때 아래 콘텐츠가 밀리지 않도록 그만큼 미리 확보한다 */}
      <div className="min-h-[100vw] sm:min-h-[280px]">
        {mounted && (
          <ins
            ref={insRef}
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={clientId}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        )}
      </div>
    </aside>
  );
}
