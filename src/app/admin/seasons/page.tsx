'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  seasonFormSchema,
  SeasonFormValues,
} from '@/common/form/fields/season';
import { useGoalForm } from '@/common/form/useGoalForm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
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
import { useDeleteSeasonMutation } from '@/features/admin/hooks/useSeasonMutation';
import { getSeasonsPaginatedPrisma } from '@/features/seasons/api-prisma';
import { useGoalQuery } from '@/hooks/useGoalQuery';

export const dynamic = 'force-dynamic';

// 카테고리 라벨 매핑 함수
function getCategoryLabel(category: string): string {
  const categoryLabels = {
    SUPER_LEAGUE: '슈퍼리그',
    CHALLENGE_LEAGUE: '챌린지리그',
    G_LEAGUE: 'G리그',
    PLAYOFF: '플레이오프',
    SBS_CUP: 'SBS컵',
    GIFA_CUP: 'GIFA컵',
    CHAMPION_MATCH: '챔피언 경기',
    OTHER: '기타',
  };
  return categoryLabels[category as keyof typeof categoryLabels] || category;
}

export default function AdminSeasonsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSeason, setEditingSeason] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  // 페이지네이션된 시즌 데이터 가져오기
  const {
    data: seasonsResponse,
    isLoading,
    refetch,
  } = useGoalQuery(
    () => getSeasonsPaginatedPrisma({ page: currentPage, limit: itemsPerPage }),
    []
  );
  const seasons = seasonsResponse?.items || [];
  const totalCount = seasonsResponse?.totalCount || 0;
  const totalPages = seasonsResponse?.totalPages || 0;

  const deleteSeasonMutation = useDeleteSeasonMutation();

  // 페이지 변경 시 데이터 새로고침
  useEffect(() => {
    refetch();
  }, [currentPage, refetch]);

  // 페이지네이션 핸들러
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

  // 시즌 삭제 처리
  const handleDeleteSeason = async (seasonId: number) => {
    const season = seasons.find((s) => s.season_id === seasonId);
    if (!season) return;

    // 추가 안전 확인
    const confirmMessage = `정말로 "${season.season_name}" 시즌을 삭제하시겠습니까?\n\n⚠️ 주의사항:\n• 이 작업은 되돌릴 수 없습니다\n• 시즌과 관련된 모든 데이터가 영구적으로 삭제됩니다`;

    if (confirm(confirmMessage)) {
      try {
        await deleteSeasonMutation.mutateAsync(seasonId);
        alert('시즌이 성공적으로 삭제되었습니다.');
        // 페이지 새로고침으로 목록 업데이트
        window.location.reload();
      } catch (error: unknown) {
        // 더 자세한 오류 메시지 표시
        const errorMessage =
          error instanceof Error
            ? error.message
            : '시즌 삭제 중 오류가 발생했습니다.';
        alert(`삭제 실패: ${errorMessage}`);
      }
    }
  };

  return (
    <Container className="py-8">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <H1>시즌 관리</H1>
          <div className="space-x-4">
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              variant={showCreateForm ? 'outline' : 'default'}
            >
              {showCreateForm ? '취소' : '새 시즌 추가'}
            </Button>
            <Link href="/admin/matches">
              <Button variant="outline">경기 관리로 돌아가기</Button>
            </Link>
          </div>
        </div>

        {/* 새 시즌 추가 폼 */}
        {showCreateForm && (
          <CreateSeasonForm
            onSuccess={() => {
              setShowCreateForm(false);
              setCurrentPage(1); // 새 시즌 추가 후 첫 페이지로 이동
              queryClient.invalidateQueries({ queryKey: ['seasons'] }); // 시즌 목록 캐시 무효화
            }}
          />
        )}

        {/* 시즌 수정 폼 */}
        {editingSeason && (
          <EditSeasonForm
            seasonId={editingSeason}
            onSuccess={() => {
              setEditingSeason(null);
              queryClient.invalidateQueries({ queryKey: ['seasons'] }); // 시즌 목록 캐시 무효화
            }}
            onCancel={() => setEditingSeason(null)}
          />
        )}

        {/* 시즌 목록 */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            {isLoading ? (
              <>
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold">
                  시즌 목록 (총 {totalCount}개)
                </h2>
                <div className="text-sm text-gray-500">
                  페이지 {currentPage} / {totalPages}
                </div>
              </>
            )}
          </div>
          {isLoading ? (
            // 로딩 중 시즌 목록 스켈레톤
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : seasons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 시즌이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {seasons.map((season) => (
                <div
                  key={season.season_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{season.season_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {season.year}년
                      {season.category &&
                        ` • ${getCategoryLabel(season.category)}`}
                      {season.start_date &&
                        ` • ${new Date(season.start_date).toLocaleDateString()}`}
                      {season.end_date &&
                        ` - ${new Date(season.end_date).toLocaleDateString()}`}
                    </p>
                    {(season.match_count ?? 0) > 0 && (
                      <p className="text-xs text-blue-600">
                        경기 수: {season.match_count ?? 0}경기
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSeason(season.season_id)}
                    >
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`${
                        (season.match_count ?? 0) > 0
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      disabled={(season.match_count ?? 0) > 0}
                      onClick={() => handleDeleteSeason(season.season_id)}
                      title={
                        (season.match_count ?? 0) > 0
                          ? `경기가 ${season.match_count ?? 0}경기 있어 삭제할 수 없습니다`
                          : '시즌 삭제'
                      }
                    >
                      {(season.match_count ?? 0) > 0 ? '삭제 불가' : '삭제'}
                    </Button>
                  </div>
                </div>
              ))}
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
        </Card>
      </div>
    </Container>
  );
}

// 시즌 수정 폼 컴포넌트
function EditSeasonForm({
  seasonId,
  onSuccess,
  onCancel,
}: {
  seasonId: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const form = useGoalForm<SeasonFormValues, typeof seasonFormSchema>({
    zodSchema: seasonFormSchema,
    defaultValues: {
      season_name: '',
      year: '',
      start_date: '',
      end_date: '',
    } as unknown as SeasonFormValues,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 시즌 데이터 로드
  const { data: season } = useGoalQuery(
    () => fetch(`/api/seasons/${seasonId}`).then((res) => res.json()),
    []
  );

  // 시즌 데이터가 로드되면 폼에 설정
  useEffect(() => {
    if (season) {
      form.reset({
        season_name: season.season_name || '',
        year: season.year?.toString() || '',
        category: season.category || undefined,
        start_date: season.start_date
          ? new Date(season.start_date).toISOString().split('T')[0]
          : '',
        end_date: season.end_date
          ? new Date(season.end_date).toISOString().split('T')[0]
          : '',
      } as unknown as SeasonFormValues);
    }
  }, [season, form]);

  const handleSubmit = async (values: SeasonFormValues) => {
    setIsSubmitting(true);

    // 추가 유효성 검사
    const yearNum = parseInt(values.year);
    if (yearNum < 2020 || yearNum > 2030) {
      alert('연도는 2020년에서 2030년 사이여야 합니다.');
      setIsSubmitting(false);
      return;
    }

    if (values.start_date && values.end_date) {
      const start = new Date(values.start_date);
      const end = new Date(values.end_date);
      if (start >= end) {
        alert('시작일은 종료일보다 이전이어야 합니다.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/seasons/${seasonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          season_name: values.season_name.trim(),
          year: yearNum,
          category: values.category || null,
          start_date: values.start_date || null,
          end_date: values.end_date || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || '시즌이 성공적으로 수정되었습니다.');
        onSuccess();
      } else {
        const error = await response.json();
        alert(`시즌 수정 실패: ${error.error}`);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '시즌 수정 중 오류가 발생했습니다.';
      alert(`수정 실패: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!season) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <div className="h-10 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">시즌 수정</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="season_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>시즌명 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 골때리는 그녀들 시즌 8 G리그"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>연도 *</FormLabel>
                  <FormControl>
                    <Input type="number" min="2020" max="2030" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>카테고리</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SUPER_LEAGUE">슈퍼리그</SelectItem>
                      <SelectItem value="CHALLENGE_LEAGUE">
                        챌린지리그
                      </SelectItem>
                      <SelectItem value="G_LEAGUE">G리그</SelectItem>
                      <SelectItem value="PLAYOFF">플레이오프</SelectItem>
                      <SelectItem value="SBS_CUP">SBS컵</SelectItem>
                      <SelectItem value="GIFA_CUP">GIFA컵</SelectItem>
                      <SelectItem value="CHAMPION_MATCH">
                        챔피언 경기
                      </SelectItem>
                      <SelectItem value="OTHER">기타</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>시작일</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>종료일</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '수정 중...' : '시즌 수정'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}

// 시즌 생성 폼 컴포넌트
function CreateSeasonForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useGoalForm<SeasonFormValues, typeof seasonFormSchema>({
    zodSchema: seasonFormSchema,
    defaultValues: {
      season_name: '',
      year: new Date().getFullYear().toString(),
      category: undefined,
      start_date: '',
      end_date: '',
    } as unknown as SeasonFormValues,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: SeasonFormValues) => {
    setIsSubmitting(true);

    // 추가 유효성 검사
    const yearNum = parseInt(values.year);
    if (yearNum < 2020 || yearNum > 2030) {
      alert('연도는 2020년에서 2030년 사이여야 합니다.');
      setIsSubmitting(false);
      return;
    }

    if (values.start_date && values.end_date) {
      const start = new Date(values.start_date);
      const end = new Date(values.end_date);
      if (start >= end) {
        alert('시작일은 종료일보다 이전이어야 합니다.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/seasons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          season_name: values.season_name.trim(),
          year: yearNum,
          category: values.category || null,
          start_date: values.start_date || null,
          end_date: values.end_date || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || '시즌이 성공적으로 생성되었습니다.');
        form.reset();
        onSuccess();
      } else {
        const error = await response.json();
        alert(`시즌 생성 실패: ${error.error}`);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '시즌 생성 중 오류가 발생했습니다.';
      alert(`생성 실패: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">새 시즌 추가</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="season_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>시즌명 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 골때리는 그녀들 시즌 8 G리그"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>연도 *</FormLabel>
                  <FormControl>
                    <Input type="number" min="2020" max="2030" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>카테고리</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SUPER_LEAGUE">슈퍼리그</SelectItem>
                      <SelectItem value="CHALLENGE_LEAGUE">
                        챌린지리그
                      </SelectItem>
                      <SelectItem value="G_LEAGUE">G리그</SelectItem>
                      <SelectItem value="PLAYOFF">플레이오프</SelectItem>
                      <SelectItem value="SBS_CUP">SBS컵</SelectItem>
                      <SelectItem value="GIFA_CUP">GIFA컵</SelectItem>
                      <SelectItem value="CHAMPION_MATCH">
                        챔피언 경기
                      </SelectItem>
                      <SelectItem value="OTHER">기타</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>시작일</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>종료일</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onSuccess}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '생성 중...' : '시즌 생성'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
