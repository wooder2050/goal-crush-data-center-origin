'use client';

import React, { useState } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { PassMap } from '@/features/event-actions/components/PassMap';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

import {
  getMatchActionsPrisma,
  getMatchByIdPrisma,
  getMatchDetailedStatsPrisma,
  getMatchPassMapPrisma,
  type RawMatchAction,
  type TeamPassNetworkData,
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

// 피치 크기
const PITCH_WIDTH = 40;
const PITCH_HEIGHT = 20;

// 액션 타입별 색상
const ACTION_TYPE_COLORS: Record<string, string> = {
  PASS: '#3b82f6', // 파랑
  RECEIVE: '#22c55e', // 초록
  SHOT: '#ef4444', // 빨강
  DRIBBLE: '#f59e0b', // 주황
  TACKLE: '#8b5cf6', // 보라
  INTERCEPTION: '#06b6d4', // 청록
  FOUL: '#ec4899', // 핑크
  KEEPER_SAVE: '#14b8a6', // 틸
  CLEARANCE: '#6366f1', // 인디고
  CROSS: '#0ea5e9', // 하늘
  FREE_KICK: '#a855f7', // 퍼플
  CORNER_KICK: '#d946ef', // 푸시아
  GOAL_KICK: '#84cc16', // 라임
  KICK_IN: '#eab308', // 옐로우
  BALL_LOST: '#64748b', // 슬레이트
  CARD: '#facc15', // 노랑
  CATCH: '#10b981', // 에메랄드
  PUNCH: '#f97316', // 오렌지
  THROW: '#0284c7', // 라이트블루
  KEEPER_THROW: '#0284c7', // 라이트블루 (스로와 동일)
  KEEPER_CLAIM: '#10b981', // 에메랄드 (캐치와 동일)
  KEEPER_PUNCH: '#f97316', // 오렌지 (펀칭과 동일)
  BAD_TOUCH: '#64748b', // 슬레이트 (볼로스트와 동일)
};

// 액션 타입 한글 이름
const ACTION_TYPE_LABELS: Record<string, string> = {
  PASS: '패스',
  RECEIVE: '리시브',
  SHOT: '슛',
  DRIBBLE: '드리블',
  TACKLE: '태클',
  INTERCEPTION: '인터셉트',
  FOUL: '파울',
  KEEPER_SAVE: '세이브',
  CLEARANCE: '클리어',
  CROSS: '크로스',
  FREE_KICK: '프리킥',
  CORNER_KICK: '코너킥',
  GOAL_KICK: '골킥',
  KICK_IN: '킥인',
  BALL_LOST: '볼로스트',
  CARD: '카드',
  CATCH: '캐치',
  PUNCH: '펀칭',
  THROW: '스로',
  KEEPER_THROW: 'GK 스로',
  KEEPER_CLAIM: 'GK 캐치',
  KEEPER_PUNCH: 'GK 펀칭',
  BAD_TOUCH: '볼로스트',
};

// 원본 데이터를 PitchView와 동일한 방향으로 표시하는 컴포넌트
function RawDataPitch({
  actions,
  homeTeamName,
  awayTeamName,
  isSecondHalf = false,
}: {
  actions: RawMatchAction[];
  homeTeamName: string;
  awayTeamName: string;
  isSecondHalf?: boolean;
}) {
  // 후반전에는 진영이 바뀌므로 팀 레이블 위치도 반전
  const leftTeamName = isSecondHalf ? awayTeamName : homeTeamName;
  const rightTeamName = isSecondHalf ? homeTeamName : awayTeamName;
  const [selectedActionType, setSelectedActionType] = useState<string | null>(
    null
  );

  const SVG_WIDTH = 100;
  const SVG_HEIGHT = 50;

  // 피치 좌표를 SVG 좌표로 변환 (PitchView와 동일)
  const toSvgX = (x: number) => (x / PITCH_WIDTH) * SVG_WIDTH;
  const toSvgY = (y: number) => (y / PITCH_HEIGHT) * SVG_HEIGHT;

  // 액션별 색상 가져오기
  const getActionColor = (actionType: string) => {
    return ACTION_TYPE_COLORS[actionType] || '#9ca3af';
  };

  if (actions.length === 0) {
    return (
      <div className="text-xs text-gray-400 py-4 text-center border rounded">
        데이터 없음
      </div>
    );
  }

  // 액션 타입별 개수 집계
  const actionCounts = actions.reduce(
    (acc, action) => {
      acc[action.action_type] = (acc[action.action_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // 필터된 액션
  const filteredActions = selectedActionType
    ? actions.filter((a) => a.action_type === selectedActionType)
    : actions;

  return (
    <div className="relative w-full">
      {/* 액션 타입 필터 탭 */}
      <div className="mb-2 flex flex-wrap gap-1">
        <button
          onClick={() => setSelectedActionType(null)}
          className={`px-2 py-1 text-[10px] rounded border ${
            selectedActionType === null
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
          }`}
        >
          전체 ({actions.length})
        </button>
        {Object.entries(actionCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => (
            <button
              key={type}
              onClick={() =>
                setSelectedActionType(selectedActionType === type ? null : type)
              }
              className={`px-2 py-1 text-[10px] rounded border flex items-center gap-1 ${
                selectedActionType === type
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
              }`}
              style={
                selectedActionType === type
                  ? { backgroundColor: getActionColor(type) }
                  : {}
              }
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    selectedActionType === type
                      ? 'white'
                      : getActionColor(type),
                }}
              />
              {ACTION_TYPE_LABELS[type] || type} ({count})
            </button>
          ))}
      </div>

      {/* 팀 레이블 (피치 밖) */}
      <div className="flex justify-between mb-1 text-xs font-medium">
        <span className={isSecondHalf ? 'text-red-600' : 'text-blue-600'}>
          {leftTeamName}
        </span>
        <span className={isSecondHalf ? 'text-blue-600' : 'text-red-600'}>
          {rightTeamName}
        </span>
      </div>

      <svg
        viewBox="0 0 100 50"
        className="w-full border rounded-lg"
        style={{ aspectRatio: '2/1' }}
      >
        {/* 피치 배경 */}
        <rect x="0" y="0" width="100" height="50" fill="#3d8b40" />

        {/* 피치 외곽선 */}
        <rect
          x="2"
          y="2"
          width="96"
          height="46"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* 중앙선 */}
        <line x1="50" y1="2" x2="50" y2="48" stroke="white" strokeWidth="0.3" />

        {/* 센터 서클 */}
        <circle
          cx="50"
          cy="25"
          r="8"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* 왼쪽 페널티 박스 */}
        <rect
          x="2"
          y="13"
          width="12"
          height="24"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* 오른쪽 페널티 박스 */}
        <rect
          x="86"
          y="13"
          width="12"
          height="24"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* 왼쪽 골대 */}
        <rect x="0" y="20" width="2" height="10" fill="#555" opacity="0.5" />

        {/* 오른쪽 골대 */}
        <rect x="98" y="20" width="2" height="10" fill="#555" opacity="0.5" />

        {/* 액션 포인트들 */}
        {filteredActions.map((action) => (
          <g key={action.action_id}>
            <circle
              cx={toSvgX(action.start_x)}
              cy={toSvgY(action.start_y)}
              r="1.5"
              fill={getActionColor(action.action_type)}
              stroke="white"
              strokeWidth="0.3"
              opacity={0.9}
            />
            {/* 등번호 + 이름 표시 */}
            {action.player && (
              <text
                x={toSvgX(action.start_x)}
                y={toSvgY(action.start_y) - 2}
                fill="white"
                fontSize="1.8"
                textAnchor="middle"
              >
                {action.player.jersey_number
                  ? `${action.player.jersey_number}. ${action.player.name}`
                  : action.player.name}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* 필터된 액션 개수 */}
      <div className="mt-1 text-xs text-gray-500">
        {selectedActionType
          ? `${ACTION_TYPE_LABELS[selectedActionType] || selectedActionType}: ${filteredActions.length}개`
          : `총 ${actions.length}개 액션`}
      </div>
    </div>
  );
}

// 패스맵 내부 컴포넌트 (useGoalSuspenseQuery 사용)
function PassMapSectionInner({
  matchId,
  homeTeamName,
  homeTeamId,
  awayTeamName,
  awayTeamId,
}: {
  matchId: number;
  homeTeamName: string;
  homeTeamId: number;
  awayTeamName: string;
  awayTeamId: number;
}) {
  const [showDebug, setShowDebug] = useState(false);

  const { data: passMapData } = useGoalSuspenseQuery(getMatchPassMapPrisma, [
    matchId,
  ]) as { data: TeamPassNetworkData[] };

  const { data: rawActions } = useGoalSuspenseQuery(getMatchActionsPrisma, [
    matchId,
  ]) as { data: RawMatchAction[] };

  // 데이터가 없으면 표시하지 않음
  if (
    !passMapData ||
    passMapData.length === 0 ||
    !passMapData.some((team) => team.total_passes > 0)
  ) {
    return null;
  }

  // 홈팀이 항상 왼쪽에 오도록 정렬 (team_id로 비교)
  const sortedPassMapData = [...passMapData].sort((a, b) => {
    const aIsHome = a.team_id === homeTeamId;
    const bIsHome = b.team_id === homeTeamId;
    if (aIsHome && !bIsHome) return -1;
    if (!aIsHome && bIsHome) return 1;
    return 0;
  });

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
        {sortedPassMapData.map((teamData) => {
          // 팀 이름 대신 team_id로 비교 (시즌별 팀 이름 차이 문제 방지)
          const isHomeTeam = teamData.team_id === homeTeamId;
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

      {/* 디버그: 원본 데이터 확인 */}
      <Card>
        <CardContent className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-700">
              원본 데이터 확인 (디버그)
            </h4>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showDebug ? '숨기기' : '보기'}
            </button>
          </div>

          {showDebug && (
            <div className="space-y-6">
              <p className="text-xs text-gray-500">
                아래 피치는 이벤트 기록 입력 화면과 동일한 방향입니다. (가로형,
                홈팀 왼쪽 / 원정팀 오른쪽)
              </p>

              {/* 홈팀 */}
              <div className="space-y-4">
                <h5 className="font-semibold text-blue-600">
                  {homeTeamName} (홈팀)
                </h5>

                {/* 홈팀 전반 */}
                <div>
                  <h6 className="text-sm text-gray-600 mb-2">
                    전반 (Period 1, 3)
                  </h6>
                  <RawDataPitch
                    actions={rawActions.filter(
                      (a) =>
                        a.team_id === homeTeamId &&
                        (a.period_id === 1 || a.period_id === 3)
                    )}
                    homeTeamName={homeTeamName}
                    awayTeamName={awayTeamName}
                  />
                </div>

                {/* 홈팀 후반 */}
                <div>
                  <h6 className="text-sm text-gray-600 mb-2">
                    후반 (Period 2, 4)
                  </h6>
                  <RawDataPitch
                    actions={rawActions.filter(
                      (a) =>
                        a.team_id === homeTeamId &&
                        (a.period_id === 2 || a.period_id === 4)
                    )}
                    homeTeamName={homeTeamName}
                    awayTeamName={awayTeamName}
                    isSecondHalf
                  />
                </div>
              </div>

              {/* 원정팀 */}
              <div className="space-y-4">
                <h5 className="font-semibold text-red-600">
                  {awayTeamName} (원정팀)
                </h5>

                {/* 원정팀 전반 */}
                <div>
                  <h6 className="text-sm text-gray-600 mb-2">
                    전반 (Period 1, 3)
                  </h6>
                  <RawDataPitch
                    actions={rawActions.filter(
                      (a) =>
                        a.team_id === awayTeamId &&
                        (a.period_id === 1 || a.period_id === 3)
                    )}
                    homeTeamName={homeTeamName}
                    awayTeamName={awayTeamName}
                  />
                </div>

                {/* 원정팀 후반 */}
                <div>
                  <h6 className="text-sm text-gray-600 mb-2">
                    후반 (Period 2, 4)
                  </h6>
                  <RawDataPitch
                    actions={rawActions.filter(
                      (a) =>
                        a.team_id === awayTeamId &&
                        (a.period_id === 2 || a.period_id === 4)
                    )}
                    homeTeamName={homeTeamName}
                    awayTeamName={awayTeamName}
                    isSecondHalf
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 패스맵 섹션 래퍼 컴포넌트 (GoalWrapper로 감싸서 Suspense 처리)
function PassMapSection({
  matchId,
  homeTeamName,
  homeTeamId,
  awayTeamName,
  awayTeamId,
}: {
  matchId: number;
  homeTeamName: string;
  homeTeamId: number;
  awayTeamName: string;
  awayTeamId: number;
}) {
  return (
    <GoalWrapper fallback={null}>
      <PassMapSectionInner
        matchId={matchId}
        homeTeamName={homeTeamName}
        homeTeamId={homeTeamId}
        awayTeamName={awayTeamName}
        awayTeamId={awayTeamId}
      />
    </GoalWrapper>
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
  homeScore,
  awayScore,
}: {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
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
        homeScore={homeScore}
        awayScore={awayScore}
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
                  homeScore={match.home_score}
                  awayScore={match.away_score}
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
        {match.home_score != null &&
          match.away_score != null &&
          match.home_team_id != null &&
          match.away_team_id != null && (
            <PassMapSection
              matchId={match.match_id}
              homeTeamName={match.home_team?.team_name || '홈팀'}
              homeTeamId={match.home_team_id}
              awayTeamName={match.away_team?.team_name || '원정팀'}
              awayTeamId={match.away_team_id}
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
