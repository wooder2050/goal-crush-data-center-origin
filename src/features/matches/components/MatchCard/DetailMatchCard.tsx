'use client';

import React, { useEffect, useState } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { PassMap } from '@/features/event-actions/components/PassMap';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

import {
  getMatchByIdPrisma,
  getMatchDetailedStatsPrisma,
} from '../../api-prisma';
import { hasPenaltyShootout } from '../../lib/matchUtils';
import CoachHeadToHeadList from './CoachHeadToHeadList';
import CoachHeadToHeadListSkeleton from './CoachHeadToHeadListSkeleton';
import CoachHeadToHeadSection from './CoachHeadToHeadSection';
import CoachHeadToHeadSectionSkeleton from './CoachHeadToHeadSectionSkeleton';
import DetailMatchCardSkeleton from './DetailMatchCardSkeleton';
import FeaturedPlayersSection from './FeaturedPlayersSection';
import FeaturedPlayersSectionSkeleton from './FeaturedPlayersSectionSkeleton';
import GoalSection from './GoalSection';
import GoalSectionSkeleton from './GoalSectionSkeleton';
import HeadToHeadList from './HeadToHeadList';
import HeadToHeadListSkeleton from './HeadToHeadListSkeleton';
import HeadToHeadSection from './HeadToHeadSection';
import HeadToHeadSectionSkeleton from './HeadToHeadSectionSkeleton';
import KeyPlayersSection from './KeyPlayersSection';
import KeyPlayersSectionSkeleton from './KeyPlayersSectionSkeleton';
import MatchDetailedStatsSection from './MatchDetailedStatsSection';
import MatchDetailedStatsSectionSkeleton from './MatchDetailedStatsSectionSkeleton';
import MatchFooter from './MatchFooter';
import MatchGoalkeeperStatsSection from './MatchGoalkeeperStatsSection';
import MatchGoalkeeperStatsSectionSkeleton from './MatchGoalkeeperStatsSectionSkeleton';
import MatchHeader from './MatchHeader';
import MatchMediaLinks from './MatchMediaLinks';
import MatchScoreHeader from './MatchScoreHeader';
import PenaltyShootoutSection from './PenaltyShootoutSection';
import PenaltyShootoutSectionSkeleton from './PenaltyShootoutSectionSkeleton';
import RecentFormSection from './RecentFormSection';
import RecentFormSectionSkeleton from './RecentFormSectionSkeleton';
import TeamLineupsSection from './TeamLineupsSection';

interface DetailMatchCardProps {
  matchId: number;
  className?: string;
}

interface PlayerPosition {
  player_id: number;
  player_name: string;
  jersey_number: number;
  profile_image_url?: string | null;
  avg_x: number;
  avg_y: number;
  total_passes: number;
  success_passes: number;
}

interface PassConnection {
  from_jersey: number;
  to_jersey: number;
  count: number;
}

interface TeamPassNetworkData {
  team_id: number;
  team_name: string;
  primary_color: string;
  secondary_color: string;
  players: PlayerPosition[];
  connections: PassConnection[];
  total_passes: number;
  success_passes: number;
}

