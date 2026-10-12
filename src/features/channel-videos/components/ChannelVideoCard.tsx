'use client';

import { Youtube } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import { YOUTUBE_CHANNEL_NAME, YOUTUBE_CHANNEL_URL } from '@/lib/youtube';

import { getChannelVideos } from '../api';
import { VIDEO_TYPE_LABEL } from '../types';
import ChannelVideoPlayer from './ChannelVideoPlayer';

/**
 * 골때녀 기록실(유튜브) 쇼츠 카드 — channel_videos 최신 1편.
 * matchId를 주면 그 경기 영상만 찾고, 없으면 카드 자체를 그리지 않는다.
 */
export default function ChannelVideoCard({
  matchId,
  heading,
  className = '',
}: {
  matchId?: number;
  heading: string;
  className?: string;
}) {
  const { data: videos } = useGoalQuery(
    getChannelVideos,
    [{ matchId, limit: 1 }],
    { staleTime: 60_000 }
  );
  const video = videos?.[0];
  if (!video) return null;

  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-base">
            <Youtube className="h-4 w-4 text-red-600" aria-hidden />
            {heading}
          </CardTitle>
          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#ff4800] hover:underline"
          >
            채널 보기
          </a>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-4 sm:px-6">
        <div className="flex gap-4">
          <ChannelVideoPlayer video={video} className="w-40 shrink-0" />
          <div className="flex min-w-0 flex-col justify-center gap-2">
            <span className="w-fit rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-600">
              {VIDEO_TYPE_LABEL[video.video_type] ?? '쇼츠'}
            </span>
            <p className="text-sm font-semibold leading-snug text-gray-900">
              {video.title}
            </p>
            <p className="text-xs text-gray-500">
              {YOUTUBE_CHANNEL_NAME} · 기록으로 보는 경기 쇼츠
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <a
                href={video.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                유튜브에서 보기
              </a>
              <a
                href={`${YOUTUBE_CHANNEL_URL}?sub_confirmation=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                구독
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
