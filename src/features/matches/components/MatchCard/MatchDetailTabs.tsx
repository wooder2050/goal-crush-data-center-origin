'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHashTab } from '@/hooks/useHashTab';
import type { MatchWithTeams } from '@/lib/types';

import LineupsTab from './tabs/LineupsTab';
import RatingsTab from './tabs/RatingsTab';
import StatsTab from './tabs/StatsTab';
import SummaryTab from './tabs/SummaryTab';

interface MatchDetailTabsProps {
  match: MatchWithTeams;
}

export default function MatchDetailTabs({ match }: MatchDetailTabsProps) {
  const hasScore = match.home_score != null && match.away_score != null;
  const hasTeams = match.home_team_id != null && match.away_team_id != null;
  const { tab, onTabChange } = useHashTab('summary');

  const completedTabs = [
    { value: 'summary', label: '요약' },
    { value: 'lineups', label: '라인업' },
    { value: 'stats', label: '통계' },
    ...(hasTeams ? [{ value: 'ratings', label: '평점' }] : []),
  ];

  const previewTabs = [
    { value: 'summary', label: '프리뷰' },
    { value: 'lineups', label: '라인업' },
    { value: 'stats', label: '맞대결' },
  ];

  const tabs = hasScore ? completedTabs : previewTabs;

  return (
    <Tabs value={tab} onValueChange={onTabChange} className="mt-4">
      <TabsList className="sticky top-0 z-10 w-full justify-start gap-1 bg-white">
        {tabs.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className="min-h-[44px] flex-1 text-sm"
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="summary">
        <SummaryTab match={match} />
      </TabsContent>

      <TabsContent value="lineups">
        <LineupsTab match={match} />
      </TabsContent>

      <TabsContent value="stats">
        <StatsTab match={match} />
      </TabsContent>

      {hasScore && hasTeams && (
        <TabsContent value="ratings">
          <RatingsTab match={match} />
        </TabsContent>
      )}
    </Tabs>
  );
}
