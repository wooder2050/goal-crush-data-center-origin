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
 * reserveSpace: 아래에 다른 위젯이 있는 자리(홈)에서 로딩 중 같은 높이를 잡아 레이아웃 밀림을 줄인다.
 */
export default function ChannelVideoCard({
  matchId,
  heading,
  reserveSpace = false,
  className = '',
}: {
  matchId?: number;
  heading: string;
  reserveSpace?: boolean;
  className?: string;
}) {
  // 전역 기본값은 재조회를 꺼 두었지만, 이 카드는 DB 수정이 배포 없이 보여야 하므로 다시 켠다
  const { data: videos, isPending } = useGoalQuery(
    getChannelVideos,
    [{ matchId, limit: 1 }],
    {
      staleTime: 60_000,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    }
  );
  const video = videos?.[0];
  if (!video) {
    return reserveSpace && isPending ? (
      <div
        aria-hidden
        className={`h-[565px] animate-pulse rounded-lg border bg-white sm:h-[505px] ${className}`}
      />
    ) : null;
  }

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
        {/* 유튜브 임베드 최소 크기(200px) — 좁은 화면은 영상 아래에 설명 */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <ChannelVideoPlayer
            key={video.youtube_id}
            video={video}
            className="w-[200px] shrink-0"
          />
          <div className="flex w-full min-w-0 flex-col justify-center gap-2">
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
