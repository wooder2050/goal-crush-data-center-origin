'use client';

import { Swords } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { ShareButtons } from '@/components/ShareButtons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';
import { shortenSeasonName } from '@/lib/utils';

// ========== Types ==========

interface HeadToHeadMatch {
  match_id: number;
  match_date: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
  season_name: string;
  location?: string;
  penalty_home_score?: number;
  penalty_away_score?: number;
}

interface HeadToHeadStats {
  team1_id: number;
  team2_id: number;
  team1_name: string;
  team2_name: string;
  team1_logo?: string;
  team2_logo?: string;
  team1_primary_color?: string;
  team1_secondary_color?: string;
  team2_primary_color?: string;
  team2_secondary_color?: string;
  total_matches: number;
  team1_wins: number;
  team2_wins: number;
  draws: number;
  team1_goals: number;
  team2_goals: number;
  recent_matches: HeadToHeadMatch[];
  biggest_win_team1: {
    match_date: string;
    score: string;
    season: string;
    margin: number;
  } | null;
  biggest_win_team2: {
    match_date: string;
    score: string;
    season: string;
    margin: number;
  } | null;
}

// ========== Color Utilities ==========

function isLightColor(hex: string | null | undefined): boolean {
  if (!hex) return true;
  const color = hex.replace('#', '');
  if (color.length < 6) return true;
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
}

function pickTeamColor(
  primary?: string,
  secondary?: string,
  fallback = '#3B82F6'
): string {
  if (primary && !isLightColor(primary)) return primary;
  if (secondary && !isLightColor(secondary)) return secondary;
  return fallback;
}

interface TeamOption {
  team_id: number;
  team_name: string;
  logo?: string;
}

// ========== API ==========

async function getHeadToHeadStats(
  team1Id: number,
  team2Id: number,
  limit: number = 10
): Promise<HeadToHeadStats> {
  const params = new URLSearchParams({
    team1_id: team1Id.toString(),
    team2_id: team2Id.toString(),
    limit: limit.toString(),
  });
  const response = await fetch(apiUrl(`/api/stats/head-to-head?${params}`), {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Failed to fetch head-to-head statistics');
  return response.json();
}

async function getAllTeams(): Promise<TeamOption[]> {
  const response = await fetch(apiUrl('/api/teams'), { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch teams');
  const result = await response.json();
  return result.data || [];
}

// ========== Sub-components ==========

function TeamLogo({
  src,
  alt,
  size = 40,
}: {
  src?: string;
  alt: string;
  size?: number;
}) {
  if (!src) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-400"
        style={{ width: size, height: size }}
      >
        {alt.charAt(0)}
      </div>
    );
  }
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    </div>
  );
}

/** FotMob-style horizontal stacked bar */
function WinLossBar({
  wins1,
  wins2,
  color1,
  color2,
}: {
  wins1: number;
  wins2: number;
  color1: string;
  color2: string;
}) {
  const total = wins1 + wins2;
  if (total === 0) return null;
  const pct1 = (wins1 / total) * 100;
  const pct2 = (wins2 / total) * 100;

  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full">
      <div
        className="transition-all duration-500"
        style={{ width: `${pct1}%`, backgroundColor: color1 }}
      />
      <div
        className="transition-all duration-500"
        style={{ width: `${pct2}%`, backgroundColor: color2 }}
      />
    </div>
  );
}

