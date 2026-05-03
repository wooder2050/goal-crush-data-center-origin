'use client';

import { Calendar, MapPin, MonitorPlay, Tv } from 'lucide-react';

import type { MatchWithTeams } from '@/lib/types';

interface MatchSidebarProps {
  match: MatchWithTeams;
}

export default function MatchSidebar({ match }: MatchSidebarProps) {
  const matchDate = match.match_date
    ? new Date(match.match_date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    : null;

  const ratingNationwide = (match as { rating_nationwide?: number })
    .rating_nationwide;
  const ratingMetro = (match as { rating_metropolitan?: number })
    .rating_metropolitan;
  const highlightUrl = (match as { highlight_url?: string }).highlight_url;
  const fullVideoUrl = (match as { full_video_url?: string }).full_video_url;
  const seasonName = (match as { season?: { season_name?: string } }).season
    ?.season_name;

  return (
    <div className="space-y-4">
      {/* 경기 영상 */}
      {(highlightUrl || fullVideoUrl) && (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            경기 영상
          </h3>
          <div className="space-y-2">
            {highlightUrl && (
              <a
                href={highlightUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100"
              >
                <MonitorPlay className="h-4 w-4 text-gray-500" />
                하이라이트
              </a>
            )}
            {fullVideoUrl && (
              <a
                href={fullVideoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100"
              >
                <Tv className="h-4 w-4 text-gray-500" />
                풀영상 보기
              </a>
            )}
          </div>
        </div>
      )}

      {/* 시청률 */}
      {(ratingNationwide || ratingMetro) && (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            시청률
          </h3>
          <dl className="space-y-2.5 text-sm">
            {ratingNationwide && (
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">전국</dt>
                <dd className="font-semibold text-gray-900">
                  {ratingNationwide}%
                </dd>
              </div>
            )}
            {ratingMetro && (
              <div className="flex items-center justify-between">
                <dt className="text-gray-500">수도권</dt>
                <dd className="font-semibold text-gray-900">{ratingMetro}%</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* 경기 정보 */}
      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          경기 정보
        </h3>
        <dl className="space-y-3 text-sm">
          {matchDate && (
            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
              <dd className="text-gray-700">{matchDate}</dd>
            </div>
          )}
          {match.location && (
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
              <dd className="text-gray-700">{match.location}</dd>
            </div>
          )}
          {seasonName && (
            <div className="flex items-start gap-2.5">
              <Tv className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
              <dd className="text-gray-700">{seasonName}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
