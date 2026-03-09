import { apiUrl } from '@/lib/api-url';
import { authFetch } from '@/lib/auth-fetch';

import type { PlayerRatingsResponse } from './types';

/**
 * 선수 능력치 평가 데이터 조회
 */
export async function getPlayerRatings({
  playerId,
  seasonId,
  includeReviews = true,
  topRatingsLimit = 5,
  userRatingsLimit = 10,
}: {
  playerId: number;
  seasonId?: number;
  includeReviews?: boolean;
  topRatingsLimit?: number;
  userRatingsLimit?: number;
}): Promise<PlayerRatingsResponse> {
  const searchParams = new URLSearchParams({
    player_id: playerId.toString(),
    include_reviews: includeReviews.toString(),
    top_ratings_limit: topRatingsLimit.toString(),
    user_ratings_limit: userRatingsLimit.toString(),
  });

  if (seasonId) {
    searchParams.append('season_id', seasonId.toString());
  }

  const response = await fetch(
    apiUrl(`/api/player-ratings-api?${searchParams}`)
  );

  if (!response.ok) {
    throw new Error('Failed to fetch player ratings');
  }

  return response.json();
}

/**
 * 평가에 대한 리뷰 작성
 */
export async function createRatingReview({
  ratingId,
  reviewType,
  comment,
}: {
  ratingId: number;
  reviewType: 'helpful' | 'not_helpful' | 'comment';
  comment?: string;
}): Promise<unknown> {
  const response = await authFetch(`/api/ratings/${ratingId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      review_type: reviewType,
      comment,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit review');
  }

  return response.json();
}

/**
 * 선수 능력치 평가 제출
 */
export async function createPlayerRating(
  ratingData: import('./types').CreateRatingRequest
): Promise<unknown> {
  const response = await authFetch('/api/ratings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ratingData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit rating');
  }

  return response.json();
}

// Query key 정의
getPlayerRatings.queryKey = 'player-ratings';
createRatingReview.queryKey = 'rating-review';
createPlayerRating.queryKey = 'create-rating';
