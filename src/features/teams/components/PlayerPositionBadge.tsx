'use client';

const POSITION_STYLES: Record<string, string> = {
  GK: 'bg-amber-400 text-white',
  DF: 'bg-blue-400 text-white',
  MF: 'bg-emerald-400 text-white',
  FW: 'bg-rose-400 text-white',
};

interface PlayerPositionBadgeProps {
  position: string;
}

export default function PlayerPositionBadge({
  position,
}: PlayerPositionBadgeProps) {
  const style = POSITION_STYLES[position] ?? 'bg-gray-300 text-white';

  return (
    <span
      className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${style}`}
    >
      {position}
    </span>
  );
}
