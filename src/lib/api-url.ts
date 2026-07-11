const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// 서버(SSR/RSC)에서는 fetch가 절대 URL을 요구함 — 상대 경로면 Invalid URL로 throw.
// 우선순위: 명시된 사이트 URL → Vercel 배포 URL → 로컬
// 한계: 프리뷰 배포는 Standard Protection(SSO)이 켜져 있어 self-fetch가 302를 만남
// (프리뷰 SSR은 기존과 동일하게 클라이언트 폴백으로 동작 — 프로덕션은 보호 없음 실측 확인)
function serverBase(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://127.0.0.1:${process.env.PORT || 3000}`;
}

export function apiUrl(path: string): string {
  if (API_BASE) return `${API_BASE}${path}`;
  if (typeof window !== 'undefined') return path;
  return `${serverBase()}${path}`;
}
