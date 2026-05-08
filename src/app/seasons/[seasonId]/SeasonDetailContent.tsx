'use client';

import { ChevronLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Section } from '@/components/ui';
import ChallengeResults from '@/features/matches/components/ChallengeResults';
import GLeagueTournamentResults from '@/features/matches/components/GLeagueTournamentResults';
import OtherLeagueResults from '@/features/matches/components/OtherLeagueResults';
import PlayoffResults from '@/features/matches/components/PlayoffResults';
import SbsCupResults from '@/features/matches/components/SbsCupResults';
import SemiFinalBracket from '@/features/matches/components/SemiFinalBracket';
import SuperResults from '@/features/matches/components/SuperResults';
import UpcomingMatches from '@/features/matches/components/UpcomingMatches';
import UpcomingMatchesSkeleton from '@/features/matches/components/UpcomingMatchesSkeleton';
import type { InitialSeasonDetailData } from '@/features/seasons/server';

const SeasonViewershipChart = dynamic(
  () => import('@/features/stats/components/SeasonViewershipChart'),
  { ssr: false }
);

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
  return (
    <Suspense fallback={<SeasonDetailBody initialData={initialData} />}>
      <SeasonDetailBodyWithTab initialData={initialData} />
    </Suspense>
  );
}

function SeasonDetailBodyWithTab({
  initialData,
}: {
  initialData: InitialSeasonDetailData;
}) {
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab') ?? undefined;
  return <SeasonDetailBody initialData={initialData} initialTab={tab} />;
}

function SeasonDetailBody({
  initialData,
  initialTab,
}: {
  initialData: InitialSeasonDetailData;
  initialTab?: string;
}) {
  const season = initialData.season;

  const category = (season.category ??
    'OTHER') as keyof typeof categoryToComponent;
  const Component = categoryToComponent[category] ?? OtherLeagueResults;

  return (
    <Section padding="sm" className="pt-2 sm:pt-3">
      <Link
        href="/seasons"
        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        시즌 목록
      </Link>
      <div className="space-y-6">
        <GoalWrapper fallback={<UpcomingMatchesSkeleton items={1} />}>
          <UpcomingMatches seasonId={season.season_id} limit={10} />
        </GoalWrapper>
        {category === 'G_LEAGUE' && (
          <SemiFinalBracket seasonId={season.season_id} />
        )}
        <SeasonViewershipChart seasonId={season.season_id} />
        <Component
          seasonId={season.season_id}
          title={season.season_name}
          initialTab={initialTab}
        />
      </div>
    </Section>
  );
}
