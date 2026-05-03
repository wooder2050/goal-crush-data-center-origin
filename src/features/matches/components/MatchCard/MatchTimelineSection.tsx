'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Card, CardContent } from '@/components/ui';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

import {
  getMatchTimelinePrisma,
  type MatchTimelineResponse,
  type TimelineGoal,
} from '../../api-prisma';

interface Props {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
}

function MatchTimelineSectionInner({
  matchId,
  homeTeamId,
  awayTeamId,
}: Props) {
  const { data } = useGoalSuspenseQuery(getMatchTimelinePrisma, [
    matchId,
  ]) as { data: MatchTimelineResponse };

  const goalsWithScore = useMemo(() => {
    if (!data) return [];

    let homeScore = 0;
    let awayScore = 0;

    return data.goals
      .map((goal) => {
        const scoringTeamId =
          goal.goal_type === 'own_goal'
            ? goal.team_id === homeTeamId
              ? awayTeamId
              : homeTeamId
            : (goal.team_id ?? 0);
        return { ...goal, scoringTeamId };
      })
      .sort((a, b) => (a.goal_time ?? 999) - (b.goal_time ?? 999))
      .map((goal) => {
        if (goal.scoringTeamId === homeTeamId) homeScore++;
        else awayScore++;
        return { ...goal, homeScore, awayScore };
      });
  }, [data, homeTeamId, awayTeamId]);

  if (!data || data.goals.length === 0) return null;

  return (
    <Card>
      <CardContent className="px-3 py-4 sm:px-4">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          경기 타임라인
        </h3>

        <div className="relative">
          {/* 중앙 세로 라인 */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -translate-x-1/2" />

          <CenterLabel label="경기 시작" />

          {goalsWithScore.map((goal, index) => (
            <GoalRow
              key={`goal-${goal.goal_id}-${index}`}
              goal={goal}
              isHome={goal.scoringTeamId === homeTeamId}
            />
          ))}

          <CenterLabel label="경기 종료" />
        </div>
      </CardContent>
    </Card>
  );
}

function CenterLabel({ label }: { label: string }) {
  return (
    <div className="relative flex justify-center py-2">
      <span className="relative z-10 bg-white px-3 text-[11px] font-medium text-gray-400">
        {label}
      </span>
    </div>
  );
}

function GoalRow({
  goal,
  isHome,
}: {
  goal: TimelineGoal & {
    scoringTeamId: number;
    homeScore: number;
    awayScore: number;
  };
  isHome: boolean;
}) {
  const isOwnGoal = goal.goal_type === 'own_goal';
  const isPenalty = goal.goal_type === 'penalty';
  const scoreText = `(${goal.homeScore} - ${goal.awayScore})`;
  const typeText = isOwnGoal ? ', 자책골' : isPenalty ? ', PK' : '';

  const content = (
    <div className="space-y-0.5">
      {/* 득점자 행 */}
      <div
        className={`flex items-center gap-1.5 ${isHome ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <Link href={`/players/${goal.player_id}`} className="shrink-0">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200">
            {goal.profile_image_url ? (
              <Image
                src={goal.profile_image_url}
                alt={goal.player_name}
                width={28}
                height={28}
                className="object-cover object-top w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-[10px] font-bold">
                {goal.player_name.charAt(0)}
              </div>
            )}
          </div>
        </Link>

        <div className={isHome ? 'text-right' : 'text-left'}>
          <Link
            href={`/players/${goal.player_id}`}
            className="text-xs font-semibold text-gray-900 hover:underline"
          >
            {goal.player_name}
          </Link>
          <span className="text-xs font-bold text-gray-900 ml-1">
            {scoreText}
          </span>
          {typeText && (
            <span className="text-[10px] text-gray-400">{typeText}</span>
          )}
        </div>
      </div>

      {/* 어시스트 행 */}
      {goal.assists.length > 0 && (
        <div className={isHome ? 'text-right' : 'text-left'}>
          {goal.assists.map((a, i) => (
            <Link
              key={i}
              href={`/players/${a.player_id}`}
              className="text-[11px] text-gray-400 hover:underline"
            >
              {a.player_name}의 어시스트
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative flex items-start py-2.5">
      {/* 중앙 시간 원 */}
      <div className="absolute left-1/2 -translate-x-1/2 z-10 top-2.5">
        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
          <span className="text-[10px] font-bold text-gray-600 tabular-nums">
            {goal.goal_time != null ? `${goal.goal_time}'` : '⚽'}
          </span>
        </div>
      </div>

      {/* 홈팀 영역 (왼쪽) */}
      <div className="w-1/2 pr-6">
        {isHome && content}
      </div>

      {/* 원정팀 영역 (오른쪽) */}
      <div className="w-1/2 pl-6">
        {!isHome && content}
      </div>
    </div>
  );
}

export default function MatchTimelineSection(props: Props) {
  return (
    <GoalWrapper fallback={null}>
      <MatchTimelineSectionInner {...props} />
    </GoalWrapper>
  );
}
