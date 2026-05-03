'use client';

import { GoalWrapper } from '@/common/GoalWrapper';
import type { MatchWithTeams } from '@/lib/types';

import MatchDetailedStatsSection from '../MatchDetailedStatsSection';
import MatchDetailedStatsSectionSkeleton from '../MatchDetailedStatsSectionSkeleton';
import MatchPlayerRatingsSection from '../MatchPlayerRatingsSection';

export default function RatingsTab({ match }: { match: MatchWithTeams }) {
  const hasScore = match.home_score != null && match.away_score != null;
  const hasTeams = match.home_team_id != null && match.away_team_id != null;

  if (!hasScore || !hasTeams) return null;

  return (
    <div className="space-y-4">
      <GoalWrapper fallback={null}>
        <MatchPlayerRatingsSection
          matchId={match.match_id}
          homeTeamId={match.home_team_id!}
          awayTeamId={match.away_team_id!}
          homeTeamName={match.home_team?.team_name || '홈팀'}
          awayTeamName={match.away_team?.team_name || '원정팀'}
          homeTeamLogo={match.home_team?.logo}
          awayTeamLogo={match.away_team?.logo}
        />
      </GoalWrapper>

      <GoalWrapper fallback={<MatchDetailedStatsSectionSkeleton />}>
        <MatchDetailedStatsSection
          matchId={match.match_id}
          homeTeamId={match.home_team_id!}
          awayTeamId={match.away_team_id!}
          homeTeamName={match.home_team?.team_name || '홈팀'}
          awayTeamName={match.away_team?.team_name || '원정팀'}
          homeTeamLogo={match.home_team?.logo}
          awayTeamLogo={match.away_team?.logo}
          variant="player-stats"
          homeTeamPrimaryColor={match.home_team?.primary_color || '#000000'}
          homeTeamSecondaryColor={match.home_team?.secondary_color || '#FFFFFF'}
          awayTeamPrimaryColor={match.away_team?.primary_color || '#6B7280'}
          awayTeamSecondaryColor={match.away_team?.secondary_color || '#FFFFFF'}
        />
      </GoalWrapper>
    </div>
  );
}
