import type { RatingReview, User } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type ReviewWithUser = RatingReview & {
  user: Pick<User, 'user_id' | 'korean_nickname' | 'profile_image_url'>;
};

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    rating_id: string;
  };
}

// GET - 특정 평가의 리뷰 목록 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const ratingId = parseInt(params.rating_id);
    const url = new URL(request.url);
    const reviewType = url.searchParams.get('type');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (isNaN(ratingId)) {
      return NextResponse.json({ error: 'Invalid rating ID' }, { status: 400 });
    }

    // 평가 존재 확인
    const rating = await prisma.playerAbilityRating.findUnique({
      where: { rating_id: ratingId },
    });

    if (!rating) {
      return NextResponse.json({ error: 'Rating not found' }, { status: 404 });
    }

    const where: { rating_id: number; review_type?: string } = {
      rating_id: ratingId,
    };

    if (
      reviewType &&
      ['helpful', 'not_helpful', 'comment'].includes(reviewType)
    ) {
      where.review_type = reviewType;
    }

    const [reviews, totalCount] = await Promise.all([
      prisma.ratingReview.findMany({
        where,
        include: {
          user: {
            select: {
              user_id: true,
              korean_nickname: true,
              profile_image_url: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ratingReview.count({ where }),
    ]);

    return NextResponse.json({
      reviews: reviews.map((review: ReviewWithUser) => ({
        ...review,
        user: {
          ...review.user,
          profile_image_url: review.user.profile_image_url ?? undefined,
        },
        created_at: review.created_at.toISOString(),
      })),
      total_count: totalCount,
      page,
      per_page: limit,
      total_pages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error('Error fetching rating reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rating reviews' },
      { status: 500 }
    );
  }
}

// POST - 평가에 대한 리뷰 추가 (도움됨/도움안됨/댓글)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const ratingId = parseInt(params.rating_id);
    const { review_type, comment } = await request.json();

    if (isNaN(ratingId)) {
      return NextResponse.json({ error: 'Invalid rating ID' }, { status: 400 });
    }

    // 리뷰 타입 검증
    if (!['helpful', 'not_helpful', 'comment'].includes(review_type)) {
      return NextResponse.json(
        {
          error:
            'Invalid review type. Must be helpful, not_helpful, or comment',
        },
        { status: 400 }
      );
    }

    // 댓글 타입인 경우 댓글 내용 필요
    if (review_type === 'comment' && (!comment || comment.trim() === '')) {
      return NextResponse.json(
        { error: 'Comment is required for comment type reviews' },
        { status: 400 }
      );
    }

    // 사용자 인증 확인
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.userId;

    // 평가 존재 확인
    const rating = await prisma.playerAbilityRating.findUnique({
      where: { rating_id: ratingId },
    });

    if (!rating) {
      return NextResponse.json({ error: 'Rating not found' }, { status: 404 });
    }

    // 자신의 평가에는 리뷰할 수 없음
    if (rating.user_id === userId) {
      return NextResponse.json(
        { error: 'You cannot review your own rating' },
        { status: 400 }
      );
    }

    // 이미 같은 타입의 리뷰를 했는지 확인
    const existingReview = await prisma.ratingReview.findUnique({
      where: {
        rating_id_user_id_review_type: {
          rating_id: ratingId,
          user_id: userId,
          review_type,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        {
          error:
            'You have already submitted this type of review for this rating',
        },
        { status: 409 }
      );
    }

    // helpful/not_helpful의 경우 반대 타입이 있으면 삭제
    if (review_type === 'helpful' || review_type === 'not_helpful') {
      const oppositeType =
        review_type === 'helpful' ? 'not_helpful' : 'helpful';
      await prisma.ratingReview.deleteMany({
        where: {
          rating_id: ratingId,
          user_id: userId,
          review_type: oppositeType,
        },
      });
    }

    // 리뷰 생성
    const review = await prisma.ratingReview.create({
      data: {
        rating_id: ratingId,
        user_id: userId,
        review_type,
        comment: review_type === 'comment' ? comment?.trim() : null,
      },
      include: {
        user: {
          select: {
            user_id: true,
            korean_nickname: true,
            profile_image_url: true,
          },
        },
      },
    });

    // helpful_count 업데이트
    await updateHelpfulCount(ratingId);

    return NextResponse.json({
      ...review,
      user: {
        ...review.user,
        profile_image_url: review.user.profile_image_url ?? undefined,
      },
      created_at: review.created_at.toISOString(),
    });
  } catch (error) {
    console.error('Error creating rating review:', error);
    return NextResponse.json(
      { error: 'Failed to create rating review' },
      { status: 500 }
    );
  }
}

// helpful_count 업데이트 헬퍼 함수
async function updateHelpfulCount(ratingId: number) {
  try {
    const helpfulCount = await prisma.ratingReview.count({
      where: {
        rating_id: ratingId,
        review_type: 'helpful',
      },
    });

    const totalReviews = await prisma.ratingReview.count({
      where: {
        rating_id: ratingId,
        review_type: {
          in: ['helpful', 'not_helpful', 'comment'],
        },
      },
    });

    await prisma.playerAbilityRating.update({
      where: { rating_id: ratingId },
      data: {
        helpful_count: helpfulCount,
        total_reviews: totalReviews,
      },
    });
  } catch (error) {
    console.error('Error updating helpful count:', error);
  }
}
