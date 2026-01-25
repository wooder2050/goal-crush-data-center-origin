'use client';

import { useMemo } from 'react';

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
import { getAllSeasonsPrisma } from '@/features/seasons/api-prisma';
import SeasonPageSkeleton from '@/features/seasons/components/SeasonPageSkeleton';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import type { Season } from '@/lib/types';

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
}

function SeasonDetailContentInner({ seasonId }: SeasonDetailContentProps) {
  const idNum = Number(seasonId);
  const resolvedId = Number.isFinite(idNum) ? idNum : null;

  const { data: seasons = [] } = useGoalSuspenseQuery(getAllSeasonsPrisma, []);

  const matchedSeason: Season | undefined = useMemo(() => {
    return seasons.find((s) => s.season_id === resolvedId);
  }, [seasons, resolvedId]);

  if (!matchedSeason || !matchedSeason.season_id) {
    return (
      <Section padding="sm" className="pt-2 sm:pt-3">
        <div className="text-center">
          <p className="text-lg text-gray-700">
            해당 시즌 페이지를 찾을 수 없습니다.
          </p>
        </div>
      </Section>
    );
  }

  const category = (matchedSeason.category ??
    'OTHER') as keyof typeof categoryToComponent;
  const Component = categoryToComponent[category] ?? OtherLeagueResults;

  return (
    <Section padding="sm" className="pt-2 sm:pt-3">
      <div className="space-y-6">
        <GoalWrapper fallback={<UpcomingMatchesSkeleton items={1} />}>
          <UpcomingMatches seasonId={matchedSeason.season_id} limit={10} />
        </GoalWrapper>
        <Component
          seasonId={matchedSeason.season_id}
          title={matchedSeason.season_name}
        />
      </div>
    </Section>
  );
}

export default function SeasonDetailContent({
  seasonId,
}: SeasonDetailContentProps) {
  return (
    <GoalWrapper fallback={<SeasonPageSkeleton />}>
      <SeasonDetailContentInner seasonId={seasonId} />
    </GoalWrapper>
  );
}