/** FotMob-style stat comparison row */
function StatCompareRow({
  label,
  value1,
  value2,
  color1,
  color2,
  format,
  suffix,
}: {
  label: string;
  value1: number;
  value2: number;
  color1: string;
  color2: string;
  format?: (v: number) => string;
  suffix?: string;
}) {
  const max = Math.max(value1, value2, 0.01);
  const pct1 = (value1 / max) * 100;
  const pct2 = (value2 / max) * 100;
  const is1Better = value1 > value2;
  const is2Better = value2 > value1;
  const fmt = format ?? ((v: number) => String(v));

  return (
    <div className="py-3">
      <div className="mb-1.5 text-center text-[12px] font-medium text-gray-500">
        {label}
      </div>
      <div className="flex items-center gap-3">
        <span
          className="w-12 text-right text-[15px] font-bold"
          style={{ color: is1Better ? color1 : '#9CA3AF' }}
        >
          {fmt(value1)}
          {suffix}
        </span>
        <div className="flex flex-1 items-center gap-0.5">
          <div className="flex h-5 flex-1 justify-end">
            <div
              className="rounded-l-full transition-all duration-500"
              style={{
                width: `${pct1}%`,
                minWidth: value1 > 0 ? '4px' : '0',
                backgroundColor: is1Better ? color1 : '#E5E7EB',
              }}
            />
          </div>
          <div className="h-6 w-px shrink-0 bg-gray-200" />
          <div className="flex h-5 flex-1 justify-start">
            <div
              className="rounded-r-full transition-all duration-500"
              style={{
                width: `${pct2}%`,
                minWidth: value2 > 0 ? '4px' : '0',
                backgroundColor: is2Better ? color2 : '#E5E7EB',
              }}
            />
          </div>
        </div>
        <span
          className="w-12 text-left text-[15px] font-bold"
          style={{ color: is2Better ? color2 : '#9CA3AF' }}
        >
          {fmt(value2)}
          {suffix}
        </span>
      </div>
    </div>
  );
}

/** Format match date for display */
function formatMatchDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

// ========== Main Inner Component ==========

