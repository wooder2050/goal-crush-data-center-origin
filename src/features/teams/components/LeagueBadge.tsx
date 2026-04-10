'use client';

export type LeagueType =
  | 'super'
  | 'challenge'
  | 'playoff'
  | 'cup'
  | 'championship'
  | 'g-league'
  | 'other';

const LEAGUE_STYLES: Record<LeagueType, string> = {
  super: 'bg-violet-100 text-violet-700',
  challenge: 'bg-sky-100 text-sky-700',
  playoff: 'bg-indigo-100 text-indigo-700',
  cup: 'bg-orange-100 text-orange-700',
  championship: 'bg-rose-100 text-rose-700',
  'g-league': 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-600',
};

const LEAGUE_LABELS: Record<LeagueType, string> = {
  super: '슈퍼',
  challenge: '챌린지',
  playoff: '플레이오프',
  cup: '컵',
  championship: '챔피언십',
  'g-league': 'G리그',
  other: '기타',
};

export default function LeagueBadge({ league }: { league: LeagueType }) {
  const style = LEAGUE_STYLES[league] ?? LEAGUE_STYLES.other;

  return (
    <span
      className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${style}`}
    >
      {LEAGUE_LABELS[league] ?? league}
    </span>
  );
}
