'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import type { MatchWithTeams, Team } from '@/lib/types/database';

import {
  getMatchResult,
  getWinnerTeam,
  hasPenaltyShootout,
} from '../../lib/matchUtils';

interface MatchScoreHeaderProps {
  match: MatchWithTeams;
  className?: string;
}

interface TeamWithLogoProps {
  team: Pick<Team, 'team_name' | 'logo'> | null;
  isWinner: boolean;
  isLoser: boolean;
  teamId: number | null;
}

const MatchScoreHeader: React.FC<MatchScoreHeaderProps> = ({
  match,
  className = '',
}) => {
  const winner = getWinnerTeam(match);
  const hasScore = match.home_score != null && match.away_score != null;

  const TeamWithLogo: React.FC<TeamWithLogoProps> = ({
    team,
    isWinner,
    isLoser,
    teamId,
  }) => {
    const headCoachName =
      (teamId === match.home_team_id
        ? match.home_coach?.name
        : teamId === match.away_team_id
          ? match.away_coach?.name
          : undefined) || undefined;
    const headCoachId =
      teamId === match.home_team_id
        ? match.home_coach?.coach_id
        : teamId === match.away_team_id
          ? match.away_coach?.coach_id
          : undefined;

    return (
      <div
        className={`flex flex-col items-center gap-1.5 sm:gap-2 transition-opacity ${
          isLoser ? 'opacity-50' : ''
        }`}
      >
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full sm:h-12 sm:w-12">
          {team?.logo ? (
            <Image
              src={team.logo}
              alt={`${team.team_name} 로고`}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 sm:h-12 sm:w-12">
              <span className="text-sm font-medium text-gray-500 sm:text-base">
                {team?.team_name?.charAt(0) || '?'}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center">
          <div
            className={`text-sm font-medium sm:text-base ${
              isWinner ? 'font-bold text-black' : 'text-gray-700'
            }`}
          >
            {teamId ? (
              <Link
                href={`/teams/${teamId}`}
                className="py-1 text-inherit no-underline"
              >
                {team?.team_name || '알 수 없음'}
              </Link>
            ) : (
              team?.team_name || '알 수 없음'
            )}
          </div>
          {headCoachName && (
            <div className="mt-0.5 text-xs text-gray-500">
              {headCoachId ? (
                <Link
                  href={`/coaches/${headCoachId}`}
                  className="py-0.5 text-inherit no-underline"
                >
                  {headCoachName}
                </Link>
              ) : (
                headCoachName
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Home Team */}
      <div className="flex-1 text-center">
        <TeamWithLogo
          team={match.home_team}
          isWinner={winner === 'home'}
          isLoser={hasScore && winner !== null && winner !== 'home'}
          teamId={match.home_team_id}
        />
      </div>

      {/* Score */}
      <div className="flex-shrink-0 px-3 sm:px-6">
        <div className="text-center">
          <div className="text-3xl font-black sm:text-4xl">
            {getMatchResult(match)}
          </div>
          {hasPenaltyShootout(match) && (
            <div className="mt-1 text-xs text-gray-600 sm:text-sm">
              PK {match.penalty_home_score}:{match.penalty_away_score}
            </div>
          )}
        </div>
      </div>

      {/* Away Team */}
      <div className="flex-1 text-center">
        <TeamWithLogo
          team={match.away_team}
          isWinner={winner === 'away'}
          isLoser={hasScore && winner !== null && winner !== 'away'}
          teamId={match.away_team_id}
        />
      </div>
    </div>
  );
};

export default MatchScoreHeader;
