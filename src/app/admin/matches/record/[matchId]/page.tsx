'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { type MatchResultFormValues } from '@/common/form/fields';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreateAssistData,
  CreateGoalData,
  CreateLineupData,
  CreatePenaltyData,
  CreateSubstitutionData,
  MatchCoachResponse,
} from '@/features/admin/api';
import MatchDataDisplay from '@/features/admin/components/MatchDataDisplay';
import MatchDialogs from '@/features/admin/components/MatchDialogs';
import MatchErrorState from '@/features/admin/components/MatchErrorState';
import MatchHeader from '@/features/admin/components/MatchHeader';
import MatchInfo from '@/features/admin/components/MatchInfo';
import { MatchDetailPageSkeleton } from '@/features/admin/components/skeletons';
import {
  AssistsTab,
  CoachesTab,
  GoalsTab,
  LineupsTab,
  PenaltiesTab,
  ScoreTab,
  SubstitutionsTab,
} from '@/features/admin/components/tabs';
import { useMatchAssists } from '@/features/admin/hooks/useAssistQuery';
import { useMatchCoaches } from '@/features/admin/hooks/useCoachQuery';
import { useMatchLineups } from '@/features/admin/hooks/useLineupQuery';
import { useMatchData } from '@/features/admin/hooks/useMatchData';
import { useMatchGoals } from '@/features/admin/hooks/useMatchGoalsQuery';
import { useMatchDetail } from '@/features/admin/hooks/useMatchQuery';
import { useMatchPenalties } from '@/features/admin/hooks/usePenaltyQuery';
import { useTeamPlayers } from '@/features/admin/hooks/usePlayersQuery';
import { useMatchSubstitutions } from '@/features/admin/hooks/useSubstitutionQuery';

export const dynamic = 'force-dynamic';

