'use client';

import { Section } from '@/components/ui';
import { useGoalQuery } from '@/hooks/useGoalQuery';

import { fetchHomePageData } from '../api-prisma';
import type { HomePageData } from '../types';
import CareerStatsWidget from './CareerStatsWidget';
import CupTournamentWidget from './CupTournamentWidget';
import FreshnessStrip from './FreshnessStrip';
import KnockoutBracketWidget from './KnockoutBracketWidget';
import MatchdayModeCard from './MatchdayModeCard';
import MatchesWidget from './MatchesWidget';
import NewProfilesNotice from './NewProfilesNotice';
import PlayerCompareBanner from './PlayerCompareBanner';
import PlayerStatsWidget from './PlayerStatsWidget';
import PowerRankingWidget from './PowerRankingWidget';
import SeasonKickoffBanner from './SeasonKickoffBanner';
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

  // 개막 전(새 시즌 데이터 없음)에는 스탯 위젯이 직전 시즌으로 폴백됨
  const statsSeason = pageData.statsSeason ?? {
    season_id: pageData.currentSeason.season_id,
    season_name: pageData.currentSeason.season_name,
    is_fallback: false,
  };
  const kickoffMatch = statsSeason.is_fallback
    ? (pageData.kickoffMatch ??
      pageData.upcomingMatches.find(
        (m) => m.season?.season_id === pageData.currentSeason.season_id
      ) ??
      null)
    : null;

  const matchdayCandidates = [
    ...pageData.upcomingMatches,
    ...pageData.recentMatches,
    ...(pageData.cupMatches ?? []),
  ];

  return (
    <Section padding="sm" className="min-h-screen bg-gray-50 py-6">
      {/* 신선도 스트립 (검색 첫 방문자용 갱신 신호) */}
      <FreshnessStrip
        recentMatches={pageData.recentMatches}
        upcomingMatches={pageData.upcomingMatches}
        matchdayCandidates={pageData.cupMatches ?? []}
      />

      {/* 매치데이 모드 (경기일 18시 ~ 다음날 12시만 노출) */}
      <MatchdayModeCard matches={matchdayCandidates} />

      {/* Season Header */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        {pageData.currentSeason.season_name}
      </h2>

      {/* 새 시즌 선수 프로필 안내 (시즌 데이터가 쌓인 뒤 노출) */}
      {!statsSeason.is_fallback && (
        <div className="mb-4">
          <NewProfilesNotice
            seasonId={pageData.currentSeason.season_id}
            seasonName={pageData.currentSeason.season_name}
            standings={pageData.standings}
          />
        </div>
      )}

      {/* Kickoff Banner (개막 전에만 노출) */}
      {statsSeason.is_fallback && (
        <div className="mb-4">
          <SeasonKickoffBanner
            seasonName={pageData.currentSeason.season_name}
            startDate={pageData.currentSeason.start_date ?? null}
            kickoffMatch={kickoffMatch}
          />
        </div>
      )}

      {/* 2-Column Grid: FotMob style */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Left Column - Standings + Player Stats */}
        <div className="lg:col-span-7 space-y-4">
          {pageData.knockoutMatches.length > 0 &&
            !(pageData.cupMatches?.length > 0) && (
              <KnockoutBracketWidget
                seasonId={pageData.currentSeason.season_id}
                knockoutMatches={pageData.knockoutMatches}
              />
            )}
          {/* 컵 대회는 승점 순위표 대신 라운드별 토너먼트 현황 */}
          {pageData.cupMatches?.length > 0 ? (
            <CupTournamentWidget
              seasonId={pageData.currentSeason.season_id}
              seasonName={pageData.currentSeason.season_name}
              matches={pageData.cupMatches}
            />
          ) : (
            <StandingsWidget
              standings={pageData.standings}
              seasonName={statsSeason.season_name}
              seasonId={statsSeason.season_id}
              isFallback={statsSeason.is_fallback}
            />
          )}
          <PlayerStatsWidget
            seasonId={statsSeason.season_id}
            topScorers={pageData.topScorers}
            topAssists={pageData.topAssists}
            topRatings={pageData.topRatings}
            topXtRatings={pageData.topXtRatings}
            isFallback={statsSeason.is_fallback}
          />
        </div>

        {/* Right Column - Matches + Career Stats */}
        <div className="lg:col-span-5 space-y-4">
          <MatchesWidget
            seasonId={pageData.currentSeason.season_id}
            recentMatches={pageData.recentMatches}
            upcomingMatches={pageData.upcomingMatches}
            knockoutMatches={pageData.knockoutMatches}
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
