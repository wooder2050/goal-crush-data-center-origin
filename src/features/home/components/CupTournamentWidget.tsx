'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

import type { HomeMatch } from '../types';

interface CupTournamentWidgetProps {
  seasonId: number;
  seasonName: string;
  matches: HomeMatch[];
}

const STAGE_LABELS: Record<string, string> = {
  round_1: '1라운드',
  round_of_6: '6강',
  quarter_final: '8강',
  semi_final: '4강',
  final: '결승',
};

const STAGE_ORDER = [
  'round_1',
  'quarter_final',
  'round_of_6',
  'semi_final',
  'final',
];

/**
 * 컵(토너먼트) 대회용 홈 위젯 — 승점 순위표 대신 라운드별 대진·결과를 표시.
 * 라운드는 matches.tournament_stage 기준으로 그룹핑.
 */
export default function CupTournamentWidget({
  seasonId,
  seasonName,
  matches,
}: CupTournamentWidgetProps) {
  const byStage = new Map<string, HomeMatch[]>();
  for (const match of matches) {
    const stage = match.tournament_stage ?? 'unknown';
    const list = byStage.get(stage);
    if (list) list.push(match);
    else byStage.set(stage, [match]);
  }
  const orderedStages = STAGE_ORDER.filter((s) => byStage.has(s)).concat(
    Array.from(byStage.keys()).filter((s) => !STAGE_ORDER.includes(s))
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">토너먼트 현황</CardTitle>
          <Link
            href={`/seasons/${seasonId}?tab=matches`}
            className="text-xs text-[#ff4800] hover:underline"
          >
            {seasonName} 전체 보기
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4">
        {matches.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            등록된 경기가 없습니다.
          </p>
        ) : (
          <div className="space-y-1">
            {orderedStages.map((stage) => (
              <div key={stage}>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 py-1.5 mt-1">
                  {STAGE_LABELS[stage] ?? '라운드 미정'}
                </div>
                {(byStage.get(stage) ?? []).map((match) => (
                  <CupMatchRow key={match.match_id} match={match} />
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CupMatchRow({ match }: { match: HomeMatch }) {
  const isCompleted = match.status === 'completed';
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
      className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
    >
      <TeamSide
        name={match.home_team?.team_name}
        logo={match.home_team?.logo}
        emphasized={homeWin}
        muted={awayWin}
        align="right"
      />
      <div className="flex-shrink-0 w-12 sm:w-14 text-center">
        {isCompleted ? (
          <>
            <span className="text-xs sm:text-sm font-bold text-gray-900">
              {match.home_score ?? 0} - {match.away_score ?? 0}
            </span>
            {hasPenalty && (
              <div className="text-[10px] text-gray-400 leading-tight">
                PK {match.penalty_home_score}-{match.penalty_away_score}
              </div>
            )}
          </>
        ) : match.is_date_confirmed !== false ? (
          <>
            <div className="text-[10px] sm:text-xs text-gray-400">
              {format(new Date(match.match_date), 'M/d', { locale: ko })}
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-600">
              {format(new Date(match.match_date), 'HH:mm')}
            </div>
          </>
        ) : (
          <span className="text-[11px] text-amber-600 font-medium">미정</span>
        )}
      </div>
      <TeamSide
        name={match.away_team?.team_name}
        logo={match.away_team?.logo}
        emphasized={awayWin}
        muted={homeWin}
        align="left"
      />
    </Link>
  );
}

function TeamSide({
  name,
  logo,
  emphasized,
  muted,
  align,
}: {
  name: string | undefined;
  logo: string | null | undefined;
  emphasized: boolean;
  muted: boolean;
  align: 'left' | 'right';
}) {
  const textCls = emphasized
    ? 'font-bold text-gray-900'
    : muted
      ? 'text-gray-500'
      : 'font-medium text-gray-800';

  return (
    <div
      className={`flex-1 flex items-center gap-1.5 min-w-0 ${
        align === 'right' ? 'justify-end' : ''
      }`}
    >
      {align === 'left' && logo && <TeamLogo src={logo} name={name} />}
      <span
        className={`text-xs sm:text-sm truncate ${textCls} ${
          align === 'right' ? 'order-first' : ''
        }`}
      >
        {name}
      </span>
      {align === 'right' && logo && <TeamLogo src={logo} name={name} />}
    </div>
  );
}

function TeamLogo({ src, name }: { src: string; name?: string }) {
  return (
    <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 rounded-full overflow-hidden">
      <Image
        src={src}
        alt={name || ''}
        fill
        className="object-cover"
        sizes="24px"
      />
    </div>
  );
}
