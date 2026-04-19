'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { Container, H1, Section } from '@/components/ui';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';

interface ArchiveMatch {
  match_id: number;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
  status: string | null;
  season: { season_id: number; season_name: string } | null;
  home_team: { team_id: number; team_name: string; logo: string | null } | null;
  away_team: { team_id: number; team_name: string; logo: string | null } | null;
}

interface Season {
  season_id: number;
  season_name: string;
}

interface Props {
  seasons: Season[];
  recentMatches: ArchiveMatch[];
  upcomingMatches: ArchiveMatch[];
}

async function fetchSeasonMatches(seasonId: number): Promise<ArchiveMatch[]> {
  const res = await fetch(apiUrl(`/api/matches/season/${seasonId}`));
  if (!res.ok) throw new Error('Failed to fetch season matches');
  return res.json();
}

export default function MatchesArchiveContent({
  seasons,
  recentMatches,
  upcomingMatches,
}: Props) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);

  const { data: seasonMatches, isLoading } = useGoalQuery(
    fetchSeasonMatches,
    [selectedSeasonId!],
    {
      enabled: selectedSeasonId !== null,
      staleTime: 5 * 60 * 1000,
    }
  );

  const showingSeasonMatches = selectedSeasonId !== null;
  const selectedSeason = seasons.find((s) => s.season_id === selectedSeasonId);

  return (
    <Container className="py-8">
      <Section>
        <H1>경기 기록</H1>
        <p className="mt-2 text-gray-500">
          골 때리는 그녀들의 모든 경기를 한곳에서 확인하세요.
        </p>
      </Section>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 왼쪽: 경기 목록 */}
        <div className="lg:col-span-2 space-y-8">
          {showingSeasonMatches ? (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedSeason?.season_name}
                </h2>
                <button
                  onClick={() => setSelectedSeasonId(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  전체 보기
                </button>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-14 rounded-lg bg-gray-100 animate-pulse"
                    />
                  ))}
                </div>
              ) : seasonMatches && seasonMatches.length > 0 ? (
                <div className="space-y-2">
                  {seasonMatches.map((match) => (
                    <MatchRow key={match.match_id} match={match} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-8 text-center">
                  해당 시즌의 경기가 없습니다.
                </p>
              )}
            </section>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* 오른쪽: 시즌별 필터 */}
        <aside>
          <h2 className="text-lg font-bold text-gray-900 mb-4">시즌별 경기</h2>
          <nav>
            <ul className="space-y-1">
              {seasons.map((season) => (
                <li key={season.season_id}>
                  <button
                    onClick={() =>
                      setSelectedSeasonId(
                        selectedSeasonId === season.season_id
                          ? null
                          : season.season_id
                      )
                    }
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                      selectedSeasonId === season.season_id
                        ? 'bg-gray-900 text-white font-medium'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {season.season_name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </Container>
  );
}

function MatchRow({ match }: { match: ArchiveMatch }) {
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
      <div className="w-16 flex-shrink-0 text-center">
        <span className="text-xs text-gray-400">{dateStr}</span>
        {match.season && (
          <div className="text-[10px] text-gray-300 truncate">
            {match.season.season_name}
          </div>
        )}
      </div>

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
          {match.home_team?.team_name?.replace('FC ', '')}
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
          {match.away_team?.team_name?.replace('FC ', '')}
        </span>
      </div>
    </Link>
  );
}
