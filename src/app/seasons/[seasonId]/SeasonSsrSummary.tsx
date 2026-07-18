import Link from 'next/link';

import type { SeasonSsrSummary } from '@/features/seasons/server';
import type { Season } from '@/lib/types';

const matchDateFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
});

function formatMatchDate(iso: string): string {
  return matchDateFormat.format(new Date(iso));
}

function seasonStatusLabel(season: Season, summary: SeasonSsrSummary): string {
  const now = Date.now();
  if (season.start_date && new Date(season.start_date).getTime() > now) {
    return '개막 예정';
  }
  if (season.end_date && new Date(season.end_date).getTime() < now) {
    return '종료';
  }
  return summary.completed_matches === 0 ? '개막 예정' : '진행 중';
}

/**
 * 서버 렌더링 시즌 요약 블록.
 * 경기 목록·순위표 본문은 클라이언트에서 로딩되므로, 크롤러가 읽을 수 있는
 * 핵심 요약(경기 수·최근 결과·상위 순위)을 서버 HTML에 포함한다.
 */
export default function SeasonSsrSummaryBlock({
  season,
  summary,
}: {
  season: Season;
  summary: SeasonSsrSummary;
}) {
  const status = seasonStatusLabel(season, summary);
  const hasResults = summary.recent_results.length > 0;
  const hasStandings = summary.top_standings.length > 0;
  const cup = summary.cup;

  return (
    <section
      aria-label="시즌 요약"
      className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
    >
      <p className="font-medium text-gray-900">
        {season.season_name} — {cup ? '토너먼트 ' : ''}
        {status}
        {cup?.champion_team_name && (
          <span className="ml-2 text-amber-600">
            우승: {cup.champion_team_name}
          </span>
        )}
        {!cup?.champion_team_name && cup?.current_stage_label && (
          <span className="ml-2 text-gray-600">
            현재 {cup.current_stage_label}
          </span>
        )}
        {summary.total_matches > 0 && (
          <span className="ml-2 font-normal text-gray-500">
            전체 {summary.total_matches}경기 중 {summary.completed_matches}
            경기 완료
          </span>
        )}
      </p>

      {hasResults && (
        <ul className="mt-2 space-y-0.5">
          {summary.recent_results.map((m) => (
            <li key={m.match_id}>
              <Link href={`/matches/${m.match_id}`} className="hover:underline">
                {formatMatchDate(m.match_date)}{' '}
                {m.stage_label && `[${m.stage_label}] `}
                {m.home_team_name} {m.home_score}:{m.away_score}{' '}
                {m.away_team_name}
                {m.penalty_home_score !== null &&
                  m.penalty_away_score !== null &&
                  ` (승부차기 ${m.penalty_home_score}:${m.penalty_away_score})`}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {hasStandings && (
        <p className="mt-2 text-gray-600">
          순위:{' '}
          {summary.top_standings
            .map(
              (s) =>
                `${s.position}위 ${s.team_name}(${s.marker ? `${s.marker}, ` : ''}승점 ${s.points ?? 0}, ${s.wins ?? 0}승 ${s.losses ?? 0}패)`
            )
            .join(' · ')}
        </p>
      )}
    </section>
  );
}
