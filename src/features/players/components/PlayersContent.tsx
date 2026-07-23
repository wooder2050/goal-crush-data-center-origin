'use client';

import { Search as SearchIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PlayersPageResponse } from '@/features/players/api-prisma';
import PlayerInfiniteList from '@/features/players/components/PlayerInfiniteList';
import TeamOptionItem from '@/features/players/components/TeamOptionItem';
import { getAllSeasonsPrisma } from '@/features/seasons/api-prisma';
import { getTeamsPrisma } from '@/features/teams/api-prisma';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import type { Team } from '@/lib/types';

// 드롭다운 전용 fetcher — getTeamsPrisma/getAllSeasonsPrisma와 캐시 키를 분리한다.
// 같은 키('teamsAll' 등)를 쓰면 이 페이지의 축소형 initialData(이름·로고만)가
// 캐시를 오염시켜, 10분 내 /teams 이동 시 팀 목록이 껍데기로 렌더되는 버그 발생
const getTeamsForPlayersFilter = async () => getTeamsPrisma();
Object.defineProperty(getTeamsForPlayersFilter, 'queryKey', {
  value: 'teamsForPlayersFilter',
});
const getSeasonsForPlayersFilter = async () => getAllSeasonsPrisma();
Object.defineProperty(getSeasonsForPlayersFilter, 'queryKey', {
  value: 'seasonsForPlayersFilter',
});

// Category (position) options
const POSITION_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'FW', label: '공격수' },
  { value: 'MF', label: '미드필더' },
  { value: 'DF', label: '수비수' },
  { value: 'GK', label: '골키퍼' },
] as const;

type PositionValue = (typeof POSITION_OPTIONS)[number]['value'];
type OrderValue = 'apps' | 'goals';

