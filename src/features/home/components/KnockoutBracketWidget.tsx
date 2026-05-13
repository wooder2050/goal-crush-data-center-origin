import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

import type { HomeMatch } from '../types';

interface KnockoutBracketWidgetProps {
  seasonId: number;
  knockoutMatches: HomeMatch[];
}

const STAGE_LABELS: Record<string, string> = {
  semi_final: '4강',
  last_place_match: '꼴찌 결정전',
  final: '결승전',
  relegation: '방출전',
};

const STAGE_ORDER = ['semi_final', 'last_place_match', 'final', 'relegation'];

export default function KnockoutBracketWidget({
  seasonId,
  knockoutMatches,
}: KnockoutBracketWidgetProps) {
  if (knockoutMatches.length === 0) return null;

  const grouped = new Map<string, HomeMatch[]>();
  for (const match of knockoutMatches) {
    const stage = match.tournament_stage ?? 'other';
    const list = grouped.get(stage);
    if (list) list.push(match);
    else grouped.set(stage, [match]);
  }

  const orderedStages = STAGE_ORDER.filter((s) => grouped.has(s)).concat(
    Array.from(grouped.keys()).filter((s) => !STAGE_ORDER.includes(s))
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">토너먼트 대진</CardTitle>
          <Link
            href={`/seasons/${seasonId}?tab=matches`}
            className="text-xs text-[#ff4800] hover:underline"
          >
            전체 경기 보기
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4 space-y-4">
        {orderedStages.map((stage) => {
          const matches = grouped.get(stage) ?? [];
          if (matches.length === 0) return null;
          return (
            <div key={stage}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {STAGE_LABELS[stage] ?? stage}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matches.map((match) => (
                  <BracketMatchCard key={match.match_id} match={match} />
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function BracketMatchCard({ match }: { match: HomeMatch }) {
  const isCompleted = match.status === 'completed';
  const isDateConfirmed = match.is_date_confirmed !== false;

  const hasPenalty =
    match.penalty_home_score != null && match.penalty_away_score != null;
  const tied =
    match.home_score != null &&
    match.away_score != null &&
    match.home_score === match.away_score;
  const homeWin =
    isCompleted &&
    match.home_score != null &&
    match.away_score != null &&
    (match.home_score > match.away_score ||
      (tied &&
        hasPenalty &&
        match.penalty_home_score! > match.penalty_away_score!));
  const awayWin =
    isCompleted &&
    match.home_score != null &&
    match.away_score != null &&
    (match.away_score > match.home_score ||
      (tied &&
        hasPenalty &&
        match.penalty_away_score! > match.penalty_home_score!));

  return (
    <Link
      href={`/matches/${match.match_id}`}
      className="block rounded-lg border border-gray-200 px-3 py-2.5 hover:border-[#ff4800] hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
        <span>{isCompleted ? '종료' : isDateConfirmed ? '예정' : '미정'}</span>
        {isDateConfirmed && (
          <span>
            {format(new Date(match.match_date), 'M/d HH:mm', { locale: ko })}
          </span>
        )}
      </div>

      <TeamRow
        team={match.home_team}
        score={match.home_score}
        penaltyScore={match.penalty_home_score}
        isWinner={homeWin}
        isCompleted={isCompleted}
        showPenalty={hasPenalty && tied}
      />
      <TeamRow
        team={match.away_team}
        score={match.away_score}
        penaltyScore={match.penalty_away_score}
        isWinner={awayWin}
        isCompleted={isCompleted}
        showPenalty={hasPenalty && tied}
      />
    </Link>
  );
}

function TeamRow({
  team,
  score,
  penaltyScore,
  isWinner,
  isCompleted,
  showPenalty,
}: {
  team: HomeMatch['home_team'];
  score: number | null;
  penaltyScore: number | null;
  isWinner: boolean;
  isCompleted: boolean;
  showPenalty: boolean;
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      {team?.logo ? (
        <div className="w-5 h-5 relative flex-shrink-0 rounded-full overflow-hidden">
          <Image
            src={team.logo}
            alt={team.team_name || ''}
            fill
            className="object-cover"
            sizes="20px"
          />
        </div>
      ) : (
        <div className="w-5 h-5 flex-shrink-0" />
      )}
      <span
        className={`flex-1 text-xs sm:text-sm truncate ${
          isCompleted
            ? isWinner
              ? 'font-bold text-gray-900'
              : 'text-gray-500'
            : 'font-medium text-gray-800'
        }`}
      >
        {team?.team_name ?? '미정'}
      </span>
      {isCompleted && (
        <span
          className={`text-xs sm:text-sm font-bold tabular-nums ${
            isWinner ? 'text-gray-900' : 'text-gray-500'
          }`}
        >
          {score ?? 0}
          {showPenalty && penaltyScore != null && (
            <span className="ml-1 text-[10px] font-normal text-gray-400">
              ({penaltyScore})
            </span>
          )}
        </span>
      )}
    </div>
  );
}
