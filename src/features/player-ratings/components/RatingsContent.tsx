'use client';

import { MessageCircle, TrendingUp, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';

type AllRatingsData = {
  ratings: Array<{
    rating_id: number;
    overall_rating: number;
    comment?: string;
    created_at: string;
    helpful_count: number;
    total_reviews: number;
    // 주요 능력치들 추가
    finishing?: number;
    shot_power?: number;
    short_passing?: number;
    long_passing?: number;
    dribbling?: number;
    ball_control?: number;
    speed?: number;
    acceleration?: number;
    strength?: number;
    marking?: number;
    tackling?: number;
    player: {
      player_id: number;
      name: string;
      profile_image_url?: string;
    };
    user?: {
      korean_nickname?: string;
    };
    season?: {
      season_name: string;
    };
  }>;
  total_count: number;
  total_pages: number;
  current_page: number;
  per_page: number;
};

interface RatingsContentProps {
  data: AllRatingsData;
  currentPage: number;
  ratingsPerPage: number;
  sortBy: 'recent' | 'popular';
  handleSortChange: (sort: 'recent' | 'popular') => void;
  setCurrentPage: (page: number) => void;
}

export function RatingsContent({
  data,
  currentPage,
  ratingsPerPage,
  sortBy,
  handleSortChange,
  setCurrentPage,
}: RatingsContentProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            선수 평가 목록
            <span className="text-sm font-normal text-gray-500">
              (총 {data.total_count}개)
            </span>
          </CardTitle>

          {/* 정렬 옵션 */}
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('recent')}
              className="text-xs"
            >
              최신순
            </Button>
            <Button
              variant={sortBy === 'popular' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('popular')}
              className="text-xs"
            >
              인기순
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {data.ratings.length > 0 ? (
          <div className="space-y-6">
            {/* 현재 페이지 정보 */}
            <div className="flex items-center justify-between text-sm text-gray-600 px-1">
              <p>
                총 {data.total_count}개 평가 중{' '}
                {(currentPage - 1) * ratingsPerPage + 1}-
                {Math.min(currentPage * ratingsPerPage, data.total_count)}
                번째 표시
              </p>
              {data.total_pages > 1 && (
                <p className="text-xs">
                  {data.current_page} / {data.total_pages} 페이지
                </p>
              )}
            </div>

            {/* 평가 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.ratings.map((rating) => (
                <Card
                  key={rating.rating_id}
                  className="relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/players/${rating.player.player_id}/ratings`)
                  }
                >
                  <CardContent className="p-4">
                    {/* 선수 정보 */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* 선수 사진 - 선수 페이지로 이동 */}
                      <Link
                        href={`/players/${rating.player.player_id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {rating.player.profile_image_url ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={rating.player.profile_image_url}
                              alt={rating.player.name}
                              fill
                              sizes="40px"
                              className="object-cover object-top"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {rating.player.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </Link>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {rating.player.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {rating.season?.season_name || '전체 시즌'}
                        </p>
                      </div>

                      {/* 평점 박스 */}
                      <div className="flex-shrink-0 bg-primary/10 px-2 py-1 rounded">
                        <div className="text-lg font-bold text-primary leading-none">
                          {rating.overall_rating || 50}
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          /99
                        </div>
                      </div>
                    </div>

                    {/* 주요 능력치 표시 */}
                    <div className="mb-3">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {rating.finishing && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">피니싱</span>
                            <span className="font-medium">
                              {rating.finishing}
                            </span>
                          </div>
                        )}
                        {rating.short_passing && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">패스</span>
                            <span className="font-medium">
                              {rating.short_passing}
                            </span>
                          </div>
                        )}
                        {rating.dribbling && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">드리블</span>
                            <span className="font-medium">
                              {rating.dribbling}
                            </span>
                          </div>
                        )}
                        {rating.speed && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">스피드</span>
                            <span className="font-medium">{rating.speed}</span>
                          </div>
                        )}
                        {rating.strength && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">피지컬</span>
                            <span className="font-medium">
                              {rating.strength}
                            </span>
                          </div>
                        )}
                        {rating.marking && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">수비</span>
                            <span className="font-medium">
                              {rating.marking}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 코멘트 미리보기 */}
                    {rating.comment && (
                      <div className="p-2 bg-gray-50 rounded text-xs mb-3">
                        <p className="text-gray-700 line-clamp-2 italic">
                          &ldquo;{rating.comment}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* 하단 정보 */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>{rating.helpful_count || 0} 도움</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{rating.total_reviews || 0} 댓글</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-20">
                          {rating.user?.korean_nickname || '익명'}
                        </span>
                        <span>·</span>
                        <span>
                          {new Date(rating.created_at).toLocaleDateString(
                            'ko-KR',
                            { month: 'short', day: 'numeric' }
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 페이지네이션 */}
            {data.total_pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="text-xs"
                >
                  처음
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="text-xs"
                >
                  이전
                </Button>

                {/* 페이지 번호들 */}
                <div className="flex gap-1">
                  {(() => {
                    const maxPageButtons = 5;
                    const startPage = Math.max(
                      1,
                      currentPage - Math.floor(maxPageButtons / 2)
                    );
                    const endPage = Math.min(
                      data.total_pages,
                      startPage + maxPageButtons - 1
                    );
                    const adjustedStartPage = Math.max(
                      1,
                      endPage - maxPageButtons + 1
                    );

                    return Array.from(
                      { length: endPage - adjustedStartPage + 1 },
                      (_, i) => adjustedStartPage + i
                    ).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0 text-xs"
                      >
                        {page}
                      </Button>
                    ));
                  })()}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === data.total_pages}
                  className="text-xs"
                >
                  다음
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(data.total_pages)}
                  disabled={currentPage === data.total_pages}
                  className="text-xs"
                >
                  마지막
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">평가가 없습니다</h3>
            <p className="text-gray-600 mb-6">
              아직 선수 평가가 작성되지 않았습니다.
              <br />첫 번째 평가를 작성해보세요!
            </p>
            <Link href="/players">
              <Button className="gap-2">
                <Users className="w-4 h-4" />
                선수 목록 보기
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
