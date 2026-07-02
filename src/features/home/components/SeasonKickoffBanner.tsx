'use client';

import { differenceInCalendarDays, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';

import type { HomeMatch } from '../types';

interface SeasonKickoffBannerProps {
  seasonName: string;
  startDate: string | null;
  kickoffMatch: HomeMatch | null;
}

export default function SeasonKickoffBanner({
  seasonName,
  startDate,
  kickoffMatch,
}: SeasonKickoffBannerProps) {
  const dDay = startDate
    ? differenceInCalendarDays(new Date(startDate), new Date())
    : null;

  const dDayLabel =
    dDay == null || dDay < 0
      ? null
      : dDay === 0
        ? '오늘 개막!'
        : `개막 D-${dDay}`;

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
          {startDate && (
            <p className="text-xs text-white/80 mt-0.5">
              {format(new Date(startDate), 'M월 d일 (EEE)', { locale: ko })}{' '}
              개막
            </p>
          )}
        </div>

        {/* Kickoff Match */}
        {kickoffMatch && (
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
                {format(new Date(kickoffMatch.match_date), 'M/d', {
                  locale: ko,
                })}
              </div>
              <div className="text-sm font-bold">
                {format(new Date(kickoffMatch.match_date), 'HH:mm')}
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
