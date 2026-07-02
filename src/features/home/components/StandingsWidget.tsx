'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

import type { HomeStanding, StandingsGroup } from '../types';

interface StandingsWidgetProps {
  standings: StandingsGroup[];
  seasonName: string;
  seasonId: number;
  isFallback?: boolean;
}

function FallbackBadge() {
  return (
    <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
      지난 시즌
    </span>
  );
}

export default function StandingsWidget({
  standings,
  seasonName,
  seasonId,
  isFallback = false,
}: StandingsWidgetProps) {
  const hasData = standings.some((g) => g.standings.length > 0);

  if (!hasData) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">시즌 순위표</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            순위 데이터가 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasMultipleGroups = standings.length > 1;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">시즌 순위표</CardTitle>
            {isFallback && <FallbackBadge />}
          </div>
          <Link
            href={`/seasons/${seasonId}?tab=teams`}
            className="text-xs text-[#ff4800] hover:underline"
          >
            {seasonName} 전체 보기
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6 pb-4">
        <div className="space-y-4">
          {standings.map((group) => (
            <div key={group.group_name}>
              {hasMultipleGroups && (
                <h3 className="text-sm font-semibold text-gray-700 px-3 sm:px-0 mb-2">
                  {group.group_name}
                </h3>
              )}
              <StandingsTable standings={group.standings} seasonId={seasonId} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StandingsTable({
  standings,
  seasonId,
}: {
  standings: HomeStanding[];
  seasonId: number;
}) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-sm text-gray-500">
            <th className="text-center py-2.5 px-3 w-10">#</th>
            <th className="text-left py-2.5 px-3">팀</th>
            <th className="text-center py-2.5 px-2 hidden sm:table-cell">
              경기
            </th>
            <th className="text-center py-2.5 px-2 hidden sm:table-cell">승</th>
            <th className="text-center py-2.5 px-2 hidden sm:table-cell">패</th>
            <th className="text-center py-2.5 px-2 whitespace-nowrap">득점</th>
            <th className="text-center py-2.5 px-2 whitespace-nowrap">득실</th>
            <th className="text-center py-2.5 px-2 font-bold whitespace-nowrap">
              승점
            </th>
            <th className="text-left py-2.5 px-2 whitespace-nowrap hidden sm:table-cell">
              최근
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => (
            <tr
              key={s.standing_id}
              className="border-b border-gray-100 last:border-0 cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-50"
              onClick={() => router.push(`/seasons/${seasonId}?tab=teams`)}
            >
              <td className="text-center py-2.5 px-3 text-sm font-medium text-gray-500">
                {s.position}
              </td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  {s.team?.logo && (
                    <div className="w-6 h-6 relative flex-shrink-0 rounded-full overflow-hidden">
                      <Image
                        src={s.team.logo}
                        alt={s.team?.team_name || ''}
                        fill
                        className="object-cover"
                        sizes="24px"
                      />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-800 truncate max-w-[120px] sm:max-w-none">
                    {s.team?.team_name?.replace('FC ', '')}
                  </span>
                </div>
              </td>
              <td className="text-center py-2.5 px-2 text-sm text-gray-600 hidden sm:table-cell">
                {s.matches_played ?? 0}
              </td>
              <td className="text-center py-2.5 px-2 text-sm text-gray-600 hidden sm:table-cell">
                {s.wins ?? 0}
              </td>
              <td className="text-center py-2.5 px-2 text-sm text-gray-600 hidden sm:table-cell">
                {s.losses ?? 0}
              </td>
              <td className="text-center py-2.5 px-2 text-sm text-gray-600">
                {s.goals_for ?? 0}
              </td>
              <td className="text-center py-2.5 px-2 text-sm text-gray-600">
                {(s.goal_difference ?? 0) > 0
                  ? `+${s.goal_difference}`
                  : (s.goal_difference ?? 0)}
              </td>
              <td className="text-center py-2.5 px-2 text-sm font-bold text-gray-900">
                {s.points ?? 0}
              </td>
              <td className="py-2.5 px-2 hidden sm:table-cell">
                <RecentResults form={s.form} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentResults({ form }: { form: string | null }) {
  if (!form) return null;

  const getResult = (char: string) => {
    if (char === 'W') return { label: '승', className: 'bg-green-500' };
    if (char === 'L') return { label: '패', className: 'bg-red-500' };
    return null;
  };

  return (
    <div
      className="flex items-center gap-1"
      role="list"
      aria-label="최근 경기 결과"
    >
      {form
        .split('')
        .reverse()
        .map((char, i) => {
          const result = getResult(char);
          if (!result) return null;
          return (
            <span
              key={i}
              role="listitem"
              aria-label={result.label}
              className={`w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${result.className}`}
            >
              {result.label}
            </span>
          );
        })}
    </div>
  );
}
