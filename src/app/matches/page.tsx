import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { Container, H1, Section } from '@/components/ui';
import { getMatchesArchiveData } from '@/features/matches/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '경기 기록',
  description:
    '골 때리는 그녀들 전체 경기 기록. 최근 경기 결과, 예정 경기, 시즌별 경기 아카이브를 확인하세요.',
  keywords: [
    '골때녀 경기',
    '골때녀 경기결과',
    '골때녀 경기 기록',
    '골 때리는 그녀들 경기',
  ],
  alternates: { canonical: '/matches' },
  openGraph: {
    title: '경기 기록 | 골때녀 데이터센터',
    description:
      '골 때리는 그녀들 전체 경기 기록. 최근 결과, 예정 경기, 시즌별 아카이브.',
    url: 'https://www.gtndatacenter.com/matches',
  },
};

export default async function MatchesPage() {
  const { seasons, recentMatches, upcomingMatches } =
    await getMatchesArchiveData();

  return (
    <Container className="py-8">
      <Section>
        <H1>경기 기록</H1>
        <p className="mt-2 text-gray-500">
          골 때리는 그녀들의 모든 경기를 한곳에서 확인하세요.
        </p>
      </Section>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 왼쪽: 최근 경기 + 예정 경기 */}
        <div className="lg:col-span-2 space-y-8">
          {/* 최근 경기 */}
          {recentMatches.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                최근 경기 결과
              </h2>
              <div className="space-y-2">
                {recentMatches.map((match) => (
                  <MatchRow key={match.match_id} match={match} />
                ))}
              </div>
            </section>
          )}

          {/* 예정 경기 */}
          {upcomingMatches.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                예정 경기
              </h2>
              <div className="space-y-2">
                {upcomingMatches.map((match) => (
                  <MatchRow key={match.match_id} match={match} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* 오른쪽: 시즌별 바로가기 */}
        <aside>
          <h2 className="text-lg font-bold text-gray-900 mb-4">시즌별 경기</h2>
          <nav>
            <ul className="space-y-1">
              {seasons.map((season) => (
                <li key={season.season_id}>
                  <Link
                    href={`/seasons/${season.season_id}?tab=matches`}
                    className="block px-4 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    {season.season_name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </Container>
  );
}

function MatchRow({
  match,
}: {
  match: {
    match_id: number;
    match_date: string;
    home_score: number | null;
    away_score: number | null;
    penalty_home_score: number | null;
    penalty_away_score: number | null;
    status: string | null;
    season: { season_name: string } | null;
    home_team: {
      team_name: string;
      logo: string | null;
    } | null;
    away_team: {
      team_name: string;
      logo: string | null;
    } | null;
  };
}) {
  const isCompleted = match.status === 'completed';
  const matchDate = new Date(match.match_date);
  const dateStr = format(matchDate, 'M/d (EEE)', { locale: ko });
  const hasPenalty =
    match.penalty_home_score != null && match.penalty_away_score != null;

  return (
    <Link
      href={`/matches/${match.match_id}`}
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
    >
      {/* 날짜 */}
      <div className="w-16 flex-shrink-0 text-center">
        <span className="text-xs text-gray-400">{dateStr}</span>
        {match.season && (
          <div className="text-[10px] text-gray-300 truncate">
            {match.season.season_name}
          </div>
        )}
      </div>

      {/* 홈팀 */}
      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
        <span
          className={`text-sm truncate ${
            isCompleted &&
            match.home_score != null &&
            match.away_score != null &&
            match.home_score > match.away_score
              ? 'font-bold text-gray-900'
              : 'text-gray-600'
          }`}
        >
          {match.home_team?.team_name}
        </span>
        {match.home_team?.logo && (
          <div className="w-6 h-6 relative flex-shrink-0 rounded-full overflow-hidden">
            <Image
              src={match.home_team.logo}
              alt={match.home_team.team_name || ''}
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
        )}
      </div>

      {/* 스코어 / 시간 */}
      <div className="w-14 text-center flex-shrink-0">
        {isCompleted ? (
          <>
            <span className="text-sm font-bold text-gray-900">
              {match.home_score} - {match.away_score}
            </span>
            {hasPenalty && (
              <div className="text-[10px] text-gray-400">
                PK {match.penalty_home_score}-{match.penalty_away_score}
              </div>
            )}
          </>
        ) : (
          <span className="text-xs font-medium text-gray-500">
            {format(matchDate, 'HH:mm')}
          </span>
        )}
      </div>

      {/* 원정팀 */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {match.away_team?.logo && (
          <div className="w-6 h-6 relative flex-shrink-0 rounded-full overflow-hidden">
            <Image
              src={match.away_team.logo}
              alt={match.away_team.team_name || ''}
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
        )}
        <span
          className={`text-sm truncate ${
            isCompleted &&
            match.home_score != null &&
            match.away_score != null &&
            match.away_score > match.home_score
              ? 'font-bold text-gray-900'
              : 'text-gray-600'
          }`}
        >
          {match.away_team?.team_name}
        </span>
      </div>
    </Link>
  );
}
