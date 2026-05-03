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
      className={`mb-2 flex items-center justify-end gap-1.5 lg:hidden ${className}`}
    >
      {hasRating && (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-gray-500">
          <Tv className="h-3 w-3" />
          {match.rating_nationwide != null && (
            <span>{Number(match.rating_nationwide)}%</span>
          )}
          {match.rating_nationwide != null &&
            match.rating_metropolitan != null && (
              <span className="text-gray-300">/</span>
            )}
          {match.rating_metropolitan != null && (
            <span>{Number(match.rating_metropolitan)}%</span>
          )}
        </span>
      )}
      {match.highlight_url && (
        <a
          href={match.highlight_url}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(e) => e.stopPropagation()}
          className="rounded px-1.5 py-0.5 text-[10px] font-medium text-blue-600 hover:underline"
        >
          하이라이트
        </a>
      )}
      {match.full_video_url && (
        <a
          href={match.full_video_url}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(e) => e.stopPropagation()}
          className="rounded px-1.5 py-0.5 text-[10px] font-medium text-blue-600 hover:underline"
        >
          풀영상
        </a>
      )}
    </div>
  );
};

export default MatchMediaLinks;
