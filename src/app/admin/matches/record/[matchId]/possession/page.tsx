'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Input } from '@/components/ui/input';
import { H1 } from '@/components/ui/typography';
import MatchErrorState from '@/features/admin/components/MatchErrorState';
import { MatchDetailPageSkeleton } from '@/features/admin/components/skeletons';
import { useMatchLineups } from '@/features/admin/hooks/useLineupQuery';
import { useMatchDetail } from '@/features/admin/hooks/useMatchQuery';

export const dynamic = 'force-dynamic';

interface PlayerPossession {
  player_id: number;
  player_name: string;
  jersey_number: number | null;
  team_id: number;
  team_name: string;
  possession_time: number; // 초 단위
}

interface PossessionAction {
  player_id: number;
  player_name: string;
  elapsed_seconds: number;
  timestamp: number;
}

interface PossessionApiResponse {
  player_id: number;
  team_id: number;
  possession_time: number;
  player: {
    name: string;
    jersey_number: number | null;
  } | null;
  team: {
    team_name: string;
  } | null;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTimeMs(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const ms = Math.floor((milliseconds % 1000) / 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
}

export default function PossessionRecordPage() {
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

  // 상태 관리
  const [totalMatchTime, setTotalMatchTime] = useState(26); // 분 단위
  const [playerPossessions, setPlayerPossessions] = useState<
    PlayerPossession[]
  >([]);
  const [activePlayerId, setActivePlayerId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0); // 현재 측정 중인 시간 (ms)
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPossessions, setIsLoadingPossessions] = useState(true);
  const [actionHistory, setActionHistory] = useState<PossessionAction[]>([]); // undo 히스토리
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const dataLoadedRef = useRef(false);

  // 기존 점유율 데이터 로드
  useEffect(() => {
    if (matchId && !dataLoadedRef.current) {
      dataLoadedRef.current = true;
      fetch(`/api/admin/matches/${matchId}/possession`)
        .then((res) => res.json())
        .then((data: PossessionApiResponse[]) => {
          if (Array.isArray(data) && data.length > 0) {
            // 기존 데이터가 있으면 적용
            setPlayerPossessions((prev) => {
              if (prev.length === 0) return prev;
              return prev.map((p) => {
                const existing = data.find((d) => d.player_id === p.player_id);
                if (existing) {
                  return { ...p, possession_time: existing.possession_time };
                }
                return p;
              });
            });
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingPossessions(false));
    }
  }, [matchId]);

  // 라인업 데이터로 선수 점유율 초기화
  useEffect(() => {
    if (lineups.length > 0 && playerPossessions.length === 0) {
      const initialPossessions: PlayerPossession[] = lineups.map((lineup) => ({
        player_id: lineup.player_id ?? 0,
        player_name: lineup.player?.name || '알 수 없음',
        jersey_number: lineup.player?.jersey_number ?? null,
        team_id: lineup.team_id ?? 0,
        team_name: lineup.team?.team_name || '알 수 없음',
        possession_time: 0,
      }));
      setPlayerPossessions(initialPossessions);
    }
  }, [lineups, playerPossessions.length]);

  // 타이머 시작
  const handleStart = useCallback((playerId: number) => {
    setActivePlayerId(playerId);
    startTimeRef.current = Date.now();
    setCurrentTime(0);

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setCurrentTime(Date.now() - startTimeRef.current);
      }
    }, 100);
  }, []);

  // 타이머 중단
  const handleStop = useCallback(() => {
    if (activePlayerId === null || startTimeRef.current === null) return;

    const elapsedMs = Date.now() - startTimeRef.current;
    const elapsedSeconds = Math.round(elapsedMs / 1000);

    // 현재 선수 이름 찾기
    const currentPlayer = playerPossessions.find(
      (p) => p.player_id === activePlayerId
    );

    // 히스토리에 액션 추가 (undo용)
    if (currentPlayer) {
      setActionHistory((prev) => [
        ...prev,
        {
          player_id: activePlayerId,
          player_name: currentPlayer.player_name,
          elapsed_seconds: elapsedSeconds,
          timestamp: Date.now(),
        },
      ]);
    }

    // 선수의 점유 시간에 추가
    setPlayerPossessions((prev) =>
      prev.map((p) =>
        p.player_id === activePlayerId
          ? { ...p, possession_time: p.possession_time + elapsedSeconds }
          : p
      )
    );

    // 타이머 초기화
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    startTimeRef.current = null;
    setActivePlayerId(null);
    setCurrentTime(0);
  }, [activePlayerId, playerPossessions]);

