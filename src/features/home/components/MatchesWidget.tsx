'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { trackSelectContent } from '@/lib/analytics';
import { formatKstMonthDay, formatKstTime } from '@/lib/kst';

import type { HomeMatch, LatestMatchGoals } from '../types';
import { shortSeasonName } from './SeasonScopeBadge';

interface MatchesWidgetProps {
  seasonId: number;
  recentMatches: HomeMatch[];
  upcomingMatches: HomeMatch[];
  knockoutMatches?: HomeMatch[];
  /** 가장 최근 완료 경기의 득점 기록 (최근 결과 첫 행과 같은 경기일 때만 표시) */
  latestMatchGoals?: LatestMatchGoals | null;
}

const STAGE_LABELS: Record<string, string> = {
  semi_final: '4강전',
  last_place_match: '꼴찌 결정전',
  final: '결승전',
  relegation: '방출전',
};

// 4강전은 토너먼트 섹션에서 표시하지 않음 (꼴찌 결정전/결승전만 노출)
const STAGE_ORDER = ['last_place_match', 'final', 'relegation'];
const HIDDEN_STAGES = ['semi_final'];

export default function MatchesWidget({
  seasonId,
  recentMatches,
  upcomingMatches,
  knockoutMatches = [],
  latestMatchGoals = null,
}: MatchesWidgetProps) {
  const hasNoMatches =
    recentMatches.length === 0 &&
    upcomingMatches.length === 0 &&
    knockoutMatches.length === 0;

  const knockoutByStage = new Map<string, HomeMatch[]>();
  for (const match of knockoutMatches) {
    const stage = match.tournament_stage ?? 'other';
    const list = knockoutByStage.get(stage);
    if (list) list.push(match);
    else knockoutByStage.set(stage, [match]);
  }
  const orderedStages = STAGE_ORDER.filter((s) =>
    knockoutByStage.has(s)
  ).concat(
    Array.from(knockoutByStage.keys()).filter(
      (s) => !STAGE_ORDER.includes(s) && !HIDDEN_STAGES.includes(s)
    )
  );

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
                {recentMatches.map((match, i) => {
                  const seasonId = match.season?.season_id;
                  // 시즌이 바뀌는 지점마다 시즌명을 붙여 여러 대회 결과가 섞여도 구분되게
                  const showSeason =
                    match.season &&
                    (i === 0 ||
                      recentMatches[i - 1].season?.season_id !== seasonId);
                  return (
                    <div key={match.match_id}>
                      {showSeason && (
                        <div className="px-2 pt-1 text-[11px] text-gray-400">
                          {shortSeasonName(match.season!.season_name)}
                        </div>
                      )}
                      <CompletedMatchRow match={match} />
                      {i === 0 &&
                        latestMatchGoals?.match.match_id === match.match_id && (
                          <LatestScorers
                            match={match}
                            goals={latestMatchGoals.goals}
                          />
                        )}
                    </div>
                  );
                })}
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

            {/* Knockout Matches by Stage */}
            {orderedStages.map((stage) => {
              const stageMatches = knockoutByStage.get(stage) ?? [];
              if (stageMatches.length === 0) return null;
              return (
                <div key={stage}>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 py-1.5 mt-2">
                    {STAGE_LABELS[stage] ?? stage}
                  </div>
                  {stageMatches.map((match) => (
                    <InterleagueMatchRow key={match.match_id} match={match} />
                  ))}
                </div>
              );
            })}
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
              alt={match.home_team?.team_name || ''}
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
              alt={match.away_team?.team_name || ''}
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

/**
 * 최신 경기 득점자 → 선수 상세 링크.
 * 득점 기록이 없는데 스코어가 있으면 '등록된 득점자 기록 없음'(0:0이면 표시 안 함)
 */
function LatestScorers({
  match,
  goals,
}: {
  match: HomeMatch;
  goals: LatestMatchGoals['goals'];
}) {
  const totalScore = (match.home_score ?? 0) + (match.away_score ?? 0);
  if (goals.length === 0) {
    if (totalScore === 0) return null;
    return (
      <p className="px-2 pb-1.5 text-[11px] text-gray-400">
        등록된 득점자 기록 없음
      </p>
    );
  }
  return (
    <p className="px-2 pb-1.5 text-[11px] leading-5 text-gray-500">
      <span className="mr-1 text-gray-400">득점</span>
      {goals.map((g, i) => (
        <span key={g.goal_id}>
          {i > 0 && ' · '}
          <Link
            href={`/players/${g.player_id}`}
            onClick={() =>
              trackSelectContent({
                module: 'home_latest_scorers',
                destination: 'player',
              })
            }
            className="text-gray-700 underline-offset-2 hover:underline"
          >
            {g.player_name}
          </Link>
          {g.goal_time != null && ` ${g.goal_time}'`}
          {g.goal_type === 'own_goal' && ' (자책)'}
          {g.goal_type === 'penalty' && ' (PK)'}
        </span>
      ))}
    </p>
  );
}

function UpcomingMatchRow({ match }: { match: HomeMatch }) {
  const isDateConfirmed = match.is_date_confirmed !== false;

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
              alt={match.home_team?.team_name || ''}
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
        )}
      </div>

      {/* Date & Time */}
      <div className="flex-shrink-0 w-12 sm:w-14 text-center">
        {isDateConfirmed ? (
          <>
            <div className="text-[10px] sm:text-xs text-gray-400">
              {formatKstMonthDay(match.match_date)}
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-600">
              {formatKstTime(match.match_date)}
            </div>
          </>
        ) : (
          <span className="text-[11px] text-amber-600 font-medium">미정</span>
        )}
      </div>

      {/* Away Team */}
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        {match.away_team?.logo && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 rounded-full overflow-hidden">
            <Image
              src={match.away_team.logo}
              alt={match.away_team?.team_name || ''}
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

function InterleagueMatchRow({ match }: { match: HomeMatch }) {
  const isCompleted = match.status === 'completed';
  const isDateConfirmed = match.is_date_confirmed !== false;

  return (
    <Link
      href={`/matches/${match.match_id}`}
      className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
    >
      {/* Home Team */}
      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
        <span
          className={`text-xs sm:text-sm truncate ${
            isCompleted &&
            match.home_score != null &&
            match.away_score != null &&
            match.home_score > match.away_score
              ? 'font-bold text-gray-900'
              : isCompleted
                ? 'text-gray-600'
                : 'font-medium text-gray-800'
          }`}
        >
          {match.home_team?.team_name}
        </span>
        {match.home_team?.logo && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 rounded-full overflow-hidden">
            <Image
              src={match.home_team.logo}
              alt={match.home_team?.team_name || ''}
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
        )}
      </div>

      {/* Center: Score / Time / TBD */}
      <div className="flex-shrink-0 w-12 sm:w-14 text-center">
        {isCompleted ? (
          <span className="text-xs sm:text-sm font-bold text-gray-900">
            {match.home_score ?? 0} - {match.away_score ?? 0}
          </span>
        ) : isDateConfirmed ? (
          <>
            <div className="text-[10px] sm:text-xs text-gray-400">
              {formatKstMonthDay(match.match_date)}
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-600">
              {formatKstTime(match.match_date)}
            </div>
          </>
        ) : (
          <span className="text-[11px] text-amber-600 font-medium">미정</span>
        )}
      </div>

      {/* Away Team */}
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        {match.away_team?.logo && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 rounded-full overflow-hidden">
            <Image
              src={match.away_team.logo}
              alt={match.away_team?.team_name || ''}
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
        )}
        <span
          className={`text-xs sm:text-sm truncate ${
            isCompleted &&
            match.home_score != null &&
            match.away_score != null &&
            match.away_score > match.home_score
              ? 'font-bold text-gray-900'
              : isCompleted
                ? 'text-gray-600'
                : 'font-medium text-gray-800'
          }`}
        >
          {match.away_team?.team_name}
        </span>
      </div>
    </Link>
  );
}
