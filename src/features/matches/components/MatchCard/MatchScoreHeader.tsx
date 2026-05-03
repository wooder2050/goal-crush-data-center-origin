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

type MatchOutcome = 'win' | 'loss' | 'draw' | 'pending';

interface MatchScoreHeaderProps {
  match: MatchWithTeams;
  className?: string;
}

interface TeamWithLogoProps {
  team: Pick<Team, 'team_name' | 'logo'> | null;
  outcome: MatchOutcome;
  teamId: number | null;
  coachName?: string;
  coachId?: number;
}

const outcomeStyles: Record<MatchOutcome, string> = {
  win: '',
  loss: 'opacity-60',
  draw: '',
  pending: '',
};

const teamNameStyles: Record<MatchOutcome, string> = {
  win: 'font-bold text-black',
  loss: 'text-gray-500',
  draw: 'font-medium text-gray-700',
  pending: 'text-gray-700',
};

function TeamWithLogo({
  team,
  outcome,
  teamId,
  coachName,
  coachId,
}: TeamWithLogoProps) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 sm:gap-2 ${outcomeStyles[outcome]}`}
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
        <div className={`text-sm sm:text-base ${teamNameStyles[outcome]}`}>
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
        {coachName && (
          <div className="mt-0.5 text-[11px] text-gray-400">
            {coachId ? (
              <Link
                href={`/coaches/${coachId}`}
                className="py-0.5 text-inherit no-underline"
              >
                {coachName}
              </Link>
            ) : (
              coachName
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getOutcome(
  winner: 'home' | 'away' | 'draw' | null,
  side: 'home' | 'away',
  hasScore: boolean
): MatchOutcome {
  if (!hasScore) return 'pending';
  if (winner === side) return 'win';
  if (winner === 'draw' || winner === null) return 'draw';
  return 'loss';
}

const MatchScoreHeader: React.FC<MatchScoreHeaderProps> = ({
  match,
  className = '',
}) => {
  const winner = getWinnerTeam(match);
  const hasScore = match.home_score != null && match.away_score != null;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex-1 text-center">
        <TeamWithLogo
          team={match.home_team}
          outcome={getOutcome(winner, 'home', hasScore)}
          teamId={match.home_team_id}
          coachName={match.home_coach?.name}
          coachId={match.home_coach?.coach_id}
        />
      </div>

      <div className="flex-shrink-0 px-3 sm:px-6">
        <div className="text-center">
          <div className="text-3xl font-black sm:text-4xl">
            {getMatchResult(match)}
          </div>
          {hasPenaltyShootout(match) && (
            <div className="mt-1 text-xs text-gray-600">
              PK {match.penalty_home_score}:{match.penalty_away_score}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 text-center">
        <TeamWithLogo
          team={match.away_team}
          outcome={getOutcome(winner, 'away', hasScore)}
          teamId={match.away_team_id}
          coachName={match.away_coach?.name}
          coachId={match.away_coach?.coach_id}
        />
      </div>
    </div>
  );
};

export default MatchScoreHeader;
