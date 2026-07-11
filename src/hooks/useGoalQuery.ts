/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
  useSuspenseQuery,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from '@tanstack/react-query';

/**
 * Standard query hook
 */
export function useGoalQuery<
  TQueryFn extends (...args: any[]) => Promise<any>,
  TParams extends Parameters<TQueryFn>,
  TData = Awaited<ReturnType<TQueryFn>>,
>(
  apiFn: TQueryFn,
  params: TParams,
  options?: Omit<
    UseQueryOptions<TData, Error, TData, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<TData, Error> {
  const customKey = (apiFn as any)?.queryKey as string | undefined;
  const safeName =
    customKey ||
    (typeof apiFn === 'function' && (apiFn as { name?: string }).name) ||
    'anonymous';

  return useQuery<TData, Error, TData, QueryKey>({
    queryKey: [safeName, JSON.stringify(params)],
    queryFn: () => apiFn(...params),
    ...options,
  });
}

/**
 * useGoalSuspenseQuery와 동일한 queryKey 규약의 쿼리 옵션 생성기.
 * useSuspenseQueries로 여러 쿼리를 병렬 실행할 때 사용 (직렬 suspense 체인 방지).
 * 키 규약이 같아 개별 useGoal*Query 사용처와 캐시가 공유된다.
 */
export function goalQueryOptions<
  TQueryFn extends (...args: any[]) => Promise<any>,
>(apiFn: TQueryFn, params: Parameters<TQueryFn>) {
  const customKey = (apiFn as any)?.queryKey as string | undefined;
  const safeName =
    customKey ||
    (typeof apiFn === 'function' && (apiFn as { name?: string }).name) ||
    'anonymous';

  return {
    queryKey: [safeName, JSON.stringify(params)] as QueryKey,
    queryFn: () => apiFn(...params) as Promise<Awaited<ReturnType<TQueryFn>>>,
  };
}

/**
 * Suspense-enabled query hook
 */
export function useGoalSuspenseQuery<
  TQueryFn extends (...args: any[]) => Promise<any>,
  TParams extends Parameters<TQueryFn>,
  TData = Awaited<ReturnType<TQueryFn>>,
>(
  apiFn: TQueryFn,
  params: TParams,
  options?: Omit<
    UseSuspenseQueryOptions<TData, Error, TData, QueryKey>,
    'queryKey' | 'queryFn'
  >
): UseSuspenseQueryResult<TData, Error> {
  const customKey = (apiFn as any)?.queryKey as string | undefined;
  const safeName =
    customKey ||
    (typeof apiFn === 'function' && (apiFn as { name?: string }).name) ||
    'anonymous';

  return useSuspenseQuery<TData, Error, TData, QueryKey>({
    queryKey: [safeName, JSON.stringify(params)],
    queryFn: () => apiFn(...params),
    ...options,
  });
}

/**
 * Infinite query hook (returns fixed InfiniteData)
 */
export type UseGoalInfiniteQueryOptions<
  TQueryFn extends (...args: any[]) => Promise<any>,
  TPageParam,
> = Omit<
  UseInfiniteQueryOptions<
    Awaited<ReturnType<TQueryFn>>,
    Error,
    InfiniteData<Awaited<ReturnType<TQueryFn>>, TPageParam>,
    readonly unknown[],
    TPageParam
  >,
  'queryKey' | 'queryFn'
>;

export function useGoalInfiniteQuery<
  TQueryFn extends (...args: any[]) => Promise<any>,
  TPageParam,
>(
  apiFn: TQueryFn,
  getParams: (arg: { pageParam: TPageParam }) => Parameters<TQueryFn>,
  options: UseGoalInfiniteQueryOptions<TQueryFn, TPageParam>
): UseInfiniteQueryResult<
  InfiniteData<Awaited<ReturnType<TQueryFn>>, TPageParam>,
  Error
> {
  const typed = options as UseInfiniteQueryOptions<
    Awaited<ReturnType<TQueryFn>>,
    Error,
    InfiniteData<Awaited<ReturnType<TQueryFn>>, TPageParam>,
    readonly unknown[],
    TPageParam
  >;
  const { initialPageParam, getNextPageParam, ...rest } = typed;
  const paramsForKey = getParams({ pageParam: initialPageParam as TPageParam });
  const customKey = (apiFn as any)?.queryKey as string | undefined;
  const safeName =
    customKey ||
    (typeof apiFn === 'function' && (apiFn as { name?: string }).name) ||
    'anonymous';
  const keyParams = JSON.stringify(paramsForKey);

  // Remove forbidden keys without introducing unused vars
  const sanitizedRestObj = { ...(rest as Record<string, unknown>) };
  delete (sanitizedRestObj as Record<string, unknown>).queryKey;
  delete (sanitizedRestObj as Record<string, unknown>).queryFn;

  return useInfiniteQuery<
    Awaited<ReturnType<TQueryFn>>,
    Error,
    InfiniteData<Awaited<ReturnType<TQueryFn>>, TPageParam>,
    readonly unknown[],
    TPageParam
  >({
    queryKey: [safeName, keyParams, 'infinite'],
    initialPageParam: initialPageParam as TPageParam,
    getNextPageParam: getNextPageParam as NonNullable<typeof getNextPageParam>,
    queryFn: ({ pageParam }) =>
      apiFn(
        ...(getParams({
          pageParam: pageParam as TPageParam,
        }) as Parameters<TQueryFn>)
      ),
    ...(sanitizedRestObj as Partial<
      UseInfiniteQueryOptions<
        Awaited<ReturnType<TQueryFn>>,
        Error,
        InfiniteData<Awaited<ReturnType<TQueryFn>>, TPageParam>,
        readonly unknown[],
        TPageParam
      >
    >),
  });
}
