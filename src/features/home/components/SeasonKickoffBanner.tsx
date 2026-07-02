'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { HomeMatch } from '../types';

interface SeasonKickoffBannerProps {
  seasonName: string;
  startDate: string | null;
  kickoffMatch: HomeMatch | null;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const KST_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// KST 기준 시각 컴포넌트 — 서버(UTC)/브라우저 어디서 렌더해도 동일한 값 보장
function kstParts(date: Date) {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    month: kst.getUTCMonth() + 1,
    day: kst.getUTCDate(),
    weekday: KST_WEEKDAYS[kst.getUTCDay()],
    hour: String(kst.getUTCHours()).padStart(2, '0'),
    minute: String(kst.getUTCMinutes()).padStart(2, '0'),
  };
}

// KST 기준 날짜(자정)로 정규화 — 서버(UTC)와 브라우저 로컬 타임존 차이 제거
function kstDateOnlyMs(date: Date): number {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate());
}

export default function SeasonKickoffBanner({
  seasonName,
  startDate,
  kickoffMatch,
}: SeasonKickoffBannerProps) {
  // D-day는 마운트 후에만 계산해 SSR/클라이언트 hydration 불일치를 방지
  const [dDay, setDDay] = useState<number | null>(null);
  useEffect(() => {
    if (!startDate) return;
    setDDay(
      Math.round(
        (kstDateOnlyMs(new Date(startDate)) - kstDateOnlyMs(new Date())) /
          DAY_MS
      )
    );
  }, [startDate]);

  const dDayLabel =
    dDay == null || dDay < 0
      ? null
      : dDay === 0
        ? '오늘 개막!'
        : `개막 D-${dDay}`;

  const start = startDate ? kstParts(new Date(startDate)) : null;
  const kickoff = kickoffMatch
    ? kstParts(new Date(kickoffMatch.match_date))
    : null;

  return (
    <div className="rounded-xl bg-gradient-to-r from-[#ff4800] to-[#ff7e33] text-white p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Season Info */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide bg-white/20 rounded-full px-2 py-0.5">
              새 시즌
            </span>
            {dDayLabel && (
              <span className="text-[11px] font-bold bg-white text-[#ff4800] rounded-full px-2 py-0.5">
                {dDayLabel}
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-bold">{seasonName}</h3>
          {start && (
            <p className="text-xs text-white/80 mt-0.5">
              {start.month}월 {start.day}일 ({start.weekday}) 개막
            </p>
          )}
        </div>

        {/* Kickoff Match */}
        {kickoffMatch && kickoff && (
          <Link
            href={`/matches/${kickoffMatch.match_id}`}
            className="flex items-center justify-center gap-3 bg-white/15 hover:bg-white/25 transition-colors rounded-lg px-4 py-2.5"
          >
            <TeamBadge
              name={kickoffMatch.home_team?.team_name}
              logo={kickoffMatch.home_team?.logo}
              align="right"
            />
            <div className="text-center flex-shrink-0">
              <div className="text-[10px] text-white/80">
                {kickoff.month}/{kickoff.day}
              </div>
              <div className="text-sm font-bold">
                {kickoff.hour}:{kickoff.minute}
              </div>
            </div>
            <TeamBadge
              name={kickoffMatch.away_team?.team_name}
              logo={kickoffMatch.away_team?.logo}
              align="left"
            />
          </Link>
        )}
      </div>
    </div>
  );
}

function TeamBadge({
  name,
  logo,
  align,
}: {
  name: string | undefined;
  logo: string | null | undefined;
  align: 'left' | 'right';
}) {
  const label = name?.replace('FC ', '') ?? '';
  return (
    <div
      className={`flex items-center gap-1.5 min-w-0 ${
        align === 'right' ? 'flex-row-reverse' : ''
      }`}
    >
      {logo && (
        <div className="w-6 h-6 relative flex-shrink-0 rounded-full overflow-hidden bg-white">
          <Image
            src={logo}
            alt={label}
            fill
            className="object-cover"
            sizes="24px"
          />
        </div>
      )}
      <span className="text-xs sm:text-sm font-semibold truncate">{label}</span>
    </div>
  );
}
