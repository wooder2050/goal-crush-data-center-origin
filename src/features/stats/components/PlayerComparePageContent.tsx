'use client';

import { Link2, Search, Swords, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Card, CardContent, Input, Section } from '@/components/ui';
import InfiniteSeasonSelect from '@/features/stats/components/InfiniteSeasonSelect';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import { shortenSeasonName } from '@/lib/utils';

// ========== Types ==========

interface PlayerSearchResult {
  player_id: number;
  name: string;
  profile_image_url: string | null;
  team: {
    team_id: number;
    team_name: string;
    logo: string | null;
  } | null;
}

interface PlayerCompareStats {
  matches: number;
  goals: number;
  assists: number;
  attack_points: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  seasons_played: number;
}

interface GoalTimingData {
  first_half: number;
  second_half: number;
  total: number;
}

interface SeasonBreakdownEntry {
  season_id: number;
  season_name: string;
  player1: { goals: number; assists: number; matches: number };
  player2: { goals: number; assists: number; matches: number };
}

interface TeamWithColors {
  team_id: number;
  team_name: string;
  logo: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
}

interface PlayerCompareData {
  player_id: number;
  name: string;
  profile_image_url: string | null;
  jersey_number: number | null;
  birth_date: string | null;
  height_cm: number | null;
  position: string | null;
  team: TeamWithColors | null;
  stats: PlayerCompareStats;
}

// ========== Color Utilities ==========

/** 밝은 색상인지 확인 (YIQ 공식, 기존 HeadToHeadSection과 동일 기준) */
function isLightColor(hex: string | null | undefined): boolean {
  if (!hex) return true;
  const color = hex.replace('#', '');
  if (color.length < 6) return true;
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 200;
}