// 패스맵 섹션 컴포넌트 (match_actions 데이터가 있을 때만 표시)
function PassMapSection({
  matchId,
  homeTeamName,
}: {
  matchId: number;
  homeTeamName: string;
}) {
  const [passMapData, setPassMapData] = useState<TeamPassNetworkData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPassMapData() {
      try {
        setIsLoading(true);
        const res = await fetch(
          `/api/admin/matches/${matchId}/actions/pass-map`
        );
        if (res.ok) {
          const data = await res.json();
          setPassMapData(data);
        }
      } catch (error) {
        console.error('패스맵 데이터 로딩 오류:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (matchId) {
      fetchPassMapData();
    }
  }, [matchId]);

  // 로딩 중이거나 데이터가 없으면 표시하지 않음
  if (
    isLoading ||
    passMapData.length === 0 ||
    !passMapData.some((team) => team.total_passes > 0)
  ) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          🔗 패스 네트워크
        </h3>
        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
          SPADL 이벤트 데이터 기반
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {passMapData.map((teamData) => {
          const isHomeTeam = teamData.team_name === homeTeamName;
          return (
            <Card key={teamData.team_id} className="h-full">
              <CardContent className="px-4 py-4">
                <PassMap
                  players={teamData.players}
                  connections={teamData.connections}
                  teamName={teamData.team_name}
                  totalPasses={teamData.total_passes}
                  successPasses={teamData.success_passes}
                  primaryColor={teamData.primary_color}
                  secondaryColor={teamData.secondary_color}
                  isHomeTeam={isHomeTeam}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// 상세 통계가 있으면 팀 통계 비교, 없으면 맞대결 섹션을 보여주는 컴포넌트
function HeadToHeadOrTeamStatsSection({
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
}: {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
}) {
  const { data: stats } = useGoalSuspenseQuery(getMatchDetailedStatsPrisma, [
    matchId,
  ]);

  // 상세 통계가 있으면 팀 통계 비교 표시
  if (stats && stats.length > 0) {
    return (
      <MatchDetailedStatsSection
        matchId={matchId}
        homeTeamId={homeTeamId}
        awayTeamId={awayTeamId}
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeTeamLogo={homeTeamLogo}
        awayTeamLogo={awayTeamLogo}
        variant="team-comparison"
      />
    );
  }

  // 상세 통계가 없으면 맞대결 섹션들 표시
  return (
    <>
      <GoalWrapper fallback={<HeadToHeadSectionSkeleton />}>
        <HeadToHeadSection matchId={matchId} />
      </GoalWrapper>
      <GoalWrapper fallback={<HeadToHeadListSkeleton />}>
        <HeadToHeadList matchId={matchId} />
      </GoalWrapper>
      <GoalWrapper fallback={<CoachHeadToHeadSectionSkeleton />}>
        <CoachHeadToHeadSection matchId={matchId} />
      </GoalWrapper>
      <GoalWrapper fallback={<CoachHeadToHeadListSkeleton />}>
        <CoachHeadToHeadList matchId={matchId} />
      </GoalWrapper>
    </>
  );
}

// 상세 통계가 없을 때만 골키퍼 통계를 보여주는 컴포넌트
function GoalkeeperStatsSectionIfNoDetailedStats({
  matchId,
}: {
  matchId: number;
}) {
  const { data: stats } = useGoalSuspenseQuery(getMatchDetailedStatsPrisma, [
    matchId,
  ]);

  // 상세 통계가 있으면 골키퍼 통계 숨김 (상세 통계에 이미 포함됨)
  if (stats && stats.length > 0) {
    return null;
  }

  // 상세 통계가 없으면 골키퍼 통계 표시
  return (
    <div className="mt-4">
      <GoalWrapper fallback={<MatchGoalkeeperStatsSectionSkeleton />}>
        <MatchGoalkeeperStatsSection matchId={matchId} />
      </GoalWrapper>
    </div>
  );
}

function DetailMatchCardInner({
  matchId,
  className = '',
}: DetailMatchCardProps) {
  const { data: match } = useGoalSuspenseQuery(getMatchByIdPrisma, [matchId]);

  if (!match) {
    return (
      <Card className={className}>
        <CardContent className="px-0 py-3 sm:p-6">
          <div className="text-[#ff4800]">매치 정보를 불러올 수 없습니다.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <MatchHeader match={match} />
      <CardContent className="px-0 py-2 sm:p-4">
        <MatchMediaLinks match={match} />
        <div
          className={`grid grid-cols-1 ${hasPenaltyShootout(match) ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-4 lg:gap-6`}
        >
          <div
            className={`${hasPenaltyShootout(match) ? 'lg:col-span-2' : ''} space-y-3 sm:space-y-4`}
          >
            <MatchScoreHeader match={match} />
            {match.home_score == null && match.away_score == null ? (
              <>
                <GoalWrapper fallback={<RecentFormSectionSkeleton />}>
                  <RecentFormSection match={match} />
                </GoalWrapper>
                <GoalWrapper fallback={<KeyPlayersSectionSkeleton />}>
                  <KeyPlayersSection matchId={match.match_id} />
                </GoalWrapper>
              </>
            ) : (
              <GoalWrapper fallback={<GoalSectionSkeleton />}>
                <GoalSection match={match} />
              </GoalWrapper>
            )}
            {hasPenaltyShootout(match) ? (
              <>
                <TeamLineupsSection match={match} />
                <div className="mt-2 sm:mt-3">
                  <GoalWrapper fallback={<FeaturedPlayersSectionSkeleton />}>
                    <FeaturedPlayersSection match={match} />
                  </GoalWrapper>
                </div>
              </>
            ) : null}
            {/* 상세 통계가 있으면 팀 통계 비교, 없으면 맞대결 섹션 */}
            {match.home_team_id != null && match.away_team_id != null ? (
              <GoalWrapper fallback={<HeadToHeadSectionSkeleton />}>
                <HeadToHeadOrTeamStatsSection
                  matchId={match.match_id}
                  homeTeamId={match.home_team_id}
                  awayTeamId={match.away_team_id}
                  homeTeamName={match.home_team?.team_name || '홈팀'}
                  awayTeamName={match.away_team?.team_name || '원정팀'}
                  homeTeamLogo={match.home_team?.logo}
                  awayTeamLogo={match.away_team?.logo}
                />
              </GoalWrapper>
            ) : (
              <>
                <GoalWrapper fallback={<HeadToHeadSectionSkeleton />}>
                  <HeadToHeadSection matchId={match.match_id} />
                </GoalWrapper>
                <GoalWrapper fallback={<HeadToHeadListSkeleton />}>
                  <HeadToHeadList matchId={match.match_id} />
                </GoalWrapper>
                <GoalWrapper fallback={<CoachHeadToHeadSectionSkeleton />}>
                  <CoachHeadToHeadSection matchId={match.match_id} />
                </GoalWrapper>
                <GoalWrapper fallback={<CoachHeadToHeadListSkeleton />}>
                  <CoachHeadToHeadList matchId={match.match_id} />
                </GoalWrapper>
              </>
            )}

            {/* Goalkeeper stats for completed matches (only if no detailed stats) */}
            {match.home_score != null && match.away_score != null && (
              <GoalWrapper fallback={<MatchGoalkeeperStatsSectionSkeleton />}>
                <GoalkeeperStatsSectionIfNoDetailedStats
                  matchId={match.match_id}
                />
              </GoalWrapper>
            )}
          </div>
          <div className="lg:col-span-1">
            {hasPenaltyShootout(match) ? (
              <GoalWrapper fallback={<PenaltyShootoutSectionSkeleton />}>
                <PenaltyShootoutSection match={match} />
              </GoalWrapper>
            ) : (
              <>
                <TeamLineupsSection match={match} />
                <div className="mt-2 sm:mt-3">
                  <GoalWrapper fallback={<FeaturedPlayersSectionSkeleton />}>
                    <FeaturedPlayersSection match={match} />
                  </GoalWrapper>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Player stats for completed matches - Full width */}
        {match.home_score != null &&
          match.away_score != null &&
          match.home_team_id != null &&
          match.away_team_id != null && (
            <div className="mt-4">
              <GoalWrapper fallback={<MatchDetailedStatsSectionSkeleton />}>
                <MatchDetailedStatsSection
                  matchId={match.match_id}
                  homeTeamId={match.home_team_id}
                  awayTeamId={match.away_team_id}
                  homeTeamName={match.home_team?.team_name || '홈팀'}
                  awayTeamName={match.away_team?.team_name || '원정팀'}
                  homeTeamLogo={match.home_team?.logo}
                  awayTeamLogo={match.away_team?.logo}
                  variant="player-stats"
                />
              </GoalWrapper>
            </div>
          )}

        {/* 패스 네트워크 맵 (match_actions 데이터가 있을 때만 표시) */}
        {match.home_score != null && match.away_score != null && (
          <PassMapSection
            matchId={match.match_id}
            homeTeamName={match.home_team?.team_name || '홈팀'}
          />
        )}

        {/* 디테일 카드에서는 상세 보기 버튼 숨김 */}
        <div className="mt-4">
          <MatchFooter match={match} hideDetailButton />
        </div>
      </CardContent>
    </Card>
  );
}

const DetailMatchCard: React.FC<DetailMatchCardProps> = ({
  matchId,
  className = '',
}) => {
  return (
    <GoalWrapper fallback={<DetailMatchCardSkeleton className={className} />}>
      <DetailMatchCardInner matchId={matchId} className={className} />
    </GoalWrapper>
  );
};

export default DetailMatchCard;
