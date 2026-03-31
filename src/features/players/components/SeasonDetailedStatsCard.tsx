'use client';

import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useGoalQuery } from '@/hooks/useGoalQuery';
import { shortenSeasonName } from '@/lib/utils';

interface StatItem {
  value: number;
  percentile: number;
  percentile_per_match: number;
}

interface DetailedStatsData {
  matches: number;
  shooting: Record<string, StatItem>;
  passing: Record<string, StatItem>;
  possession: Record<string, StatItem>;
  defense: Record<string, StatItem>;
  distribution: Record<string, StatItem>;
  discipline: Record<string, StatItem>;
}

interface SeasonOption {
  season_id: number;
  season_name: string;
  match_count: number;
}

interface DetailedStatsResponse {
  seasons: SeasonOption[];
  season_id: number;
  total_players: number;
  is_goalkeeper: boolean;
  data: DetailedStatsData | null;
}

async function fetchDetailedStats(
  playerId: number,
  seasonId?: number
): Promise<DetailedStatsResponse> {
  const qs = seasonId ? `&season_id=${seasonId}` : '';
  const res = await fetch(
    `/api/stats/player-detailed-stats?player_id=${playerId}${qs}`
  );
  if (!res.ok) throw new Error('Failed to fetch detailed stats');
  return res.json();
}

// ── 필드 플레이어 지표 정의 ──
type StatDef = {
  category: string;
  label: string;
  items: Array<{
    key: string;
    label: string;
    source: string;
    tooltip?: string;
  }>;
};

const FIELD_STATS: StatDef[] = [
  {
    category: 'shooting',
    label: '슈팅',
    items: [
      { key: 'goals', label: '득점', source: 'shooting' },
      { key: 'shots', label: '슈팅', source: 'shooting' },
      { key: 'shots_on_target', label: '유효 슈팅', source: 'shooting' },
    ],
  },
  {
    category: 'passing',
    label: '패스',
    items: [
      { key: 'assists', label: '어시스트', source: 'passing' },
      { key: 'passes_completed', label: '패스 성공', source: 'passing' },
      { key: 'pass_accuracy', label: '패스 정확도 %', source: 'passing' },
      { key: 'key_passes', label: '키 패스', source: 'passing' },
    ],
  },
  {
    category: 'possession',
    label: '점유율',
    items: [
      { key: 'dribbles', label: '드리블', source: 'possession' },
      {
        key: 'possession_time',
        label: '볼 점유 시간(초)',
        source: 'possession',
      },
    ],
  },
  {
    category: 'defense',
    label: '수비',
    items: [
      { key: 'tackles', label: '태클', source: 'defense' },
      { key: 'interceptions', label: '인터셉션', source: 'defense' },
      { key: 'clearances', label: '클리어런스', source: 'defense' },
    ],
  },
  {
    category: 'discipline',
    label: '반칙',
    items: [
      {
        key: 'fouls',
        label: '파울',
        source: 'discipline',
        tooltip: '적을수록 높은 순위로 표시됩니다',
      },
      {
        key: 'yellow_cards',
        label: '경고',
        source: 'discipline',
        tooltip: '적을수록 높은 순위로 표시됩니다',
      },
      {
        key: 'red_cards',
        label: '퇴장',
        source: 'discipline',
        tooltip: '적을수록 높은 순위로 표시됩니다',
      },
    ],
  },
];

// ── 골키퍼 지표 정의 ──
const GK_STATS: StatDef[] = [
  {
    category: 'goalkeeping',
    label: '골키핑',
    items: [
      { key: 'saves', label: '선방', source: 'defense' },
      {
        key: 'goals_conceded',
        label: '실점',
        source: 'defense',
        tooltip: '골키퍼끼리 비교, 적을수록 높은 순위로 표시됩니다',
      },
      { key: 'clean_sheets', label: '클린시트', source: 'defense' },
      { key: 'penalty_saves', label: '페널티 선방', source: 'defense' },
    ],
  },
  {
    category: 'distribution',
    label: '배급',
    items: [
      { key: 'gk_throws', label: '던지기 시도', source: 'distribution' },
      {
        key: 'gk_throws_completed',
        label: '던지기 성공',
        source: 'distribution',
      },
      { key: 'passes_completed', label: '패스 성공', source: 'passing' },
      { key: 'pass_accuracy', label: '패스 정확도 %', source: 'passing' },
    ],
  },
  {
    category: 'defense',
    label: '수비',
    items: [
      { key: 'clearances', label: '클리어런스', source: 'defense' },
      { key: 'interceptions', label: '인터셉션', source: 'defense' },
    ],
  },
  {
    category: 'discipline',
    label: '반칙',
    items: [
      {
        key: 'fouls',
        label: '파울',
        source: 'discipline',
        tooltip: '적을수록 높은 순위로 표시됩니다',
      },
      {
        key: 'yellow_cards',
        label: '경고',
        source: 'discipline',
        tooltip: '적을수록 높은 순위로 표시됩니다',
      },
      {
        key: 'red_cards',
        label: '퇴장',
        source: 'discipline',
        tooltip: '적을수록 높은 순위로 표시됩니다',
      },
    ],
  },
];

