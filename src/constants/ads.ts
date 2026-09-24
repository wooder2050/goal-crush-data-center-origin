/**
 * 애드센스 수동 디스플레이 광고 단위(반응형) slot ID.
 * 애드센스 콘솔 > 광고 > 광고 단위 기준에서 위치별로 하나씩 만든 값.
 * 빈 문자열이면 해당 위치의 광고 칸을 렌더링하지 않는다.
 */
export const AD_SLOTS = {
  matchDetail: '',
  seasonDetail: '',
  playerDetail: '',
  teamDetail: '',
} as const;

export type AdPlacement = keyof typeof AD_SLOTS;