/** 밝은 색상이면 어두운 텍스트 색상을 반환, 아니면 원본 반환 */
function textColorFor(hex: string): string {
  if (isLightColor(hex)) {
    // 원본 색을 60%로 어둡게
    const color = hex.replace('#', '');
    const r = Math.round(parseInt(color.substring(0, 2), 16) * 0.55);
    const g = Math.round(parseInt(color.substring(2, 4), 16) * 0.55);
    const b = Math.round(parseInt(color.substring(4, 6), 16) * 0.55);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  return hex;
}

/** 팀 색상 결정: primary가 밝으면 secondary 사용 (다른 팀 간 비교용) */
function pickTeamColor(
  primary: string | null | undefined,
  secondary: string | null | undefined,
  fallback: string
): string {
  if (isLightColor(primary)) {
    if (secondary && !isLightColor(secondary)) return secondary;
    return fallback;
  }
  return primary || fallback;
}

interface PlayerColors {
  /** 바 차트, 프로필 테두리 등 배경용 (밝은 색 가능) */
  bar1: string;
  bar2: string;
  /** 글자(숫자)용 — 밝은 색이면 어둡게 보정 */
  text1: string;
  text2: string;
}

function getPlayerColors(
  player1Team: TeamWithColors | null,
  player2Team: TeamWithColors | null
): PlayerColors {
  const defaultColor1 = '#3B82F6';
  const defaultColor2 = '#F43F5E';

  const isSameTeam =
    player1Team && player2Team && player1Team.team_id === player2Team.team_id;

  if (isSameTeam) {
    // 같은 팀: primary/secondary를 그대로 사용
    const bar1 = player1Team?.primary_color || defaultColor1;
    const bar2 =
      player1Team?.secondary_color && player1Team.secondary_color !== bar1
        ? player1Team.secondary_color
        : defaultColor2;
    return {
      bar1,
      bar2,
      text1: textColorFor(bar1),
      text2: textColorFor(bar2),
    };
  }

  // 다른 팀: 밝으면 secondary로 교체
  const bar1 = pickTeamColor(
    player1Team?.primary_color,
    player1Team?.secondary_color,
    defaultColor1
  );
  let bar2 = pickTeamColor(
    player2Team?.primary_color,
    player2Team?.secondary_color,
    defaultColor2
  );

  // 두 팀의 색상이 같으면 선수2를 폴백 색상으로 변경
  if (bar1 === bar2) {
    bar2 = defaultColor2;
  }

  return {
    bar1,
    bar2,
    text1: textColorFor(bar1),
    text2: textColorFor(bar2),
  };
}

interface CompareResponse {
  player1: PlayerCompareData;
  player2: PlayerCompareData;
  head_to_head: {
    total_matches: number;
    player1_wins: number;
    player2_wins: number;
  };
  goal_timing: {
    player1: GoalTimingData;
    player2: GoalTimingData;
  };
  season_breakdown: SeasonBreakdownEntry[];
}

// ========== API Functions ==========

async function fetchPlayers(searchTerm: string): Promise<PlayerSearchResult[]> {
  if (!searchTerm) return [];
  const response = await fetch(
    `/api/players?name=${encodeURIComponent(searchTerm)}&limit=10`
  );
  if (!response.ok) throw new Error('Failed to fetch players');
  return response.json();
}

async function fetchCompareDataRaw(
  player1Id: number,
  player2Id: number
): Promise<CompareResponse | null> {
  const response = await fetch(
    `/api/stats/player-compare?player1_id=${player1Id}&player2_id=${player2Id}&season_id=all`
  );
  if (!response.ok) return null;
  return response.json();
}

async function fetchCompareData(
  player1Id: number,
  player2Id: number,
  seasonId?: number
): Promise<CompareResponse> {
  const seasonQuery =
    seasonId !== undefined ? `&season_id=${seasonId}` : '&season_id=all';
  const response = await fetch(
    `/api/stats/player-compare?player1_id=${player1Id}&player2_id=${player2Id}${seasonQuery}`
  );
  if (!response.ok) throw new Error('Failed to fetch comparison data');
  return response.json();
}

// ========== Player Search Component ==========

function PlayerSearchInput({
  label,
  selectedPlayer,
  onSelect,
  onClear,
}: {
  label: string;
  selectedPlayer: PlayerSearchResult | null;
  onSelect: (player: PlayerSearchResult) => void;
  onClear: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = useGoalQuery(
    fetchPlayers,
    [searchTerm],
    { enabled: searchTerm.length > 0 }
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (player: PlayerSearchResult) => {
      onSelect(player);
      setSearchTerm('');
      setIsOpen(false);
    },
    [onSelect]
  );

  if (selectedPlayer) {
    return (
      <div className="relative">
        <div className="flex items-center gap-3 rounded-lg border bg-white p-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
            {selectedPlayer.profile_image_url ? (
              <Image
                src={selectedPlayer.profile_image_url}
                alt={selectedPlayer.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-400">
                {selectedPlayer.name[0]}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-900">
              {selectedPlayer.name}
            </p>
            {selectedPlayer.team && (
              <p className="truncate text-xs text-gray-500">
                {selectedPlayer.team.team_name}
              </p>
            )}
          </div>
          <button
            onClick={onClear}
            className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={label}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9"
        />
      </div>

      {isOpen && searchTerm.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              검색 중...
            </div>
          ) : results && results.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto py-1">
              {results.map((player) => (
                <li key={player.player_id}>
                  <button
                    onClick={() => handleSelect(player)}
                    className="flex w-full items-center gap-3 px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100">
                      {player.profile_image_url ? (
                        <Image
                          src={player.profile_image_url}
                          alt={player.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          {player.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {player.name}
                      </p>
                      {player.team && (
                        <p className="truncate text-xs text-gray-500">
                          {player.team.team_name}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ========== Stat Comparison Bar ==========

function StatBar({
  label,
  value1,
  value2,
  colors,
  higherIsBetter = true,
}: {
  label: string;
  value1: number;
  value2: number;
  colors: PlayerColors;
  higherIsBetter?: boolean;
}) {
  const max = Math.max(value1, value2, 1);
  const pct1 = (value1 / max) * 100;
  const pct2 = (value2 / max) * 100;

  const isPlayer1Better = higherIsBetter ? value1 > value2 : value1 < value2;
  const isPlayer2Better = higherIsBetter ? value2 > value1 : value2 < value1;
  const isTied = value1 === value2;

  return (
    <div className="py-3">
      <div className="mb-2 text-center text-xs font-medium text-gray-500 sm:text-sm">
        {label}
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div
          className="w-12 text-right text-base font-bold sm:w-16 sm:text-lg"
          style={{
            color: isTied || isPlayer1Better ? colors.text1 : '#9CA3AF',
          }}
        >
          {value1}
        </div>

        <div className="flex flex-1 items-center gap-1">
          <div className="flex h-6 flex-1 justify-end sm:h-7">
            <div
              className="rounded-l-full transition-all duration-500"
              style={{
                backgroundColor:
                  isTied || isPlayer1Better ? colors.bar1 : '#E5E7EB',
                width: `${pct1}%`,
                minWidth: value1 > 0 ? '4px' : '0',
              }}
            />
          </div>
          <div className="h-8 w-px shrink-0 bg-gray-300 sm:h-9" />
          <div className="flex h-6 flex-1 justify-start sm:h-7">
            <div
              className="rounded-r-full transition-all duration-500"
              style={{
                backgroundColor:
                  isTied || isPlayer2Better ? colors.bar2 : '#E5E7EB',
                width: `${pct2}%`,
                minWidth: value2 > 0 ? '4px' : '0',
              }}
            />
          </div>
        </div>

        <div
          className="w-12 text-left text-base font-bold sm:w-16 sm:text-lg"
          style={{
            color: isTied || isPlayer2Better ? colors.text2 : '#9CA3AF',
          }}
        >
          {value2}
        </div>
      </div>
    </div>
  );
}

// ========== Head-to-Head Section ==========

function HeadToHeadSection({
  data,
  player1Name,
  player2Name,
  color1,
  color2,
}: {
  data: CompareResponse['head_to_head'];
  player1Name: string;
  player2Name: string;
  color1: string;
  color2: string;
}) {
  if (data.total_matches === 0) return null;

  return (
    <Card className="mt-4">
      <CardContent className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-center gap-2">
          <Swords className="h-5 w-5 text-gray-600" />
          <h3 className="text-base font-bold text-gray-900 sm:text-lg">
            맞대결 전적
          </h3>
        </div>
        <p className="mb-4 text-center text-xs text-gray-500">
          두 선수가 같은 경기에 출전한 {data.total_matches}경기
        </p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div
            className="rounded-lg p-3 sm:p-4"
            style={{ backgroundColor: color1 + '15' }}
          >
            <p
              className="text-2xl font-black sm:text-3xl"
              style={{ color: color1 }}
            >
              {data.player1_wins}
            </p>
            <p
              className="mt-1 truncate text-xs sm:text-sm"
              style={{ color: color1 }}
            >
              {player1Name} 승
            </p>
          </div>
          <div
            className="rounded-lg p-3 sm:p-4"
            style={{ backgroundColor: color2 + '15' }}
          >
            <p
              className="text-2xl font-black sm:text-3xl"
              style={{ color: color2 }}
            >
              {data.player2_wins}
            </p>
            <p
              className="mt-1 truncate text-xs sm:text-sm"
              style={{ color: color2 }}
            >
              {player2Name} 승
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== Goal Timing Section ==========

function GoalTimingSection({
  data,
  player1Name,
  player2Name,
  color1,
  color2,
}: {
  data: CompareResponse['goal_timing'];
  player1Name: string;
  player2Name: string;
  color1: string;
  color2: string;
}) {
  if (data.player1.total === 0 && data.player2.total === 0) return null;

  const TimingBar = ({
    firstHalf,
    total,
    barColor,
  }: {
    firstHalf: number;
    total: number;
    barColor: string;
  }) => {
    if (total === 0) return <p className="text-xs text-gray-400">기록 없음</p>;
    const secondHalf = total - firstHalf;
    const firstPct = (firstHalf / total) * 100;
    const secondPct = (secondHalf / total) * 100;
    const safeColor = textColorFor(barColor);

    return (
      <div>
        <div className="flex h-7 overflow-hidden rounded-full sm:h-8">
          {firstHalf > 0 && (
            <div
              className="flex items-center justify-center text-xs font-semibold text-white"
              style={{
                backgroundColor: safeColor + 'B0',
                width: `${firstPct}%`,
                minWidth: '28px',
              }}
            >
              {firstHalf}
            </div>
          )}
          {secondHalf > 0 && (
            <div
              className="flex items-center justify-center text-xs font-semibold text-white"
              style={{
                backgroundColor: safeColor,
                width: `${secondPct}%`,
                minWidth: '28px',
              }}
            >
              {secondHalf}
            </div>
          )}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-gray-400">
          <span>전반 {firstHalf}골</span>
          <span>후반 {secondHalf}골</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4 sm:p-6">
        <h3 className="mb-4 text-center text-base font-bold text-gray-900 sm:text-lg">
          골 타이밍
        </h3>
        <div className="space-y-4">
          <div>
            <p
              className="mb-1 text-xs font-semibold sm:text-sm"
              style={{ color: textColorFor(color1) }}
            >
              {player1Name}{' '}
              <span className="font-normal text-gray-400">
                ({data.player1.total}골)
              </span>
            </p>
            <TimingBar
              firstHalf={data.player1.first_half}
              total={data.player1.total}
              barColor={color1}
            />
          </div>
          <div>
            <p
              className="mb-1 text-xs font-semibold sm:text-sm"
              style={{ color: textColorFor(color2) }}
            >
              {player2Name}{' '}
              <span className="font-normal text-gray-400">
                ({data.player2.total}골)
              </span>
            </p>
            <TimingBar
              firstHalf={data.player2.first_half}
              total={data.player2.total}
              barColor={color2}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: textColorFor(color1) + 'B0' }}
            />
            전반
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: textColorFor(color1) }}
            />
            후반
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== Season Breakdown Section ==========

function SeasonBreakdownSection({
  data,
  player1Name,
  player2Name,
  color1,
  color2,
}: {
  data: SeasonBreakdownEntry[];
  player1Name: string;
  player2Name: string;
  color1: string;
  color2: string;
}) {
  if (data.length === 0) return null;

  return (
    <Card className="mt-4">
      <CardContent className="p-4 sm:p-6">
        <h3 className="mb-4 text-center text-base font-bold text-gray-900 sm:text-lg">
          시즌별 성적
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs sm:text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-2 text-left font-medium">시즌</th>
                <th className="pb-2 font-medium" colSpan={2}>
                  <span style={{ color: color1 }}>{player1Name}</span>
                </th>
                <th className="pb-2 font-medium" colSpan={2}>
                  <span style={{ color: color2 }}>{player2Name}</span>
                </th>
              </tr>
              <tr className="border-b text-[10px] text-gray-400 sm:text-xs">
                <th className="pb-1" />
                <th className="pb-1 font-normal">골</th>
                <th className="pb-1 font-normal">도움</th>
                <th className="pb-1 font-normal">골</th>
                <th className="pb-1 font-normal">도움</th>
              </tr>
            </thead>
            <tbody>
              {data.map((season) => (
                <tr key={season.season_id} className="border-b last:border-0">
                  <td className="py-2 text-left font-medium text-gray-700">
                    {shortenSeasonName(season.season_name)}
                  </td>
                  <td
                    className="py-2 font-bold"
                    style={{
                      color:
                        season.player1.goals > season.player2.goals
                          ? color1
                          : '#6B7280',
                    }}
                  >
                    {season.player1.matches > 0 ? season.player1.goals : '-'}
                  </td>
                  <td
                    className="py-2 font-bold"
                    style={{
                      color:
                        season.player1.assists > season.player2.assists
                          ? color1
                          : '#6B7280',
                    }}
                  >
                    {season.player1.matches > 0 ? season.player1.assists : '-'}
                  </td>
                  <td
                    className="py-2 font-bold"
                    style={{
                      color:
                        season.player2.goals > season.player1.goals
                          ? color2
                          : '#6B7280',
                    }}
                  >
                    {season.player2.matches > 0 ? season.player2.goals : '-'}
                  </td>
                  <td
                    className="py-2 font-bold"
                    style={{
                      color:
                        season.player2.assists > season.player1.assists
                          ? color2
                          : '#6B7280',
                    }}
                  >
                    {season.player2.matches > 0 ? season.player2.assists : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== Player Profile Card ==========

function PlayerProfile({
  player,
  teamColor,
}: {
  player: PlayerCompareData;
  teamColor: string;
}) {
  const positionLabel: Record<string, string> = {
    FW: '공격수',
    MF: '미드필더',
    DF: '수비수',
    GK: '골키퍼',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative h-20 w-20 overflow-hidden rounded-full border-3 sm:h-28 sm:w-28"
        style={{ borderColor: teamColor }}
      >
        {player.profile_image_url ? (
          <Image
            src={player.profile_image_url}
            alt={player.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-2xl font-bold text-gray-400 sm:text-3xl">
            {player.name[0]}
          </div>
        )}
      </div>
      <h3 className="text-center text-base font-bold text-gray-900 sm:text-lg">
        {player.name}
      </h3>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {player.team && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {player.team.team_name}
          </span>
        )}
        {player.position && (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: teamColor + '15',
              color: textColorFor(teamColor),
            }}
          >
            {positionLabel[player.position] || player.position}
          </span>
        )}
        {player.jersey_number !== null && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            #{player.jersey_number}
          </span>
        )}
      </div>
    </div>
  );
}

// ========== Inner Component (uses useSearchParams) ==========

function PlayerCompareInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedSeason, setSelectedSeason] = useState<number | undefined>(
    undefined
  );
  const [player1, setPlayer1] = useState<PlayerSearchResult | null>(null);
  const [player2, setPlayer2] = useState<PlayerSearchResult | null>(null);
  const [copied, setCopied] = useState(false);
  const initializedRef = useRef(false);

  // Load players from URL query params on mount
  useEffect(() => {
    if (initializedRef.current) return;
    const p1 = searchParams.get('player1');
    const p2 = searchParams.get('player2');

    if (p1 && p2) {
      // Both players specified — load comparison
      initializedRef.current = true;
      const p1Id = parseInt(p1, 10);
      const p2Id = parseInt(p2, 10);
      if (isNaN(p1Id) || isNaN(p2Id)) return;

      fetchCompareDataRaw(p1Id, p2Id).then((data) => {
        if (!data) return;
        setPlayer1({
          player_id: data.player1.player_id,
          name: data.player1.name,
          profile_image_url: data.player1.profile_image_url,
          team: data.player1.team,
        });
        setPlayer2({
          player_id: data.player2.player_id,
          name: data.player2.name,
          profile_image_url: data.player2.profile_image_url,
          team: data.player2.team,
        });
      });
    } else if (p1 && !p2) {
      // Only player1 — pre-select and let user pick player2
      initializedRef.current = true;
      const p1Id = parseInt(p1, 10);
      if (isNaN(p1Id)) return;

      fetchCompareDataRaw(p1Id, p1Id).then((data) => {
        if (!data) return;
        setPlayer1({
          player_id: data.player1.player_id,
          name: data.player1.name,
          profile_image_url: data.player1.profile_image_url,
          team: data.player1.team,
        });
      });
    }
  }, [searchParams]);

  // Update URL when players change (only when user selects, not from URL init)
  const isUserAction = useRef(false);

  const handleSetPlayer1 = useCallback((p: PlayerSearchResult | null) => {
    isUserAction.current = true;
    setPlayer1(p);
  }, []);

  const handleSetPlayer2 = useCallback((p: PlayerSearchResult | null) => {
    isUserAction.current = true;
    setPlayer2(p);
  }, []);

  useEffect(() => {
    if (player1 && player2 && isUserAction.current) {
      isUserAction.current = false;
      const params = new URLSearchParams();
      params.set('player1', player1.player_id.toString());
      params.set('player2', player2.player_id.toString());
      router.replace(`/stats/player-compare?${params.toString()}`, {
        scroll: false,
      });
    }
  }, [player1, player2, router]);

  const handleCopyLink = useCallback(() => {
    if (player1 && player2) {
      const url = `${window.location.origin}/stats/player-compare?player1=${player1.player_id}&player2=${player2.player_id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [player1, player2]);

  const bothSelected = player1 !== null && player2 !== null;

  const { data: compareData, isLoading: isLoadingCompare } = useGoalQuery(
    fetchCompareData,
    [player1?.player_id ?? 0, player2?.player_id ?? 0, selectedSeason],
    { enabled: bothSelected }
  );

  const stats: {
    label: string;
    key: keyof PlayerCompareStats;
    higherIsBetter?: boolean;
  }[] = [
    { label: '출장 경기', key: 'matches' },
    { label: '골', key: 'goals' },
    { label: '도움', key: 'assists' },
    { label: '공격포인트', key: 'attack_points' },
    { label: '선방', key: 'saves' },
    { label: '경고', key: 'yellow_cards', higherIsBetter: false },
    { label: '퇴장', key: 'red_cards', higherIsBetter: false },
  ];

  const colors = useMemo(
    () =>
      compareData
        ? getPlayerColors(compareData.player1.team, compareData.player2.team)
        : null,
    [compareData]
  );

  return (
    <Section padding="sm">
      <div className="mx-auto max-w-3xl">
        {/* Player Selection */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-center gap-3">
              <InfiniteSeasonSelect
                value={selectedSeason}
                onValueChange={setSelectedSeason}
                placeholder="전체 시즌"
              />
              {bothSelected && (
                <button
                  onClick={handleCopyLink}
                  className="flex shrink-0 items-center gap-1 rounded-lg border bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  {copied ? '복사됨!' : '링크 복사'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
              <PlayerSearchInput
                label="선수 검색"
                selectedPlayer={player1}
                onSelect={handleSetPlayer1}
                onClear={() => handleSetPlayer1(null)}
              />
              <span className="text-center text-sm font-bold text-gray-400">
                VS
              </span>
              <PlayerSearchInput
                label="선수 검색"
                selectedPlayer={player2}
                onSelect={handleSetPlayer2}
                onClear={() => handleSetPlayer2(null)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {bothSelected && isLoadingCompare && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                비교 데이터를 불러오는 중...
              </div>
            </CardContent>
          </Card>
        )}

        {compareData && colors && (
          <>
            {/* Basic Stats */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="mb-6 grid grid-cols-2 gap-4 sm:mb-8">
                  <PlayerProfile
                    player={compareData.player1}
                    teamColor={colors.bar1}
                  />
                  <PlayerProfile
                    player={compareData.player2}
                    teamColor={colors.bar2}
                  />
                </div>
                <div className="divide-y">
                  {stats.map((stat) => {
                    const v1 = compareData.player1.stats[stat.key] as number;
                    const v2 = compareData.player2.stats[stat.key] as number;
                    if (v1 === 0 && v2 === 0) return null;
                    return (
                      <StatBar
                        key={stat.key}
                        label={stat.label}
                        value1={v1}
                        value2={v2}
                        colors={colors}
                        higherIsBetter={stat.higherIsBetter}
                      />
                    );
                  })}
                </div>
                <div className="mt-6 rounded-lg bg-gray-50 p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">참여 시즌</p>
                      <p
                        className="text-lg font-bold"
                        style={{ color: colors.text1 }}
                      >
                        {compareData.player1.stats.seasons_played}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">참여 시즌</p>
                      <p
                        className="text-lg font-bold"
                        style={{ color: colors.text2 }}
                      >
                        {compareData.player2.stats.seasons_played}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Head-to-Head */}
            <HeadToHeadSection
              data={compareData.head_to_head}
              player1Name={compareData.player1.name}
              player2Name={compareData.player2.name}
              color1={colors.text1}
              color2={colors.text2}
            />

            {/* Goal Timing */}
            <GoalTimingSection
              data={compareData.goal_timing}
              player1Name={compareData.player1.name}
              player2Name={compareData.player2.name}
              color1={colors.bar1}
              color2={colors.bar2}
            />

            {/* Season Breakdown */}
            <SeasonBreakdownSection
              data={compareData.season_breakdown}
              player1Name={compareData.player1.name}
              player2Name={compareData.player2.name}
              color1={colors.text1}
              color2={colors.text2}
            />
          </>
        )}

        {/* Empty State */}
        {!bothSelected && !isLoadingCompare && (
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 sm:p-12">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-700">
                두 선수를 선택해주세요
              </h3>
              <p className="text-sm text-gray-500">
                비교하고 싶은 선수 이름을 검색해서 선택하면
                <br />
                통산 기록을 나란히 비교할 수 있어요
              </p>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

// ========== Main Component (Suspense wrapper for useSearchParams) ==========

export function PlayerComparePageContent() {
  return (
    <Suspense
      fallback={
        <Section padding="sm">
          <div className="mx-auto max-w-3xl">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  로딩 중...
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>
      }
    >
      <PlayerCompareInner />
    </Suspense>
  );
}
