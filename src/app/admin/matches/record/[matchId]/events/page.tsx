'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { H1 } from '@/components/ui/typography';
import MatchErrorState from '@/features/admin/components/MatchErrorState';
import { MatchDetailPageSkeleton } from '@/features/admin/components/skeletons';
import { useMatchLineups } from '@/features/admin/hooks/useLineupQuery';
import { useMatchDetail } from '@/features/admin/hooks/useMatchQuery';
import {
  ACTION_REQUIRES_END_COORDINATE,
  ActionResult,
  ActionType,
  BodyPart,
  createAction,
  CreateActionData,
  deleteAction,
  formatTime,
  getActions,
  InputStep,
  LineupPlayer,
  MatchAction,
  PERIOD_LABELS,
  PitchCoordinate,
} from '@/features/event-actions';
import {
  ActionHistory,
  ActionTypeSelector,
  BodyPartSelector,
  PitchView,
  PlayerSelector,
  ResultSelector,
} from '@/features/event-actions/components';

export const dynamic = 'force-dynamic';

export default function EventRecordPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = Number(params.matchId as string);

  // 경기 정보 조회
  const {
    data: match,
    isLoading: isLoadingMatch,
    error: matchError,
  } = useMatchDetail(matchId);

  // 라인업 조회
  const { data: lineups = [], isLoading: isLoadingLineups } =
    useMatchLineups(matchId);

  // 상태 관리
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [inputStep, setInputStep] = useState<InputStep>('idle');
  const [showGuide, setShowGuide] = useState(false);
  const [periodDurationMinutes, setPeriodDurationMinutes] = useState(10); // 피리어드 길이 (분)

  // 입력 상태
  const [startCoordinate, setStartCoordinate] =
    useState<PitchCoordinate | null>(null);
  const [endCoordinate, setEndCoordinate] = useState<PitchCoordinate | null>(
    null
  );
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedActionType, setSelectedActionType] =
    useState<ActionType | null>(null);
  const [selectedResult, setSelectedResult] = useState<ActionResult | null>(
    null
  );
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | null>(
    null
  );

  // 액션 목록
  const [actions, setActions] = useState<MatchAction[]>([]);
  const [isLoadingActions, setIsLoadingActions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 타이머 ref
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 라인업을 LineupPlayer 형태로 변환
  const players: LineupPlayer[] = lineups.map((lineup) => ({
    player_id: lineup.player_id ?? 0,
    name: lineup.player?.name || '알 수 없음',
    jersey_number: lineup.player?.jersey_number ?? null,
    position: lineup.position || '',
    team_id: lineup.team_id ?? 0,
    team_name: lineup.team?.team_name || '알 수 없음',
  }));

  // 기존 액션 데이터 로드
  useEffect(() => {
    if (matchId) {
      getActions(matchId)
        .then((data) => {
          if (Array.isArray(data)) {
            setActions(data);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingActions(false));
    }
  }, [matchId]);

  // 타이머 시작/정지
  const toggleTimer = useCallback(() => {
    if (isTimerRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsTimerRunning(false);
    } else {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      setIsTimerRunning(true);
    }
  }, [isTimerRunning]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 단축키 비활성화
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // 액션 타입 선택 단계에서만 단축키 활성화
      if (inputStep === 'action_type') {
        switch (e.key.toLowerCase()) {
          case 'p': // 패스
            e.preventDefault();
            handleActionTypeSelect('PASS');
            break;
          case 's': // 슛
            e.preventDefault();
            handleActionTypeSelect('SHOT');
            break;
          case 'r': // 리시브
            e.preventDefault();
            handleActionTypeSelect('RECEIVE');
            break;
          case 'v': // 세이브 (S가 슛에 사용되므로 V 사용)
            e.preventDefault();
            handleActionTypeSelect('KEEPER_SAVE');
            break;
          case 'd': // 드리블
            e.preventDefault();
            handleActionTypeSelect('DRIBBLE');
            break;
          case 't': // 태클
            e.preventDefault();
            handleActionTypeSelect('TACKLE');
            break;
          case 'i': // 인터셉트
            e.preventDefault();
            handleActionTypeSelect('INTERCEPTION');
            break;
          case 'f': // 파울
            e.preventDefault();
            handleActionTypeSelect('FOUL');
            break;
        }
      }

      // Escape로 입력 취소
      if (e.key === 'Escape' && inputStep !== 'idle') {
        e.preventDefault();
        resetInput();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputStep]);

  // 피리어드 변경
  const handlePeriodChange = (period: number) => {
    setCurrentPeriod(period);
    setElapsedSeconds(0);
    if (isTimerRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsTimerRunning(false);
    }
  };

  // 좌표 선택 핸들러
  const handleCoordinateSelect = (coord: PitchCoordinate) => {
    if (inputStep === 'idle' || inputStep === 'coordinate_start') {
      setStartCoordinate(coord);
      setInputStep('player');
    } else if (inputStep === 'coordinate_end') {
      setEndCoordinate(coord);
      setInputStep('result');
    }
  };

  // 선수 선택 핸들러
  const handlePlayerSelect = (playerId: number, teamId: number) => {
    setSelectedPlayerId(playerId);
    setSelectedTeamId(teamId);
    setInputStep('action_type');
  };

  // 액션 타입 선택 핸들러
  const handleActionTypeSelect = (actionType: ActionType) => {
    setSelectedActionType(actionType);
    if (ACTION_REQUIRES_END_COORDINATE[actionType]) {
      setInputStep('coordinate_end');
    } else {
      setInputStep('result');
    }
  };

  // 결과 선택 핸들러
  const handleResultSelect = async (result: ActionResult) => {
    setSelectedResult(result);

    // 모든 필수 필드가 채워졌으면 저장
    if (
      startCoordinate &&
      selectedPlayerId &&
      selectedTeamId &&
      selectedActionType
    ) {
      await saveAction(result);
    }
  };

  // 액션 저장
  const saveAction = async (result: ActionResult) => {
    if (
      !startCoordinate ||
      !selectedPlayerId ||
      !selectedTeamId ||
      !selectedActionType
    ) {
      return;
    }

    setIsSaving(true);
    try {
      const actionData: CreateActionData = {
        period_id: currentPeriod,
        time_seconds: elapsedSeconds,
        player_id: selectedPlayerId,
        team_id: selectedTeamId,
        action_type: selectedActionType,
        result: result,
        body_part: selectedBodyPart || undefined,
        start_x: startCoordinate.x,
        start_y: startCoordinate.y,
        end_x: endCoordinate?.x,
        end_y: endCoordinate?.y,
        is_set_piece: false,
      };

      const newAction = await createAction(matchId, actionData);
      setActions((prev) => [...prev, newAction]);

      // 입력 상태 초기화
      resetInput();
    } catch (error) {
      console.error('Failed to save action:', error);
      alert('액션 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 입력 초기화
  const resetInput = () => {
    setStartCoordinate(null);
    setEndCoordinate(null);
    setSelectedPlayerId(null);
    setSelectedTeamId(null);
    setSelectedActionType(null);
    setSelectedResult(null);
    setSelectedBodyPart(null);
    setInputStep('idle');
  };

  // Undo (마지막 액션 삭제)
  const handleUndo = async () => {
    if (actions.length === 0) return;

    const lastAction = actions[actions.length - 1];

    try {
      await deleteAction(matchId, lastAction.action_id);
      setActions((prev) => prev.slice(0, -1));
    } catch (error) {
      console.error('Failed to undo:', error);
      alert('Undo에 실패했습니다.');
    }
  };

  // 네비게이션 핸들러
  const handleBackClick = () => router.push('/admin/matches/record');

  // 현재 입력 단계 안내 메시지
  const getStepMessage = (): string => {
    switch (inputStep) {
      case 'idle':
        return '피치를 터치하여 시작 위치를 선택하세요';
      case 'coordinate_start':
        return '피치를 터치하여 시작 위치를 선택하세요';
      case 'player':
        return '선수를 선택하세요';
      case 'action_type':
        return '액션 타입을 선택하세요';
      case 'coordinate_end':
        return '피치를 터치하여 종료 위치를 선택하세요';
      case 'result':
        return '결과를 선택하세요';
      default:
        return '';
    }
  };

  // 로딩 상태
  if (isLoadingMatch) {
    return <MatchDetailPageSkeleton />;
  }

  // 에러 상태
  if (matchError || !match) {
    return (
      <MatchErrorState
        errorMessage={matchError?.message}
        onBackClick={handleBackClick}
      />
    );
  }

  return (
    <Container className="py-4">
      <div className="space-y-3">
        {/* 헤더 */}
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
            <H1 className="text-xl">이벤트 기록</H1>
          </div>
          <div className="flex gap-2">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/admin/matches/record/${matchId}/possession`)
              }
            >
              점유율
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/admin/matches/record/${matchId}/pass-map`)
              }
            >
              패스맵
            </Button>
          </div>
        </div>

        {/* 기록 방법 안내 */}
        <Card className="p-3 bg-blue-50 border-blue-200">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="text-sm font-medium text-blue-800">
              기록 방법 안내
            </span>
            <span className="text-blue-600">{showGuide ? '▲' : '▼'}</span>
          </button>

          {showGuide && (
            <div className="mt-3 space-y-3 text-sm text-blue-900">
              {/* 기본 플로우 */}
              <div>
                <h4 className="font-semibold mb-1">기록 순서</h4>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>
                    <strong>타이머 시작</strong> - 경기 시작과 함께
                    &quot;시작&quot; 버튼 클릭
                  </li>
                  <li>
                    <strong>위치 선택</strong> - 피치에서 이벤트 발생 위치 터치
                  </li>
                  <li>
                    <strong>선수 선택</strong> - 해당 이벤트를 수행한 선수 클릭
                  </li>
                  <li>
                    <strong>액션 선택</strong> - 패스, 슛, 태클 등 액션 타입
                    선택
                  </li>
                  <li>
                    <strong>종료 위치</strong> - 패스/슛은 도착 위치도 터치
                  </li>
                  <li>
                    <strong>결과 선택</strong> - 성공/실패/골 등 결과 선택 →
                    자동 저장
                  </li>
                </ol>
              </div>

              {/* 패스/드리블 카테고리 */}
              <div>
                <h4 className="font-semibold mb-1 text-blue-700">
                  패스/드리블
                </h4>
                <div className="grid gap-1 text-xs">
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">➡️ 패스</span>: 팀 동료에게
                    볼을 전달하는 모든 행위
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 성공: 동료가 볼을 받음 | 실패: 상대에게 넘어감, 아웃됨
                    </span>
                  </div>
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">↗️ 크로스</span>: 측면에서
                    중앙/골대 방향으로 올리는 패스
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 주로 윙어가 페널티박스로 올리는 공중볼
                    </span>
                  </div>
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">🏃 드리블</span>: 볼을 가지고
                    이동하는 행위
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 성공: 상대를 제치거나 공간 확보 | 실패: 볼을 뺏김
                    </span>
                  </div>
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">📥 리시브</span>: 패스를 받는
                    행위
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 성공: 볼 컨트롤 성공 | 실패: 트래핑 미스로 볼 소유권
                      상실
                    </span>
                  </div>
                </div>
              </div>

              {/* 슈팅 카테고리 */}
              <div>
                <h4 className="font-semibold mb-1 text-red-700">슈팅</h4>
                <div className="grid gap-1 text-xs">
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">🎯 슛</span>: 골대를 향해 차는
                    모든 시도
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 골: 득점 | 성공: 유효슈팅(골대 정면) | 실패: 빗나감/막힘
                    </span>
                  </div>
                </div>
              </div>

              {/* 수비 카테고리 */}
              <div>
                <h4 className="font-semibold mb-1 text-green-700">수비</h4>
                <div className="grid gap-1 text-xs">
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">🦵 태클</span>: 상대 볼을 뺏기
                    위해 다리를 뻗는 행위
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 성공: 볼 탈취 | 실패: 상대가 여전히 소유, 파울
                    </span>
                  </div>
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">✋ 인터셉트</span>: 상대
                    패스를 중간에 가로채는 행위
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 성공: 패스 차단 후 소유권 확보 | 실패: 터치했으나 확보
                      못함
                    </span>
                  </div>
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">🧹 클리어</span>: 위험
                    지역에서 볼을 걷어내는 행위
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 주로 수비수가 페널티박스에서 위험을 제거할 때
                    </span>
                  </div>
                </div>
              </div>

              {/* 세트피스 카테고리 */}
              <div>
                <h4 className="font-semibold mb-1 text-purple-700">세트피스</h4>
                <div className="grid gap-1 text-xs">
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">🦶 킥인</span>: 터치라인
                    밖으로 나간 후 발로 차서 넣는 행위 (풋살 규칙)
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 성공: 동료가 받음 | 실패: 상대에게 넘어감
                    </span>
                  </div>
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">🚩 코너킥</span>: 코너에서
                    차는 킥
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 수비팀이 골라인 밖으로 걷어낸 후 공격팀이 차는 킥
                    </span>
                  </div>
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">⚽ 프리킥</span>: 파울 후
                    주어지는 킥
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 직접 슛 또는 패스로 연결. 골대 근처면 직접 슛 시도
                    </span>
                  </div>
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">🥅 골킥</span>: 골키퍼가
                    골에어리어에서 차는 킥
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 공격팀이 골라인 밖으로 차낸 후 수비팀에게 주어지는 킥
                    </span>
                  </div>
                </div>
              </div>

              {/* 골키퍼 카테고리 */}
              <div>
                <h4 className="font-semibold mb-1 text-orange-700">골키퍼</h4>
                <div className="grid gap-1 text-xs">
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">🧤 세이브</span>: 상대 슛을
                    막아내는 행위
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 성공: 슛 저지 | 실패: 골 허용 또는 리바운드 실점
                    </span>
                  </div>
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">🤲 캐치</span>: 공중볼이나
                    슛을 잡는 행위
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 성공: 볼 완전 확보 | 실패: 놓침
                    </span>
                  </div>
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">👊 펀칭</span>: 주먹으로 볼을
                    쳐내는 행위
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 크로스나 코너킥 상황에서 볼을 걷어낼 때
                    </span>
                  </div>
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">🤾 스로</span>: 볼을 잡은 후
                    손으로 던지는 행위
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 역습 시작을 위해 빠르게 볼을 배급할 때
                    </span>
                  </div>
                </div>
              </div>

              {/* 기타 카테고리 */}
              <div>
                <h4 className="font-semibold mb-1 text-gray-700">기타</h4>
                <div className="grid gap-1 text-xs">
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">🚫 파울</span>: 규칙 위반 행위
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 성공: 일반 파울 | 경고: 옐로카드 | 퇴장: 레드카드
                    </span>
                  </div>
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">❌ 볼 로스트</span>: 실수로 볼
                    소유권을 잃는 행위
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 드리블 미스, 트래핑 실패, 헛발질 등
                    </span>
                  </div>
                  <div className="bg-white/50 p-2 rounded">
                    <span className="font-medium">🟨 카드</span>: 경고/퇴장만
                    별도 기록할 때
                    <br />
                    <span className="text-gray-600 ml-4">
                      • 파울 없이 카드만 받는 경우 (항의, 지연 등)
                    </span>
                  </div>
                </div>
              </div>

              {/* 키보드 단축키 */}
              <div className="bg-blue-100 p-2 rounded text-blue-800">
                <h4 className="font-semibold mb-1">⌨️ 키보드 단축키</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                  <div>
                    <kbd className="bg-white px-1 rounded text-[10px] font-mono">
                      P
                    </kbd>{' '}
                    패스
                  </div>
                  <div>
                    <kbd className="bg-white px-1 rounded text-[10px] font-mono">
                      S
                    </kbd>{' '}
                    슛
                  </div>
                  <div>
                    <kbd className="bg-white px-1 rounded text-[10px] font-mono">
                      R
                    </kbd>{' '}
                    리시브
                  </div>
                  <div>
                    <kbd className="bg-white px-1 rounded text-[10px] font-mono">
                      V
                    </kbd>{' '}
                    세이브
                  </div>
                  <div>
                    <kbd className="bg-white px-1 rounded text-[10px] font-mono">
                      D
                    </kbd>{' '}
                    드리블
                  </div>
                  <div>
                    <kbd className="bg-white px-1 rounded text-[10px] font-mono">
                      T
                    </kbd>{' '}
                    태클
                  </div>
                  <div>
                    <kbd className="bg-white px-1 rounded text-[10px] font-mono">
                      I
                    </kbd>{' '}
                    인터셉트
                  </div>
                  <div>
                    <kbd className="bg-white px-1 rounded text-[10px] font-mono">
                      F
                    </kbd>{' '}
                    파울
                  </div>
                  <div className="col-span-2 mt-1 pt-1 border-t border-blue-200">
                    <kbd className="bg-white px-1 rounded text-[10px] font-mono">
                      Esc
                    </kbd>{' '}
                    입력 취소
                  </div>
                </div>
              </div>

              {/* 팁 */}
              <div className="bg-yellow-100 p-2 rounded text-yellow-800">
                <h4 className="font-semibold mb-1">💡 Tip</h4>
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  <li>
                    실수로 잘못 기록했다면 <strong>Undo</strong> 버튼으로 취소
                  </li>
                  <li>
                    피리어드 변경 시 타이머가 자동으로 0:00으로 리셋됩니다
                  </li>
                  <li>
                    골때녀 피치 크기: 가로 40m × 세로 20m (풋살 규격 기준)
                  </li>
                  <li>기록은 자동 저장되므로 별도 저장 버튼이 필요 없습니다</li>
                </ul>
              </div>
            </div>
          )}
        </Card>

        {/* 타이머 + 피리어드 컨트롤 */}
        <Card className="p-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* 피리어드 선택 */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((period) => (
                  <Button
                    key={period}
                    variant={currentPeriod === period ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePeriodChange(period)}
                    className="h-8 px-3"
                  >
                    {PERIOD_LABELS[period]}
                  </Button>
                ))}
              </div>
              {/* 피리어드 길이 선택 */}
              <div className="flex items-center gap-1 ml-2 border-l pl-2">
                <span className="text-xs text-gray-500">경기시간:</span>
                {[10, 12, 13].map((minutes) => (
                  <Button
                    key={minutes}
                    variant={
                      periodDurationMinutes === minutes ? 'default' : 'ghost'
                    }
                    size="sm"
                    onClick={() => setPeriodDurationMinutes(minutes)}
                    className="h-6 px-2 text-xs"
                  >
                    {minutes}분
                  </Button>
                ))}
              </div>
            </div>

            {/* 타이머 */}
            <div className="flex items-center gap-2">
              {/* 시간 감소 버튼 */}
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setElapsedSeconds((prev) => Math.max(0, prev - 60))
                  }
                  className="h-8 px-2 text-xs"
                  title="-1분"
                >
                  -1분
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setElapsedSeconds((prev) => Math.max(0, prev - 1))
                  }
                  className="h-8 px-2 text-xs"
                  title="-1초"
                >
                  -1초
                </Button>
              </div>

              {/* 현재 시간 표시 */}
              <span className="text-2xl font-mono font-bold min-w-[70px] text-center">
                {formatTime(elapsedSeconds)}
              </span>
              <span className="text-gray-400 text-sm">
                / {periodDurationMinutes}:00
              </span>

              {/* 시간 증가 버튼 */}
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setElapsedSeconds((prev) => prev + 1)}
                  className="h-8 px-2 text-xs"
                  title="+1초"
                >
                  +1초
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setElapsedSeconds((prev) => prev + 60)}
                  className="h-8 px-2 text-xs"
                  title="+1분"
                >
                  +1분
                </Button>
              </div>

              {/* 시작/일시정지 버튼 */}
              <Button
                variant={isTimerRunning ? 'destructive' : 'default'}
                size="sm"
                onClick={toggleTimer}
                className="ml-2"
              >
                {isTimerRunning ? '일시정지' : '시작'}
              </Button>
            </div>

            {/* Undo 버튼 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={actions.length === 0}
            >
              Undo
            </Button>
          </div>
        </Card>

        {/* 입력 상태 안내 */}
        <div
          className={`text-center py-2 rounded ${
            inputStep !== 'idle'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-gray-50 text-gray-500'
          }`}
        >
          <span className="text-sm">{getStepMessage()}</span>
          {inputStep !== 'idle' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetInput}
              className="ml-2 h-6 px-2 text-xs"
            >
              취소
            </Button>
          )}
        </div>

        {/* 메인 영역: 피치 + 선수/액션 선택 */}
        <div className="grid md:grid-cols-2 gap-3">
          {/* 피치 뷰 */}
          <Card className="p-3">
            <PitchView
              onCoordinateSelect={handleCoordinateSelect}
              startCoordinate={startCoordinate}
              endCoordinate={endCoordinate}
              recentActions={actions.slice(-5)}
              showEndCoordinate={
                inputStep === 'coordinate_end' || !!endCoordinate
              }
              disabled={
                isSaving ||
                (inputStep !== 'idle' &&
                  inputStep !== 'coordinate_start' &&
                  inputStep !== 'coordinate_end')
              }
              homeTeamName={match.home_team?.team_name}
              awayTeamName={match.away_team?.team_name}
            />
          </Card>

          {/* 선수 선택 */}
          <Card className="p-3">
            <h3 className="text-xs font-semibold text-gray-600 mb-2">
              선수 선택
            </h3>
            {isLoadingLineups ? (
              <div className="text-sm text-gray-400">로딩 중...</div>
            ) : players.length === 0 ? (
              <div className="text-sm text-gray-400">
                라인업이 등록되지 않았습니다
              </div>
            ) : (
              <PlayerSelector
                players={players}
                selectedPlayerId={selectedPlayerId}
                onSelect={handlePlayerSelect}
                homeTeamId={match.home_team_id ?? 0}
                awayTeamId={match.away_team_id ?? 0}
                disabled={isSaving || inputStep !== 'player'}
              />
            )}
          </Card>
        </div>

        {/* 액션 타입 선택 */}
        <Card className="p-3">
          <h3 className="text-xs font-semibold text-gray-600 mb-2">
            액션 타입
          </h3>
          <ActionTypeSelector
            selectedActionType={selectedActionType}
            onSelect={handleActionTypeSelect}
            disabled={isSaving || inputStep !== 'action_type'}
          />
        </Card>

        {/* 결과 선택 + 신체 부위 */}
        <Card className="p-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-600 mb-2">결과</h3>
              <ResultSelector
                actionType={selectedActionType}
                selectedResult={selectedResult}
                onSelect={handleResultSelect}
                disabled={isSaving || inputStep !== 'result'}
              />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-600 mb-2">
                신체 부위 (선택)
              </h3>
              <BodyPartSelector
                selectedBodyPart={selectedBodyPart}
                onSelect={setSelectedBodyPart}
                disabled={isSaving}
              />
            </div>
          </div>
        </Card>

        {/* 액션 히스토리 */}
        <Card className="p-3">
          <ActionHistory
            actions={actions}
            onUndo={handleUndo}
            canUndo={actions.length > 0 && !isSaving}
            isLoading={isLoadingActions}
          />
        </Card>
      </div>
    </Container>
  );
}
