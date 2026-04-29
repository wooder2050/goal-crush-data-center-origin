'use client';

import { Section } from '@/components/ui';
import { useGoalQuery } from '@/hooks/useGoalQuery';

import { fetchHomePageData } from '../api-prisma';
import type { HomePageData } from '../types';
import CareerStatsWidget from './CareerStatsWidget';
import MatchesWidget from './MatchesWidget';
import PlayerCompareBanner from './PlayerCompareBanner';
import PlayerStatsWidget from './PlayerStatsWidget';
import PowerRankingWidget from './PowerRankingWidget';
import StandingsWidget from './StandingsWidget';

interface HomePageDashboardProps {
  initialData: HomePageData;
}

export default function HomePageDashboard({
  initialData,
}: HomePageDashboardProps) {
  const { data } = useGoalQuery(fetchHomePageData, [], {
    initialData,
    staleTime: 60 * 1000,
  });

  const pageData = data ?? initialData;

  return (
    <Section padding="sm" className="min-h-screen bg-gray-50 py-6">
      {/* Season Header */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        {pageData.currentSeason.season_name}
      </h2>

      {/* 2-Column Grid: FotMob style */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Left Column - Standings + Player Stats */}
        <div className="lg:col-span-7 space-y-4">
          <StandingsWidget
            standings={pageData.standings}
            seasonName={pageData.currentSeason.season_name}
            seasonId={pageData.currentSeason.season_id}
          />
          <PlayerStatsWidget
            seasonId={pageData.currentSeason.season_id}
            topScorers={pageData.topScorers}
            topAssists={pageData.topAssists}
            topRatings={pageData.topRatings}
            topXtRatings={pageData.topXtRatings}
          />
        </div>

        {/* Right Column - Matches + Career Stats */}
        <div className="lg:col-span-5 space-y-4">
          <MatchesWidget
            seasonId={pageData.currentSeason.season_id}
            recentMatches={pageData.recentMatches}
            upcomingMatches={pageData.upcomingMatches}
            semiFinalMatches={pageData.semiFinalMatches}
          />
          <PowerRankingWidget />
          <PlayerCompareBanner
            topScorers={pageData.topScorers}
            topAssists={pageData.topAssists}
          />
          <CareerStatsWidget
            careerTopScorers={pageData.careerTopScorers}
            careerTopAssists={pageData.careerTopAssists}
            careerGoalsPerMatch={pageData.careerGoalsPerMatch}
            careerAssistsPerMatch={pageData.careerAssistsPerMatch}
            careerAttackPoints={pageData.careerAttackPoints}
            careerAttackPointsPerMatch={pageData.careerAttackPointsPerMatch}
          />
        </div>
      </div>
    </Section>
  );
}
