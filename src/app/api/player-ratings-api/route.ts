import { NextRequest, NextResponse } from 'next/server';

import type { PlayerRatingsResponse } from '@/features/player-ratings/types';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 타입 정의

export const dynamic = 'force-dynamic';

// GET - 특정 선수의 능력치 평가 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const playerId = url.searchParams.get('player_id');
    const seasonId = url.searchParams.get('season_id');
    const includeReviews = url.searchParams.get('include_reviews') === 'true';
    const topRatingsLimit = parseInt(
      url.searchParams.get('top_ratings_limit') || '5'
    );
    const userRatingsLimit = parseInt(
      url.searchParams.get('user_ratings_limit') || '10'
    );

    if (!playerId || isNaN(parseInt(playerId))) {
      return NextResponse.json(
        { error: 'Valid player ID is required' },
        { status: 400 }
      );
    }

    const playerIdInt = parseInt(playerId);

    // 선수 정보 조회
    const player = await prisma.player.findUnique({
      where: { player_id: playerIdInt },
      select: {
        player_id: true,
        name: true,
        profile_image_url: true,
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // 집계 데이터 조회
    let aggregate = null;

    if (seasonId && seasonId !== 'all') {
      // 특정 시즌 데이터 조회
      aggregate = await prisma.playerAbilityAggregate.findUnique({
        where: {
          player_id_season_id: {
            player_id: playerIdInt,
            season_id: parseInt(seasonId),
          },
        },
        include: {
          season: {
            select: {
              season_id: true,
              season_name: true,
            },
          },
        },
      });
    } else {
      // 전체 시즌 또는 기본 데이터 조회
      aggregate = await prisma.playerAbilityAggregate.findFirst({
        where: {
          player_id: playerIdInt,
        },
        include: {
          season: {
            select: {
              season_id: true,
              season_name: true,
            },
          },
        },
        orderBy: {
          last_updated: 'desc',
        },
      });
    }

    // 사용자 평가들 조회 (최신순)
    const ratingsWhere: { player_id: number; season_id?: number } = {
      player_id: playerIdInt,
    };
    if (seasonId && seasonId !== 'all') {
      ratingsWhere.season_id = parseInt(seasonId);
    }

    const userRatings = await prisma.playerAbilityRating.findMany({
      where: ratingsWhere,
      include: {
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
        ...(includeReviews
          ? {
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
                  created_at: 'desc' as const,
                },
              },
            }
          : {}),
      },
      orderBy: [
        { helpful_count: 'desc' },
        { total_reviews: 'desc' },
        { created_at: 'desc' },
      ],
      take: userRatingsLimit,
    });

    // 인기 평가들 조회 (도움됨 수가 많은 순)
    const topRatings = await prisma.playerAbilityRating.findMany({
      where: {
        ...ratingsWhere,
        helpful_count: {
          gt: 0, // 도움됨이 1개 이상인 것만
        },
      },
      include: {
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
        ...(includeReviews
          ? {
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
                  created_at: 'desc' as const,
                },
              },
            }
          : {}),
      },
      orderBy: [
        { helpful_count: 'desc' },
        { total_reviews: 'desc' },
        { overall_rating: 'desc' },
        { created_at: 'desc' },
      ],
      take: topRatingsLimit,
    });

    // 현재 사용자 정보 가져오기 (안전하게 처리)
    let currentUser = null;
    try {
      currentUser = await getCurrentUser();
    } catch {
      // error unused
      console.log('사용자 인증 정보 없음 (게스트 모드)');
    }

    // 현재 사용자가 이미 평가했는지 확인
    let hasUserRated = false;
    if (currentUser) {
      const existingRating = await prisma.playerAbilityRating.findFirst({
        where: {
          player_id: playerIdInt,
          user_id: currentUser.userId,
          ...(seasonId && seasonId !== 'all'
            ? { season_id: parseInt(seasonId) }
            : {}),
        },
      });
      hasUserRated = !!existingRating;
    }

    // Helper function to convert null to undefined and format dates
    const formatRating = (
      rating: Record<string, unknown>
    ): Record<string, unknown> => {
      return {
        ...rating,
        user: {
          ...(rating.user as Record<string, unknown>),
          profile_image_url:
            (rating.user as Record<string, unknown>).profile_image_url ??
            undefined,
        },
        season: rating.season
          ? {
              ...(rating.season as Record<string, unknown>),
            }
          : undefined,
        ...(rating.reviews
          ? {
              reviews: (rating.reviews as Record<string, unknown>[]).map(
                (review) => ({
                  ...review,
                  user: {
                    ...(review.user as Record<string, unknown>),
                    profile_image_url:
                      (review.user as Record<string, unknown>)
                        .profile_image_url ?? undefined,
                  },
                  created_at: (review.created_at as Date).toISOString(),
                })
              ),
            }
          : {}),
        created_at: (rating.created_at as Date).toISOString(),
        updated_at: (rating.updated_at as Date).toISOString(),
      };
    };

    const response: PlayerRatingsResponse = {
      player: {
        ...player,
        profile_image_url: player.profile_image_url ?? undefined,
      },
      aggregate: aggregate
        ? ({
            ...aggregate,
            last_updated: aggregate.last_updated.toISOString(),
          } as PlayerRatingsResponse['aggregate'])
        : undefined,
      user_ratings: userRatings.map(
        formatRating
      ) as unknown as PlayerRatingsResponse['user_ratings'],
      top_ratings: topRatings.map(
        formatRating
      ) as unknown as PlayerRatingsResponse['top_ratings'],
      has_user_rated: hasUserRated, // 현재 사용자 평가 여부 추가
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching player ratings:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch player ratings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
