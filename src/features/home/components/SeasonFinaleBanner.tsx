'use client';

import Image from 'next/image';
import Link from 'next/link';

import { trackSelectContent } from '@/lib/analytics';

import type { PlayerStatRow, SeasonFinale } from '../types';

interface SeasonFinaleBannerProps {
  finale: SeasonFinale;
}

/**
 * 시즌 마무리 배너 — 시즌 종료 후 다음 시즌 개막 전까지 노출.
 * 우승팀·우승 로스터와 개인 기록 1위(득점왕·도움왕)를 표기한다.
 * 노출 조건·우승팀 판정·동률 처리는 서버(getSeasonFinale)에서 확정된다.
 */
export default function SeasonFinaleBanner({
  finale,
}: SeasonFinaleBannerProps) {
  const { champion, roster, topScorers, topAssists } = finale;

  if (!champion && topScorers.length === 0 && topAssists.length === 0) {
    return null;
  }

  const track = (destination: string) =>
    trackSelectContent({ module: 'season_finale', destination });

  return (
    <section
      aria-label={`${finale.season_name} 시즌 마무리`}
      className="rounded-xl bg-gradient-to-r from-[#8a5a00] to-[#b07a10] text-white p-4 sm:p-5 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide bg-white/20 rounded-full px-2 py-0.5">
          시즌 종료
        </span>
        <Link
          href={`/seasons/${finale.season_id}`}
          onClick={() => track('season_detail')}
          className="text-xs text-white/90 hover:text-white hover:underline truncate"
        >
          {finale.season_name}
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
                  alt=""
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] text-white/90">우승</div>
              <div className="text-sm sm:text-base font-bold truncate">
                {champion.team_name}
              </div>
            </div>
          </Link>
        )}

        <div className="flex flex-col min-[420px]:flex-row gap-2 sm:gap-3">
          <AwardChip
            title="득점왕"
            leaders={topScorers}
            statLabel={(row) => `${row.goals ?? 0}골`}
            onSelect={() => track('top_scorer')}
          />
          <AwardChip
            title="도움왕"
            leaders={topAssists}
            statLabel={(row) => `${row.assists ?? 0}도움`}
            onSelect={() => track('top_assist')}
          />
        </div>
      </div>

      {champion && roster.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="text-[10px] text-white/90 mb-2">
            우승 멤버 · {roster.length}명
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-2">
            {roster.map((player) => {
              const statText = [
                player.goals > 0 ? `${player.goals}골` : null,
                player.assists > 0 ? `${player.assists}도움` : null,
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <li key={player.player_id}>
                  <Link
                    href={`/players/${player.player_id}`}
                    onClick={() => track('champion_player')}
                    aria-label={`${player.player_name}, ${player.matches_played}경기 ${player.goals}골 ${player.assists}도움`}
                    className="flex flex-col items-center w-14 group"
                  >
                    <Avatar
                      src={player.player_image}
                      name={player.player_name}
                      size={44}
                    />
                    <span className="mt-1 text-[11px] font-semibold truncate w-full text-center group-hover:underline">
                      {player.player_name}
                    </span>
                    {statText && (
                      <span className="text-[10px] text-white/90">
                        {statText}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

// 이름이 항상 옆에 표시되므로 아바타는 장식 요소로 취급 (alt="" / aria-hidden)
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
        aria-hidden
        className="rounded-full bg-white/30 flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
      >
        {name.slice(0, 1)}
      </div>
    );
  }
  return (
    <div
      style={style}
      aria-hidden
      className="relative rounded-full overflow-hidden bg-white ring-2 ring-white/60 flex-shrink-0"
    >
      <Image
        src={src}
        alt=""
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
        <div className="text-[10px] text-white/90">{title}</div>
        <div className="text-sm font-bold truncate">
          {names}
          <span className="ml-1 text-xs font-semibold text-white/90">
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
        aria-label={`${title} ${first.player_name ?? ''} ${statLabel(first)}`}
        className={`${className} hover:bg-white/25 transition-colors`}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
