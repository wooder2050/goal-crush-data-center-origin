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

import { CoachManagementFormValues } from '@/common/form/fields/coach-management';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Input } from '@/components/ui/input';
import { H1 } from '@/components/ui/typography';
import {
  CreateCoachData,
  UpdateCoachData,
  useCreateCoachManagementMutation,
  useUpdateCoachManagementMutation,
} from '@/features/admin/hooks/useCoachManagementMutation';
import { getCoachesForAdmin } from '@/features/coaches/api-admin';
import { useGoalQuery } from '@/hooks/useGoalQuery';

import { CreateCoachForm } from './CreateCoachForm';
import { CoachType, EditCoachForm } from './EditCoachForm';

export function CoachesManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCoach, setEditingCoach] = useState<CoachType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 검색 및 필터 상태
  const [searchInput, setSearchInput] = useState('');
  const [searchName, setSearchName] = useState('');

  // 감독 목록 조회
  const { data: coaches = [], isLoading } = useGoalQuery(
    getCoachesForAdmin,
    []
  );

  // Mutations
  const createCoachMutation = useCreateCoachManagementMutation();
  const updateCoachMutation = useUpdateCoachManagementMutation();

  // 필터링된 감독 목록
  const filteredCoaches = coaches.filter((coach) => {
    if (searchName) {
      return coach.name.toLowerCase().includes(searchName.toLowerCase());
    }
    return true;
  });

  // 페이지네이션 계산
  const totalCount = filteredCoaches.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCoaches = filteredCoaches.slice(
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

  const handleCreateCoach = async (values: CoachManagementFormValues) => {
    try {
      const apiData: CreateCoachData = {
        name: values.name,
        birth_date: values.birth_date || undefined,
        nationality: values.nationality || undefined,
        profile_image_url: values.profile_image_url || undefined,
      };

      await createCoachMutation.mutateAsync(apiData);
      setShowCreateForm(false);
      setCurrentPage(1);
      alert('감독이 성공적으로 생성되었습니다.');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '감독 생성 중 오류가 발생했습니다.';
      alert(errorMessage);
    }
  };

  const handleUpdateCoach = async (values: CoachManagementFormValues) => {
    if (!editingCoach) return;

    try {
      const apiData: UpdateCoachData = {
        name: values.name,
        birth_date: values.birth_date || undefined,
        nationality: values.nationality || undefined,
        profile_image_url: values.profile_image_url || undefined,
      };

      await updateCoachMutation.mutateAsync({
        coachId: editingCoach.coach_id,
        data: apiData,
      });
      setEditingCoach(null);
      alert('감독 정보가 성공적으로 수정되었습니다.');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '감독 수정 중 오류가 발생했습니다.';
      alert(errorMessage);
    }
  };

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <H1>감독 관리</H1>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            감독 추가
          </Button>
        </div>

        {/* 검색 및 필터 */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 감독명 검색 */}
              <div className="flex-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="감독명으로 검색..."
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
                  감독명: {searchName}
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
                    감독 목록 (총 {totalCount}명)
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
                      <th className="text-left py-2 px-4">프로필</th>
                      <th className="text-left py-2 px-4">감독명</th>
                      <th className="text-left py-2 px-4">생년월일</th>
                      <th className="text-left py-2 px-4">국적</th>
                      <th className="text-left py-2 px-4">현재 팀</th>
                      <th className="text-left py-2 px-4">총 경기수</th>
                      <th className="text-right py-2 px-4">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: itemsPerPage }).map((_, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-4">
                          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
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
                        <td className="py-2 px-4 text-right">
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : paginatedCoaches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchName
                  ? '검색 조건에 맞는 감독이 없습니다.'
                  : '등록된 감독이 없습니다.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">프로필</th>
                      <th className="text-left py-2 px-4">감독명</th>
                      <th className="text-left py-2 px-4">생년월일</th>
                      <th className="text-left py-2 px-4">국적</th>
                      <th className="text-left py-2 px-4">현재 팀</th>
                      <th className="text-left py-2 px-4">총 경기수</th>
                      <th className="text-right py-2 px-4">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCoaches.map((coach) => (
                      <tr
                        key={coach.coach_id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-2 px-4">
                          {coach.profile_image_url ? (
                            <div className="h-8 w-8 relative rounded-full overflow-hidden bg-gray-100">
                              <Image
                                src={coach.profile_image_url}
                                alt={`${coach.name} 프로필`}
                                fill
                                className="object-cover object-top"
                                sizes="32px"
                              />
                            </div>
                          ) : (
                            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-4 font-medium">{coach.name}</td>
                        <td className="py-2 px-4">
                          {coach.birth_date
                            ? format(new Date(coach.birth_date), 'yyyy-MM-dd')
                            : '-'}
                        </td>
                        <td className="py-2 px-4">
                          {coach.nationality || '-'}
                        </td>
                        <td className="py-2 px-4">
                          {coach.current_team ? (
                            <div className="flex items-center gap-2">
                              {coach.current_team.logo && (
                                <div className="h-4 w-4 relative rounded-full overflow-hidden">
                                  <Image
                                    src={coach.current_team.logo}
                                    alt={`${coach.current_team.team_name} 로고`}
                                    fill
                                    className="object-cover object-center"
                                    sizes="16px"
                                  />
                                </div>
                              )}
                              <span className="text-xs">
                                {coach.current_team.team_name}
                              </span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <span className="text-xs">
                            {coach.total_matches || 0}경기
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingCoach(coach)}
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
            {totalPages > 1 && !isLoading && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-500">
                  {startIndex + 1}-
                  {Math.min(startIndex + itemsPerPage, totalCount)} /{' '}
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
            )}
          </div>
        </Card>

        {/* 감독 생성 다이얼로그 */}
        <CreateCoachForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSubmit={handleCreateCoach}
          isLoading={createCoachMutation.isPending}
        />

        {/* 감독 수정 다이얼로그 */}
        {editingCoach && (
          <EditCoachForm
            open={!!editingCoach}
            onOpenChange={(open) => !open && setEditingCoach(null)}
            coach={editingCoach}
            onSubmit={handleUpdateCoach}
            isLoading={updateCoachMutation.isPending}
          />
        )}
      </div>
    </Container>
  );
}
