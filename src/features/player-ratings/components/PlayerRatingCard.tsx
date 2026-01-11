'use client';

import { MessageCircle, ThumbsDown, ThumbsUp, User } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { Button, Card, CardContent, CardHeader } from '@/components/ui';
import type {
  PlayerAbilityRating,
  RatingReview,
} from '@/features/player-ratings/types';
import {
  ABILITY_CATEGORIES,
  ABILITY_METADATA,
} from '@/features/player-ratings/types';

interface PlayerRatingCardProps {
  rating: PlayerAbilityRating;
  onReview?: (
    ratingId: number,
    reviewType: 'helpful' | 'not_helpful' | 'comment',
    comment?: string
  ) => void;
  showReviews?: boolean;
  isReviewLoading?: boolean;
  showDetailedStats?: boolean; // 상세 능력치 표시 여부
}

export function PlayerRatingCard({
  rating,
  onReview,
  showReviews = true,
  isReviewLoading = false,
  showDetailedStats = false,
}: PlayerRatingCardProps) {
  const [showAllAbilities, setShowAllAbilities] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(
    ABILITY_CATEGORIES.ATTACK
  );

  // 능력치들을 카테고리별로 그룹화
  const abilityGroups = Object.entries(ABILITY_METADATA).reduce(
    (groups, [key, meta]) => {
      if (!groups[meta.category]) {
        groups[meta.category] = [];
      }

      const value = rating[key as keyof PlayerAbilityRating] as number;
      if (value && value > 0) {
        groups[meta.category].push({
          key: key as keyof PlayerAbilityRating,
          name: meta.name,
          value,
          color: getCategoryColor(meta.category),
        });
      }

      return groups;
    },
    {} as Record<
      string,
      Array<{
        key: keyof PlayerAbilityRating;
        name: string;
        value: number;
        color: string;
      }>
    >
  );

  // 주요 능력치만 표시 (높은 값 순으로 5개)
  const topAbilities = Object.values(abilityGroups)
    .flat()
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const handleReview = (reviewType: 'helpful' | 'not_helpful' | 'comment') => {
    if (!onReview) return;

    if (reviewType === 'comment') {
      if (!reviewComment.trim()) return;
      onReview(rating.rating_id, reviewType, reviewComment.trim());
      setReviewComment('');
      setShowReviewForm(false);
    } else {
      onReview(rating.rating_id, reviewType);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {rating.user?.profile_image_url ? (
              <Image
                src={rating.user.profile_image_url}
                alt={rating.user.korean_nickname}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
            )}

            <div>
              <h4 className="font-semibold">
                {rating.user?.korean_nickname || '익명'}
              </h4>
              <p className="text-sm text-gray-500">
                {new Date(rating.created_at).toLocaleDateString()}
                {rating.season && ` • ${rating.season.season_name}`}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {rating.overall_rating || 50}
              <span className="text-sm text-gray-500 font-normal">/99</span>
            </div>
            <p className="text-xs text-gray-500">전체 평점</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 주요 능력치 표시 */}
        <div>
          <h5 className="text-sm font-semibold mb-2 flex items-center justify-between">
            {showDetailedStats ? '상세 능력치' : '주요 능력치'}
            {Object.keys(abilityGroups).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllAbilities(!showAllAbilities)}
                className="text-xs"
              >
                {showAllAbilities ? '접기' : '전체보기'}
              </Button>
            )}
          </h5>

          {!showAllAbilities ? (
            // 주요 능력치만 표시 - 반응형 그리드
            <div>
              <p className="text-xs text-gray-600 mb-3">상위 능력치 (TOP 5)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {topAbilities.map((ability) => (
                  <div
                    key={ability.key}
                    className="p-2 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {ability.name}
                      </span>
                      <span
                        className="font-bold text-lg"
                        style={{ color: ability.color }}
                      >
                        {ability.value}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${(ability.value / 99) * 100}%`,
                          backgroundColor: ability.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // 전체 능력치 카테고리별 표시
            <div className="space-y-4">
              {/* 카테고리 탭 - 개선된 디자인 */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">카테고리 선택</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries({
                    [ABILITY_CATEGORIES.ATTACK]: {
                      name: '공격',
                      color: '#ef4444',
                    },
                    [ABILITY_CATEGORIES.PASSING]: {
                      name: '패스',
                      color: '#3b82f6',
                    },
                    [ABILITY_CATEGORIES.DRIBBLING]: {
                      name: '드리블',
                      color: '#10b981',
                    },
                    [ABILITY_CATEGORIES.DEFENDING]: {
                      name: '수비',
                      color: '#f59e0b',
                    },
                    [ABILITY_CATEGORIES.PHYSICAL]: {
                      name: '피지컬',
                      color: '#8b5cf6',
                    },
                    [ABILITY_CATEGORIES.MENTAL]: {
                      name: '멘탈',
                      color: '#06b6d4',
                    },
                    [ABILITY_CATEGORIES.GOALKEEPER]: {
                      name: '골키퍼',
                      color: '#ec4899',
                    },
                  }).map(([category, info]) => {
                    if (
                      !abilityGroups[category] ||
                      abilityGroups[category].length === 0
                    )
                      return null;

                    const isActive = activeCategory === category;
                    return (
                      <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-3 py-2 text-xs font-medium rounded-full border transition-all ${
                          isActive
                            ? 'text-white border-transparent shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                        style={isActive ? { backgroundColor: info.color } : {}}
                      >
                        {info.name} ({abilityGroups[category].length})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 선택된 카테고리의 능력치 - 카드형 레이아웃 */}
              <div>
                <h6 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: getCategoryColor(activeCategory),
                    }}
                  />
                  {
                    (
                      {
                        [ABILITY_CATEGORIES.ATTACK]: '공격',
                        [ABILITY_CATEGORIES.PASSING]: '패스',
                        [ABILITY_CATEGORIES.DRIBBLING]: '드리블',
                        [ABILITY_CATEGORIES.DEFENDING]: '수비',
                        [ABILITY_CATEGORIES.PHYSICAL]: '피지컬',
                        [ABILITY_CATEGORIES.MENTAL]: '멘탈',
                        [ABILITY_CATEGORIES.GOALKEEPER]: '골키퍼',
                      } as Record<string, string>
                    )[activeCategory]
                  }{' '}
                  상세 능력치
                </h6>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {abilityGroups[activeCategory]?.map((ability) => (
                    <div
                      key={ability.key}
                      className="p-2 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {ability.name}
                        </span>
                        <span
                          className="font-bold text-lg"
                          style={{ color: ability.color }}
                        >
                          {ability.value}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${(ability.value / 99) * 100}%`,
                            backgroundColor: ability.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 평가 코멘트 - 영화 리뷰 스타일 */}
        {rating.comment && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-primary">
            <p className="text-sm text-gray-800 leading-relaxed italic">
              &ldquo;{rating.comment}&rdquo;
            </p>
          </div>
        )}

        {/* 리뷰 액션 - 영화 리뷰 스타일 */}
        {onReview && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReview('helpful')}
                  disabled={isReviewLoading}
                  className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {rating.helpful_count || 0}
                  </span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReview('not_helpful')}
                  disabled={isReviewLoading}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2"
                >
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-xs text-gray-500">
                {rating.total_reviews || 0}개의 댓글
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <MessageCircle className="w-4 h-4" />
              댓글 {showReviewForm ? '접기' : '쓰기'}
            </Button>
          </div>
        )}

        {/* 댓글 작성 폼 - 영화 리뷰 스타일 */}
        {showReviewForm && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <h6 className="text-sm font-medium text-gray-700">댓글 작성</h6>
            <textarea
              placeholder="이 평가에 대한 의견을 남겨보세요... (영화 리뷰처럼 자유롭게 작성해주세요!)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {reviewComment.length}/500자
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewComment('');
                  }}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleReview('comment')}
                  disabled={
                    !reviewComment.trim() ||
                    isReviewLoading ||
                    reviewComment.length > 500
                  }
                  className="bg-primary hover:bg-primary/90"
                >
                  {isReviewLoading ? '작성 중...' : '댓글 게시'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 댓글들 표시 - 영화 리뷰 스타일 */}
        {showReviews && rating.reviews && rating.reviews.length > 0 && (
          <div className="border-t pt-4">
            <h6 className="text-sm font-medium mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              댓글 (
              {
                rating.reviews.filter(
                  (r) => r.review_type === 'comment' && r.comment
                ).length
              }
              )
            </h6>
            <div className="space-y-3">
              {rating.reviews
                .filter(
                  (review: RatingReview) =>
                    review.review_type === 'comment' && review.comment
                )
                .map((review: RatingReview) => (
                  <div
                    key={review.review_id}
                    className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {(review.user?.korean_nickname || '익명').charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-sm text-gray-900">
                        {review.user?.korean_nickname || '익명'}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString(
                          'ko-KR'
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed pl-8">
                      {review.comment}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 카테고리별 색상 반환
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    [ABILITY_CATEGORIES.ATTACK]: '#ef4444',
    [ABILITY_CATEGORIES.PASSING]: '#3b82f6',
    [ABILITY_CATEGORIES.DRIBBLING]: '#10b981',
    [ABILITY_CATEGORIES.DEFENDING]: '#f59e0b',
    [ABILITY_CATEGORIES.PHYSICAL]: '#8b5cf6',
    [ABILITY_CATEGORIES.MENTAL]: '#06b6d4',
    [ABILITY_CATEGORIES.GOALKEEPER]: '#ec4899',
  };

  return colors[category] || '#6b7280';
}
