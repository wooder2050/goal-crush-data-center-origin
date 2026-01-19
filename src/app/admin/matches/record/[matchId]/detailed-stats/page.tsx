'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Body, H1 } from '@/components/ui/typography';
import {
  bulkSaveDetailedStats,
  CreateDetailedStatsData,
} from '@/features/admin/api';
import MatchErrorState from '@/features/admin/components/MatchErrorState';
import MatchInfo from '@/features/admin/components/MatchInfo';
import { MatchDetailPageSkeleton } from '@/features/admin/components/skeletons';
import { DetailedStatsTab } from '@/features/admin/components/tabs';
import { useMatchDetailedStats } from '@/features/admin/hooks/useDetailedStatsQuery';
import { useMatchLineups } from '@/features/admin/hooks/useLineupQuery';
import { useMatchDetail } from '@/features/admin/hooks/useMatchQuery';

export const dynamic = 'force-dynamic';

// 라인업 데이터를 상세통계탭에서 사용할 형식으로 변환
interface PlayerLineup {
  player_id: number;
  player_name: string;
  jersey_number: number | null;
  team_id: number;
  team_name: string;
  position: string;
}

export default function DetailedStatsRecordPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = Number(params.matchId as string);

  // 경기 정보 조회
  const {
    data: match,
    isLoading: isLoadingMatch,
    error: matchError,
  } = useMatchDetail(matchId);

  // 라인업 조회 (출전 선수 목록)
  const { data: lineups = [], isLoading: isLoadingLineups } =
    useMatchLineups(matchId);

  // 기존 상세 통계 조회
  const {
    data: detailedStats = [],
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useMatchDetailedStats(matchId);

  // 저장 상태
  const [isSaving, setIsSaving] = useState(false);

  // 핸들러 함수들
  const handleBackClick = () => router.push('/admin/matches/record');

  // 일괄 저장
  const handleSaveAll = async (stats: CreateDetailedStatsData[]) => {
    setIsSaving(true);
    try {
      await bulkSaveDetailedStats(matchId, stats);
      await refetchStats();
      alert('상세 통계가 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save detailed stats:', error);
      alert('상세 통계 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 라인업 데이터를 PlayerLineup 형식으로 변환
  const playerLineups: PlayerLineup[] = lineups.map((lineup) => ({
    player_id: lineup.player_id ?? 0,
    player_name: lineup.player?.name || '알 수 없음',
    jersey_number: lineup.player?.jersey_number ?? null,
    team_id: lineup.team_id ?? 0,
    team_name: lineup.team?.team_name || '알 수 없음',
    position: lineup.position || 'MF',
  }));

  // 로딩 상태 처리
  if (isLoadingMatch) {
    return <MatchDetailPageSkeleton />;
  }

  // 에러 상태 처리
  if (matchError || !match) {
    return (
      <MatchErrorState
        errorMessage={matchError?.message}
        onBackClick={handleBackClick}
      />
    );
  }

  // 경기 결과가 완료되지 않은 경우 접근 차단
  if (match.status !== 'completed') {
    return (
      <Container className="py-8">
        <Card className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              경기 결과 기록이 완료되지 않았습니다
            </h2>
            <p className="text-gray-600 mb-6">
              상세 통계는 경기 결과 기록이 완료된 후에 입력할 수 있습니다.
            </p>
            <Button
              onClick={() => router.push(`/admin/matches/record/${matchId}`)}
            >
              경기 결과 기록하러 가기
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="space-y-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={handleBackClick} className="mb-4">
              &larr; 경기 목록으로 돌아가기
            </Button>
            <H1>경기 상세 통계 기록</H1>
            <Body className="text-gray-600 mt-2">
              풀경기를 보면서 선수별 세부 기록을 +/- 버튼으로 입력합니다.
            </Body>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/matches/record/${matchId}`)}
          >
            기본 경기 기록으로 이동
          </Button>
        </div>

        {/* 경기 정보 카드 */}
        <Card className="p-6">
          <MatchInfo match={match} />
        </Card>

        {/* 출전 선수 필요 안내 */}
        {!isLoadingLineups && playerLineups.length === 0 && (
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <div className="text-center">
              <h3 className="font-semibold text-yellow-800 mb-2">
                출전 선수가 등록되지 않았습니다
              </h3>
              <p className="text-yellow-700 text-sm mb-4">
                상세 통계를 기록하려면 먼저 라인업에서 출전 선수를 등록해주세요.
              </p>
              <Button
                onClick={() => router.push(`/admin/matches/record/${matchId}`)}
              >
                라인업 등록하러 가기
              </Button>
            </div>
          </Card>
        )}

        {/* 상세 통계 기록 영역 */}
        {!isLoadingLineups && playerLineups.length > 0 && (
          <Card className="p-6">
            {isLoadingStats ? (
              <div className="text-center py-8">
                <p className="text-gray-500">상세 통계를 불러오는 중...</p>
              </div>
            ) : (
              <DetailedStatsTab
                homeTeamName={match.home_team?.team_name || '홈팀'}
                awayTeamName={match.away_team?.team_name || '원정팀'}
                homeTeamId={match.home_team_id || 0}
                awayTeamId={match.away_team_id || 0}
                lineups={playerLineups}
                existingStats={detailedStats}
                onSaveAll={handleSaveAll}
                isSaving={isSaving}
              />
            )}
          </Card>
        )}

        {/* 출전 선수 목록 요약 */}
        {playerLineups.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">출전 선수 현황</h2>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-medium mb-2 text-blue-800">
                  {match.home_team?.team_name || '홈팀'} (
                  {playerLineups.filter((p) => p.team_id === match.home_team_id)
                    .length || 0}
                  명)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {playerLineups
                    .filter((p) => p.team_id === match.home_team_id)
                    .map((p) => (
                      <span
                        key={p.player_id}
                        className="px-2 py-1 bg-blue-50 rounded text-xs"
                      >
                        {p.jersey_number ?? '-'} {p.player_name}
                      </span>
                    ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2 text-red-800">
                  {match.away_team?.team_name || '원정팀'} (
                  {playerLineups.filter((p) => p.team_id === match.away_team_id)
                    .length || 0}
                  명)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {playerLineups
                    .filter((p) => p.team_id === match.away_team_id)
                    .map((p) => (
                      <span
                        key={p.player_id}
                        className="px-2 py-1 bg-red-50 rounded text-xs"
                      >
                        {p.jersey_number ?? '-'} {p.player_name}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Container>
  );
}
