'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';

import { useGoalQuery } from '@/hooks/useGoalQuery';
import { isLightColor } from '@/lib/utils';

interface PassData {
  action_id: number;
  period_id: number | null;
  start_x: number;
  start_y: number;
  end_x: number;
  end_y: number;
  result: string;
  time_seconds: number;
}

interface MatchOption {
  match_id: number;
  match_date: string;
  season_name: string;
  home_team_name: string;
  home_team_logo: string | null;
  away_team_name: string;
  away_team_logo: string | null;
  home_score: number | null;
  away_score: number | null;
  is_home: boolean;
  total_passes: number;
  successful_passes: number;
}

interface PassMapResponse {
  matches: MatchOption[];
  match_id: number;
  flip_first_half: boolean;
  passes: PassData[];
}

async function fetchPassMap(
  playerId: number,
  matchId?: number
): Promise<PassMapResponse> {
  const qs = matchId ? `&match_id=${matchId}` : '';
  const res = await fetch(
    `/api/stats/player-pass-map?player_id=${playerId}${qs}`
  );
  if (!res.ok) throw new Error('Failed to fetch pass map');
  return res.json();
}

// 풋살 피치: 40m x 20m
const PITCH_W = 400;
const PITCH_H = 200;
const FIELD_W = 40;
const FIELD_H = 20;

function scaleX(x: number) {
  return (x / FIELD_W) * PITCH_W;
}
function scaleY(y: number) {
  return (y / FIELD_H) * PITCH_H;
}

// ── 스켈레톤 ──
function PassMapSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="h-5 w-16 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="flex flex-col sm:flex-row">
        <div className="flex-1 p-4">
          <div
            className="w-full animate-pulse rounded-lg bg-gray-100"
            style={{ aspectRatio: '2 / 1' }}
          />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-4 p-4 sm:border-l sm:border-gray-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-10 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
        <div className="h-7 w-7 animate-pulse rounded-full bg-gray-100" />
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-7 w-7 animate-pulse rounded-full bg-gray-100" />
      </div>
    </div>
  );
}

// ── 좌표 정규화: 왼쪽=자기진영, 오른쪽=상대진영 ──
function normalizePasses(
  passes: PassData[],
  flipFirstHalf: boolean
): PassData[] {
  return passes.map((p) => {
    const shouldFlip = flipFirstHalf ? p.period_id === 1 : p.period_id === 2;

    if (shouldFlip) {
      return {
        ...p,
        start_x: FIELD_W - p.start_x,
        start_y: FIELD_H - p.start_y,
        end_x: FIELD_W - p.end_x,
        end_y: FIELD_H - p.end_y,
      };
    }
    return p;
  });
}

// ── 피치 SVG ──
function FutsalPitch({ passes }: { passes: PassData[] }) {
  const successPasses = passes.filter((p) => p.result === 'SUCCESS');
  const failPasses = passes.filter((p) => p.result !== 'SUCCESS');

  return (
    <svg
      viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}
      className="w-full rounded-lg"
      role="img"
      aria-label="패스맵"
    >
      <rect width={PITCH_W} height={PITCH_H} rx="6" fill="#EFEFEF" />
      <rect
        x="8"
        y="8"
        width={PITCH_W - 16}
        height={PITCH_H - 16}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
      <line
        x1={PITCH_W / 2}
        y1="8"
        x2={PITCH_W / 2}
        y2={PITCH_H - 8}
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
      <circle
        cx={PITCH_W / 2}
        cy={PITCH_H / 2}
        r="30"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
      <rect
        x="8"
        y={PITCH_H / 2 - 45}
        width="50"
        height="90"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
      <rect
        x={PITCH_W - 58}
        y={PITCH_H / 2 - 45}
        width="50"
        height="90"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
      {/* 방향 표시 */}
      <text
        x="20"
        y={PITCH_H - 4}
        fill="#BCBCBC"
        fontSize="9"
        textAnchor="start"
      >
        자기 진영
      </text>
      <text
        x={PITCH_W - 20}
        y={PITCH_H - 4}
        fill="#BCBCBC"
        fontSize="9"
        textAnchor="end"
      >
        상대 진영 →
      </text>

      {/* 화살촉 마커 정의 */}
      <defs>
        <marker
          id="arrow-success"
          markerWidth="6"
          markerHeight="4"
          refX="5"
          refY="2"
          orient="auto"
        >
          <path d="M0,0 L6,2 L0,4 Z" fill="rgba(22,163,74,0.8)" />
        </marker>
        <marker
          id="arrow-fail"
          markerWidth="6"
          markerHeight="4"
          refX="5"
          refY="2"
          orient="auto"
        >
          <path d="M0,0 L6,2 L0,4 Z" fill="rgba(220,38,38,0.8)" />
        </marker>
      </defs>

      {failPasses.map((p) => (
        <g key={p.action_id}>
          <line
            x1={scaleX(p.start_x)}
            y1={scaleY(p.start_y)}
            x2={scaleX(p.end_x)}
            y2={scaleY(p.end_y)}
            stroke="rgba(220,38,38,0.6)"
            strokeWidth="1"
            markerEnd="url(#arrow-fail)"
          />
          <circle
            cx={scaleX(p.start_x)}
            cy={scaleY(p.start_y)}
            r="2.5"
            fill="rgba(220,38,38,0.8)"
          />
        </g>
      ))}

      {successPasses.map((p) => (
        <g key={p.action_id}>
          <line
            x1={scaleX(p.start_x)}
            y1={scaleY(p.start_y)}
            x2={scaleX(p.end_x)}
            y2={scaleY(p.end_y)}
            stroke="rgba(22,163,74,0.6)"
            strokeWidth="1"
            markerEnd="url(#arrow-success)"
          />
          <circle
            cx={scaleX(p.start_x)}
            cy={scaleY(p.start_y)}
            r="2.5"
            fill="rgba(22,163,74,0.8)"
          />
        </g>
      ))}
    </svg>
  );
}