function HeadToHeadPageContentInner({
  initialTeams,
}: {
  initialTeams?: TeamOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [team1Id, setTeam1Id] = useState<number | undefined>();
  const [team2Id, setTeam2Id] = useState<number | undefined>();
  const initializedRef = useRef(false);
  const isUserAction = useRef(false);

  // URL 쿼리에서 팀 ID 복원
  useEffect(() => {
    if (initializedRef.current) return;
    const t1 = searchParams.get('team1');
    const t2 = searchParams.get('team2');
    if (t1) {
      const id = parseInt(t1, 10);
      if (!isNaN(id)) setTeam1Id(id);
    }
    if (t2) {
      const id = parseInt(t2, 10);
      if (!isNaN(id)) setTeam2Id(id);
    }
    initializedRef.current = true;
  }, [searchParams]);

  const handleSetTeam1 = useCallback((id: number) => {
    isUserAction.current = true;
    setTeam1Id(id);
  }, []);

  const handleSetTeam2 = useCallback((id: number) => {
    isUserAction.current = true;
    setTeam2Id(id);
  }, []);

  useEffect(() => {
    if (!isUserAction.current) return;
    isUserAction.current = false;
    const params = new URLSearchParams();
    if (team1Id) params.set('team1', team1Id.toString());
    if (team2Id) params.set('team2', team2Id.toString());
    const qs = params.toString();
    router.replace(qs ? `/stats/head-to-head?${qs}` : '/stats/head-to-head', {
      scroll: false,
    });
  }, [team1Id, team2Id, router]);

  const { data: teamsData } = useGoalQuery(getAllTeams, [], {
    staleTime: 10 * 60 * 1000,
    initialData: initialTeams,
  });

  const { data, isLoading, error } = useGoalQuery(
    getHeadToHeadStats,
    [team1Id!, team2Id!, 15],
    {
      enabled: !!(team1Id && team2Id && team1Id !== team2Id),
      staleTime: 5 * 60 * 1000,
    }
  );

  const teams = teamsData ?? [];
  const availableTeams1 = teams.filter((t) => t.team_id !== team2Id);
  const availableTeams2 = teams.filter((t) => t.team_id !== team1Id);

  const renderTeamSelect = (
    value: number | undefined,
    onChange: (teamId: number) => void,
    availableTeams: TeamOption[],
    placeholder: string
  ) => (
    <Select
      value={value?.toString() || ''}
      onValueChange={(v) => onChange(Number(v))}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {availableTeams.map((team) => (
          <SelectItem key={team.team_id} value={team.team_id.toString()}>
            <div className="flex items-center gap-2">
              {team.logo && (
                <div className="relative h-5 w-5">
                  <Image
                    src={team.logo}
                    alt={team.team_name}
                    fill
                    sizes="20px"
                    className="object-cover rounded"
                  />
                </div>
              )}
              {team.team_name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="mx-auto max-w-[600px] px-4 pb-10 pt-6 lg:max-w-[900px]">
      {/* 팀 선택 */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="px-5 py-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-gray-500">
                팀 1
              </label>
              {renderTeamSelect(
                team1Id,
                handleSetTeam1,
                availableTeams1,
                '팀 선택'
              )}
            </div>
            <div className="pb-2 text-[14px] font-bold text-gray-300">VS</div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-gray-500">
                팀 2
              </label>
              {renderTeamSelect(
                team2Id,
                handleSetTeam2,
                availableTeams2,
                '팀 선택'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 비선택 상태 */}
      {(!team1Id || !team2Id) && !isLoading && (
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center">
          <Swords className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-[15px] font-medium text-gray-700">
            비교할 두 팀을 선택해주세요
          </p>
          <p className="mt-1 text-[13px] text-gray-400">
            상대 전적, 득점 현황, 최근 경기 결과를 확인할 수 있습니다
          </p>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center">
          <p className="text-[15px] font-medium text-red-600">
            통계를 불러올 수 없습니다
          </p>
        </div>
      )}

      {/* 로딩 */}
      {isLoading && <LoadingSkeleton />}

      {/* 결과 */}
      {data &&
        !isLoading &&
        (() => {
          const color1 = pickTeamColor(
            data.team1_primary_color,
            data.team1_secondary_color,
            '#3B82F6'
          );
          const color2 = pickTeamColor(
            data.team2_primary_color,
            data.team2_secondary_color,
            '#EF4444'
          );
          // 두 팀 색상이 같으면 팀2를 폴백
          const c2 = color1 === color2 ? '#EF4444' : color2;

          return (
            <div className="space-y-4">
              {/* === 역대 전적 요약 === */}
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                <div className="px-5 py-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="w-8" aria-hidden="true" />
                    <p className="text-center text-[12px] font-medium text-gray-400">
                      역대 전적
                    </p>
                    <ShareButtons
                      title={`${data.team1_name} vs ${data.team2_name} 역대 전적 | 골때녀 데이터센터`}
                      description={`${data.team1_name} ${data.team1_wins}승 · ${data.team2_name} ${data.team2_wins}승 (총 ${data.total_matches}경기)`}
                      contentType="head_to_head"
                      itemId={`${team1Id}-${team2Id}`}
                      compact
                    />
                  </div>

                  {/* 팀 로고 + 승수 */}
                  <div className="mb-4 flex items-center">
                    <div className="flex flex-1 flex-col items-center gap-1.5 min-w-0">
                      <TeamLogo
                        src={data.team1_logo}
                        alt={data.team1_name}
                        size={48}
                      />
                      <span className="max-w-[80px] truncate text-center text-[13px] font-medium text-gray-900 sm:max-w-none">
                        {data.team1_name}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-6 text-center">
                      <div>
                        <p
                          className="text-[28px] font-black leading-none"
                          style={{ color: color1 }}
                        >
                          {data.team1_wins}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-400">승</p>
                      </div>
                      <div>
                        <p
                          className="text-[28px] font-black leading-none"
                          style={{ color: c2 }}
                        >
                          {data.team2_wins}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-400">승</p>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col items-center gap-1.5 min-w-0">
                      <TeamLogo
                        src={data.team2_logo}
                        alt={data.team2_name}
                        size={48}
                      />
                      <span className="max-w-[80px] truncate text-center text-[13px] font-medium text-gray-900 sm:max-w-none">
                        {data.team2_name}
                      </span>
                    </div>
                  </div>

                  {/* 승패 바 */}
                  <WinLossBar
                    wins1={data.team1_wins}
                    wins2={data.team2_wins}
                    color1={color1}
                    color2={c2}
                  />
                  <p className="mt-2 text-center text-[11px] text-gray-400">
                    총 {data.total_matches}경기
                  </p>
                </div>

                {/* 통계 비교 바 */}
                {data.total_matches > 0 &&
                  (() => {
                    const winRate1 =
                      data.total_matches > 0
                        ? (data.team1_wins / data.total_matches) * 100
                        : 0;
                    const winRate2 =
                      data.total_matches > 0
                        ? (data.team2_wins / data.total_matches) * 100
                        : 0;
                    const gpg1 =
                      data.total_matches > 0
                        ? data.team1_goals / data.total_matches
                        : 0;
                    const gpg2 =
                      data.total_matches > 0
                        ? data.team2_goals / data.total_matches
                        : 0;
                    const fmtPct = (v: number) =>
                      v % 1 === 0 ? String(v) : v.toFixed(1);
                    const fmtDec = (v: number) => v.toFixed(1);

                    return (
                      <div className="border-t border-gray-100 px-5 py-2">
                        <StatCompareRow
                          label="승률"
                          value1={winRate1}
                          value2={winRate2}
                          color1={color1}
                          color2={c2}
                          format={fmtPct}
                          suffix="%"
                        />
                        <StatCompareRow
                          label="승리"
                          value1={data.team1_wins}
                          value2={data.team2_wins}
                          color1={color1}
                          color2={c2}
                        />
                        <StatCompareRow
                          label="총 득점"
                          value1={data.team1_goals}
                          value2={data.team2_goals}
                          color1={color1}
                          color2={c2}
                        />
                        <StatCompareRow
                          label="경기당 골"
                          value1={gpg1}
                          value2={gpg2}
                          color1={color1}
                          color2={c2}
                          format={fmtDec}
                        />
                      </div>
                    );
                  })()}
              </div>

              {/* === 최고 승리 기록 === */}
              {(data.biggest_win_team1 || data.biggest_win_team2) && (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                  <div className="border-b border-gray-100 px-5 py-3">
                    <p className="text-[14px] font-medium text-gray-900">
                      최고 승리 기록
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {data.biggest_win_team1 && (
                      <div className="flex items-center gap-3 px-5 py-3.5">
                        <TeamLogo
                          src={data.team1_logo}
                          alt={data.team1_name}
                          size={32}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-medium text-gray-900">
                            {data.team1_name}
                          </p>
                          <p className="text-[12px] text-gray-400">
                            {data.biggest_win_team1.season} ·{' '}
                            {data.biggest_win_team1.match_date}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span
                            className="text-[16px] font-bold"
                            style={{ color: color1 }}
                          >
                            {data.biggest_win_team1.score}
                          </span>
                          <p className="text-[11px] text-gray-400">
                            {data.biggest_win_team1.margin}골차
                          </p>
                        </div>
                      </div>
                    )}
                    {data.biggest_win_team2 && (
                      <div className="flex items-center gap-3 px-5 py-3.5">
                        <TeamLogo
                          src={data.team2_logo}
                          alt={data.team2_name}
                          size={32}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-medium text-gray-900">
                            {data.team2_name}
                          </p>
                          <p className="text-[12px] text-gray-400">
                            {data.biggest_win_team2.season} ·{' '}
                            {data.biggest_win_team2.match_date}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span
                            className="text-[16px] font-bold"
                            style={{ color: c2 }}
                          >
                            {data.biggest_win_team2.score}
                          </span>
                          <p className="text-[11px] text-gray-400">
                            {data.biggest_win_team2.margin}골차
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === 최근 경기 === */}
              {data.recent_matches.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                  <div className="border-b border-gray-100 px-5 py-3">
                    <p className="text-[14px] font-medium text-gray-900">
                      최근 경기
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {data.recent_matches.map((match) => {
                      let homeWin = match.home_score > match.away_score;
                      let awayWin = match.away_score > match.home_score;
                      // 동점 시 승부차기 결과로 승자 결정
                      if (
                        !homeWin &&
                        !awayWin &&
                        match.penalty_home_score != null &&
                        match.penalty_away_score != null
                      ) {
                        homeWin =
                          match.penalty_home_score > match.penalty_away_score;
                        awayWin =
                          match.penalty_away_score > match.penalty_home_score;
                      }

                      return (
                        <Link
                          key={match.match_id}
                          href={`/matches/${match.match_id}`}
                          className="block px-5 py-3.5 transition-colors hover:bg-gray-50 active:bg-gray-50"
                        >
                          {/* 날짜 + 시즌 */}
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[11px] text-gray-400">
                              {formatMatchDate(match.match_date)}
                            </span>
                            <span className="truncate text-[11px] text-gray-400 ml-2">
                              {shortenSeasonName(match.season_name)}
                            </span>
                          </div>
                          {/* 홈 로고 — 홈이름 — 스코어 — 원정이름 — 원정 로고 */}
                          <div className="flex items-center gap-2">
                            <TeamLogo
                              src={
                                match.home_team_name === data.team1_name
                                  ? data.team1_logo
                                  : data.team2_logo
                              }
                              alt={match.home_team_name}
                              size={24}
                            />
                            <span
                              className={`min-w-0 flex-1 truncate text-right text-[13px] ${homeWin ? 'font-bold text-gray-900' : 'text-gray-500'}`}
                            >
                              {match.home_team_name}
                            </span>
                            <div className="shrink-0 w-[72px] text-center">
                              <span className="text-[15px] font-bold text-gray-900">
                                {match.home_score} - {match.away_score}
                              </span>
                              {match.penalty_home_score != null &&
                                match.penalty_away_score != null && (
                                  <p className="text-[10px] text-gray-400">
                                    PK {match.penalty_home_score}:
                                    {match.penalty_away_score}
                                  </p>
                                )}
                            </div>
                            <span
                              className={`min-w-0 flex-1 truncate text-left text-[13px] ${awayWin ? 'font-bold text-gray-900' : 'text-gray-500'}`}
                            >
                              {match.away_team_name}
                            </span>
                            <TeamLogo
                              src={
                                match.away_team_name === data.team1_name
                                  ? data.team1_logo
                                  : data.team2_logo
                              }
                              alt={match.away_team_name}
                              size={24}
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {data.total_matches === 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center">
                  <p className="text-[15px] font-medium text-gray-500">
                    맞대결 기록이 없습니다
                  </p>
                  <p className="mt-1 text-[13px] text-gray-400">
                    선택한 두 팀 간의 경기 기록을 찾을 수 없습니다
                  </p>
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
}

// ========== Loading Skeleton ==========

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white px-5 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gray-100" />
            <div className="h-3 w-14 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="flex gap-4">
            <div className="h-8 w-6 animate-pulse rounded bg-gray-100" />
            <div className="h-8 w-6 animate-pulse rounded bg-gray-100" />
            <div className="h-8 w-6 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gray-100" />
            <div className="h-3 w-14 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
        <div className="h-2.5 w-full animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 border-b border-gray-100 px-5 py-3.5 last:border-b-0"
          >
            <div className="h-6 w-6 animate-pulse rounded-full bg-gray-100" />
            <div className="h-3 w-16 flex-1 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-12 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-16 flex-1 animate-pulse rounded bg-gray-100" />
            <div className="h-6 w-6 animate-pulse rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== Export ==========

export default function HeadToHeadPageContent({
  initialTeams,
}: {
  initialTeams?: TeamOption[];
}) {
  return (
    <Suspense>
      <HeadToHeadPageContentInner initialTeams={initialTeams} />
    </Suspense>
  );
}
