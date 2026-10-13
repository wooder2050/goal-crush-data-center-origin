'use client';

import { useGoalQuery } from '@/hooks/useGoalQuery';
import { YOUTUBE_CHANNEL_URL } from '@/lib/youtube';

import { getChannelVideos } from '../api';
import type { ChannelVideoFormat, ChannelVideoItem } from '../types';
import { VideoInfo } from './ChannelVideoCard';
import ChannelVideoPlayer from './ChannelVideoPlayer';

const QUERY_OPTIONS = {
  staleTime: 60_000,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
} as const;

/** /videos — 롱폼(가로)과 쇼츠(세로)를 최신순으로 나눠 보여준다. 섹션마다 따로 로딩·오류 처리 */
export default function ChannelVideosList() {
  return (
    <div className="mt-6 space-y-10">
      <VideoSection title="경기 프리뷰" format="long" limit={12} />
      <VideoSection title="쇼츠" format="short" limit={24} />
      <p className="text-xs text-gray-500">
        최신 영상만 표시합니다. 지난 영상은{' '}
        <a
          href={`${YOUTUBE_CHANNEL_URL}/videos`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#ff4800] hover:underline"
        >
          유튜브 채널
        </a>
        에서 볼 수 있습니다.
      </p>
    </div>
  );
}

function VideoSection({
  title,
  format,
  limit,
}: {
  title: string;
  format: ChannelVideoFormat;
  limit: number;
}) {
  const { data, isPending, isError, refetch } = useGoalQuery(
    getChannelVideos,
    [{ format, limit }],
    QUERY_OPTIONS
  );
  const isLong = format === 'long';
  // 롱폼 16:9는 모바일 전체 폭(≥200px 높이), 쇼츠는 칸 폭 최소 200px (유튜브 임베드 최소 크기)
  const grid = isLong
    ? 'grid grid-cols-1 gap-6 md:grid-cols-2'
    : 'grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4';

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-gray-900">{title}</h2>
      {isPending ? (
        <div className={grid}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className={`${isLong ? 'aspect-video' : 'aspect-[9/16]'} animate-pulse rounded-lg bg-gray-100`}
            />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-gray-500">
          영상을 불러오지 못했습니다.{' '}
          <button
            type="button"
            onClick={() => refetch()}
            className="font-semibold text-[#ff4800] hover:underline"
          >
            다시 시도
          </button>
        </p>
      ) : !data?.length ? (
        <p className="text-sm text-gray-500">아직 등록된 영상이 없습니다.</p>
      ) : (
        <div className={grid}>
          {data.map((v: ChannelVideoItem) =>
            isLong ? (
              <div key={v.video_id} className="flex flex-col gap-3">
                <ChannelVideoPlayer
                  key={v.youtube_id}
                  video={v}
                  className="w-full"
                />
                <VideoInfo video={v} />
              </div>
            ) : (
              <div key={v.video_id} className="flex flex-col gap-2">
                <ChannelVideoPlayer
                  key={v.youtube_id}
                  video={v}
                  className="w-full"
                />
                <a
                  href={v.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="line-clamp-2 text-xs font-semibold text-gray-900 hover:underline"
                >
                  {v.title}
                </a>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}