// ── 필터 타입 ──
type PassFilter = 'all' | 'success' | 'fail' | 'forward';

// ── 필터 칩 ──
function FilterChip({
  label,
  count,
  active,
  teamColor,
  onClick,
}: {
  label: string;
  count: number | string;
  active: boolean;
  teamColor: string;
  onClick: () => void;
}) {
  const textColor = active
    ? isLightColor(teamColor)
      ? '#111827'
      : '#FFFFFF'
    : '#6B7280';

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors"
      style={
        active
          ? {
              backgroundColor: teamColor,
              borderColor: teamColor,
              color: textColor,
            }
          : { borderColor: '#E5E7EB', color: '#6B7280' }
      }
    >
      {label} <span className="font-semibold">{count}</span>
    </button>
  );
}

// ── 핵심 수치 셀 ──
function SummaryCell({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="text-center">
      <p className="text-[20px] font-semibold text-gray-900">{value}</p>
      <p className="mt-0.5 text-[12px] text-gray-500">{label}</p>
    </div>
  );
}

// ── 메인 ──
export default function PassMapCard({
  playerId,
  teamColor = '#3B82F6',
}: {
  playerId: number;
  teamColor?: string;
}) {
  const [selectedMatchId, setSelectedMatchId] = useState<number | undefined>(
    undefined
  );
  const [filter, setFilter] = useState<PassFilter>('all');

  const { data, isLoading, isFetching } = useGoalQuery(
    fetchPassMap,
    [playerId, selectedMatchId],
    {
      staleTime: 5 * 60 * 1000,
      placeholderData: (prev: PassMapResponse | undefined) => prev,
    }
  );

  const matches = useMemo(() => data?.matches ?? [], [data?.matches]);
  const passes = useMemo(
    () => normalizePasses(data?.passes ?? [], data?.flip_first_half ?? false),
    [data?.passes, data?.flip_first_half]
  );

  const currentIndex = useMemo(() => {
    if (!data?.match_id || matches.length === 0) return 0;
    const idx = matches.findIndex((m) => m.match_id === data.match_id);
    return idx >= 0 ? idx : 0;
  }, [data?.match_id, matches]);

  const currentMatch = matches[currentIndex] ?? null;

  const handlePrev = useCallback(() => {
    if (currentIndex < matches.length - 1) {
      setSelectedMatchId(matches[currentIndex + 1].match_id);
      setFilter('all');
    }
  }, [currentIndex, matches]);

  const handleNext = useCallback(() => {
    if (currentIndex > 0) {
      setSelectedMatchId(matches[currentIndex - 1].match_id);
      setFilter('all');
    }
  }, [currentIndex, matches]);

  // 단일 루프로 통계 합산 (js-combine-iterations)
  const { successCount, forwardCount, totalDist } = useMemo(() => {
    let success = 0;
    let forward = 0;
    let dist = 0;
    for (const p of passes) {
      if (p.result === 'SUCCESS') success++;
      if (p.end_x > p.start_x) forward++;
      dist += Math.sqrt(
        (p.end_x - p.start_x) ** 2 + (p.end_y - p.start_y) ** 2
      );
    }
    return { successCount: success, forwardCount: forward, totalDist: dist };
  }, [passes]);
  const failCount = passes.length - successCount;
  const accuracy =
    passes.length > 0 ? Math.round((successCount / passes.length) * 100) : 0;
  const avgDistance =
    passes.length > 0 ? (totalDist / passes.length).toFixed(1) : '0';

  const filteredPasses = useMemo(() => {
    switch (filter) {
      case 'success':
        return passes.filter((p) => p.result === 'SUCCESS');
      case 'fail':
        return passes.filter((p) => p.result !== 'SUCCESS');
      case 'forward':
        return passes.filter((p) => p.end_x > p.start_x);
      default:
        return passes;
    }
  }, [passes, filter]);

  const toggleFilter = useCallback((f: PassFilter) => {
    setFilter((prev) => (prev === f ? 'all' : f));
  }, []);

  // 첫 로딩 중 스켈레톤
  if (isLoading && !data) return <PassMapSkeleton />;

  if (!data || matches.length === 0 || passes.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4">
        <p className="text-[18px] font-medium text-gray-900">패스맵</p>
      </div>

      {/* 반반 레이아웃: 피치 + 통계 */}
      <div
        className={`flex flex-col sm:flex-row transition-opacity ${isFetching ? 'opacity-50' : 'opacity-100'}`}
      >
        {/* 좌: 피치 */}
        <div className="flex-1 p-4">
          <FutsalPitch passes={filteredPasses} />
          {/* 범례 */}
          <div className="mt-2 flex justify-center gap-5">
            <div className="flex items-center gap-1.5 text-[12px]">
              <span
                className="inline-block h-2 w-2 rounded-full bg-green-600"
                aria-hidden="true"
              />
              <span className="text-gray-500">성공</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px]">
              <span
                className="inline-block h-2 w-2 rounded-full bg-red-600"
                aria-hidden="true"
              />
              <span className="text-gray-500">실패</span>
            </div>
          </div>
        </div>

        {/* 우: 경기 네비게이터 + 통계 */}
        <div className="flex flex-1 flex-col border-t border-gray-100 sm:border-l sm:border-t-0">
          {/* 경기 네비게이터 */}
          {currentMatch && (
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <button
                onClick={handlePrev}
                disabled={currentIndex >= matches.length - 1}
                aria-label="이전 경기"
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="flex items-center gap-2.5">
                {/* 홈팀 로고 */}
                {currentMatch.home_team_logo && (
                  <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={currentMatch.home_team_logo}
                      alt={currentMatch.home_team_name}
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  </span>
                )}
                <span className="text-[15px] font-semibold text-gray-900">
                  {currentMatch.home_score} - {currentMatch.away_score}
                </span>
                {/* 원정팀 로고 */}
                {currentMatch.away_team_logo && (
                  <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={currentMatch.away_team_logo}
                      alt={currentMatch.away_team_name}
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  </span>
                )}
              </div>

              <button
                onClick={handleNext}
                disabled={currentIndex <= 0}
                aria-label="다음 경기"
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* 핵심 수치 */}
          <div className="flex items-center justify-around border-b border-gray-100 py-4">
            <SummaryCell label="패스" value={passes.length} />
            <SummaryCell label="성공률" value={`${accuracy}%`} />
            <SummaryCell label="평균 거리" value={`${avgDistance}m`} />
          </div>

          {/* 필터 칩 */}
          <div className="flex flex-1 flex-col justify-center p-4">
            <p className="mb-2.5 text-[13px] font-medium text-gray-700">필터</p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="전체"
                count={passes.length}
                active={filter === 'all'}
                teamColor={teamColor}
                onClick={() => toggleFilter('all')}
              />
              <FilterChip
                label="성공"
                count={successCount}
                active={filter === 'success'}
                teamColor={teamColor}
                onClick={() => toggleFilter('success')}
              />
              <FilterChip
                label="실패"
                count={failCount}
                active={filter === 'fail'}
                teamColor={teamColor}
                onClick={() => toggleFilter('fail')}
              />
              <FilterChip
                label="전진 패스"
                count={forwardCount}
                active={filter === 'forward'}
                teamColor={teamColor}
                onClick={() => toggleFilter('forward')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
