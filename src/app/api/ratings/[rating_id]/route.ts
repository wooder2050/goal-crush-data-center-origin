import type { RatingReview, User } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import type { UpdateRatingRequest } from '@/features/player-ratings/types';
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

// GET - 특정 평가 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const ratingId = parseInt(params.rating_id);

    if (isNaN(ratingId)) {
      return NextResponse.json({ error: 'Invalid rating ID' }, { status: 400 });
    }

    const rating = await prisma.playerAbilityRating.findUnique({
      where: { rating_id: ratingId },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            profile_image_url: true,
          },
        },
        user: {
          select: {
            user_id: true,
            korean_nickname: true,
            profile_image_url: true,
          },
        },
        season: {
          select: {
            season_id: true,
            season_name: true,
          },
        },
        reviews: {
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
        },
      },
    });

    if (!rating) {
      return NextResponse.json({ error: 'Rating not found' }, { status: 404 });
    }

    // Helper function to convert null to undefined
    const convertNullToUndefined = <T>(obj: T): T => {
      if (obj === null) return undefined as T;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(convertNullToUndefined) as T;

      const converted: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(
        obj as Record<string, unknown>
      )) {
        converted[key] =
          value === null
            ? undefined
            : typeof value === 'object'
              ? convertNullToUndefined(value)
              : value;
      }
      return converted as T;
    };

    return NextResponse.json(
      convertNullToUndefined({
        ...rating,
        player: {
          ...rating.player,
          profile_image_url: rating.player.profile_image_url ?? undefined,
        },
        user: {
          ...rating.user,
          profile_image_url: rating.user.profile_image_url ?? undefined,
        },
        reviews: rating.reviews.map((review: ReviewWithUser) => ({
          ...review,
          user: {
            ...review.user,
            profile_image_url: review.user.profile_image_url ?? undefined,
          },
          created_at: review.created_at.toISOString(),
        })),
        created_at: rating.created_at.toISOString(),
        updated_at: rating.updated_at.toISOString(),
      })
    );
  } catch (error) {
    console.error('Error fetching rating:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rating' },
      { status: 500 }
    );
  }
}

// PUT - 평가 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const ratingId = parseInt(params.rating_id);
    const data: UpdateRatingRequest = await request.json();

    if (isNaN(ratingId)) {
      return NextResponse.json({ error: 'Invalid rating ID' }, { status: 400 });
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

    // 평가 존재 확인 및 권한 확인
    const existingRating = await prisma.playerAbilityRating.findUnique({
      where: { rating_id: ratingId },
    });

    if (!existingRating) {
      return NextResponse.json({ error: 'Rating not found' }, { status: 404 });
    }

    if (existingRating.user_id !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own ratings' },
        { status: 403 }
      );
    }

    // 능력치 값 검증 (1-99 범위)
    const abilityFields = [
      'finishing',
      'shot_power',
      'shot_accuracy',
      'heading',
      'short_passing',
      'long_passing',
      'vision',
      'crossing',
      'dribbling',
      'ball_control',
      'agility',
      'balance',
      'marking',
      'tackling',
      'interceptions',
      'defensive_heading',
      'speed',
      'acceleration',
      'stamina',
      'strength',
      'determination',
      'work_rate',
      'leadership',
      'composure',
      'reflexes',
      'diving',
      'handling',
      'kicking',
      'overall_rating',
    ];

    const updateData: Partial<UpdateRatingRequest> = {};
    for (const field of abilityFields) {
      const value = data[field as keyof UpdateRatingRequest] as number;
      if (value !== undefined) {
        if (value < 1 || value > 99) {
          return NextResponse.json(
            { error: `${field} must be between 1 and 99` },
            { status: 400 }
          );
        }
        (updateData as Record<string, unknown>)[field] = value;
      }
    }

    if (data.comment !== undefined) {
      updateData.comment = data.comment;
    }

    // 평가 업데이트
    const updatedRating = await prisma.playerAbilityRating.update({
      where: { rating_id: ratingId },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            profile_image_url: true,
          },
        },
        user: {
          select: {
            user_id: true,
            korean_nickname: true,
            profile_image_url: true,
          },
        },
        season: {
          select: {
            season_id: true,
            season_name: true,
          },
        },
      },
    });

    // Helper function to convert null to undefined
    const convertNullToUndefined = <T>(obj: T): T => {
      if (obj === null) return undefined as T;
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(convertNullToUndefined) as T;

      const converted: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(
        obj as Record<string, unknown>
      )) {
        converted[key] =
          value === null
            ? undefined
            : typeof value === 'object'
              ? convertNullToUndefined(value)
              : value;
      }
      return converted as T;
    };

    return NextResponse.json(
      convertNullToUndefined({
        ...updatedRating,
        player: {
          ...updatedRating.player,
          profile_image_url:
            updatedRating.player.profile_image_url ?? undefined,
        },
        user: {
          ...updatedRating.user,
          profile_image_url: updatedRating.user.profile_image_url ?? undefined,
        },
        created_at: updatedRating.created_at.toISOString(),
        updated_at: updatedRating.updated_at.toISOString(),
      })
    );
  } catch (error) {
    console.error('Error updating rating:', error);
    return NextResponse.json(
      { error: 'Failed to update rating' },
      { status: 500 }
    );
  }
}

// DELETE - 평가 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const ratingId = parseInt(params.rating_id);

    if (isNaN(ratingId)) {
      return NextResponse.json({ error: 'Invalid rating ID' }, { status: 400 });
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

    // 평가 존재 확인 및 권한 확인
    const existingRating = await prisma.playerAbilityRating.findUnique({
      where: { rating_id: ratingId },
    });

    if (!existingRating) {
      return NextResponse.json({ error: 'Rating not found' }, { status: 404 });
    }

    if (existingRating.user_id !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own ratings' },
        { status: 403 }
      );
    }

    // 평가 삭제 (CASCADE로 리뷰들도 자동 삭제됨)
    await prisma.playerAbilityRating.delete({
      where: { rating_id: ratingId },
    });

    return NextResponse.json({
      success: true,
      message: 'Rating deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting rating:', error);
    return NextResponse.json(
      { error: 'Failed to delete rating' },
      { status: 500 }
    );
  }
}