export default function RecordMatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = Number(params.matchId as string);

  const {
    data: match,
    isLoading: isLoadingMatch,
    error: matchError,
  } = useMatchDetail(matchId);

  // 골 목록 조회
  const { data: goals = [], isLoading: isLoadingGoals } =
    useMatchGoals(matchId);

  // 어시스트, 라인업, 교체, 페널티킥, 감독 목록 조회
  const { data: assists = [] } = useMatchAssists(matchId);
  const { data: lineups = [] } = useMatchLineups(matchId);
  const { data: substitutions = [] } = useMatchSubstitutions(matchId);
  const { data: penalties = [] } = useMatchPenalties(matchId);
  const { data: coaches = [] } = useMatchCoaches(matchId);

  // 팀별 선수 목록 조회
  const { data: homePlayers = [], isLoading: isLoadingHomePlayers } =
    useTeamPlayers(match?.home_team_id || null);

  const { data: awayPlayers = [], isLoading: isLoadingAwayPlayers } =
    useTeamPlayers(match?.away_team_id || null);

  // 현재 활성화된 탭
  const [activeTab, setActiveTab] = useState('score');

  // 다이얼로그 상태 관리
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [assistDialogOpen, setAssistDialogOpen] = useState(false);
  const [lineupDialogOpen, setLineupDialogOpen] = useState(false);
  const [substitutionDialogOpen, setSubstitutionDialogOpen] = useState(false);
  const [penaltyDialogOpen, setPenaltyDialogOpen] = useState(false);

  // 경기 데이터 관리
  const {
    matchData,
    updateScore,
    addGoal,
    removeGoal,
    addAssist,
    removeAssist,
    addLineup,
    removeLineup,
    addSubstitution,
    removeSubstitution,
    addPenalty,
    removePenalty,
    addCoach,
    removeCoach,
    validateData,
    resetMatchData,
  } = useMatchData(matchId);

  // 유효성 검증 결과 상태
  const [validationResult, setValidationResult] = useState<
    | {
        isValid: boolean;
        errors: Record<string, string[]>;
      }
    | undefined
  >(undefined);

  // 경기 데이터 로드 상태 추적 (각 데이터 타입별)
  const loadedRef = useRef({
    score: false,
    goals: false,
    lineups: false,
    substitutions: false,
    penalties: false,
    assists: false,
    coaches: false,
  });

  // 스코어 설정
  useEffect(() => {
    if (match && !loadedRef.current.score && match.home_score !== null) {
      loadedRef.current.score = true;
      updateScore({
        home_score: match.home_score,
        away_score: match.away_score !== null ? match.away_score : 0,
        penalty_home_score: match.penalty_home_score,
        penalty_away_score: match.penalty_away_score,
        status: match.status || 'completed',
      });
    }
  }, [match, updateScore]);

  // 골 데이터 로드
  useEffect(() => {
    if (match && goals.length > 0 && !loadedRef.current.goals) {
      loadedRef.current.goals = true;
      goals.forEach((goal) => {
        addGoal({
          player_id: goal.player_id,
          goal_time: goal.goal_time,
          goal_type: goal.goal_type,
          description: goal.description,
          player_name: goal.player?.name || '알 수 없음',
          jersey_number: goal.player?.jersey_number || null,
        });
      });
    }
  }, [match, goals, addGoal]);

  // 라인업 데이터 로드
  useEffect(() => {
    if (match && lineups.length > 0 && !loadedRef.current.lineups) {
      loadedRef.current.lineups = true;
      lineups.forEach((lineup) => {
        addLineup({
          player_id: lineup.player_id,
          team_id: lineup.team_id,
          position: lineup.position || '',
          jersey_number: lineup.player?.jersey_number,
          minutes_played: lineup.minutes_played || 0,
          player_name: lineup.player?.name || '알 수 없음',
          team_name: lineup.team?.team_name || '알 수 없음',
        });
      });
    }
  }, [match, lineups, addLineup]);

  // 교체 데이터 로드
  useEffect(() => {
    if (match && substitutions.length > 0 && !loadedRef.current.substitutions) {
      loadedRef.current.substitutions = true;
      substitutions.forEach((sub) => {
        addSubstitution({
          team_id: sub.team_id,
          player_in_id: sub.player_in_id,
          player_out_id: sub.player_out_id,
          substitution_time: sub.substitution_time,
          description: sub.substitution_reason,
          player_in_name: sub.player_in?.name || '알 수 없음',
          player_out_name: sub.player_out?.name || '알 수 없음',
          team_name: sub.team?.team_name || '알 수 없음',
        });
      });
    }
  }, [match, substitutions, addSubstitution]);

  // 승부차기 데이터 로드
  useEffect(() => {
    if (match && penalties.length > 0 && !loadedRef.current.penalties) {
      loadedRef.current.penalties = true;
      penalties.forEach((penalty) => {
        addPenalty({
          team_id: penalty.team_id,
          player_id: penalty.kicker_id,
          goalkeeper_id: penalty.goalkeeper_id,
          is_scored: penalty.is_successful,
          order: penalty.kicker_order,
          player_name: penalty.kicker?.name || '알 수 없음',
          goalkeeper_name: penalty.goalkeeper?.name || '알 수 없음',
          team_name: penalty.team?.team_name || '알 수 없음',
        });
      });
    }
  }, [match, penalties, addPenalty]);

  // 어시스트 데이터 로드 (골 데이터가 있을 때)
  useEffect(() => {
    if (
      match &&
      assists.length > 0 &&
      matchData.goals.length > 0 &&
      !loadedRef.current.assists
    ) {
      loadedRef.current.assists = true;
      // 골 ID 매핑 생성
      const goalIdMap = new Map<number, string>();
      matchData.goals.forEach((goal) => {
        const apiGoal = goals.find(
          (g) =>
            g.player_id === goal.player_id &&
            g.goal_time === goal.goal_time &&
            g.goal_type === goal.goal_type
        );
        if (apiGoal) {
          goalIdMap.set(apiGoal.goal_id, goal.id);
        }
      });

      assists.forEach((assist) => {
        const goalId = goalIdMap.get(assist.goal_id);
        if (goalId) {
          addAssist({
            player_id: assist.player_id,
            goal_id: goalId,
            description: assist.description,
            player_name: assist.player?.name || '알 수 없음',
            goal_time: assist.goal?.goal_time || 0,
            goal_player_name: assist.goal?.player?.name || '알 수 없음',
          });
        }
      });
    }
  }, [match, assists, goals, matchData.goals, addAssist]);

  // 감독 데이터 로드
  useEffect(() => {
    if (match && coaches.length > 0 && !loadedRef.current.coaches) {
      loadedRef.current.coaches = true;
      coaches.forEach((coach: MatchCoachResponse) => {
        addCoach({
          team_id: coach.team_id,
          coach_id: coach.coach_id,
          role: coach.role,
          description: coach.description,
          coach_name: coach.coach_name || '알 수 없음',
          team_name: coach.team_name || '알 수 없음',
        });
      });
    }
  }, [match, coaches, addCoach]);

  // 핸들러 함수들
  const handleBackClick = () => router.push('/admin/matches/record');

  const handleScoreSubmit = async (values: MatchResultFormValues) => {
    const scoreData = {
      home_score: parseInt(values.home_score),
      away_score: parseInt(values.away_score),
      penalty_home_score: values.penalty_home_score
        ? parseInt(values.penalty_home_score)
        : null,
      penalty_away_score: values.penalty_away_score
        ? parseInt(values.penalty_away_score)
        : null,
      status: 'completed',
    };

    try {
      // 즉시 서버에 스코어 저장
      const response = await fetch(`/api/admin/matches/${matchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData),
      });

      if (!response.ok) {
        throw new Error('스코어 저장에 실패했습니다.');
      }

      // 로컬 상태도 업데이트
      updateScore(scoreData);

      alert('스코어가 성공적으로 저장되었습니다. 이제 골 기록을 진행해주세요.');
      setActiveTab('goals');
    } catch (error) {
      console.error('스코어 저장 실패:', error);
      alert('스코어 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleFinalSubmit = async () => {
    try {
      // 1. 유효성 검사
      const result = validateData();
      setValidationResult(result);

      if (!result.isValid) {
        alert('데이터 유효성 검증에 실패했습니다. 오류를 수정해주세요.');
        return;
      }

      // 2. 순위표 및 통계 업데이트 (standing, team_season_stats, team_seasons, h2h_pair_stats)
      const statsResponse = await fetch(
        `/api/admin/matches/${matchId}/update-stats`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!statsResponse.ok) {
        throw new Error('통계 업데이트에 실패했습니다.');
      }

      alert(
        '모든 데이터가 성공적으로 저장되고 통계가 업데이트되었습니다!\n순위표, 팀 통계, 상대전적이 모두 갱신되었습니다.'
      );
      resetMatchData();
      router.push('/admin/matches');
    } catch (error) {
      console.error('최종 제출 실패:', error);
      alert('최종 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const dialogSubmitHandlers = {
    onSubmitGoal: async (data: CreateGoalData) => {
      try {
        // 즉시 서버에 골 저장
        const response = await fetch(`/api/admin/matches/${matchId}/goals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            player_id: data.player_id,
            goal_time: data.goal_time,
            goal_type: data.goal_type || 'regular',
            description: data.description || null,
          }),
        });

        if (!response.ok) {
          throw new Error('골 저장에 실패했습니다.');
        }

        // 로컬 상태도 업데이트
        addGoal({ ...data, goal_type: data.goal_type || 'regular' });
        setGoalDialogOpen(false);
        alert('골이 성공적으로 저장되었습니다.');
      } catch (error) {
        console.error('골 추가 실패:', error);
        alert('골 추가 중 오류가 발생했습니다.');
      }
    },
    onSubmitAssist: async (data: CreateAssistData) => {
      try {
        // 즉시 서버에 어시스트 저장
        const response = await fetch(`/api/admin/matches/${matchId}/assists`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            player_id: data.player_id,
            goal_id: data.goal_id,
            description: data.description || null,
          }),
        });

        if (!response.ok) {
          throw new Error('어시스트 저장에 실패했습니다.');
        }

        // 로컬 상태도 업데이트
        addAssist({ ...data, goal_id: data.goal_id.toString() });
        setAssistDialogOpen(false);
        alert('어시스트가 성공적으로 저장되었습니다.');
      } catch (error) {
        console.error('어시스트 추가 실패:', error);
        alert('어시스트 추가 중 오류가 발생했습니다.');
      }
    },
    onSubmitLineup: async (data: CreateLineupData) => {
      try {
        // 즉시 서버에 라인업 저장 (player_match_stats와 player_season_stats 업데이트)
        const response = await fetch(`/api/admin/matches/${matchId}/lineups`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            player_id: data.player_id,
            team_id: data.team_id,
            position: data.position || null,
            jersey_number: data.jersey_number,
            minutes_played: data.minutes_played || 90,
            goals_conceded: data.goals_conceded,
          }),
        });

        if (!response.ok) {
          throw new Error('라인업 저장에 실패했습니다.');
        }

        // 로컬 상태도 업데이트
        addLineup(data);
        setLineupDialogOpen(false);
        alert(
          '라인업이 성공적으로 저장되었습니다. (player_match_stats 및 player_season_stats 업데이트됨)'
        );
      } catch (error) {
        console.error('라인업 추가 실패:', error);
        alert('라인업 추가 중 오류가 발생했습니다.');
      }
    },
    onSubmitSubstitution: async (data: CreateSubstitutionData) => {
      try {
        // 즉시 서버에 교체 저장
        const response = await fetch(
          `/api/admin/matches/${matchId}/substitutions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              team_id: data.team_id,
              player_in_id: data.player_in_id,
              player_out_id: data.player_out_id,
              substitution_time: data.substitution_time,
              substitution_reason: data.description || null,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('교체 저장에 실패했습니다.');
        }

        // 로컬 상태도 업데이트
        addSubstitution(data);
        setSubstitutionDialogOpen(false);
        alert('교체가 성공적으로 저장되었습니다.');
      } catch (error) {
        console.error('교체 추가 실패:', error);
        alert('교체 추가 중 오류가 발생했습니다.');
      }
    },
    onSubmitPenalty: async (data: CreatePenaltyData) => {
      try {
        // 즉시 서버에 승부차기 저장
        const response = await fetch(
          `/api/admin/matches/${matchId}/penalties`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              team_id: data.team_id,
              kicker_id: data.player_id,
              goalkeeper_id: data.goalkeeper_id,
              is_successful: data.is_scored,
              kicker_order: data.order,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('승부차기 저장에 실패했습니다.');
        }

        // 로컬 상태도 업데이트
        addPenalty(data);
        setPenaltyDialogOpen(false);
        alert('승부차기가 성공적으로 저장되었습니다.');
      } catch (error) {
        console.error('페널티킥 추가 실패:', error);
        alert('페널티킥 추가 중 오류가 발생했습니다.');
      }
    },
  };

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

  return (
    <Container className="py-8">
      <div className="space-y-8">
        <MatchHeader onBackClick={handleBackClick} />

        <Card className="p-6">
          <MatchInfo match={match} />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="score">스코어</TabsTrigger>
              <TabsTrigger value="goals">골</TabsTrigger>
              <TabsTrigger value="assists">어시스트</TabsTrigger>
              <TabsTrigger value="lineups">라인업</TabsTrigger>
              <TabsTrigger value="substitutions">교체</TabsTrigger>
              <TabsTrigger value="penalties">승부차기</TabsTrigger>
              <TabsTrigger value="coaches">감독</TabsTrigger>
            </TabsList>

            <TabsContent value="score">
              <ScoreTab match={match} onSubmit={handleScoreSubmit} />
            </TabsContent>

            <TabsContent value="goals">
              <GoalsTab
                goals={goals}
                isLoading={isLoadingGoals}
                onAddGoal={() => setGoalDialogOpen(true)}
                actualGoals={matchData.goals}
                onRemoveGoal={removeGoal}
              />
            </TabsContent>

            <TabsContent value="assists">
              <AssistsTab
                isLoading={isLoadingGoals}
                onAddAssist={() => setAssistDialogOpen(true)}
                actualAssists={matchData.assists}
                onRemoveAssist={removeAssist}
              />
            </TabsContent>

            <TabsContent value="lineups">
              <LineupsTab
                homeTeamName={match.home_team?.team_name || ''}
                awayTeamName={match.away_team?.team_name || ''}
                homePlayers={homePlayers}
                awayPlayers={awayPlayers}
                isLoadingHomePlayers={isLoadingHomePlayers}
                isLoadingAwayPlayers={isLoadingAwayPlayers}
                onAddLineup={() => setLineupDialogOpen(true)}
                actualLineups={matchData.lineups}
                substitutions={matchData.substitutions}
                onRemoveLineup={removeLineup}
              />
            </TabsContent>

            <TabsContent value="substitutions">
              <SubstitutionsTab
                isLoadingPlayers={isLoadingHomePlayers || isLoadingAwayPlayers}
                onAddSubstitution={() => setSubstitutionDialogOpen(true)}
                actualSubstitutions={matchData.substitutions}
                onRemoveSubstitution={removeSubstitution}
              />
            </TabsContent>

            <TabsContent value="penalties">
              <PenaltiesTab
                isLoadingPlayers={isLoadingHomePlayers || isLoadingAwayPlayers}
                onAddPenalty={() => setPenaltyDialogOpen(true)}
                actualPenalties={matchData.penalties}
                onRemovePenalty={removePenalty}
              />
            </TabsContent>

            <TabsContent value="coaches">
              <CoachesTab
                matchId={matchId}
                actualCoaches={coaches}
                onRemoveCoach={() => {
                  // 감독 삭제 후 목록 새로고침
                  window.location.reload();
                }}
                homeTeam={{
                  team_id: match?.home_team_id || 0,
                  team_name: match?.home_team?.team_name || '',
                }}
                awayTeam={{
                  team_id: match?.away_team_id || 0,
                  team_name: match?.away_team?.team_name || '',
                }}
              />
            </TabsContent>
          </Tabs>
        </Card>

        <MatchDataDisplay
          matchData={matchData}
          validationResult={validationResult}
          onRemoveGoal={removeGoal}
          onRemoveAssist={removeAssist}
          onRemoveLineup={removeLineup}
          onRemoveSubstitution={removeSubstitution}
          onRemovePenalty={removePenalty}
          onRemoveCoach={(coachId) => {
            removeCoach(coachId);
          }}
          onSubmit={handleFinalSubmit}
        />
      </div>

      {match && (
        <MatchDialogs
          match={match}
          goals={goals}
          homePlayers={homePlayers}
          awayPlayers={awayPlayers}
          dialogStates={{
            goalDialogOpen,
            assistDialogOpen,
            lineupDialogOpen,
            substitutionDialogOpen,
            penaltyDialogOpen,
          }}
          onDialogStateChange={{
            setGoalDialogOpen,
            setAssistDialogOpen,
            setLineupDialogOpen,
            setSubstitutionDialogOpen,
            setPenaltyDialogOpen,
          }}
          onSubmitHandlers={dialogSubmitHandlers}
        />
      )}
    </Container>
  );
}
