'use client';

import { useSuspenseQueries } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useMemo, useState } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import {
  RatingTypeDescription,
  RatingTypeTabs,
} from '@/components/ui/rating-type-tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TopRatedPlayerRow } from '@/features/stats/api-prisma';
import {
  getTopAppearancesPrisma,
  getTopAssistsPrisma,
  getTopAttackPointsPrisma,
  getTopRatingsPrisma,
  getTopScorersPrisma,
  getTopXtRatingsPrisma,
} from '@/features/stats/api-prisma';
import { goalQueryOptions } from '@/hooks/useGoalQuery';
import type { PlayerSeasonStats } from '@/lib/types';
import { getRatingBgColor, getRatingTextColor } from '@/lib/utils';

type PlayerSeasonStatsWithNames = PlayerSeasonStats & {
  player_name: string | null;
  player_image?: string | null;
  team_name: string | null;
  team_logo?: string | null;
};

interface PlayerSeasonRankingTableProps {
  seasonId: number;
  className?: string;
}

// ── 공유 셀 ──────────────────────────────────────────────

/** 순위 셀 — 1~3위 금/은/동 색상 */
function RankCell({ rank }: { rank: number }) {
  return (
    <TableCell className="text-center">
      <span
        className={`font-bold ${
          rank === 1
            ? 'text-yellow-600'
            : rank === 2
              ? 'text-gray-500'
              : rank === 3
                ? 'text-orange-600'
                : 'text-gray-500'
        }`}
      >
        {rank}
      </span>
    </TableCell>
  );
}

