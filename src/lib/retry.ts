/**
 * 일시적 실패(빌드 시 DB 연결 경합 등)에 대한 재시도 래퍼.
 * Vercel 빌드에서 병렬 배포가 connection_limit=1 Supabase를 두고 경합하면
 * 프리렌더 쿼리가 간헐적으로 실패해 빌드 전체가 죽는 문제의 방어책.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  baseDelayMs = 1500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, baseDelayMs * (attempt + 1))
        );
      }
    }
  }
  throw lastError;
}
