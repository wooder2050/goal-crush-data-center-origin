import { apiUrl } from '@/lib/api-url';

import type { ChannelVideoItem } from './types';

/** 골때녀 기록실 영상 — matchId가 있으면 그 경기 영상만 */
export async function getChannelVideos({
  matchId,
  limit,
}: {
  matchId?: number;
  limit?: number;
}): Promise<ChannelVideoItem[]> {
  const qs = new URLSearchParams();
  if (matchId) qs.set('match_id', String(matchId));
  if (limit) qs.set('limit', String(limit));
  const res = await fetch(apiUrl(`/api/channel-videos?${qs}`));
  if (!res.ok) return [];
  const data = (await res.json()) as { videos?: ChannelVideoItem[] };
  return data.videos ?? [];
}
getChannelVideos.queryKey = 'channelVideos';