/** 선수 셀 — 프로필 이미지 + 팀 로고 오버레이 + 이름/팀 (FotMob 스타일) */
function PlayerCell({
  playerId,
  playerName,
  playerImage,
  teamName,
  teamLogo,
}: {
  playerId: number | null;
  playerName: string | null;
  playerImage?: string | null;
  teamName: string | null;
  teamLogo?: string | null;
}) {
  return (
    <TableCell>
      <div className="flex items-center gap-2">
        <div className="relative flex-shrink-0">
          {playerImage ? (
            <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gray-100">
              <Image
                src={playerImage}
                alt={playerName ?? '선수'}
                fill
                sizes="36px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
              {(playerName ?? '-').charAt(0)}
            </div>
          )}
          {teamLogo && (
            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-white p-0.5 shadow-sm">
              <div className="relative h-full w-full overflow-hidden rounded-full">
                <Image
                  src={teamLogo}
                  alt="팀 로고"
                  fill
                  sizes="14px"
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <Link
            href={`/players/${playerId}`}
            className="font-medium hover:underline hover:text-blue-600 transition-colors block truncate"
          >
            {playerName ?? '알 수 없음'}
          </Link>
          <div className="text-xs text-gray-500 truncate">
            {teamName ?? '알 수 없음'}
          </div>
        </div>
      </div>
    </TableCell>
  );
}

// ── 스탯 순위 테이블 (득점/도움/공격포인트/출전 공용) ──────

type StatColumn = {
  header: string;
  value: (row: PlayerSeasonStatsWithNames) => number;
  /** 강조 컬럼 — 모바일에서도 표시, 파란색 볼드 */
  highlight?: boolean;
  /** 비강조인데 볼드 처리 (기존 도움/출전 테이블의 골 컬럼 스타일 유지) */
  bold?: boolean;
};

function StatRankingTable({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: PlayerSeasonStatsWithNames[];
  columns: StatColumn[];
}) {
  return (
    <div>
      <h4 className="mb-3 sm:mb-4 font-semibold">{title}</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center whitespace-nowrap">
              순위
            </TableHead>
            <TableHead className="whitespace-nowrap">선수</TableHead>
            {columns.map((c) => (
              <TableHead
                key={c.header}
                className={`whitespace-nowrap text-center ${
                  c.highlight ? '' : 'hidden sm:table-cell'
                }`}
              >
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={2 + columns.length}
                className="text-center text-gray-500 py-6"
              >
                개인 순위 데이터가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow key={row.stat_id}>
                <RankCell rank={idx + 1} />
                <PlayerCell
                  playerId={row.player_id}
                  playerName={row.player_name}
                  playerImage={row.player_image}
                  teamName={row.team_name}
                  teamLogo={row.team_logo}
                />
                {columns.map((c) => (
                  <TableCell
                    key={c.header}
                    className={
                      c.highlight
                        ? 'text-center font-semibold text-blue-600'
                        : `hidden sm:table-cell text-center text-gray-600${
                            c.bold ? ' font-semibold' : ''
                          }`
                    }
                  >
                    {c.value(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ── 스켈레톤 ─────────────────────────────────────────────

function PlayerSeasonRankingTableSkeleton({
  className = '',
}: {
  className?: string;
}) {
  const SkeletonRow = () => (
    <div className="flex items-center gap-3 p-2 border-b border-gray-100">
      <div className="w-6 h-5 bg-gray-200 rounded animate-pulse"></div>
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="w-20 h-4 bg-gray-200 rounded mb-1 animate-pulse"></div>
        <div className="w-14 h-3 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="w-8 h-4 bg-gray-200 rounded animate-pulse hidden sm:block"></div>
      <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
      <div className="w-8 h-4 bg-gray-200 rounded animate-pulse hidden sm:block"></div>
    </div>
  );

  return (
    <div className={className}>
      <h3 className="text-lg font-bold mb-2">개인 순위</h3>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        {['득점 TOP 10', '도움 TOP 10', '공격포인트 TOP 10', '출전 TOP 10'].map(
          (title) => (
            <div key={title}>
              <h4 className="mb-3 sm:mb-4 font-semibold">{title}</h4>
              <div>
                {Array.from({ length: 10 }).map((_, index) => (
                  <SkeletonRow key={index} />
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── 본체 ─────────────────────────────────────────────────

function PlayerSeasonRankingTableInner({
  seasonId,
  className,
}: PlayerSeasonRankingTableProps) {
  // 6개 쿼리를 병렬 실행 — 직렬 suspense 체인(RTT×6) 방지
  const [
    { data: topScorers },
    { data: topAppearances },
    { data: topAssists },
    { data: topAttackPoints },
    { data: topRatings },
    { data: topXtRatings },
  ] = useSuspenseQueries({
    queries: [
      goalQueryOptions(getTopScorersPrisma, [seasonId, 10]),
      goalQueryOptions(getTopAppearancesPrisma, [seasonId, 10]),
      goalQueryOptions(getTopAssistsPrisma, [seasonId, 10]),
      goalQueryOptions(getTopAttackPointsPrisma, [seasonId, 10]),
      goalQueryOptions(getTopRatingsPrisma, [seasonId, 10]),
      goalQueryOptions(getTopXtRatingsPrisma, [seasonId, 10]),
    ],
  });

  const sortedAppearances = useMemo(() => {
    return [...topAppearances].sort((a, b) => {
      const aApps = a.matches_played ?? 0;
      const bApps = b.matches_played ?? 0;
      if (bApps !== aApps) return bApps - aApps;
      const aGoals = a.goals ?? 0;
      const bGoals = b.goals ?? 0;
      if (bGoals !== aGoals) return bGoals - aGoals;
      const aAst = a.assists ?? 0;
      const bAst = b.assists ?? 0;
      return bAst - aAst;
    });
  }, [topAppearances]);

  const sortedAssists = useMemo(() => {
    return [...topAssists].sort((a, b) => {
      const aAst = a.assists ?? 0;
      const bAst = b.assists ?? 0;
      if (bAst !== aAst) return bAst - aAst;
      const aGoals = a.goals ?? 0;
      const bGoals = b.goals ?? 0;
      if (bGoals !== aGoals) return bGoals - aGoals;
      const aApps = a.matches_played ?? 0;
      const bApps = b.matches_played ?? 0;
      return bApps - aApps;
    });
  }, [topAssists]);

  return (
    <div className={className}>
      <h3 className="text-lg font-bold mb-2">개인 순위</h3>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        {(topRatings.length > 0 || topXtRatings.length > 0) && (
          <RatingRankingTable
            topRatings={topRatings}
            topXtRatings={topXtRatings}
          />
        )}
        <StatRankingTable
          title="득점 TOP 10"
          rows={topScorers}
          columns={[
            { header: '경기', value: (r) => r.matches_played ?? 0 },
            { header: '골', value: (r) => r.goals ?? 0, highlight: true },
            { header: '도움', value: (r) => r.assists ?? 0 },
          ]}
        />
        <StatRankingTable
          title="도움 TOP 10"
          rows={sortedAssists}
          columns={[
            { header: '경기', value: (r) => r.matches_played ?? 0 },
            { header: '골', value: (r) => r.goals ?? 0, bold: true },
            { header: '도움', value: (r) => r.assists ?? 0, highlight: true },
          ]}
        />
        <StatRankingTable
          title="공격포인트 TOP 10"
          rows={topAttackPoints}
          columns={[
            { header: '골', value: (r) => r.goals ?? 0 },
            { header: '도움', value: (r) => r.assists ?? 0 },
            {
              header: '포인트',
              value: (r) => (r.goals ?? 0) + (r.assists ?? 0),
              highlight: true,
            },
          ]}
        />
        <StatRankingTable
          title="출전 TOP 10"
          rows={sortedAppearances}
          columns={[
            {
              header: '경기',
              value: (r) => r.matches_played ?? 0,
              highlight: true,
            },
            { header: '골', value: (r) => r.goals ?? 0, bold: true },
            { header: '도움', value: (r) => r.assists ?? 0 },
          ]}
        />
      </div>
    </div>
  );
}

function RatingRankingTable({
  topRatings,
  topXtRatings = [],
}: {
  topRatings: TopRatedPlayerRow[];
  topXtRatings?: TopRatedPlayerRow[];
}) {
  const [ratingType, setRatingType] = useState<'stats' | 'xt'>('stats');

  const showTabs = topRatings.length > 0 && topXtRatings.length > 0;
  const effectiveType =
    ratingType === 'xt' && topXtRatings.length === 0
      ? 'stats'
      : ratingType === 'stats' && topRatings.length === 0
        ? 'xt'
        : ratingType;
  const displayData = effectiveType === 'xt' ? topXtRatings : topRatings;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h4 className="font-semibold">평점 TOP 10</h4>
        {showTabs && (
          <RatingTypeTabs value={effectiveType} onValueChange={setRatingType} />
        )}
      </div>
      {showTabs && (
        <RatingTypeDescription type={effectiveType} className="-mt-2 mb-3" />
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center whitespace-nowrap">
              순위
            </TableHead>
            <TableHead className="whitespace-nowrap">선수</TableHead>
            <TableHead className="hidden sm:table-cell whitespace-nowrap text-center">
              경기
            </TableHead>
            <TableHead className="whitespace-nowrap text-center">
              평점
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayData.map((row, idx) => (
            <TableRow key={row.player_id}>
              <RankCell rank={idx + 1} />
              <PlayerCell
                playerId={row.player_id}
                playerName={row.player_name}
                playerImage={row.player_image}
                teamName={row.team_name}
                teamLogo={row.team_logo}
              />
              <TableCell className="hidden sm:table-cell text-center text-gray-600">
                {row.matches_rated}
              </TableCell>
              <TableCell className="text-center">
                <span
                  className={`inline-flex items-center justify-center rounded-xl px-2.5 py-0.5 text-xs font-bold ${getRatingBgColor(row.avg_rating)} ${getRatingTextColor()}`}
                >
                  {row.avg_rating.toFixed(2)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const PlayerSeasonRankingTable: FC<PlayerSeasonRankingTableProps> = ({
  seasonId,
  className,
}) => {
  return (
    <GoalWrapper
      fallback={<PlayerSeasonRankingTableSkeleton className={className} />}
    >
      <PlayerSeasonRankingTableInner
        seasonId={seasonId}
        className={className}
      />
    </GoalWrapper>
  );
};

export default PlayerSeasonRankingTable;
