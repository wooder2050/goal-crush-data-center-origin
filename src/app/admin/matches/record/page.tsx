'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { H1, H2 } from '@/components/ui/typography';
import { MatchWithRelations } from '@/features/admin/api';
import { useAllMatches } from '@/features/admin/hooks/useMatchesQuery';

export const dynamic = 'force-dynamic';

// 페이지네이션 타입
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// 페이지네이션 컴포넌트
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  // 페이지 번호 배열 생성 (최대 5개)
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  return (
    <div className="flex justify-center items-center space-x-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
      >
        &lt;&lt;
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &lt;
      </Button>

      {getPageNumbers().map((pageNumber) => (
        <Button
          key={pageNumber}
          variant={pageNumber === currentPage ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPageChange(pageNumber)}
          className={pageNumber === currentPage ? 'bg-primary' : ''}
        >
          {pageNumber}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        &gt;
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        &gt;&gt;
      </Button>
    </div>
  );
}

export default function RecordMatchPage() {
  const router = useRouter();

  // useGoalQuery 훅으로 경기 목록 조회
  const {
    data: matches = [] as MatchWithRelations[],
    isLoading,
    error: queryError,
  } = useAllMatches();

  const error = queryError ? '경기 목록을 불러오는데 실패했습니다.' : null;

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const matchesArray = Array.isArray(matches) ? matches : [];
  const totalMatches = matchesArray.length;
  const matchesPerPage = 10;
  const totalPages = Math.ceil(totalMatches / matchesPerPage);

  // 현재 페이지에 표시할 경기 목록 계산
  const startIndex = (currentPage - 1) * matchesPerPage;
  const endIndex = startIndex + matchesPerPage;
  const currentMatches = matchesArray.slice(startIndex, endIndex);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMatchSelect = (match: MatchWithRelations) => {
    // 경기 결과 기록 페이지로 이동
    router.push(`/admin/matches/record/${match.match_id}`);
  };

  // 스켈레톤 로더
  const MatchesTableSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-4 py-2">
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Container className="py-8">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <H1>경기 결과 기록</H1>
          <Link href="/admin/matches">
            <Button variant="outline">경기 관리로 돌아가기</Button>
          </Link>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <H2 className="mb-4">기록할 경기 선택</H2>

            {isLoading ? (
              <MatchesTableSkeleton />
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-md">
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="mt-2"
                >
                  다시 시도
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">날짜</th>
                        <th className="text-left py-2 px-4">홈팀</th>
                        <th className="text-left py-2 px-4">원정팀</th>
                        <th className="text-left py-2 px-4">상태</th>
                        <th className="text-left py-2 px-4">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentMatches.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center">
                            기록할 경기가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        currentMatches.map((match: MatchWithRelations) => (
                          <tr
                            key={match.match_id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-2 px-4">
                              {new Date(match.match_date).toLocaleString(
                                'ko-KR',
                                {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </td>
                            <td className="py-2 px-4">
                              {match.home_team.team_name}
                            </td>
                            <td className="py-2 px-4">
                              {match.away_team.team_name}
                            </td>
                            <td className="py-2 px-4">
                              {match.status === 'scheduled' ? (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                  예정됨
                                </span>
                              ) : match.status === 'completed' ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                  완료됨 ({match.home_score} -{' '}
                                  {match.away_score})
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  진행중
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleMatchSelect(match)}
                                >
                                  {match.status === 'completed'
                                    ? '결과 수정'
                                    : '결과 기록'}
                                </Button>
                                {match.status === 'completed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      router.push(
                                        `/admin/matches/record/${match.match_id}/detailed-stats`
                                      )
                                    }
                                  >
                                    상세 통계
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </Container>
  );
}
