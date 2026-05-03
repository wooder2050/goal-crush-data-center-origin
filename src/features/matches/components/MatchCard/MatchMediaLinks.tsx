'use client';

import { Tv } from 'lucide-react';
import React from 'react';

import { MatchWithTeams } from '@/lib/types/database';

interface MatchMediaLinksProps {
  match: MatchWithTeams;
  className?: string;
}

const MatchMediaLinks: React.FC<MatchMediaLinksProps> = ({
  match,
  className = '',
}) => {
  const hasLinks =
    Boolean(match.highlight_url) || Boolean(match.full_video_url);
  const hasRating =
    match.rating_nationwide != null || match.rating_metropolitan != null;

  if (!hasLinks && !hasRating) return null;

  return (
    <div
      className={`mb-2 sm:mb-3 flex w-full items-center justify-center sm:justify-end gap-2 flex-wrap lg:hidden ${className}`}
    >
      {hasRating && (
        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-gray-700">
          <Tv className="h-3 w-3" />
          {match.rating_nationwide != null && (
            <span>전국 {Number(match.rating_nationwide)}%</span>
          )}
          {match.rating_nationwide != null &&
            match.rating_metropolitan != null && (
              <span className="text-gray-300">|</span>
            )}
          {match.rating_metropolitan != null && (
            <span>수도권 {Number(match.rating_metropolitan)}%</span>
          )}
        </span>
      )}
      {match.highlight_url && (
        <a
          href={match.highlight_url}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center rounded-md bg-black px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-white shadow-sm hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50"
        >
          🎦 하이라이트
        </a>
      )}
      {match.full_video_url && (
        <a
          href={match.full_video_url}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center rounded-md border px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          ▶️ 풀영상
        </a>
      )}
    </div>
  );
};

export default MatchMediaLinks;
