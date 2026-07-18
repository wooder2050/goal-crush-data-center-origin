import { Prisma } from '@prisma/client';

/** 연결 계열(일시적) Prisma 오류 코드 — 재시도 대상 */
const TRANSIENT_PRISMA_CODES = new Set([
  'P1001', // Can't reach database server
  'P1002', // Database server timed out
  'P1008', // Operations timed out
  'P1017', // Server closed the connection
  'P2024', // Timed out fetching connection from pool
]);

/** 재시도해도 되는 일시적 DB 오류인지 판별 (구문·제약 오류 등은 즉시 실패) */
export function isTransientDbError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_PRISMA_CODES.has(error.code);
  }
  const message = error instanceof Error ? error.message : '';
  return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|Connection terminated|connection closed|socket hang up/i.test(
    message
  );
}

/**
 * 일시적 DB 오류에 한정한 재시도 래퍼.
 * Vercel 빌드에서 병렬 배포가 connection_limit=1 Supabase를 두고 경합하면
 * 프리렌더 쿼리가 간헐적으로 실패해 빌드 전체가 죽는 문제의 방어책.
 * 비일시적 오류(구문·제약 위반 등)는 즉시 던진다.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  baseDelayMs = 500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !isTransientDbError(error)) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, baseDelayMs * (attempt + 1))
      );
    }
  }
  throw lastError;
}
