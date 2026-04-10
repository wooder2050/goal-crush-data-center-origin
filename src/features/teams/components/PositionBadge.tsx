'use client';

interface PositionBadgeProps {
  position: number;
}

export default function PositionBadge({ position }: PositionBadgeProps) {
  const medal =
    position === 1
      ? '🥇'
      : position === 2
        ? '🥈'
        : position === 3
          ? '🥉'
          : null;

  const style =
    position === 1
      ? 'bg-amber-50 text-amber-800'
      : position === 2
        ? 'bg-gray-100 text-gray-700'
        : position === 3
          ? 'bg-orange-50 text-orange-800'
          : 'bg-gray-50 text-gray-600';

  return (
    <span
      className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-semibold ${style}`}
    >
      {medal ? `${medal} ${position}위` : `${position}위`}
    </span>
  );
}
