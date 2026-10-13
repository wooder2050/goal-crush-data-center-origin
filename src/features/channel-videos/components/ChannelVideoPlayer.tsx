'use client';

import { Play } from 'lucide-react';
import { useState } from 'react';

import type { ChannelVideoItem } from '../types';

/**
 * 썸네일 → 누르면 그 자리에서 재생 (iframe은 누른 뒤에만 불러와 첫 로딩을 가볍게).
 * 쇼츠는 세로(9:16), 롱폼은 가로(16:9)
 */
export default function ChannelVideoPlayer({
  video,
  className = '',
}: {
  video: ChannelVideoItem;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [thumb, setThumb] = useState(
    `https://i.ytimg.com/vi/${video.youtube_id}/${video.is_short ? 'oardefault' : 'maxresdefault'}.jpg`
  );

  return (
    <div
      className={`relative ${video.is_short ? 'aspect-[9/16]' : 'aspect-video'} overflow-hidden rounded-lg bg-gray-900 ${className}`}
    >
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}?autoplay=1&playsinline=1&rel=0`}
          title={video.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`${video.title} 재생`}
          className="group absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt=""
            loading="lazy"
            onError={() =>
              setThumb(
                `https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`
              )
            }
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/25">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
              <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
