'use client';

import Image from 'next/image';
import Link from 'next/link';

import { trackSelectContent } from '@/lib/analytics';

import type {
  ChampionRosterPlayer,
  PlayerStatRow,
  StandingsGroup,
} from '../types';

interface SeasonFinaleBannerProps {
  seasonId: number;
  seasonName: string;
  standings: StandingsGroup[];
  championRoster: ChampionRosterPlayer[];
  topScorers: PlayerStatRow[];
  topAssists: PlayerStatRow[];
}

// 동률 1위를 모두 수상자로 표기 (예: 득점 공동 1위)
function pickLeaders(
  rows: PlayerStatRow[],
  value: (row: PlayerStatRow) => number
): PlayerStatRow[] {
  const max = rows.reduce((acc, row) => Math.max(acc, value(row)), 0);
  if (max <= 0) return [];
  return rows.filter((row) => value(row) === max);
}

/**
 * 시즌 마무리 배너 — 시즌 종료(end_date 입력) 후 다음 시즌 개막 전까지 노출.
 * 우승팀(순위표 1위)·우승 로스터와 개인 기록 1위(득점왕·도움왕)를 표기한다.
 */
export default function SeasonFinaleBanner({
  seasonId,
  seasonName,
  standings,
  championRoster,
  topScorers,
  topAssists,
}: SeasonFinaleBannerProps) {
  const champion =
    standings
      .flatMap((group) => group.standings)
      .find((row) => row.position === 1)?.team ?? null;

  const scorerLeaders = pickLeaders(topScorers, (row) => row.goals ?? 0);
  const assistLeaders = pickLeaders(topAssists, (row) => row.assists ?? 0);

  if (!champion && scorerLeaders.length === 0 && assistLeaders.length === 0) {
    return null;
  }

  const track = (destination: string) =>
    trackSelectContent({ module: 'season_finale', destination });

  return (
    <div className="rounded-xl bg-gradient-to-r from-[#b8860b] to-[#daa520] text-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide bg-white/20 rounded-full px-2 py-0.5">
          시즌 종료
        </span>
        <Link
          href={`/seasons/${seasonId}`}
          onClick={() => track('season_detail')}
          className="text-xs text-white/85 hover:text-white truncate"
        >
          {seasonName}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {champion && (
          <Link
            href={`/teams/${champion.team_id}`}
            onClick={() => track('champion_team')}
            className="flex items-center gap-2.5 bg-white/15 hover:bg-white/25 transition-colors rounded-lg px-3.5 py-2.5"
          >
            <span className="text-xl" aria-hidden>
              🏆
            </span>
            {champion.logo && (
              <div className="w-8 h-8 relative flex-shrink-0 rounded-full overflow-hidden bg-white">
                <Image
                  src={champion.logo}
                  alt={champion.team_name}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] text-white/80">우승</div>
              <div className="text-sm sm:text-base font-bold truncate">
                {champion.team_name}
              </div>
            </div>
          </Link>
        )}

        <div className="flex flex-col min-[420px]:flex-row gap-2 sm:gap-3">
          <AwardChip
            title="득점왕"
            leaders={scorerLeaders}
            statLabel={(row) => `${row.goals ?? 0}골`}
            onSelect={() => track('top_scorer')}
          />
          <AwardChip
            title="도움왕"
            leaders={assistLeaders}
            statLabel={(row) => `${row.assists ?? 0}도움`}
            onSelect={() => track('top_assist')}
          />
        </div>
      </div>

      {champion && championRoster.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="text-[10px] text-white/80 mb-2">
            우승 멤버 · {championRoster.length}명
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-2">
            {championRoster.map((player) => (
              <li key={player.player_id}>
                <Link
                  href={`/players/${player.player_id}`}
                  onClick={() => track('champion_player')}
                  className="flex flex-col items-center w-14 group"
                  title={`${player.player_name} · ${player.matches_played}경기 ${player.goals}골 ${player.assists}도움`}
                >
                  <Avatar
                    src={player.player_image}
                    name={player.player_name}
                    size={44}
                  />
                  <span className="mt-1 text-[11px] font-semibold truncate w-full text-center group-hover:underline">
                    {player.player_name}
                  </span>
                  {player.goals + player.assists > 0 && (
                    <span className="text-[10px] text-white/80">
                      {player.goals > 0 ? `${player.goals}골` : ''}
                      {player.goals > 0 && player.assists > 0 ? ' ' : ''}
                      {player.assists > 0 ? `${player.assists}도움` : ''}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Avatar({
  src,
  name,
  size,
}: {
  src: string | null;
  name: string;
  size: number;
}) {
  const style = { width: size, height: size };
  if (!src) {
    return (
      <div
        style={style}
        className="rounded-full bg-white/30 flex items-center justify-center text-sm font-bold text-white/90 flex-shrink-0"
        aria-label={name}
      >
        {name.slice(0, 1)}
      </div>
    );
  }
  return (
    <div
      style={style}
      className="relative rounded-full overflow-hidden bg-white ring-2 ring-white/60 flex-shrink-0"
    >
      <Image
        src={src}
        alt={name}
        fill
        className="object-cover"
        sizes={`${size}px`}
      />
    </div>
  );
}

function AwardChip({
  title,
  leaders,
  statLabel,
  onSelect,
}: {
  title: string;
  leaders: PlayerStatRow[];
  statLabel: (row: PlayerStatRow) => string;
  onSelect: () => void;
}) {
  if (leaders.length === 0) return null;

  const first = leaders[0];
  const names = leaders
    .map((row) => row.player_name)
    .filter(Boolean)
    .join(' · ');

  const content = (
    <>
      {/* 공동 수상은 대표 1명 얼굴만 표시 */}
      <Avatar
        src={first.player_image}
        name={first.player_name ?? ''}
        size={32}
      />
      <div className="min-w-0">
        <div className="text-[10px] text-white/80">{title}</div>
        <div className="text-sm font-bold truncate">
          {names}
          <span className="ml-1 text-xs font-semibold text-white/85">
            {statLabel(first)}
          </span>
        </div>
      </div>
    </>
  );

  const className =
    'flex items-center gap-2 min-w-0 bg-white/15 rounded-lg px-3 py-2';

  // 단독 수상자는 선수 페이지로 연결, 공동 수상은 링크 없이 표기만
  if (leaders.length === 1 && first.player_id != null) {
    return (
      <Link
        href={`/players/${first.player_id}`}
        onClick={onSelect}
        className={`${className} hover:bg-white/25 transition-colors`}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
