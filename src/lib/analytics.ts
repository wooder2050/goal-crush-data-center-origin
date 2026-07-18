type GtagFn = (...args: unknown[]) => void;

/**
 * GA4 표준 share 이벤트를 전송한다.
 * gtag 미로드(GA ID 없음, 광고 차단 등) 환경에서는 조용히 무시한다.
 */
export function trackShare(params: {
  method: 'twitter' | 'native' | 'copy_link';
  contentType: string;
  itemId?: string;
}): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as { gtag?: GtagFn }).gtag;
  if (!gtag) return;

  gtag('event', 'share', {
    method: params.method,
    content_type: params.contentType,
    ...(params.itemId ? { item_id: params.itemId } : {}),
  });
}

/**
 * GA4 표준 select_content 이벤트 — 홈 모듈(매치데이 카드 등) 클릭 계측.
 */
export function trackSelectContent(params: {
  module: string;
  destination: string;
  matchState?: string;
}): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as { gtag?: GtagFn }).gtag;
  if (!gtag) return;

  gtag('event', 'select_content', {
    content_type: params.module,
    item_id: params.destination,
    ...(params.matchState ? { match_state: params.matchState } : {}),
  });
}
