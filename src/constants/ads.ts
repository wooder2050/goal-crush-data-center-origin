/**
 * 애드센스 수동 디스플레이 광고 단위(반응형) slot ID.
 * 애드센스 콘솔 > 광고 > 광고 단위 기준에서 위치별로 하나씩 만든 값
 * (단위 이름: gtn-match-detail / gtn-season-detail / gtn-player-detail / gtn-team-detail,
 *  2026-10-04 추가: gtn-home / gtn-match-list).
 * 위치별로 단위를 나누는 건 보고서에서 자리별 성과를 가르기 위한 측정 목적이다.
 * 빈 문자열이면 해당 위치의 광고 칸을 렌더링하지 않는다.
 */
export const AD_SLOTS = {
  matchDetail: '6511238841',
  seasonDetail: '7278359750',
  playerDetail: '6447573947',
  teamDetail: '5134492273',
  home: '8474572104',
  matchList: '7161490430',
} as const;

export type AdPlacement = keyof typeof AD_SLOTS;
