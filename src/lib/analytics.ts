type GtagFn = (...args: unknown[]) => void;

/**
 * gtag 호출 래퍼. gtag.js 인라인 스텁(afterInteractive)이 아직 실행 전이면
 * dataLayer에 선큐잉해 로드 후 소비되도록 한다 — gtag.js는 dataLayer의
 * Arguments 항목을 명령으로 인식하므로 배열이 아닌 arguments를 push해야 한다.
 * GA 미설정 환경에서는 dataLayer push가 무해한 no-op이다.
 */
function sendGtag(...args: unknown[]): void {
  if (typeof window === 'undefined') return;
  const w = window as { gtag?: GtagFn; dataLayer?: unknown[] };
  if (w.gtag) {
    w.gtag(...args);
    return;
  }
  w.dataLayer = w.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  w.dataLayer.push(arguments);
}

/**
 * GA4 표준 share 이벤트를 전송한다.
 */
export function trackShare(params: {
  method: 'twitter' | 'native' | 'copy_link';
  contentType: string;
  itemId?: string;
}): void {
  sendGtag('event', 'share', {
    method: params.method,
    content_type: params.contentType,
    ...(params.itemId ? { item_id: params.itemId } : {}),
  });
}

/**
 * 커스텀 view_content 이벤트 — 홈 모듈(매치데이 카드 등) 노출 계측.
 * select_content(클릭)와 짝을 이뤄 노출 대비 클릭률을 계산한다.
 */
export function trackViewContent(params: {
  module: string;
  itemId?: string;
  matchState?: string;
}): void {
  sendGtag('event', 'view_content', {
    content_type: params.module,
    ...(params.itemId ? { item_id: params.itemId } : {}),
    ...(params.matchState ? { match_state: params.matchState } : {}),
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
  sendGtag('event', 'select_content', {
    content_type: params.module,
    item_id: params.destination,
    ...(params.matchState ? { match_state: params.matchState } : {}),
  });
}
