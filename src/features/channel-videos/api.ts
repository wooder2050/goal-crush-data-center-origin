import { apiUrl } from '@/lib/api-url';

import type { ChannelVideoFormat, ChannelVideoItem } from './types';

/** 골때녀 기록실 영상 — matchId가 있으면 그 경기 영상만 */
export async function getChannelVideos({
  matchId,
  limit,
  format,
}: {
  matchId?: number;
  limit?: number;
  format?: ChannelVideoFormat;
}): Promise<ChannelVideoItem[]> {
  const qs = new URLSearchParams();
  if (matchId) qs.set('match_id', String(matchId));
  if (format) qs.set('format', format);
  if (limit) qs.set('limit', String(limit));
  const res = await fetch(apiUrl(`/api/channel-videos?${qs}`));
  // 실패는 throw — React Query가 재시도하고, 재조회 실패 시 이전 영상을 유지한다
  if (!res.ok) throw new Error(`channel-videos ${res.status}`);
  const data = (await res.json()) as { videos?: ChannelVideoItem[] };
  return data.videos ?? [];
}
getChannelVideos.queryKey = 'channelVideos';
