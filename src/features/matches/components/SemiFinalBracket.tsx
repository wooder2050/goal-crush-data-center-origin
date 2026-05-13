'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Swords } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { GoalWrapper } from '@/common/GoalWrapper';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import type { MatchWithTeams } from '@/lib/types/database';

import { getSemiFinalMatchesPrisma } from '../api-prisma';
import { getMatchResult } from '../lib/matchUtils';

interface Props {
  seasonId: number;
  className?: string;
}

function TeamLogo({ logo, name }: { logo?: string | null; name: string }) {
  if (!logo) {
    return (
      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-[9px] text-gray-400 font-medium">
          {name.charAt(0)}
        </span>
      </div>
    );
  }
  return (
    <span className="relative h-6 w-6 overflow-hidden rounded-full flex-shrink-0">
      <Image src={logo} alt={name} fill sizes="24px" className="object-cover" />
    </span>
  );
}

function MatchRow({ match }: { match: MatchWithTeams }) {
  const router = useRouter();
  const isCompleted = match.status === 'completed';
  const isDateConfirmed = match.is_date_confirmed !== false;

  const centerContent = isCompleted
    ? getMatchResult(match)
    : isDateConfirmed
      ? format(new Date(match.match_date), 'a h:mm', { locale: ko })
      : null;

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${match.home_team?.team_name} vs ${match.away_team?.team_name}`}
      onClick={() => router.push(`/matches/${match.match_id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/matches/${match.match_id}`);
        }
      }}
      className="flex items-center py-3 px-1 cursor-pointer hover:bg-gray-50/80 transition-colors rounded"
    >
      {/* 홈팀: 오른쪽 정렬 */}
      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
        <span className="text-[13px] sm:text-sm truncate text-right">
          {match.home_team?.team_name ?? '미정'}
        </span>
        <TeamLogo
          logo={match.home_team?.logo}
          name={match.home_team?.team_name ?? ''}
        />
      </div>

      {/* 가운데: 스코어 또는 시간 */}
      <div className="w-[72px] sm:w-20 flex-shrink-0 text-center">
        {centerContent ? (
          <span
            className={`text-[13px] sm:text-sm ${
              isCompleted ? 'font-bold' : 'text-gray-500'
            }`}
          >
            {centerContent}
          </span>
        ) : (
          <span className="text-[11px] text-amber-600 font-medium">미정</span>
        )}
      </div>

      {/* 어웨이팀: 왼쪽 정렬 */}
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        <TeamLogo
          logo={match.away_team?.logo}
          name={match.away_team?.team_name ?? ''}
        />
        <span className="text-[13px] sm:text-sm truncate">
          {match.away_team?.team_name ?? '미정'}
        </span>
      </div>
    </div>
  );
}

const STAGE_LABELS: Record<string, string> = {
  semi_final: '4강',
  last_place_match: '꼴찌 결정전',
  final: '결승전',
};

const STAGE_ORDER = ['semi_final', 'last_place_match', 'final'];

function SemiFinalBracketInner({ seasonId, className = '' }: Props) {
  const { data: matches } = useGoalSuspenseQuery(getSemiFinalMatchesPrisma, [
    seasonId,
  ]);

  if (!matches || matches.length === 0) return null;

  const grouped = new Map<string, MatchWithTeams[]>();
  for (const match of matches) {
    const stage = match.tournament_stage ?? 'other';
    const list = grouped.get(stage);
    if (list) list.push(match);
    else grouped.set(stage, [match]);
  }
  const orderedStages = STAGE_ORDER.filter((s) => grouped.has(s)).concat(
    Array.from(grouped.keys()).filter((s) => !STAGE_ORDER.includes(s))
  );

  return (
    <Card
      className={`${className} overflow-hidden border-l-4 border-indigo-500 ring-1 ring-indigo-500/10`}
    >
      <CardHeader className="space-y-0 p-0 sm:p-0 md:p-0">
        <CardTitle className="text-base p-0 sm:p-0 md:p-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-indigo-500" />
            <span>토너먼트 대진표</span>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] flex-shrink-0 text-gray-500 border-gray-200"
          >
            {matches.length}경기
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-4 py-0 sm:py-0 md:py-0">
        <div className="space-y-2">
          {orderedStages.map((stage) => {
            const stageMatches = grouped.get(stage) ?? [];
            if (stageMatches.length === 0) return null;
            return (
              <div key={stage}>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pt-2 pb-1 px-1">
                  {STAGE_LABELS[stage] ?? stage}
                </div>
                <div className="divide-y divide-gray-100">
                  {stageMatches.map((m: MatchWithTeams) => (
                    <MatchRow key={m.match_id} match={m} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function SemiFinalBracketSkeleton() {
  return (
    <Card className="overflow-hidden border-l-4 border-indigo-500 ring-1 ring-indigo-500/10 animate-pulse">
      <CardHeader className="space-y-0 p-0 sm:p-0 md:p-0">
        <CardTitle className="text-base p-0 sm:p-0 md:p-0 flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-300 rounded" />
          <div className="h-4 w-24 bg-gray-300 rounded" />
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-4 py-0 sm:py-0 md:py-0">
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center py-3 px-1">
              <div className="flex-1 flex items-center justify-end gap-1.5">
                <div className="h-3.5 w-16 bg-gray-200 rounded" />
                <div className="w-6 h-6 bg-gray-200 rounded-full" />
              </div>
              <div className="w-[72px] sm:w-20 flex-shrink-0 flex justify-center">
                <div className="h-3.5 w-10 bg-gray-200 rounded" />
              </div>
              <div className="flex-1 flex items-center gap-1.5">
                <div className="w-6 h-6 bg-gray-200 rounded-full" />
                <div className="h-3.5 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SemiFinalBracket(props: Props) {
  return (
    <GoalWrapper fallback={<SemiFinalBracketSkeleton />}>
      <SemiFinalBracketInner {...props} />
    </GoalWrapper>
  );
}
