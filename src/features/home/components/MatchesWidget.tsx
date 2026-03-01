import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

import type { HomeMatch } from '../types';

interface MatchesWidgetProps {
  seasonId: number;
  recentMatches: HomeMatch[];
  upcomingMatches: HomeMatch[];
}

export default function MatchesWidget({
  seasonId,
  recentMatches,
  upcomingMatches,
}: MatchesWidgetProps) {
  const hasNoMatches =
    recentMatches.length === 0 && upcomingMatches.length === 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">경기</CardTitle>
          <Link
            href={`/seasons/${seasonId}?tab=matches`}
            className="text-xs text-[#ff4800] hover:underline"
          >
            전체 경기 보기
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4">
        {hasNoMatches ? (
          <p className="text-sm text-gray-500 text-center py-4">
            경기 데이터가 없습니다.
          </p>
        ) : (
          <div className="space-y-1">
            {/* Recent Completed Matches */}
            {recentMatches.length > 0 && (
              <>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 py-1.5">
                  최근 결과
                </div>
                {recentMatches.map((match) => (
                  <CompletedMatchRow key={match.match_id} match={match} />
                ))}
              </>
            )}

            {/* Upcoming Matches */}
            {upcomingMatches.length > 0 && (
              <>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 py-1.5 mt-2">
                  예정된 경기
                </div>
                {upcomingMatches.map((match) => (
                  <UpcomingMatchRow key={match.match_id} match={match} />
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CompletedMatchRow({ match }: { match: HomeMatch }) {
  const hasPenalty =
    match.penalty_home_score != null && match.penalty_away_score != null;
  const tied =
    match.home_score != null &&
    match.away_score != null &&
    match.home_score === match.away_score;
  const homeWin =
    match.home_score != null &&
    match.away_score != null &&
    (match.home_score > match.away_score ||
      (tied &&
        hasPenalty &&
        match.penalty_home_score! > match.penalty_away_score!));
  const awayWin =
    match.home_score != null &&
    match.away_score != null &&
    (match.away_score > match.home_score ||
      (tied &&
        hasPenalty &&
        match.penalty_away_score! > match.penalty_home_score!));

  return (
    <Link
      href={`/matches/${match.match_id}`}
      className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
    >
      {/* Status */}
      <span className="text-xs text-gray-400 w-7 flex-shrink-0 text-center">
        종료
      </span>

      {/* Home Team */}
      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
        <span
          className={`text-xs sm:text-sm truncate ${homeWin ? 'font-bold text-gray-900' : 'text-gray-600'}`}
        >
          {match.home_team?.team_name}
        </span>
        {match.home_team?.logo && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 rounded-full overflow-hidden">
            <Image
              src={match.home_team.logo}
              alt=""
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
        )}
      </div>

      {/* Score */}
      <div className="flex-shrink-0 w-12 sm:w-14 text-center">
        <span className="text-xs sm:text-sm font-bold text-gray-900">
          {match.home_score ?? 0} - {match.away_score ?? 0}
        </span>
        {hasPenalty && (
          <div className="text-[10px] text-gray-400 leading-tight">
            PK {match.penalty_home_score}-{match.penalty_away_score}
          </div>
        )}
      </div>

      {/* Away Team */}
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        {match.away_team?.logo && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 rounded-full overflow-hidden">
            <Image
              src={match.away_team.logo}
              alt=""
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
        )}
        <span
          className={`text-xs sm:text-sm truncate ${awayWin ? 'font-bold text-gray-900' : 'text-gray-600'}`}
        >
          {match.away_team?.team_name}
        </span>
      </div>
    </Link>
  );
}

function UpcomingMatchRow({ match }: { match: HomeMatch }) {
  const dateStr = format(new Date(match.match_date), 'M/d', { locale: ko });
  const timeStr = format(new Date(match.match_date), 'HH:mm');

  return (
    <Link
      href={`/matches/${match.match_id}`}
      className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
    >
      {/* Home Team */}
      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
        <span className="text-xs sm:text-sm font-medium text-gray-800 truncate">
          {match.home_team?.team_name}
        </span>
        {match.home_team?.logo && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 rounded-full overflow-hidden">
            <Image
              src={match.home_team.logo}
              alt=""
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
        )}
      </div>

      {/* Date & Time */}
      <div className="flex-shrink-0 w-12 sm:w-14 text-center">
        <div className="text-[10px] sm:text-xs text-gray-400">{dateStr}</div>
        <div className="text-xs sm:text-sm font-medium text-gray-600">
          {timeStr}
        </div>
      </div>

      {/* Away Team */}
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        {match.away_team?.logo && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 rounded-full overflow-hidden">
            <Image
              src={match.away_team.logo}
              alt=""
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
        )}
        <span className="text-xs sm:text-sm font-medium text-gray-800 truncate">
          {match.away_team?.team_name}
        </span>
      </div>
    </Link>
  );
}
