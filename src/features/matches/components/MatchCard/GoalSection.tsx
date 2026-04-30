'use client';

import Link from 'next/link';
import React, { useMemo } from 'react';

import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import type { Assist } from '@/lib/types';

import {
  getMatchAssistsPrisma,
  getMatchGoalsWithAssistsPrisma,
} from '../../api-prisma';

type GoalWithPlayerAndTeam = {
  goal_id: number;
  match_id: number;
  player_id: number;
  goal_time: number | null;
  goal_type: string | null;
  description: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  player: {
    player_id: number;
    name: string;
    jersey_number: number | null;
  };
  team: {
    team_id: number;
    team_name: string;
  } | null;
};

type AssistWithPlayer = Assist & {
  player: {
    player_id: number;
    name: string;
    jersey_number: number | null;
  };
};

interface GoalSectionProps {
  match: {
    match_id: number;
    home_team: {
      team_id: number;
      team_name: string;
    };
    away_team: {
      team_id: number;
      team_name: string;
    };
  };
}

export default function GoalSection({ match }: GoalSectionProps) {
  const { data: goals = [] as GoalWithPlayerAndTeam[] } = useGoalSuspenseQuery(
    getMatchGoalsWithAssistsPrisma,
    [match.match_id]
  );
  const { data: assists = [] as AssistWithPlayer[] } = useGoalSuspenseQuery(
    getMatchAssistsPrisma,
    [match.match_id]
  );

  const assistsByGoal = useMemo(
    () =>
      (assists as AssistWithPlayer[]).reduce<
        Record<number, AssistWithPlayer[]>
      >((acc, assist) => {
        if (!acc[assist.goal_id]) acc[assist.goal_id] = [];
        acc[assist.goal_id].push(assist);
        return acc;
      }, {}),
    [assists]
  );

  // Error state는 상위 GoalWrapper에서 처리됨

  const sortedHomeTeamGoals = useMemo(
    () =>
      (goals as GoalWithPlayerAndTeam[])
        .filter((goal) => {
          if (goal.goal_type === 'own_goal') {
            return goal.team?.team_id === match.away_team.team_id; // 상대팀의 자책골
          }
          return goal.team?.team_id === match.home_team.team_id; // 일반 득점
        })
        .sort((a, b) => (a.goal_time || 999) - (b.goal_time || 999)),
    [goals, match.home_team.team_id, match.away_team.team_id]
  );

  const sortedAwayTeamGoals = useMemo(
    () =>
      (goals as GoalWithPlayerAndTeam[])
        .filter((goal) => {
          if (goal.goal_type === 'own_goal') {
            return goal.team?.team_id === match.home_team.team_id; // 상대팀의 자책골
          }
          return goal.team?.team_id === match.away_team.team_id; // 일반 득점
        })
        .sort((a, b) => (a.goal_time || 999) - (b.goal_time || 999)),
    [goals, match.home_team.team_id, match.away_team.team_id]
  );

  if (goals.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-3">득점</h3>
        <div className="text-gray-500">득점 기록이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 sm:grid-cols-[1fr_40px_1fr] lg:grid-cols-[1fr_60px_1fr] gap-2 sm:gap-3 items-start">
        {/* Home Team Goals */}
        <div className="min-w-0 space-y-1 text-center">
          <div className="text-xs font-semibold text-gray-600 mb-1 text-center">
            <Link
              href={`/teams/${match.home_team.team_id}`}
              className="text-inherit no-underline hover:underline"
            >
              {match.home_team.team_name}
            </Link>
          </div>
          {sortedHomeTeamGoals.map((goal, index) => (
            <div
              key={index}
              className="flex items-center justify-center flex-wrap text-xs text-gray-700"
            >
              <div className="w-1.5 h-1.5 bg-black rounded-full mr-2"></div>
              <span className="font-medium">
                {goal.player &&
                'player_id' in goal.player &&
                goal.player.player_id ? (
                  <Link
                    href={`/players/${goal.player.player_id}`}
                    className="text-inherit no-underline hover:underline"
                  >
                    {goal.player.name}
                  </Link>
                ) : (
                  goal.player?.name || '알 수 없음'
                )}
              </span>
              <span className="ml-1 text-gray-500">
                {goal.goal_time && `${goal.goal_time}' `}
                {goal.goal_type === 'penalty'
                  ? '🎯'
                  : goal.goal_type === 'own_goal'
                    ? '🔄'
                    : '⚽'}
              </span>
              {assistsByGoal[goal.goal_id] &&
                assistsByGoal[goal.goal_id].length > 0 && (
                  <span className="ml-1 text-[11px] sm:text-xs">
                    (
                    {assistsByGoal[goal.goal_id].map((assist, index) => (
                      <React.Fragment key={assist.assist_id}>
                        {index > 0 && ', '}
                        {assist.player && assist.player.player_id ? (
                          <Link
                            href={`/players/${assist.player.player_id}`}
                            className="text-inherit no-underline hover:underline"
                          >
                            {assist.player.name}
                          </Link>
                        ) : (
                          '알 수 없음'
                        )}
                      </React.Fragment>
                    ))}{' '}
                    🎯)
                  </span>
                )}
            </div>
          ))}
          {sortedHomeTeamGoals.length === 0 && (
            <div className="text-xs text-gray-500 italic">득점 없음</div>
          )}
        </div>

        {/* Center spacer with the same width as the score box */}
        <div aria-hidden className="hidden sm:block sm:w-[40px] lg:w-[60px]" />

        {/* Away Team Goals */}
        <div className="min-w-0 space-y-1 text-center">
          <div className="text-xs font-semibold text-gray-600 mb-1 text-center">
            <Link
              href={`/teams/${match.away_team.team_id}`}
              className="text-inherit no-underline hover:underline"
            >
              {match.away_team.team_name}
            </Link>
          </div>
          {sortedAwayTeamGoals.map((goal, index) => (
            <div
              key={index}
              className="flex items-center justify-center flex-wrap text-xs text-gray-700"
            >
              <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mr-2"></div>
              <span className="font-medium">
                {goal.player &&
                'player_id' in goal.player &&
                goal.player.player_id ? (
                  <Link
                    href={`/players/${goal.player.player_id}`}
                    className="text-inherit no-underline hover:underline"
                  >
                    {goal.player.name}
                  </Link>
                ) : (
                  goal.player?.name || '알 수 없음'
                )}
              </span>
              <span className="ml-1 text-gray-500">
                {goal.goal_time && `${goal.goal_time}' `}
                {goal.goal_type === 'penalty'
                  ? '🎯'
                  : goal.goal_type === 'own_goal'
                    ? '🔄'
                    : '⚽'}
              </span>
              {assistsByGoal[goal.goal_id] &&
                assistsByGoal[goal.goal_id].length > 0 && (
                  <span className="ml-1 text-[11px] sm:text-xs">
                    (
                    {assistsByGoal[goal.goal_id].map((assist, index) => (
                      <React.Fragment key={assist.assist_id}>
                        {index > 0 && ', '}
                        {assist.player && assist.player.player_id ? (
                          <Link
                            href={`/players/${assist.player.player_id}`}
                            className="text-inherit no-underline hover:underline"
                          >
                            {assist.player.name}
                          </Link>
                        ) : (
                          '알 수 없음'
                        )}
                      </React.Fragment>
                    ))}{' '}
                    🎯)
                  </span>
                )}
            </div>
          ))}
          {sortedAwayTeamGoals.length === 0 && (
            <div className="text-xs text-gray-500 italic">득점 없음</div>
          )}
        </div>
      </div>
    </div>
  );
}
