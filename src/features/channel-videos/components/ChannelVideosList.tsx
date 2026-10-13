'use client';

import { useGoalQuery } from '@/hooks/useGoalQuery';

import { getChannelVideos } from '../api';
import type { ChannelVideoItem } from '../types';
import { VideoInfo } from './ChannelVideoCard';
import ChannelVideoPlayer from './ChannelVideoPlayer';

/** /videos — 롱폼(가로)과 쇼츠(세로)를 최신순으로 나눠 보여준다 */
export default function ChannelVideosList() {
  const options = {
    staleTime: 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  };
  const { data: longs, isPending: lp } = useGoalQuery(
    getChannelVideos,
    [{ format: 'long', limit: 12 }],
    options
  );
  const { data: shorts, isPending: sp } = useGoalQuery(
    getChannelVideos,
    [{ format: 'short', limit: 24 }],
    options
  );

  if (lp || sp) {
    return (
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="aspect-video animate-pulse rounded-lg bg-gray-100"
          />
        ))}
      </div>
    );
  }
  if (!longs?.length && !shorts?.length) {
    return (
      <p className="mt-8 text-sm text-gray-500">아직 등록된 영상이 없습니다.</p>
    );
  }

  return (
    <div className="mt-6 space-y-10">
      {!!longs?.length && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-gray-900">경기 프리뷰</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {longs.map((v: ChannelVideoItem) => (
              <div key={v.video_id} className="flex flex-col gap-3">
                <ChannelVideoPlayer
                  key={v.youtube_id}
                  video={v}
                  className="w-full"
                />
                <VideoInfo video={v} />
              </div>
            ))}
          </div>
        </section>
      )}
      {!!shorts?.length && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-gray-900">쇼츠</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {shorts.map((v: ChannelVideoItem) => (
              <div key={v.video_id} className="flex flex-col gap-2">
                <ChannelVideoPlayer
                  key={v.youtube_id}
                  video={v}
                  className="w-full"
                />
                <p className="line-clamp-2 text-xs font-semibold text-gray-900">
                  {v.title}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