// 비율 지표 (경기당 환산하지 않음)
const RATE_STATS = new Set(['pass_accuracy', 'shot_accuracy']);

function getBarColor(percentile: number): string {
  if (percentile >= 70) return 'bg-green-500';
  if (percentile >= 30) return 'bg-amber-500';
  return 'bg-red-500';
}

function StatBar({
  label,
  value,
  percentile,
  tooltip,
}: {
  label: string;
  value: number | string;
  percentile: number;
  tooltip?: string;
}) {
  const displayValue =
    typeof value === 'number'
      ? value % 1 !== 0
        ? value.toFixed(1)
        : value
      : value;

  return (
    <div className="flex items-center py-2">
      {/* 좌측: 라벨 + 수치 */}
      <span className="flex flex-1 items-center gap-1 text-[14px] text-gray-700">
        {label}
        {tooltip && (
          <span className="group/tip relative cursor-help">
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-400">
              ?
            </span>
            <span className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 w-48 rounded-lg bg-gray-800 px-2.5 py-2 text-[11px] leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover/tip:opacity-100">
              {tooltip}
            </span>
          </span>
        )}
      </span>
      <span className="w-[52px] shrink-0 text-right text-[14px] font-medium text-gray-900">
        {displayValue}
      </span>
      {/* 세로 구분선 */}
      <span className="mx-3 h-4 w-px shrink-0 bg-gray-200" />
      {/* 우측: 바 그래프 (전체 절반) — 호버 영역 확장 */}
      <div className="group relative w-[45%] shrink-0 cursor-pointer py-2">
        <div className="relative h-2 overflow-hidden rounded-full bg-gray-100">
          {percentile > 0 && (
            <div
              className={`absolute inset-y-0 left-0 rounded-full ${getBarColor(percentile)}`}
              style={{ width: `${Math.min(percentile, 100)}%` }}
            />
          )}
        </div>
        <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-1.5 py-0.5 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
          상위 {100 - percentile}%
        </span>
      </div>
    </div>
  );
}

function CategoryHeader({
  label,
  isFirst,
}: {
  label: string;
  isFirst: boolean;
}) {
  return (
    <div className="flex items-center border-b border-gray-200 pb-2">
      <span className="flex-1 text-[14px] font-medium text-gray-900">
        {label}
      </span>
      {/* 세로 구분선 자리 맞추기 */}
      <span className="w-[52px] shrink-0" />
      <span className="mx-3 h-4 w-px shrink-0 bg-gray-200" />
      {isFirst && (
        <span className="flex w-[45%] shrink-0 items-center justify-center text-[13px] text-gray-400">
          순위
          <RankTooltip />
        </span>
      )}
      {!isFirst && <span className="w-[45%] shrink-0" />}
    </div>
  );
}

function RankTooltip() {
  return (
    <span className="group relative ml-1 inline-flex cursor-help items-center">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[10px] text-gray-400">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-lg bg-gray-800 px-3 py-2.5 text-[11px] leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        막대 그래프는 해당 시즌의 모든 선수와 비교한 백분위 순위입니다. 녹색은
        상위권, 주황색은 중위권, 빨간색은 하위권을 나타냅니다.
      </span>
    </span>
  );
}

