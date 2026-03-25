'use client';

import { AlertCircle, Check, Trash2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { H2 } from '@/components/ui/typography';

import {
  getParticipationStatus,
  getStatusBadgeClass,
  getStatusLabel,
} from '../lib/lineupUtils';
import {
  MatchAssist,
  MatchCoach,
  MatchData,
  MatchGoal,
  MatchLineup,
  MatchPenalty,
  MatchSubstitution,
  ValidationResult,
} from '../types';

interface MatchDataDisplayProps {
  matchData: MatchData;
  validationResult?: ValidationResult;
  onRemoveGoal?: (id: string) => void;
  onRemoveAssist?: (id: string) => void;
  onRemoveLineup?: (id: string) => void;
  onRemoveSubstitution?: (id: string) => void;
  onRemovePenalty?: (id: string) => void;
  onRemoveCoach?: (id: string) => void;
  onSubmit?: () => void;
}

export default function MatchDataDisplay({
  matchData,
  validationResult,
  onRemoveGoal,
  onRemoveAssist,
  onRemoveLineup,
  onRemoveSubstitution,
  onRemovePenalty,
  onRemoveCoach,
  onSubmit,
}: MatchDataDisplayProps) {
  const hasErrors = validationResult && !validationResult.isValid;
  const hasData =
    matchData.goals.length > 0 ||
    matchData.assists.length > 0 ||
    matchData.lineups.length > 0 ||
    matchData.substitutions.length > 0 ||
    matchData.penalties.length > 0 ||
    matchData.coaches.length > 0;

  return (
    <Card className="p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <H2>경기 데이터</H2>
        {onSubmit && (
          <Button
            onClick={onSubmit}
            disabled={hasErrors || !hasData}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            유효성 검사 및 통계 업데이트
          </Button>
        )}
      </div>

      {hasErrors && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>유효성 검증 오류</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-2">
              {validationResult.errors.score?.map((error, index) => (
                <li key={`score-${index}`}>{error}</li>
              ))}
              {validationResult.errors.goals?.map((error, index) => (
                <li key={`goals-${index}`}>{error}</li>
              ))}
              {validationResult.errors.assists?.map((error, index) => (
                <li key={`assists-${index}`}>{error}</li>
              ))}
              {validationResult.errors.lineups?.map((error, index) => (
                <li key={`lineups-${index}`}>{error}</li>
              ))}
              {validationResult.errors.substitutions?.map((error, index) => (
                <li key={`subs-${index}`}>{error}</li>
              ))}
              {validationResult.errors.penalties?.map((error, index) => (
                <li key={`penalties-${index}`}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* 스코어 정보 */}
        <div>
          <h3 className="font-semibold mb-2">스코어</h3>
          <div className="grid grid-cols-3 gap-4 text-center p-2 bg-gray-50 rounded">
            <div>
              <p className="text-sm text-gray-600">홈</p>
              <p className="text-xl font-bold">{matchData.score.home_score}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">:</p>
              <p className="text-xl font-bold">:</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">원정</p>
              <p className="text-xl font-bold">{matchData.score.away_score}</p>
            </div>
          </div>

          {/* 페널티킥 스코어가 있는 경우 */}
          {(matchData.score.penalty_home_score !== null ||
            matchData.score.penalty_away_score !== null) && (
            <div className="grid grid-cols-3 gap-4 text-center p-2 mt-2 bg-gray-50 rounded">
              <div>
                <p className="text-sm text-gray-600">홈 (PK)</p>
                <p className="text-xl font-bold">
                  {matchData.score.penalty_home_score}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">:</p>
                <p className="text-xl font-bold">:</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">원정 (PK)</p>
                <p className="text-xl font-bold">
                  {matchData.score.penalty_away_score}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 골 정보 */}
        {matchData.goals.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">
              골 ({matchData.goals.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">시간</th>
                    <th className="text-left py-2 px-4">선수</th>
                    <th className="text-left py-2 px-4">타입</th>
                    <th className="text-left py-2 px-4">설명</th>
                    <th className="text-right py-2 px-4">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {matchData.goals.map((goal: MatchGoal) => (
                    <tr key={goal.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{goal.goal_time}&apos;</td>
                      <td className="py-2 px-4">
                        {goal.player_name}{' '}
                        {goal.jersey_number != null &&
                          `(${goal.jersey_number})`}
                      </td>
                      <td className="py-2 px-4">
                        {goal.goal_type === 'own_goal'
                          ? '자책골'
                          : goal.goal_type === 'penalty'
                            ? '페널티킥'
                            : goal.goal_type === 'free_kick'
                              ? '프리킥'
                              : goal.goal_type === 'regular'
                                ? '일반'
                                : '일반'}
                      </td>
                      <td className="py-2 px-4">{goal.description || '-'}</td>
                      <td className="py-2 px-4 text-right">
                        {onRemoveGoal && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemoveGoal(goal.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 어시스트 정보 */}
        {matchData.assists.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">
              어시스트 ({matchData.assists.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">선수</th>
                    <th className="text-left py-2 px-4">연결된 골</th>
                    <th className="text-left py-2 px-4">설명</th>
                    <th className="text-right py-2 px-4">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {matchData.assists.map((assist: MatchAssist) => (
                    <tr key={assist.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{assist.player_name}</td>
                      <td className="py-2 px-4">
                        {assist.goal_time}&apos; {assist.goal_player_name || ''}
                      </td>
                      <td className="py-2 px-4">{assist.description || '-'}</td>
                      <td className="py-2 px-4 text-right">
                        {onRemoveAssist && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemoveAssist(assist.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 라인업 정보 */}
        {matchData.lineups.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">
              라인업 ({matchData.lineups.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">팀</th>
                    <th className="text-left py-2 px-4">선수</th>
                    <th className="text-left py-2 px-4">포지션</th>
                    <th className="text-left py-2 px-4">번호</th>
                    <th className="text-left py-2 px-4">상태</th>
                    <th className="text-right py-2 px-4">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {matchData.lineups.map((lineup: MatchLineup) => {
                    const status = getParticipationStatus(
                      lineup,
                      matchData.substitutions
                    );
                    const statusLabel = getStatusLabel(status);

                    return (
                      <tr key={lineup.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{lineup.team_name}</td>
                        <td className="py-2 px-4">{lineup.player_name}</td>
                        <td className="py-2 px-4">{lineup.position}</td>
                        <td className="py-2 px-4">
                          {lineup.jersey_number ?? '-'}
                        </td>
                        <td className="py-2 px-4">
                          <span className={getStatusBadgeClass(status)}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right">
                          {onRemoveLineup && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRemoveLineup(lineup.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 교체 정보 */}
        {matchData.substitutions.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">
              교체 ({matchData.substitutions.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">시간</th>
                    <th className="text-left py-2 px-4">팀</th>
                    <th className="text-left py-2 px-4">IN</th>
                    <th className="text-left py-2 px-4">OUT</th>
                    <th className="text-left py-2 px-4">설명</th>
                    <th className="text-right py-2 px-4">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {matchData.substitutions.map(
                    (substitution: MatchSubstitution) => (
                      <tr
                        key={substitution.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-2 px-4">
                          {substitution.substitution_time}&apos;
                        </td>
                        <td className="py-2 px-4">{substitution.team_name}</td>
                        <td className="py-2 px-4">
                          {substitution.player_in_name}
                        </td>
                        <td className="py-2 px-4">
                          {substitution.player_out_name}
                        </td>
                        <td className="py-2 px-4">
                          {substitution.description || '-'}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {onRemoveSubstitution && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                onRemoveSubstitution(substitution.id)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 페널티킥 정보 */}
        {matchData.penalties.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">
              페널티킥 ({matchData.penalties.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">순서</th>
                    <th className="text-left py-2 px-4">팀</th>
                    <th className="text-left py-2 px-4">키커</th>
                    <th className="text-left py-2 px-4">골키퍼</th>
                    <th className="text-left py-2 px-4">결과</th>
                    <th className="text-right py-2 px-4">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {matchData.penalties.map((penalty: MatchPenalty) => (
                    <tr key={penalty.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{penalty.order}</td>
                      <td className="py-2 px-4">{penalty.team_name}</td>
                      <td className="py-2 px-4">{penalty.player_name}</td>
                      <td className="py-2 px-4">{penalty.goalkeeper_name}</td>
                      <td className="py-2 px-4">
                        {penalty.is_scored ? '성공' : '실패'}
                      </td>
                      <td className="py-2 px-4 text-right">
                        {onRemovePenalty && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemovePenalty(penalty.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 감독 정보 */}
        {matchData.coaches?.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">
              감독 ({matchData.coaches.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">팀</th>
                    <th className="text-left py-2 px-4">감독명</th>
                    <th className="text-left py-2 px-4">역할</th>
                    <th className="text-left py-2 px-4">설명</th>
                    <th className="text-right py-2 px-4">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {matchData.coaches.map((coach: MatchCoach) => (
                    <tr key={coach.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{coach.team_name}</td>
                      <td className="py-2 px-4">{coach.coach_name}</td>
                      <td className="py-2 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {coach.role === 'head'
                            ? '감독'
                            : coach.role === 'assistant'
                              ? '코치'
                              : coach.role === 'goalkeeper'
                                ? '골키퍼 코치'
                                : coach.role === 'fitness'
                                  ? '피트니스 코치'
                                  : coach.role === 'analyst'
                                    ? '분석 코치'
                                    : coach.role}
                        </span>
                      </td>
                      <td className="py-2 px-4">{coach.description || '-'}</td>
                      <td className="py-2 px-4 text-right">
                        {onRemoveCoach && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemoveCoach(coach.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!hasData && (
          <div className="text-center py-8 text-gray-500">
            저장된 경기 데이터가 없습니다. 각 탭에서 데이터를 추가해주세요.
          </div>
        )}
      </div>
    </Card>
  );
}
