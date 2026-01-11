'use client';

import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';

import { TeamFormValues } from '@/common/form/fields/team';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Input } from '@/components/ui/input';
import { H1 } from '@/components/ui/typography';
import {
  CreateTeamData,
  UpdateTeamData,
  useCreateTeamMutation,
  useUpdateTeamMutation,
} from '@/features/admin/hooks/useTeamMutation';
import { getTeamsPrisma } from '@/features/teams/api-prisma';
import { useGoalQuery } from '@/hooks/useGoalQuery';

import { CreateTeamForm } from './CreateTeamForm';
import { EditTeamForm, TeamType } from './EditTeamForm';

export function TeamsManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 검색 및 필터 상태
  const [searchInput, setSearchInput] = useState('');
  const [searchName, setSearchName] = useState('');

  // 팀 목록 조회
  const { data: teams = [], isLoading } = useGoalQuery(getTeamsPrisma, []);

  // Mutations
  const createTeamMutation = useCreateTeamMutation();
  const updateTeamMutation = useUpdateTeamMutation();

  // 필터링된 팀 목록
  const filteredTeams = teams.filter((team) => {
    if (searchName) {
      return team.team_name.toLowerCase().includes(searchName.toLowerCase());
    }
    return true;
  });

  // 페이지네이션 계산
  const totalCount = filteredTeams.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeams = filteredTeams.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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

  // 검색 핸들러
  const handleSearchSubmit = () => {
    setSearchName(searchInput.trim());
    setCurrentPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchName('');
    setCurrentPage(1);
  };

  const handleCreateTeam = async (values: TeamFormValues) => {
    try {
      const apiData: CreateTeamData = {
        team_name: values.team_name,
        founded_year: values.founded_year,
        description: values.description || undefined,
        primary_color: values.primary_color || undefined,
        secondary_color: values.secondary_color || undefined,
        logo: values.logo || undefined,
      };

      await createTeamMutation.mutateAsync(apiData);
      setShowCreateForm(false);
      setCurrentPage(1);
      alert('팀이 성공적으로 생성되었습니다.');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '팀 생성 중 오류가 발생했습니다.';
      alert(errorMessage);
    }
  };

  const handleUpdateTeam = async (values: TeamFormValues) => {
    if (!editingTeam) return;

    try {
      const apiData: UpdateTeamData = {
        team_name: values.team_name,
        founded_year: values.founded_year,
        description: values.description || undefined,
        primary_color: values.primary_color || undefined,
        secondary_color: values.secondary_color || undefined,
        logo: values.logo || undefined,
      };

      await updateTeamMutation.mutateAsync({
        teamId: editingTeam.team_id,
        data: apiData,
      });
      setEditingTeam(null);
      alert('팀 정보가 성공적으로 수정되었습니다.');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '팀 수정 중 오류가 발생했습니다.';
      alert(errorMessage);
    }
  };

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <H1>팀 관리</H1>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />팀 추가
          </Button>
        </div>

        {/* 검색 및 필터 */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 팀명 검색 */}
              <div className="flex-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="팀명으로 검색..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
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

              {/* 필터 초기화 버튼 */}
              {searchName && (
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
            {searchName && (
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="text-gray-500">활성 필터:</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  팀명: {searchName}
                </span>
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
                    팀 목록 (총 {totalCount}개)
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
                      <th className="text-left py-2 px-4">팀명</th>
                      <th className="text-left py-2 px-4">창단년도</th>
                      <th className="text-left py-2 px-4">로고</th>
                      <th className="text-left py-2 px-4">컬러</th>
                      <th className="text-left py-2 px-4">생성일</th>
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
                          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : paginatedTeams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchName
                  ? '검색 조건에 맞는 팀이 없습니다.'
                  : '등록된 팀이 없습니다.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">팀명</th>
                      <th className="text-left py-2 px-4">창단년도</th>
                      <th className="text-left py-2 px-4">로고</th>
                      <th className="text-left py-2 px-4">컬러</th>
                      <th className="text-left py-2 px-4">생성일</th>
                      <th className="text-right py-2 px-4">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTeams.map((team) => (
                      <tr
                        key={team.team_id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-2 px-4 font-medium">
                          {team.team_name}
                        </td>
                        <td className="py-2 px-4">
                          {team.founded_year || '-'}
                        </td>
                        <td className="py-2 px-4">
                          {team.logo ? (
                            <div className="h-8 w-8 relative rounded-full overflow-hidden bg-gray-100">
                              <Image
                                src={team.logo}
                                alt={`${team.team_name} 로고`}
                                fill
                                className="object-cover"
                                sizes="32px"
                              />
                            </div>
                          ) : (
                            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-2">
                            {team.primary_color && (
                              <div
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: team.primary_color }}
                                title={`Primary: ${team.primary_color}`}
                              />
                            )}
                            {team.secondary_color && (
                              <div
                                className="w-4 h-4 rounded border"
                                style={{
                                  backgroundColor: team.secondary_color,
                                }}
                                title={`Secondary: ${team.secondary_color}`}
                              />
                            )}
                            {!team.primary_color &&
                              !team.secondary_color &&
                              '-'}
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          {team.created_at
                            ? format(new Date(team.created_at), 'yyyy-MM-dd')
                            : '-'}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTeam(team)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
                  {startIndex + 1}-
                  {Math.min(startIndex + itemsPerPage, totalCount)} /{' '}
                  {totalCount}개
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

        {/* 팀 생성 다이얼로그 */}
        <CreateTeamForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSubmit={handleCreateTeam}
          isLoading={createTeamMutation.isPending}
        />

        {/* 팀 수정 다이얼로그 */}
        {editingTeam && (
          <EditTeamForm
            open={!!editingTeam}
            onOpenChange={(open) => !open && setEditingTeam(null)}
            team={editingTeam}
            onSubmit={handleUpdateTeam}
            isLoading={updateTeamMutation.isPending}
          />
        )}
      </div>
    </Container>
  );
}
