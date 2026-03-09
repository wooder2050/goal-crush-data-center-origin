'use client';

import { isFuture } from 'date-fns';
import { Calendar } from 'lucide-react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { SupportMatchCardSkeleton } from '@/components/skeletons/SupportMatchCardSkeleton';
import { SupportMatchCard } from '@/components/SupportMatchCard';
import { Card, CardContent } from '@/components/ui';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';

interface UpcomingMatch {
  match_id: number;
  match_date: string;
  status: string;
  description?: string | null;
  season?: {
    season_id: number;
    season_name: string;
  } | null;
  home: {
    team_id: number;
    team_name: string;
    logo?: string | null;
  } | null;
  away: {
    team_id: number;
    team_name: string;
    logo?: string | null;
  } | null;
}

export function UpcomingMatchesTab() {
  // 다가오는 경기 목록 조회
  const fetchUpcomingMatches = async (): Promise<UpcomingMatch[]> => {
    const response = await fetch(apiUrl('/api/matches/upcoming'));
    if (!response.ok) {
      throw new Error('Failed to fetch upcoming matches');
    }
    const data = await response.json();
    return data.matches || [];
  };

  (
    fetchUpcomingMatches as typeof fetchUpcomingMatches & { queryKey: string }
  ).queryKey = 'upcomingMatches';

  const upcomingMatchesData = useGoalSuspenseQuery(fetchUpcomingMatches, []);

  const futureMatches = upcomingMatchesData.data.filter((match) =>
    isFuture(new Date(match.match_date))
  );

  if (futureMatches.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            다가오는 경기가 없습니다
          </h3>
          <p className="text-gray-600">
            새로운 경기가 등록되면 여기에 표시됩니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {futureMatches.map((match) => {
        // SupportMatchCard에서 기대하는 형식으로 변환
        const transformedMatch = {
          match_id: match.match_id,
          match_date: match.match_date,
          status: match.status,
          description: match.description,
          home_team: match.home
            ? {
                team_id: match.home.team_id,
                team_name: match.home.team_name,
                logo: match.home.logo,
                primary_color: null,
                secondary_color: null,
              }
            : null,
          away_team: match.away
            ? {
                team_id: match.away.team_id,
                team_name: match.away.team_name,
                logo: match.away.logo,
                primary_color: null,
                secondary_color: null,
              }
            : null,
        };

        return (
          <GoalWrapper
            key={match.match_id}
            fallback={<SupportMatchCardSkeleton />}
          >
            <SupportMatchCard match={transformedMatch} />
          </GoalWrapper>
        );
      })}
    </div>
  );
}
