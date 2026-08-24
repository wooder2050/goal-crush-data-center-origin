'use client';

import { useEffect, useRef } from 'react';

import { useAuth } from '@/components/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import { useHashTab } from '@/hooks/useHashTab';
import { trackExtendedDataView } from '@/lib/analytics';
import type { MatchWithTeams } from '@/lib/types';

import {
  getMatchRatingsPrisma,
  getMatchXtRatingsPrisma,
} from '../../api-prisma';
import ExtendedDataLock from './ExtendedDataLock';
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

  const { data: ratingsData } = useGoalQuery(
    getMatchRatingsPrisma,
    [match.match_id],
    { enabled: hasScore && hasTeams }
  );
  const { data: xtRatingsData } = useGoalQuery(
    getMatchXtRatingsPrisma,
    [match.match_id],
    { enabled: hasScore && hasTeams }
  );

  const { user, loading: authLoading } = useAuth();
  // 잠금 노출 이벤트 dedupe — 이 컴포넌트(=경기 상세 방문) 수명 단위
  const gateViewedKeysRef = useRef(new Set<string>());
  // 회원 열람 이벤트 — 방문당 1회
  const dataViewFiredRef = useRef(false);

  const hasRatings =
    (ratingsData?.ratings && ratingsData.ratings.length > 0) ||
    (xtRatingsData?.ratings && xtRatingsData.ratings.length > 0);

  // 확장 기록이 있는 경기인지 (비로그인 응답에도 포함되는 공개 플래그)
  const hasExtendedData =
    Boolean(ratingsData?.has_extended_data) ||
    Boolean(xtRatingsData?.has_extended_data);

  // 비로그인 + 확장 기록 존재 → 평점 탭을 잠금 상태로 노출
  const showLockedRatings =
    !authLoading && !user && !hasRatings && hasExtendedData;

  // 통계 탭 상단 잠금 배너 (팀 상세 통계·패스 네트워크 안내)
  const showStatsLockBanner = showLockedRatings;

  // 회원이 평점 탭을 실제 열람했을 때 계측 (방문당 1회 —
  // user 객체는 세션 갱신마다 새 참조라 id 기준으로만 판정)
  const userId = user?.id;
  useEffect(() => {
    if (
      tab === 'ratings' &&
      hasRatings &&
      userId &&
      !dataViewFiredRef.current
    ) {
      dataViewFiredRef.current = true;
      trackExtendedDataView({ itemId: String(match.match_id) });
    }
  }, [tab, hasRatings, userId, match.match_id]);

  const completedTabs = [
    { value: 'summary', label: '요약' },
    { value: 'lineups', label: '라인업' },
    { value: 'stats', label: '통계' },
    ...(hasTeams && (hasRatings || showLockedRatings)
      ? [{ value: 'ratings', label: hasRatings ? '평점' : '평점 🔒' }]
      : []),
  ];

  const previewTabs = [
    { value: 'summary', label: '프리뷰' },
    { value: 'lineups', label: '라인업' },
    { value: 'stats', label: '맞대결' },
  ];

  const tabs = hasScore ? completedTabs : previewTabs;

  return (
    <Tabs value={tab} onValueChange={onTabChange} className="mt-4">
      <TabsList className="sticky top-0 z-10 w-full justify-start gap-0 rounded-none border-b border-gray-200 bg-white p-0">
        {tabs.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            className="relative min-h-[44px] flex-1 rounded-none bg-transparent px-4 text-sm font-medium text-gray-400 shadow-none hover:text-gray-900 data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-gray-900 data-[state=active]:after:content-['']"
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="summary" className="mt-4">
        <SummaryTab match={match} />
      </TabsContent>

      <TabsContent value="lineups" className="mt-4">
        <LineupsTab match={match} />
      </TabsContent>

      <TabsContent value="stats" className="mt-4">
        <StatsTab
          match={match}
          lockBanner={
            showStatsLockBanner ? (
              <ExtendedDataLock
                matchId={match.match_id}
                placement="stats_banner"
                returnHash="#stats"
                viewedKeys={gateViewedKeysRef.current}
              />
            ) : null
          }
        />
      </TabsContent>

      {hasScore && hasTeams && (
        <TabsContent value="ratings" className="mt-4">
          {showLockedRatings ? (
            <ExtendedDataLock
              matchId={match.match_id}
              placement="ratings_tab"
              returnHash="#ratings"
              viewedKeys={gateViewedKeysRef.current}
            />
          ) : (
            <RatingsTab match={match} />
          )}
        </TabsContent>
      )}
    </Tabs>
  );
}