  // Undo: 마지막 기록 취소
  const handleUndo = useCallback(() => {
    if (actionHistory.length === 0) return;

    const lastAction = actionHistory[actionHistory.length - 1];

    // 선수의 점유 시간에서 마지막 기록 시간 빼기
    setPlayerPossessions((prev) =>
      prev.map((p) =>
        p.player_id === lastAction.player_id
          ? {
              ...p,
              possession_time: Math.max(
                0,
                p.possession_time - lastAction.elapsed_seconds
              ),
            }
          : p
      )
    );

    // 히스토리에서 마지막 액션 제거
    setActionHistory((prev) => prev.slice(0, -1));
  }, [actionHistory]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 저장
  const handleSave = async () => {
    if (activePlayerId !== null) {
      alert('타이머가 실행 중입니다. 먼저 중단해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const possessions = playerPossessions.map((p) => ({
        player_id: p.player_id,
        team_id: p.team_id,
        possession_time: p.possession_time,
      }));

      const response = await fetch(`/api/admin/matches/${matchId}/possession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ possessions }),
      });

      if (!response.ok) {
        throw new Error('저장에 실패했습니다.');
      }

      alert('점유율이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save possession data:', error);
      alert('점유율 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 총 점유 시간 계산
  const totalPossessionTime = playerPossessions.reduce(
    (sum, p) => sum + p.possession_time,
    0
  );
  const totalMatchTimeSeconds = totalMatchTime * 60;

  // 팀별 점유 시간 계산
  const getTeamPossession = (teamId: number) => {
    return playerPossessions
      .filter((p) => p.team_id === teamId)
      .reduce((sum, p) => sum + p.possession_time, 0);
  };

  // 핸들러 함수들
  const handleBackClick = () => router.push('/admin/matches/record');

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
              점유율 기록은 경기 결과 기록이 완료된 후에 입력할 수 있습니다.
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

  const homePossession = match.home_team_id
    ? getTeamPossession(match.home_team_id)
    : 0;
  const awayPossession = match.away_team_id
    ? getTeamPossession(match.away_team_id)
    : 0;
  const homePossessionPercent =
    totalPossessionTime > 0
      ? ((homePossession / totalPossessionTime) * 100).toFixed(1)
      : '0';
  const awayPossessionPercent =
    totalPossessionTime > 0
      ? ((awayPossession / totalPossessionTime) * 100).toFixed(1)
      : '0';

  return (
    <Container className="py-4">
      <div className="space-y-3">
        {/* 헤더 - 컴팩트 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="px-2"
            >
              &larr;
            </Button>
            <H1 className="text-xl">볼 점유율 기록</H1>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || activePlayerId !== null}
            >
              {isSaving ? '저장 중...' : '저장'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/matches/record/${matchId}`)}
            >
              기본 기록
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/admin/matches/record/${matchId}/detailed-stats`)
              }
            >
              상세 통계
            </Button>
          </div>
        </div>

        {/* 상단 고정 영역: 팀별 점유율 + 경기 시간 설정 */}
        <Card className="p-3">
          <div className="flex items-center gap-4">
            {/* 홈팀 점유율 */}
            <div className="text-center min-w-[80px]">
              <div className="text-xl font-bold text-blue-600">
                {homePossessionPercent}%
              </div>
              <div className="text-xs text-gray-600">
                {match.home_team?.team_name || '홈팀'}
              </div>
              <div className="text-xs text-gray-400">
                {formatTime(homePossession)}
              </div>
            </div>

            {/* 점유율 바 */}
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-500 h-full transition-all"
                style={{ width: `${homePossessionPercent}%` }}
              />
              <div
                className="bg-red-500 h-full transition-all"
                style={{ width: `${awayPossessionPercent}%` }}
              />
            </div>

            {/* 원정팀 점유율 */}
            <div className="text-center min-w-[80px]">
              <div className="text-xl font-bold text-red-600">
                {awayPossessionPercent}%
              </div>
              <div className="text-xs text-gray-600">
                {match.away_team?.team_name || '원정팀'}
              </div>
              <div className="text-xs text-gray-400">
                {formatTime(awayPossession)}
              </div>
            </div>

            {/* 구분선 */}
            <div className="h-10 w-px bg-gray-200" />

            {/* 경기 시간 설정 */}
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-600 whitespace-nowrap">
                총 시간:
              </label>
              <Input
                type="number"
                value={totalMatchTime}
                onChange={(e) => setTotalMatchTime(Number(e.target.value))}
                className="w-16 h-8"
                min={1}
                max={120}
              />
              <span className="text-gray-400">분</span>
            </div>

            {/* 기록 진행률 */}
            <div className="text-xs text-gray-500">
              {formatTime(totalPossessionTime)} /{' '}
              {totalMatchTimeSeconds > 0
                ? ((totalPossessionTime / totalMatchTimeSeconds) * 100).toFixed(
                    0
                  )
                : 0}
              %
            </div>
          </div>
        </Card>

        {/* 현재 측정 중 + Undo (한 줄로) */}
        {(activePlayerId !== null || actionHistory.length > 0) && (
          <div className="flex items-center gap-3">
            {/* 측정 중인 선수 */}
            {activePlayerId !== null && (
              <Card className="flex-1 p-2 bg-yellow-50 border-yellow-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-yellow-800">
                      {
                        playerPossessions.find(
                          (p) => p.player_id === activePlayerId
                        )?.player_name
                      }
                    </span>
                    <span className="text-lg font-mono font-bold text-yellow-900">
                      {formatTimeMs(currentTime)}
                    </span>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleStop}>
                    중단
                  </Button>
                </div>
              </Card>
            )}

            {/* Undo 버튼 */}
            {actionHistory.length > 0 && activePlayerId === null && (
              <Card className="p-2 bg-gray-50 border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {actionHistory[actionHistory.length - 1].player_name} +
                    {actionHistory[actionHistory.length - 1].elapsed_seconds}초
                  </span>
                  <Button variant="outline" onClick={handleUndo} size="sm">
                    Undo
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* 로딩 중 */}
        {(isLoadingLineups || isLoadingPossessions) && (
          <Card className="p-4">
            <p className="text-center text-gray-500 text-sm">로딩 중...</p>
          </Card>
        )}

        {/* 출전 선수 필요 안내 */}
        {!isLoadingLineups &&
          !isLoadingPossessions &&
          playerPossessions.length === 0 && (
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="text-center">
                <p className="text-yellow-800 text-sm mb-2">
                  출전 선수가 등록되지 않았습니다
                </p>
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(`/admin/matches/record/${matchId}`)
                  }
                >
                  라인업 등록
                </Button>
              </div>
            </Card>
          )}

        {/* 선수별 점유율 기록 영역 - 컴팩트 */}
        {!isLoadingLineups &&
          !isLoadingPossessions &&
          playerPossessions.length > 0 && (
            <div className="grid md:grid-cols-2 gap-3">
              {/* 홈팀 */}
              <Card className="p-3">
                <h2 className="text-sm font-semibold mb-2 text-blue-800">
                  {match.home_team?.team_name || '홈팀'}
                </h2>
                <div className="space-y-1">
                  {playerPossessions
                    .filter((p) => p.team_id === match.home_team_id)
                    .sort((a, b) => b.possession_time - a.possession_time)
                    .map((player) => (
                      <div
                        key={player.player_id}
                        className={`flex items-center justify-between p-2 rounded border ${
                          activePlayerId === player.player_id
                            ? 'bg-yellow-100 border-yellow-400'
                            : 'bg-white border-gray-100'
                        }`}
                      >
                        <span className="text-sm">
                          <span className="text-gray-400 mr-1">
                            {player.jersey_number ?? '-'}
                          </span>
                          {player.player_name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono w-12 text-right">
                            {formatTime(player.possession_time)}
                          </span>
                          {activePlayerId === player.player_id ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleStop}
                              className="h-7 px-3"
                            >
                              중단
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleStart(player.player_id)}
                              disabled={activePlayerId !== null}
                              className="h-7 px-3"
                            >
                              시작
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              {/* 원정팀 */}
              <Card className="p-3">
                <h2 className="text-sm font-semibold mb-2 text-red-800">
                  {match.away_team?.team_name || '원정팀'}
                </h2>
                <div className="space-y-1">
                  {playerPossessions
                    .filter((p) => p.team_id === match.away_team_id)
                    .sort((a, b) => b.possession_time - a.possession_time)
                    .map((player) => (
                      <div
                        key={player.player_id}
                        className={`flex items-center justify-between p-2 rounded border ${
                          activePlayerId === player.player_id
                            ? 'bg-yellow-100 border-yellow-400'
                            : 'bg-white border-gray-100'
                        }`}
                      >
                        <span className="text-sm">
                          <span className="text-gray-400 mr-1">
                            {player.jersey_number ?? '-'}
                          </span>
                          {player.player_name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono w-12 text-right">
                            {formatTime(player.possession_time)}
                          </span>
                          {activePlayerId === player.player_id ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleStop}
                              className="h-7 px-3"
                            >
                              중단
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleStart(player.player_id)}
                              disabled={activePlayerId !== null}
                              className="h-7 px-3"
                            >
                              시작
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          )}
      </div>
    </Container>
  );
}