export default function PlayersContent({
  initialTeams,
  initialSeasons,
  initialPlayersPage,
  initialSeasonId,
  initialTeamId,
  onTotalChange,
  controlledKeyword,
  onApplyControlledKeyword,
  hideInternalSearch,
  stickyHeaderSlot,
}: {
  initialTeams?: Array<{
    team_id: number;
    team_name: string;
    logo: string | null;
  }>;
  initialSeasons?: Array<{
    season_id: number;
    season_name: string;
    year: number;
  }>;
  initialPlayersPage?: PlayersPageResponse;
  /** URL 딥링크(?season=&team=)로 진입 시 초기 필터 */
  initialSeasonId?: number | null;
  initialTeamId?: number | null;
  onTotalChange?: (n: number) => void;
  controlledKeyword?: string;
  onApplyControlledKeyword?: () => void;
  hideInternalSearch?: boolean;
  stickyHeaderSlot?: React.ReactNode;
}) {
  const { data: teamsData } = useGoalQuery(getTeamsForPlayersFilter, [], {
    initialData: initialTeams as
      | Awaited<ReturnType<typeof getTeamsPrisma>>
      | undefined,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
  const teams = teamsData ?? initialTeams ?? [];
  const { data: seasonsData } = useGoalQuery(getSeasonsForPlayersFilter, [], {
    initialData: initialSeasons as
      | Awaited<ReturnType<typeof getAllSeasonsPrisma>>
      | undefined,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
  const seasons = seasonsData ?? initialSeasons ?? [];
  const [keyword, setKeyword] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [order, setOrder] = useState<OrderValue>('apps');
  const [position, setPosition] = useState<PositionValue>('ALL');
  const [teamId, setTeamId] = useState<number | null>(initialTeamId ?? null);
  const [seasonId, setSeasonId] = useState<number | null>(
    initialSeasonId ?? null
  );

  // 같은 페이지에서 쿼리만 바뀌는 내비게이션(홈 카드 재클릭 등)에도 필터 동기화
  useEffect(() => {
    setSeasonId(initialSeasonId ?? null);
    setTeamId(initialTeamId ?? null);
  }, [initialSeasonId, initialTeamId]);

  const teamOptions = useMemo(() => {
    // teams가 배열이 아니거나 undefined/null인 경우 빈 배열 반환
    if (!Array.isArray(teams)) {
      console.warn('teams is not an array:', teams);
      return [];
    }

    const map = new Map<
      number,
      { team_id: number; team_name: string; logo: string | null | undefined }
    >();
    for (const t of teams) {
      const id = t.team_id!;
      if (!map.has(id))
        map.set(id, {
          team_id: id,
          team_name: t.team_name ?? '',
          logo: (t as Team & { logo?: string | null }).logo ?? null,
        });
    }
    return Array.from(map.values()).sort((a, b) =>
      a.team_name.localeCompare(b.team_name)
    );
  }, [teams]);

  const seasonOptions = useMemo(() => {
    if (!Array.isArray(seasons)) {
      return [];
    }
    return seasons
      .map((s) => ({
        season_id: s.season_id!,
        season_name: s.season_name ?? '',
        year: s.year ?? 0,
      }))
      .sort((a, b) => b.year - a.year || b.season_id - a.season_id);
  }, [seasons]);

  // Select styles: visually connect with the category bar by removing trigger border and focus ring
  const triggerBase =
    'h-10 text-xs rounded-none border-0 bg-transparent px-3 shadow-none hover:bg-transparent focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0';
  const contentBase =
    'rounded-md border border-gray-200 bg-white p-0 shadow-lg';
  // Item styles: add left padding for check/emoji, remove selected background/weight
  const itemBase =
    'pl-8 pr-4 py-3 text-sm text-gray-800 data-[highlighted]:bg-gray-50 data-[state=checked]:bg-transparent data-[state=checked]:font-normal cursor-pointer';

  const applySearch = useCallback(() => {
    const next = keywordInput.trim();
    if (controlledKeyword != null) {
      if (next === controlledKeyword.trim()) return;
      onApplyControlledKeyword?.();
      return;
    }
    if (next === keyword.trim()) return;
    setKeyword(next);
  }, [keywordInput, keyword, controlledKeyword, onApplyControlledKeyword]);

  const onKeyDownInput = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applySearch();
      }
    },
    [applySearch]
  );

  return (
    <>
      {/* Sticky filter wrapper (below fixed header) */}
      <div className="sticky top-24 md:top-28 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-2 md:-top-3 left-0 right-0 h-2 md:h-3 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50"
        />
        {stickyHeaderSlot}
        {/* Mobile+Tablet: top tabs with underline */}
        <div className="mb-2 border-b bg-transparent lg:hidden">
          <div className="flex items-center gap-4 overflow-x-auto px-3 pt-3 pb-2">
            {POSITION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPosition(opt.value)}
                className={`relative whitespace-nowrap pb-2 text-sm ${position === opt.value ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
              >
                {opt.label}
                {position === opt.value && (
                  <span className="absolute inset-x-0 -bottom-px block h-px bg-gray-800/70" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile+Tablet: pill-style selects row */}
        <div className="mb-4 bg-transparent lg:hidden">
          <div className="flex items-center gap-2 overflow-x-auto px-3 py-2">
            <Select
              value={teamId != null ? String(teamId) : 'all'}
              onValueChange={(val) =>
                setTeamId(val === 'all' ? null : Number(val))
              }
            >
              <SelectTrigger className="h-9 rounded-full border border-gray-200 bg-gray-50 px-3 text-sm shadow-none focus:outline-none focus:ring-1 focus:ring-gray-300 focus:ring-offset-0 data-[state=open]:ring-1 data-[state=open]:ring-gray-300 data-[state=open]:ring-offset-0">
                <SelectValue placeholder="팀 전체" />
              </SelectTrigger>
              <SelectContent className={contentBase}>
                <SelectItem value="all" className={itemBase}>
                  <TeamOptionItem name="팀 전체" logo={null} />
                </SelectItem>
                {teamOptions.map((t) => (
                  <SelectItem
                    key={t.team_id}
                    value={String(t.team_id)}
                    className={itemBase}
                  >
                    <TeamOptionItem name={t.team_name} logo={t.logo ?? null} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={order}
              onValueChange={(val) => setOrder((val as OrderValue) ?? 'apps')}
            >
              <SelectTrigger className="h-9 rounded-full border border-gray-200 bg-gray-50 px-3 text-sm shadow-none focus:outline-none focus:ring-1 focus:ring-gray-300 focus:ring-offset-0 data-[state=open]:ring-1 data-[state=open]:ring-gray-300 data-[state=open]:ring-offset-0">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent className={contentBase}>
                <SelectItem value="apps" className={itemBase}>
                  🏃 출전 많은 순
                </SelectItem>
                <SelectItem value="goals" className={itemBase}>
                  ⚽️ 골 많은 순
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={seasonId != null ? String(seasonId) : 'all'}
              onValueChange={(val) =>
                setSeasonId(val === 'all' ? null : Number(val))
              }
            >
              <SelectTrigger className="h-9 rounded-full border border-gray-200 bg-gray-50 px-3 text-sm shadow-none focus:outline-none focus:ring-1 focus:ring-gray-300 focus:ring-offset-0 data-[state=open]:ring-1 data-[state=open]:ring-gray-300 data-[state=open]:ring-offset-0">
                <SelectValue placeholder="시즌 전체" />
              </SelectTrigger>
              <SelectContent className={contentBase}>
                <SelectItem value="all" className={itemBase}>
                  📅 시즌 전체
                </SelectItem>
                {seasonOptions.map((s) => (
                  <SelectItem
                    key={s.season_id}
                    value={String(s.season_id)}
                    className={itemBase}
                  >
                    {s.season_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Desktop (lg+): original combined bar */}
        <div className="mb-4 hidden rounded-md border bg-white lg:block">
          <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 px-3 py-3">
            {/* Left: category tabs with separators */}
            <div className="hidden max-w-full items-center gap-4 overflow-x-auto lg:flex">
              {POSITION_OPTIONS.map((opt, idx) => (
                <div key={opt.value} className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setPosition(opt.value)}
                    className={`whitespace-nowrap text-sm ${position === opt.value ? 'font-semibold text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {opt.label}
                  </button>
                  {idx < POSITION_OPTIONS.length - 1 && (
                    <span className="hidden h-5 w-px bg-gray-200 sm:inline-block" />
                  )}
                </div>
              ))}
            </div>

            {/* Right: team select + order select (left vertical divider + inner dividers) */}
            <div className="hidden items-center gap-2 lg:flex lg:gap-0 lg:pl-3 lg:ml-3 lg:border-l lg:border-gray-200 lg:divide-x lg:divide-gray-200">
              <div className="px-0 sm:px-3">
                <Select
                  value={teamId != null ? String(teamId) : 'all'}
                  onValueChange={(val) =>
                    setTeamId(val === 'all' ? null : Number(val))
                  }
                >
                  <SelectTrigger
                    className={`${triggerBase} min-w-[120px] sm:min-w-[150px]`}
                  >
                    <SelectValue placeholder="팀 전체" />
                  </SelectTrigger>
                  <SelectContent className={contentBase}>
                    <SelectItem value="all" className={itemBase}>
                      <TeamOptionItem name="팀 전체" logo={null} />
                    </SelectItem>
                    {teamOptions.map((t) => (
                      <SelectItem
                        key={t.team_id}
                        value={String(t.team_id)}
                        className={itemBase}
                      >
                        <TeamOptionItem
                          name={t.team_name}
                          logo={t.logo ?? null}
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="px-0 sm:px-3">
                <Select
                  value={order}
                  onValueChange={(val) =>
                    setOrder((val as OrderValue) ?? 'apps')
                  }
                >
                  <SelectTrigger
                    className={`${triggerBase} min-w-[100px] sm:min-w-[120px]`}
                  >
                    <SelectValue placeholder="정렬" />
                  </SelectTrigger>
                  <SelectContent className={contentBase}>
                    <SelectItem value="apps" className={itemBase}>
                      🏃 출전 많은 순
                    </SelectItem>
                    <SelectItem value="goals" className={itemBase}>
                      ⚽️ 골 많은 순
                    </SelectItem>
                    <SelectItem value="assists" className={itemBase}>
                      🎯 도움 많은 순
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="px-0 sm:px-3">
                <Select
                  value={seasonId != null ? String(seasonId) : 'all'}
                  onValueChange={(val) =>
                    setSeasonId(val === 'all' ? null : Number(val))
                  }
                >
                  <SelectTrigger
                    className={`${triggerBase} min-w-[100px] sm:min-w-[120px]`}
                  >
                    <SelectValue placeholder="시즌 전체" />
                  </SelectTrigger>
                  <SelectContent className={contentBase}>
                    <SelectItem value="all" className={itemBase}>
                      📅 시즌 전체
                    </SelectItem>
                    {seasonOptions.map((s) => (
                      <SelectItem
                        key={s.season_id}
                        value={String(s.season_id)}
                        className={itemBase}
                      >
                        {s.season_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!hideInternalSearch && (
        // Search (server) - compact underline style (<=25% width)
        <div className="mb-4 hidden sm:flex justify-end">
          <div className="relative w-full sm:w-[22%] min-w-0 sm:min-w-[220px] sm:max-w-[360px]">
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={onKeyDownInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="선수 검색"
              aria-label="선수 검색"
              className="w-full border-0 bg-transparent px-2 pr-10 text-base md:text-xl font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-0 h-10"
            />
            <button
              type="button"
              onClick={applySearch}
              disabled={
                keywordInput.trim() === (controlledKeyword ?? keyword).trim()
              }
              aria-label="검색"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 disabled:opacity-40"
            >
              <SearchIcon className="h-5 w-5 text-black" strokeWidth={2} />
            </button>
            <div
              className={`mt-1 h-[2px] w-full ${isFocused || keywordInput.trim().length > 0 ? 'bg-black' : 'bg-gray-200'}`}
            />
          </div>
        </div>
      )}

      <PlayerInfiniteList
        keyword={controlledKeyword ?? keyword}
        order={order}
        position={position === 'ALL' ? undefined : position}
        teamId={teamId}
        seasonId={seasonId}
        onTotalChange={onTotalChange}
        initialPlayersPage={initialPlayersPage}
      />
    </>
  );
}
