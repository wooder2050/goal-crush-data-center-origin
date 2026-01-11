import type { Player, PlayerAbilityRating, Season, User } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

type RatingWithIncludes = PlayerAbilityRating & {
  player: Pick<Player, 'player_id' | 'name' | 'profile_image_url'>;
  season: Pick<Season, 'season_id' | 'season_name'> | null;
  user: Pick<User, 'user_id' | 'korean_nickname' | 'profile_image_url'>;
};

export const dynamic = 'force-dynamic';

interface AllRatingsResponse {
  ratings: Array<{
    rating_id: number;
    player: {
      player_id: number;
      name: string;
      profile_image_url?: string;
    };
    season?: {
      season_id: number;
      season_name: string;
    };
    user?: {
      user_id: string;
      korean_nickname: string;
      profile_image_url?: string;
    };
    overall_rating: number | null;
    comment: string | null;
    helpful_count: number | null;
    total_reviews: number | null;
    // 주요 능력치들 추가
    finishing: number | null;
    shot_power: number | null;
    short_passing: number | null;
    long_passing: number | null;
    dribbling: number | null;
    ball_control: number | null;
    speed: number | null;
    acceleration: number | null;
    strength: number | null;
    marking: number | null;
    tackling: number | null;
    created_at: string;
    updated_at: string;
  }>;
  total_count: number;
  current_page: number;
  total_pages: number;
  per_page: number;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const seasonId = url.searchParams.get('season_id');
    const sortBy = url.searchParams.get('sort_by') || 'recent'; // recent, popular, rating

    const offset = (page - 1) * limit;

    // Where 조건 구성
    const whereClause: { season_id?: number } = {};
    if (seasonId && seasonId !== 'all') {
      whereClause.season_id = parseInt(seasonId);
    }

    // 정렬 조건 구성
    let orderBy: Array<{ [key: string]: string }>;
    switch (sortBy) {
      case 'popular':
        orderBy = [
          { helpful_count: 'desc' },
          { total_reviews: 'desc' },
          { overall_rating: 'desc' },
          { created_at: 'desc' },
        ];
        break;
      case 'rating':
        orderBy = [
          { overall_rating: 'desc' },
          { helpful_count: 'desc' },
          { created_at: 'desc' },
        ];
        break;
      case 'recent':
      default:
        orderBy = [{ created_at: 'desc' }];
        break;
    }

    // 전체 개수 조회
    const totalCount = await prisma.playerAbilityRating.count({
      where: whereClause,
    });

    // 평가 데이터 조회
    const ratings = await prisma.playerAbilityRating.findMany({
      where: whereClause,
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            profile_image_url: true,
          },
        },
        season: {
          select: {
            season_id: true,
            season_name: true,
          },
        },
        user: {
          select: {
            user_id: true,
            korean_nickname: true,
            profile_image_url: true,
          },
        },
      },
      orderBy,
      skip: offset,
      take: limit,
    });

    const response: AllRatingsResponse = {
      ratings: ratings.map((rating: RatingWithIncludes) => ({
        rating_id: rating.rating_id,
        player: {
          player_id: rating.player.player_id,
          name: rating.player.name,
          profile_image_url: rating.player.profile_image_url ?? undefined,
        },
        season: rating.season
          ? {
              season_id: rating.season.season_id,
              season_name: rating.season.season_name,
            }
          : undefined,
        user: rating.user
          ? {
              user_id: rating.user.user_id,
              korean_nickname: rating.user.korean_nickname,
              profile_image_url: rating.user.profile_image_url ?? undefined,
            }
          : undefined,
        overall_rating: rating.overall_rating,
        comment: rating.comment,
        helpful_count: rating.helpful_count,
        total_reviews: rating.total_reviews,
        // 능력치 데이터 추가
        finishing: rating.finishing,
        shot_power: rating.shot_power,
        short_passing: rating.short_passing,
        long_passing: rating.long_passing,
        dribbling: rating.dribbling,
        ball_control: rating.ball_control,
        speed: rating.speed,
        acceleration: rating.acceleration,
        strength: rating.strength,
        marking: rating.marking,
        tackling: rating.tackling,
        created_at: rating.created_at.toISOString(),
        updated_at: rating.updated_at.toISOString(),
      })),
      total_count: totalCount,
      current_page: page,
      total_pages: Math.ceil(totalCount / limit),
      per_page: limit,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error fetching all ratings:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch ratings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
