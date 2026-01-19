'use client';

import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-react';
import React, { useState } from 'react';

import {
  playerFormSchema,
  PlayerFormValues,
} from '@/common/form/fields/player';
import { useGoalForm } from '@/common/form/useGoalForm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { H1 } from '@/components/ui/typography';
import { PlayerFormSkeleton } from '@/features/admin/components/skeletons';
import {
  useCreatePlayerMutation,
  useDeletePlayerMutation,
  useUpdatePlayerMutation,
} from '@/features/admin/hooks/usePlayerMutation';
import { useAllPlayers } from '@/features/admin/hooks/usePlayerQuery';
import {
  convertFormToApiData,
  PlayerWithStats,
} from '@/features/players/api-admin';
import { getTeamsPrisma } from '@/features/teams/api-prisma';
import { useGoalQuery } from '@/hooks/useGoalQuery';

export const dynamic = 'force-dynamic';

export default function PlayersAdminPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerWithStats | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 검색 및 필터 상태
  const [searchInput, setSearchInput] = useState(''); // 입력 필드 값
  const [searchName, setSearchName] = useState(''); // 실제 검색어 (API 전달)
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');

  // 팀 목록 조회
  const { data: teams = [] } = useGoalQuery(getTeamsPrisma, []);

  // 선수 목록 조회
  const {
    data: playersResponse,
    isLoading,
    refetch,
  } = useAllPlayers({
    page: currentPage,
    limit: itemsPerPage,
    order: 'apps',
    name: searchName || undefined,
    team_id: selectedTeamId ? parseInt(selectedTeamId) : undefined,
    position: selectedPosition || undefined,
  });

  const players = Array.isArray(playersResponse)
    ? playersResponse
    : playersResponse?.items || [];

  // 페이지네이션 정보
  const totalCount = Array.isArray(playersResponse)
    ? playersResponse.length
    : playersResponse?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // 포지션 목록 (실제 데이터에서 추출하거나 고정값 사용)
  const positions = ['GK', 'DF', 'MF', 'FW'];

  // Mutations
  const createPlayerMutation = useCreatePlayerMutation();
  const updatePlayerMutation = useUpdatePlayerMutation();
  const deletePlayerMutation = useDeletePlayerMutation();

  const handleCreatePlayer = async (values: PlayerFormValues) => {
    try {
      const apiData = convertFormToApiData(values);
      await createPlayerMutation.mutateAsync(apiData);
      setShowCreateForm(false);
      setCurrentPage(1); // 새 선수 추가 후 첫 페이지로 이동
      refetch();
      alert('선수가 성공적으로 생성되었습니다.');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '선수 생성 중 오류가 발생했습니다.';
      alert(errorMessage);
    }
  };

  const handleUpdatePlayer = async (values: PlayerFormValues) => {
    if (!editingPlayer) return;

    try {
      const apiData = convertFormToApiData(values);
      await updatePlayerMutation.mutateAsync({
        playerId: editingPlayer.player_id,
        data: apiData,
      });
      setEditingPlayer(null);
      refetch();
      alert('선수 정보가 성공적으로 수정되었습니다.');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '선수 수정 중 오류가 발생했습니다.';
      alert(errorMessage);
    }
  };

  const handleDeletePlayer = async (player: PlayerWithStats) => {
    const confirmMessage = `"${player.name}" 선수를 삭제하시겠습니까?\n\n경기 기록이 있는 선수는 삭제할 수 없습니다.`;

    if (!confirm(confirmMessage)) return;

    try {
      await deletePlayerMutation.mutateAsync(player.player_id);
      refetch();
      alert('선수가 성공적으로 삭제되었습니다.');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '선수 삭제 중 오류가 발생했습니다.';
      alert(errorMessage);
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 검색/필터 핸들러
  const handleSearchSubmit = () => {
    setSearchName(searchInput.trim());
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleTeamFilter = (teamId: string) => {
    setSelectedTeamId(teamId === 'all' ? '' : teamId);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  const handlePositionFilter = (position: string) => {
    setSelectedPosition(position === 'all' ? '' : position);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchName('');
    setSelectedTeamId('');
    setSelectedPosition('');
    setCurrentPage(1);
  };

  // 로딩 상태에서도 검색/필터는 유지

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <H1>선수 관리</H1>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            선수 추가
          </Button>
        </div>

        {/* 검색 및 필터 */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 이름 검색 */}
              <div className="flex-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="선수명으로 검색..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    onClick={handleSearchSubmit}
                    size="sm"
                    className="px-4"
                    disabled={
                      !searchInput.trim() || searchInput.trim() === searchName
                    }
                  >
                    검색
                  </Button>
                </div>
              </div>

              {/* 팀 필터 */}
              <div className="w-full sm:w-48">
                <Select
                  value={selectedTeamId || 'all'}
                  onValueChange={handleTeamFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="팀 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 팀</SelectItem>
                    {teams.map((team) => (
                      <SelectItem
                        key={team.team_id}
                        value={team.team_id.toString()}
                      >
                        {team.team_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 포지션 필터 */}
              <div className="w-full sm:w-32">
                <Select
                  value={selectedPosition || 'all'}
                  onValueChange={handlePositionFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="포지션" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 필터 초기화 버튼 */}
              {(searchName ||
                (selectedTeamId && selectedTeamId !== 'all') ||
                (selectedPosition && selectedPosition !== 'all')) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  초기화
                </Button>
              )}
            </div>

            {/* 활성 필터 표시 */}
            {(searchName ||
              (selectedTeamId && selectedTeamId !== 'all') ||
              (selectedPosition && selectedPosition !== 'all')) && (
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="text-gray-500">활성 필터:</span>
                {searchName && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    이름: {searchName}
                  </span>
                )}
                {selectedTeamId && selectedTeamId !== 'all' && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    팀:{' '}
                    {
                      teams.find((t) => t.team_id.toString() === selectedTeamId)
                        ?.team_name
                    }
                  </span>
                )}
                {selectedPosition && selectedPosition !== 'all' && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    포지션: {selectedPosition}
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              {isLoading ? (
                <>
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold">
                    선수 목록 (총 {totalCount}명)
                  </h2>
                  <div className="text-sm text-gray-500">
                    페이지 {currentPage} / {totalPages}
                  </div>
                </>
              )}
            </div>

            {isLoading ? (
              // 로딩 중 테이블 스켈레톤
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">선수명</th>
                      <th className="text-left py-2 px-4">등번호</th>
                      <th className="text-left py-2 px-4">생년월일</th>
                      <th className="text-left py-2 px-4">국적</th>
                      <th className="text-left py-2 px-4">신장</th>
                      <th className="text-left py-2 px-4">현재 팀</th>
                      <th className="text-left py-2 px-4">포지션</th>
                      <th className="text-left py-2 px-4">출전/골/도움</th>
                      <th className="text-right py-2 px-4">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: itemsPerPage }).map((_, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-4">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchName ||
                (selectedTeamId && selectedTeamId !== 'all') ||
                (selectedPosition && selectedPosition !== 'all')
                  ? '검색 조건에 맞는 선수가 없습니다.'
                  : '등록된 선수가 없습니다.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">선수명</th>
                      <th className="text-left py-2 px-4">등번호</th>
                      <th className="text-left py-2 px-4">생년월일</th>
                      <th className="text-left py-2 px-4">국적</th>
                      <th className="text-left py-2 px-4">신장</th>
                      <th className="text-left py-2 px-4">현재 팀</th>
                      <th className="text-left py-2 px-4">포지션</th>
                      <th className="text-left py-2 px-4">출전/골/도움</th>
                      <th className="text-right py-2 px-4">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) => (
                      <tr
                        key={player.player_id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-2 px-4 font-medium">{player.name}</td>
                        <td className="py-2 px-4">
                          {player.jersey_number ?? '-'}
                        </td>
                        <td className="py-2 px-4">
                          {player.birth_date
                            ? format(new Date(player.birth_date), 'yyyy-MM-dd')
                            : '-'}
                        </td>
                        <td className="py-2 px-4">
                          {player.nationality || '-'}
                        </td>
                        <td className="py-2 px-4">
                          {player.height_cm ? `${player.height_cm}cm` : '-'}
                        </td>
                        <td className="py-2 px-4">
                          {player.team?.team_name || '-'}
                        </td>
                        <td className="py-2 px-4">{player.position || '-'}</td>
                        <td className="py-2 px-4">
                          <span className="text-xs">
                            {player.totals.appearances}/{player.totals.goals}/
                            {player.totals.assists}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingPlayer(player)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeletePlayer(player)}
                              disabled={player.totals.appearances > 0}
                              title={
                                player.totals.appearances > 0
                                  ? `출전 기록이 ${player.totals.appearances}경기 있어 삭제할 수 없습니다`
                                  : '선수 삭제'
                              }
                            >
                              <Trash2
                                className={`h-4 w-4 ${player.totals.appearances > 0 ? 'text-gray-400' : 'text-red-500'}`}
                              />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 페이지네이션 */}
            {isLoading ? (
              // 로딩 중 페이지네이션 스켈레톤
              <div className="flex items-center justify-between pt-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-8 w-8 bg-gray-200 rounded animate-pulse"
                      ></div>
                    ))}
                  </div>
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ) : totalPages > 1 ? (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-500">
                  {currentPage * itemsPerPage - itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, totalCount)} /{' '}
                  {totalCount}명
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    이전
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // 현재 페이지 주변 2페이지씩만 표시
                        return Math.abs(page - currentPage) <= 2;
                      })
                      .map((page) => (
                        <Button
                          key={page}
                          variant={page === currentPage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    다음
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        {/* 선수 생성 다이얼로그 */}
        <CreatePlayerForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSubmit={handleCreatePlayer}
          isLoading={createPlayerMutation.isPending}
        />

        {/* 선수 수정 다이얼로그 */}
        {editingPlayer && (
          <EditPlayerForm
            open={!!editingPlayer}
            onOpenChange={(open) => !open && setEditingPlayer(null)}
            player={editingPlayer}
            onSubmit={handleUpdatePlayer}
            isLoading={updatePlayerMutation.isPending}
          />
        )}
      </div>
    </Container>
  );
}

interface CreatePlayerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PlayerFormValues) => void;
  isLoading: boolean;
}

function CreatePlayerForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: CreatePlayerFormProps) {
  const form = useGoalForm<PlayerFormValues, typeof playerFormSchema>({
    zodSchema: playerFormSchema,
    defaultValues: {
      name: '',
      birth_date: '',
      nationality: '',
      height_cm: '',
      profile_image_url: '',
      jersey_number: '',
    } as unknown as PlayerFormValues,
  });

  const handleSubmit = async (values: PlayerFormValues) => {
    try {
      await onSubmit(values);
      form.reset();
    } catch {
      // Error is handled in parent component
    }
  };

  if (isLoading) {
    return (
      <PlayerFormSkeleton
        open={open}
        onOpenChange={onOpenChange}
        title="새 선수 추가"
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />새 선수 추가
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>선수명 *</FormLabel>
                  <FormControl>
                    <Input placeholder="선수명을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birth_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>생년월일</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>국적</FormLabel>
                  <FormControl>
                    <Input placeholder="국적을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="height_cm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>신장 (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="180" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jersey_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>등번호</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="profile_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프로필 이미지 URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '생성 중...' : '생성'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface EditPlayerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: PlayerWithStats;
  onSubmit: (values: PlayerFormValues) => void;
  isLoading: boolean;
}

function EditPlayerForm({
  open,
  onOpenChange,
  player,
  onSubmit,
  isLoading,
}: EditPlayerFormProps) {
  const form = useGoalForm<PlayerFormValues, typeof playerFormSchema>({
    zodSchema: playerFormSchema,
    defaultValues: {
      name: player.name,
      birth_date: player.birth_date
        ? format(new Date(player.birth_date), 'yyyy-MM-dd')
        : '',
      nationality: player.nationality || '',
      height_cm: player.height_cm ? player.height_cm.toString() : '',
      profile_image_url: player.profile_image_url || '',
      jersey_number: player.jersey_number
        ? player.jersey_number.toString()
        : '',
    } as unknown as PlayerFormValues,
  });

  const handleSubmit = async (values: PlayerFormValues) => {
    try {
      await onSubmit(values);
    } catch {
      // Error is handled in parent component
    }
  };

  if (isLoading) {
    return (
      <PlayerFormSkeleton
        open={open}
        onOpenChange={onOpenChange}
        title="선수 정보 수정"
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            선수 정보 수정
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>선수명 *</FormLabel>
                  <FormControl>
                    <Input placeholder="선수명을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birth_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>생년월일</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>국적</FormLabel>
                  <FormControl>
                    <Input placeholder="국적을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="height_cm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>신장 (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="180" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jersey_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>등번호</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="profile_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프로필 이미지 URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '수정 중...' : '수정'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