export default function SeasonDetailedStatsCard({
  playerId,
}: {
  playerId: number;
}) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | undefined>(
    undefined
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mode, setMode] = useState<'total' | 'per_match'>('total');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data } = useGoalQuery(
    fetchDetailedStats,
    [playerId, selectedSeasonId],
    { staleTime: 5 * 60 * 1000 }
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const handleSelectSeason = useCallback((seasonId: number) => {
    setSelectedSeasonId(seasonId);
    setDropdownOpen(false);
  }, []);

  const statDefs = data?.is_goalkeeper ? GK_STATS : FIELD_STATS;
  const stats = data?.data;
  const matches = stats?.matches ?? 1;

  // 카테고리별 렌더링 데이터 생성
  const renderedCategories = useMemo(() => {
    if (!stats) return [];

    // 0이어도 표시할 카테고리 + 역순 지표 (적을수록 좋음)
    const SHOW_ZERO_CATEGORIES = new Set(['discipline']);
    const INVERSE_CATEGORIES = new Set(['discipline']);

    return statDefs
      .map((cat) => {
        const showZero = SHOW_ZERO_CATEGORIES.has(cat.category);
        const isInverse = INVERSE_CATEGORIES.has(cat.category);
        const items = cat.items
          .map((item) => {
            const source = stats[item.source as keyof DetailedStatsData] as
              | Record<string, StatItem>
              | undefined;
            const statItem = source?.[item.key];
            if (!statItem) return null;
            if (!showZero && statItem.value === 0) return null;

            let displayValue: number = statItem.value;
            if (mode === 'per_match' && !RATE_STATS.has(item.key)) {
              displayValue = Math.round((statItem.value / matches) * 100) / 100;
            }

            let percentile =
              mode === 'per_match'
                ? statItem.percentile_per_match
                : statItem.percentile;

            // 역순 지표에서 값이 0이면 최고 (100%)
            if (isInverse && statItem.value === 0) {
              percentile = 100;
            }

            return {
              key: item.key,
              label: item.label,
              value: displayValue,
              percentile,
              tooltip: item.tooltip,
            };
          })
          .filter(Boolean) as Array<{
          key: string;
          label: string;
          value: number;
          percentile: number;
          tooltip?: string;
        }>;

        if (items.length === 0) return null;
        return { label: cat.label, items };
      })
      .filter(Boolean) as Array<{
      label: string;
      items: Array<{
        key: string;
        label: string;
        value: number;
        percentile: number;
        tooltip?: string;
      }>;
    }>;
  }, [stats, statDefs, mode, matches]);

  if (
    !data?.data ||
    !data.seasons ||
    data.seasons.length === 0 ||
    renderedCategories.length === 0
  )
    return null;

  const seasons = data.seasons;
  const currentSeason = seasons.find((s) => s.season_id === data.season_id);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4">
        <div
          className="relative flex items-center justify-between"
          ref={dropdownRef}
        >
          <p className="text-[18px] font-medium text-gray-900">시즌 성적</p>

          {seasons.length > 1 && (
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {currentSeason
                ? shortenSeasonName(currentSeason.season_name)
                : '시즌'}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
          )}

          {seasons.length === 1 && currentSeason && (
            <span className="text-[13px] text-gray-500">
              {shortenSeasonName(currentSeason.season_name)}
            </span>
          )}

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 max-h-60 w-52 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              {seasons.map((s) => (
                <button
                  key={s.season_id}
                  onClick={() => handleSelectSeason(s.season_id)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-gray-50 ${
                    s.season_id === data.season_id
                      ? 'font-medium text-gray-900'
                      : 'text-gray-600'
                  }`}
                >
                  <span>{shortenSeasonName(s.season_name)}</span>
                  <span className="text-[12px] text-gray-400">
                    {s.match_count}경기
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mode toggle + info */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <p className="text-[12px] text-gray-400">
          {stats?.matches ?? 0}경기 기준
        </p>
        <div className="flex overflow-hidden rounded-lg border border-gray-200 text-[12px]">
          <button
            onClick={() => setMode('total')}
            className={`px-3 py-1.5 font-medium transition-colors ${
              mode === 'total'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            합계
          </button>
          <button
            onClick={() => setMode('per_match')}
            className={`px-3 py-1.5 font-medium transition-colors ${
              mode === 'per_match'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            경기당
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 pb-5">
        <div className="space-y-4">
          {renderedCategories.map((cat, catIdx) => (
            <div key={cat.label}>
              <CategoryHeader label={cat.label} isFirst={catIdx === 0} />
              <div>
                {cat.items.map((item) => (
                  <StatBar
                    key={item.key}
                    label={item.label}
                    value={item.value}
                    percentile={item.percentile}
                    tooltip={item.tooltip}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
