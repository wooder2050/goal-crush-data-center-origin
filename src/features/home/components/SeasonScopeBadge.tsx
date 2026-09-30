/** "2026 골 때리는 그녀들 제2회 GIFA컵" → "2026 제2회 GIFA컵" */
export function shortSeasonName(name: string): string {
  return name.replace(/골\s*때리는\s*그녀들\s*/, '').trim();
}

/**
 * 위젯이 어떤 시즌 기록을 보여주는지 표시하는 뱃지.
 * 폴백(현재 시즌 기록이 아직 없음)일 때는 눈에 띄는 색으로 구분한다.
 */
export default function SeasonScopeBadge({
  seasonName,
  isFallback = false,
}: {
  seasonName: string;
  isFallback?: boolean;
}) {
  if (!seasonName) return null;
  return (
    <span
      className={`max-w-[11rem] truncate rounded-full border px-2 py-0.5 text-[10px] font-medium ${
        isFallback
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-gray-200 bg-gray-50 text-gray-500'
      }`}
      title={`${seasonName} 기록`}
    >
      {shortSeasonName(seasonName)} 기록
    </span>
  );
}
