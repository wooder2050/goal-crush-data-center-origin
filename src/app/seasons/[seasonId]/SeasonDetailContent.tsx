'use client';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Section } from '@/components/ui';
import ChallengeResults from '@/features/matches/components/ChallengeResults';
import GLeagueTournamentResults from '@/features/matches/components/GLeagueTournamentResults';
import OtherLeagueResults from '@/features/matches/components/OtherLeagueResults';
import PlayoffResults from '@/features/matches/components/PlayoffResults';
import SbsCupResults from '@/features/matches/components/SbsCupResults';
import SuperResults from '@/features/matches/components/SuperResults';
import UpcomingMatches from '@/features/matches/components/UpcomingMatches';
import UpcomingMatchesSkeleton from '@/features/matches/components/UpcomingMatchesSkeleton';
import type { InitialSeasonDetailData } from '@/features/seasons/server';

const categoryToComponent = {
  G_LEAGUE: GLeagueTournamentResults,
  SUPER_LEAGUE: SuperResults,
  CHALLENGE_LEAGUE: ChallengeResults,
  PLAYOFF: PlayoffResults,
  SBS_CUP: SbsCupResults,
  GIFA_CUP: SbsCupResults,
  CHAMPION_MATCH: SbsCupResults,
  OTHER: OtherLeagueResults,
} as const;

interface SeasonDetailContentProps {
  seasonId: string;
  initialData: InitialSeasonDetailData;
}

export default function SeasonDetailContent({
  initialData,
}: SeasonDetailContentProps) {
  const season = initialData.season;

  const category = (season.category ??
    'OTHER') as keyof typeof categoryToComponent;
  const Component = categoryToComponent[category] ?? OtherLeagueResults;

  return (
    <Section padding="sm" className="pt-2 sm:pt-3">
      <div className="space-y-6">
        <GoalWrapper fallback={<UpcomingMatchesSkeleton items={1} />}>
          <UpcomingMatches seasonId={season.season_id} limit={10} />
        </GoalWrapper>
        <Component seasonId={season.season_id} title={season.season_name} />
      </div>
    </Section>
  );
}
