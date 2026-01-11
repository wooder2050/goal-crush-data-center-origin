'use client';

import {
  Grid3X3,
  RotateCcw,
  Save,
  Search,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGoalMutation } from '@/hooks/useGoalMutation';
import {
  type PlayerSelection,
  type PlayerWithPosition,
  type Position,
  validateTeamComposition,
} from '@/types/fantasy';

import FantasyPlayerCard from './FantasyPlayerCard';
import FootballPitch from './FootballPitch';

interface Player {
  player_id: number;
  name: string;
  profile_image_url?: string;
  jersey_number?: number;
  current_team?: {
    team_id: number;
    team_name: string;
    logo?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  season_stats?: {
    goals: number;
    assists: number;
    matches_played: number;
  };
}

interface FantasyTeamBuilderProps {
  fantasySeasonId: number;
  availablePlayers: Player[];
  recommendedPlayers: Player[];
  initialSelectedPlayers?: Player[];
  initialTeamName?: string;
  mode: 'create' | 'edit';
  teamId?: number; // edit 모드일 때 필요
  isLocked?: boolean;
  className?: string;
  onSuccess?: (data: unknown) => void; // 성공 시 호출할 콜백 (페이지 이동 등)
}

export default function FantasyTeamBuilder({
  fantasySeasonId,
  availablePlayers,
  recommendedPlayers,
  initialSelectedPlayers = [],
  initialTeamName = '',
  mode,
  teamId,
  isLocked = false,
  className = '',
  onSuccess,
}: FantasyTeamBuilderProps) {
  const router = useRouter();
  const [teamName, setTeamName] = useState(initialTeamName);
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerWithPosition[]>(
    initialSelectedPlayers.map((player) => ({ ...player, position: undefined }))
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'pitch'>('grid');
  const [positionDialog, setPositionDialog] = useState<{
    isOpen: boolean;
    player: Player | null;
  }>({ isOpen: false, player: null });

  // 팀 생성 mutation
  const createTeamMutation = useGoalMutation(
    async (data: {
      teamName: string;
      playerSelections: Array<{
        player_id: number;
        position: 'GK' | 'DF' | 'MF' | 'FW';
      }>;
    }) => {
      const response = await fetch('/api/fantasy/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fantasy_season_id: fantasySeasonId,
          team_name: data.teamName,
          player_selections: data.playerSelections,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '팀 생성 중 오류가 발생했습니다.');
      }

      return response.json();
    },
    {
      onSuccess: (data) => {
        toast.success('팀이 성공적으로 생성되었습니다!');
        if (onSuccess) {
          onSuccess(data);
        } else {
          router.push(`/fantasy/${fantasySeasonId}/my-team`);
        }
      },
      onError: (error) => {
        console.error('팀 생성 중 오류:', error);
        toast.error(error.message || '팀 생성 중 오류가 발생했습니다.');
      },
    }
  );

  // 팀 수정 mutation
  const updateTeamMutation = useGoalMutation(
    async (data: {
      teamName: string;
      playerSelections: Array<{
        player_id: number;
        position: 'GK' | 'DF' | 'MF' | 'FW';
      }>;
    }) => {
      if (!teamId) {
        throw new Error('팀 ID가 필요합니다.');
      }

      const response = await fetch(`/api/fantasy/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: data.teamName,
          player_selections: data.playerSelections,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '팀 수정 중 오류가 발생했습니다.');
      }

      return response.json();
    },
    {
      onSuccess: (data) => {
        toast.success('팀이 성공적으로 수정되었습니다!');
        if (onSuccess) {
          onSuccess(data);
        } else {
          router.push(`/fantasy/${fantasySeasonId}/my-team`);
        }
      },
      onError: (error) => {
        console.error('팀 수정 중 오류:', error);
        toast.error(error.message || '팀 수정 중 오류가 발생했습니다.');
      },
    }
  );

  const currentMutation =
    mode === 'create' ? createTeamMutation : updateTeamMutation;
  const isSaving = currentMutation.isPending;

  const POSITION_COLORS = {
    GK: '#FFD700', // 골드 (골키퍼)
    DF: '#4285F4', // 블루 (수비수)
    MF: '#34A853', // 그린 (미드필더)
    FW: '#EA4335', // 레드 (공격수)
  };

  // 검색 필터링된 선수들
  const filteredPlayers = availablePlayers.filter(
    (player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.current_team?.team_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const filteredRecommended = recommendedPlayers.filter(
    (player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.current_team?.team_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // 선수 선택/해제
  const togglePlayerSelection = (player: Player) => {
    if (isLocked) return;

    const isSelected = selectedPlayers.some(
      (p) => p.player_id === player.player_id
    );

    if (isSelected) {
      // 선수 해제
      setSelectedPlayers((prev) =>
        prev.filter((p) => p.player_id !== player.player_id)
      );
    } else {
      // 선수 추가 - 포지션 선택 다이얼로그 열기
      if (selectedPlayers.length >= 5) {
        toast.error('최대 5명까지만 선택할 수 있습니다.');
        return;
      }
      setPositionDialog({ isOpen: true, player });
    }
  };

  // 포지션과 함께 선수 추가
  const addPlayerWithPosition = (position: Position) => {
    if (positionDialog.player) {
      // 포지션별 제한 체크
      const currentPositionCount = selectedPlayers.filter(
        (p) => p.position === position
      ).length;
      let maxCount = 0;
      let positionName = '';

      switch (position) {
        case 'GK':
          maxCount = 1;
          positionName = '골키퍼';
          break;
        case 'DF':
          maxCount = 2; // 수비수 최대 2명
          positionName = '수비수';
          break;
        case 'MF':
          maxCount = 2; // 미드필더 최대 2명
          positionName = '미드필더';
          break;
        case 'FW':
          maxCount = 2; // 공격수 최대 2명
          positionName = '공격수';
          break;
      }

      if (currentPositionCount >= maxCount) {
        toast.error(
          `${positionName}는 최대 ${maxCount}명까지 선택할 수 있습니다.`
        );
        return;
      }

      setSelectedPlayers((prev) => [
        ...prev,
        { ...positionDialog.player!, position },
      ]);
      setPositionDialog({ isOpen: false, player: null });
    }
  };

  // 포지션 변경
  const handlePositionChange = (playerId: number, position: Position) => {
    setSelectedPlayers((prev) =>
      prev.map((player) =>
        player.player_id === playerId ? { ...player, position } : player
      )
    );
  };

  // 팀 구성 검증
  const validateCurrentTeam = () => {
    const playerSelections: PlayerSelection[] = selectedPlayers.map(
      (player) => ({
        player_id: player.player_id,
        team_id: player.current_team?.team_id,
        name: player.name,
        position: undefined,
      })
    );

    return validateTeamComposition(playerSelections);
  };

  // 저장
  const handleSave = async () => {
    if (selectedPlayers.length !== 5) {
      toast.error('정확히 5명의 선수를 선택해주세요.');
      return;
    }

    const validation = validateCurrentTeam();
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    if (!teamName.trim()) {
      toast.error('팀명을 입력해주세요.');
      return;
    }

    const defaultPositions = ['GK', 'DF', 'MF', 'FW', 'FW'] as const;
    const playerSelections = selectedPlayers.map((player, index) => ({
      player_id: player.player_id,
      position: (player.position || defaultPositions[index] || 'FW') as
        | 'GK'
        | 'DF'
        | 'MF'
        | 'FW',
    }));

    currentMutation.mutate({
      teamName: teamName.trim(),
      playerSelections: playerSelections,
    });
  };

  // 초기화
  const handleReset = () => {
    if (isLocked) return;

    setSelectedPlayers(
      initialSelectedPlayers.map((player) => ({
        ...player,
        position: undefined,
      }))
    );
    setTeamName(initialTeamName);
    toast.info('팀이 초기화되었습니다.');
  };

  const validation = validateCurrentTeam();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 선택된 선수들 */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>내 팀 ({selectedPlayers.length}/5)</span>
            </CardTitle>

            {/* 뷰 모드 토글 */}
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'pitch' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('pitch')}
              >
                ⚽
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 팀명 입력 */}
          <div className="mb-4">
            <Label htmlFor="team-name">팀명</Label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="팀명을 입력하세요"
              disabled={isLocked}
              maxLength={50}
            />
          </div>

          {/* 선택된 선수들 - 뷰 모드별 표시 */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
              {Array.from({ length: 5 }).map((_, index) => {
                const player = selectedPlayers[index];
                if (player) {
                  return (
                    <FantasyPlayerCard
                      key={player.player_id}
                      player={player}
                      isSelected={true}
                      onClick={() => togglePlayerSelection(player)}
                      disabled={isLocked}
                    />
                  );
                }
                return (
                  <Card key={index} className="opacity-50 border-dashed">
                    <CardContent className="p-4 flex items-center justify-center h-24">
                      <div className="text-center text-gray-400 text-sm">
                        선수 {index + 1}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="mb-4">
              <FootballPitch
                players={selectedPlayers}
                onPlayerClick={(player) =>
                  !isLocked && togglePlayerSelection(player)
                }
                onPositionChange={handlePositionChange}
                allowPositionChange={!isLocked}
              />
            </div>
          )}

          {/* 검증 결과 */}
          {!validation.isValid && selectedPlayers.length > 0 && (
            <Alert className="mb-4">
              <AlertDescription>{validation.errors[0]}</AlertDescription>
            </Alert>
          )}

          {/* 팀 구성 정보 */}
          {selectedPlayers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {/* 팀별 선수 수 표시 */}
              {Object.entries(
                selectedPlayers.reduce(
                  (acc, player) => {
                    if (player.current_team) {
                      const teamName = player.current_team.team_name;
                      acc[teamName] = (acc[teamName] || 0) + 1;
                    }
                    return acc;
                  },
                  {} as Record<string, number>
                )
              ).map(([teamName, count]) => (
                <Badge
                  key={teamName}
                  variant={count > 2 ? 'destructive' : 'outline'}
                  className="text-xs"
                >
                  {teamName}: {count}명
                </Badge>
              ))}
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleSave}
              disabled={
                !validation.isValid ||
                selectedPlayers.length !== 5 ||
                !teamName.trim() ||
                isSaving ||
                isLocked
              }
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving
                ? '저장 중...'
                : mode === 'create'
                  ? '팀 생성'
                  : '팀 수정'}
            </Button>

            {!isLocked && (
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                초기화
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 선수 선택 */}
      {!isLocked && (
        <Card>
          <CardHeader>
            <CardTitle>선수 선택</CardTitle>

            {/* 검색창 */}
            <div className="relative pt-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="선수명 또는 팀명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="all"
                  className="flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>전체 선수</span>
                </TabsTrigger>
                <TabsTrigger
                  value="recommended"
                  className="flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI 추천</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredPlayers.map((player) => (
                    <FantasyPlayerCard
                      key={player.player_id}
                      player={player}
                      isSelected={selectedPlayers.some(
                        (p) => p.player_id === player.player_id
                      )}
                      onClick={() => togglePlayerSelection(player)}
                    />
                  ))}
                </div>

                {filteredPlayers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm
                      ? '검색 결과가 없습니다.'
                      : '선택 가능한 선수가 없습니다.'}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recommended" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredRecommended.map((player) => (
                    <FantasyPlayerCard
                      key={player.player_id}
                      player={player}
                      isSelected={selectedPlayers.some(
                        (p) => p.player_id === player.player_id
                      )}
                      isRecommended={true}
                      onClick={() => togglePlayerSelection(player)}
                    />
                  ))}
                </div>

                {filteredRecommended.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm
                      ? '검색 결과가 없습니다.'
                      : '추천 선수가 없습니다.'}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* 잠금 상태 메시지 */}
      {isLocked && (
        <Alert>
          <AlertDescription>
            편성 마감일이 지나 팀을 수정할 수 없습니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 포지션 선택 다이얼로그 */}
      <Dialog
        open={positionDialog.isOpen}
        onOpenChange={(open) =>
          setPositionDialog({
            isOpen: open,
            player: open ? positionDialog.player : null,
          })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>포지션 선택</DialogTitle>
            <DialogDescription>
              {positionDialog.player?.name}의 포지션을 선택해주세요.
            </DialogDescription>
          </DialogHeader>

          {positionDialog.player && (
            <div className="space-y-4">
              {/* 선수 정보 */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-gray-100">
                  {positionDialog.player.profile_image_url ? (
                    <Image
                      src={positionDialog.player.profile_image_url}
                      alt={positionDialog.player.name}
                      fill
                      className="object-contain"
                      sizes="48px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Shield className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{positionDialog.player.name}</p>
                  {positionDialog.player.current_team && (
                    <p className="text-sm text-gray-600">
                      {positionDialog.player.current_team.team_name}
                    </p>
                  )}
                </div>
              </div>

              {/* 포지션 선택 버튼들 */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2"
                  onClick={() => addPlayerWithPosition('GK')}
                  disabled={
                    selectedPlayers.filter((p) => p.position === 'GK').length >=
                    1
                  }
                >
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: POSITION_COLORS.GK }}
                  />
                  <span className="text-sm font-medium">골키퍼</span>
                  <span className="text-xs text-gray-500">
                    ({selectedPlayers.filter((p) => p.position === 'GK').length}
                    /1)
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2"
                  onClick={() => addPlayerWithPosition('DF')}
                  disabled={
                    selectedPlayers.filter((p) => p.position === 'DF').length >=
                    2
                  }
                >
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: POSITION_COLORS.DF }}
                  />
                  <span className="text-sm font-medium">수비수</span>
                  <span className="text-xs text-gray-500">
                    ({selectedPlayers.filter((p) => p.position === 'DF').length}
                    /2)
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2"
                  onClick={() => addPlayerWithPosition('MF')}
                  disabled={
                    selectedPlayers.filter((p) => p.position === 'MF').length >=
                    2
                  }
                >
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: POSITION_COLORS.MF }}
                  />
                  <span className="text-sm font-medium">미드필더</span>
                  <span className="text-xs text-gray-500">
                    ({selectedPlayers.filter((p) => p.position === 'MF').length}
                    /2)
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2"
                  onClick={() => addPlayerWithPosition('FW')}
                  disabled={
                    selectedPlayers.filter((p) => p.position === 'FW').length >=
                    2
                  }
                >
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: POSITION_COLORS.FW }}
                  />
                  <span className="text-sm font-medium">공격수</span>
                  <span className="text-xs text-gray-500">
                    ({selectedPlayers.filter((p) => p.position === 'FW').length}
                    /2)
                  </span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
