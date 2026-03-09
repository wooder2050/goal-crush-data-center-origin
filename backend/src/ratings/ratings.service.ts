import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ABILITY_FIELDS = [
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
] as const;

const RATING_INCLUDE = {
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
} as const;

/** Convert null values to undefined (for JSON serialization consistency) */
function convertNullToUndefined<T>(obj: T): T {
  if (obj === null) return undefined as T;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(convertNullToUndefined) as T;

  const converted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    converted[key] =
      value === null
        ? undefined
        : typeof value === 'object'
          ? convertNullToUndefined(value)
          : value;
  }
  return converted as T;
}

/** Format a rating record for API response */
function formatRatingResponse(rating: Record<string, unknown>) {
  return convertNullToUndefined({
    ...rating,
    player: {
      ...(rating.player as Record<string, unknown>),
      profile_image_url: (rating.player as Record<string, unknown>).profile_image_url ?? undefined,
    },
    user: {
      ...(rating.user as Record<string, unknown>),
      profile_image_url: (rating.user as Record<string, unknown>).profile_image_url ?? undefined,
    },
    season: rating.season ? { ...(rating.season as Record<string, unknown>) } : undefined,
    ...(rating.reviews
      ? {
          reviews: (rating.reviews as Record<string, unknown>[]).map((review) => ({
            ...review,
            user: {
              ...(review.user as Record<string, unknown>),
              profile_image_url:
                (review.user as Record<string, unknown>).profile_image_url ?? undefined,
            },
            created_at: (review.created_at as Date).toISOString(),
          })),
        }
      : {}),
    created_at: (rating.created_at as Date).toISOString(),
    updated_at: (rating.updated_at as Date).toISOString(),
  });
}

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── GET /ratings ──

  async findAll(params: {
    playerId?: number;
    userId?: string;
    seasonId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const sortBy = params.sortBy || 'created_at';
    const order = params.order || 'desc';

    const where: {
      player_id?: number;
      user_id?: string;
      season_id?: number | null;
    } = {};

    if (params.playerId) {
      where.player_id = params.playerId;
    }
    if (params.userId) {
      where.user_id = params.userId;
    }
    if (params.seasonId && params.seasonId !== 'all') {
      where.season_id = parseInt(params.seasonId, 10);
    }

    const [ratings, totalCount] = await Promise.all([
      this.prisma.playerAbilityRating.findMany({
        where,
        include: RATING_INCLUDE,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.playerAbilityRating.count({ where }),
    ]);

    return {
      ratings: ratings.map((rating) =>
        formatRatingResponse(rating as unknown as Record<string, unknown>),
      ),
      total_count: totalCount,
      page,
      per_page: limit,
      total_pages: Math.ceil(totalCount / limit),
    };
  }

  // ── POST /ratings ──

  async create(userId: string, data: Record<string, unknown>) {
    const playerId = data.player_id as number | undefined;

    if (!playerId) {
      throw new BadRequestException('Player ID is required');
    }

    // 능력치 값 검증 (1-99 범위)
    for (const field of ABILITY_FIELDS) {
      const value = data[field] as number | undefined;
      if (value !== undefined && (value < 1 || value > 99)) {
        throw new BadRequestException(`${field} must be between 1 and 99`);
      }
    }

    // 선수 존재 확인
    const player = await this.prisma.player.findUnique({
      where: { player_id: playerId },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    // 동일한 사용자가 같은 선수/시즌에 대해 이미 평가했는지 확인
    const seasonId = (data.season_id as number) ?? null;

    const existingRating = seasonId
      ? await this.prisma.playerAbilityRating.findUnique({
          where: {
            player_id_user_id_season_id: {
              player_id: playerId,
              user_id: userId,
              season_id: seasonId,
            },
          },
        })
      : await this.prisma.playerAbilityRating.findFirst({
          where: {
            player_id: playerId,
            user_id: userId,
            season_id: null,
          },
        });

    if (existingRating) {
      throw new ConflictException('You have already rated this player for this season');
    }

    // 평가 생성
    const rating = await this.prisma.playerAbilityRating.create({
      data: {
        ...(data as Record<string, unknown>),
        user_id: userId,
      } as never,
      include: RATING_INCLUDE,
    });

    // Aggregate 데이터 자동 업데이트
    await this.updatePlayerAbilityAggregate(playerId, seasonId);

    return formatRatingResponse(rating as unknown as Record<string, unknown>);
  }

  // ── GET /ratings/:ratingId ──

  async findOne(ratingId: number) {
    const rating = await this.prisma.playerAbilityRating.findUnique({
      where: { rating_id: ratingId },
      include: {
        ...RATING_INCLUDE,
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
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    return formatRatingResponse(rating as unknown as Record<string, unknown>);
  }

  // ── PUT /ratings/:ratingId ──

  async update(userId: string, ratingId: number, data: Record<string, unknown>) {
    // 평가 존재 확인 및 권한 확인
    const existingRating = await this.prisma.playerAbilityRating.findUnique({
      where: { rating_id: ratingId },
    });

    if (!existingRating) {
      throw new NotFoundException('Rating not found');
    }

    if (existingRating.user_id !== userId) {
      throw new ForbiddenException('You can only edit your own ratings');
    }

    // 능력치 값 검증 (1-99 범위)
    const updateData: Record<string, unknown> = {};

    for (const field of ABILITY_FIELDS) {
      const value = data[field] as number | undefined;
      if (value !== undefined) {
        if (value < 1 || value > 99) {
          throw new BadRequestException(`${field} must be between 1 and 99`);
        }
        updateData[field] = value;
      }
    }

    if (data.comment !== undefined) {
      updateData.comment = data.comment;
    }

    // 평가 업데이트
    const updatedRating = await this.prisma.playerAbilityRating.update({
      where: { rating_id: ratingId },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
      include: RATING_INCLUDE,
    });

    return formatRatingResponse(updatedRating as unknown as Record<string, unknown>);
  }

  // ── DELETE /ratings/:ratingId ──

  async remove(userId: string, ratingId: number) {
    const existingRating = await this.prisma.playerAbilityRating.findUnique({
      where: { rating_id: ratingId },
    });

    if (!existingRating) {
      throw new NotFoundException('Rating not found');
    }

    if (existingRating.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own ratings');
    }

    // 평가 삭제 (CASCADE로 리뷰들도 자동 삭제됨)
    await this.prisma.playerAbilityRating.delete({
      where: { rating_id: ratingId },
    });

    return { success: true, message: 'Rating deleted successfully' };
  }

  // ── GET /ratings/:ratingId/reviews ──

  async findReviews(ratingId: number, params: { type?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 10;

    // 평가 존재 확인
    const rating = await this.prisma.playerAbilityRating.findUnique({
      where: { rating_id: ratingId },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    const where: { rating_id: number; review_type?: string } = {
      rating_id: ratingId,
    };

    if (params.type && ['helpful', 'not_helpful', 'comment'].includes(params.type)) {
      where.review_type = params.type;
    }

    const [reviews, totalCount] = await Promise.all([
      this.prisma.ratingReview.findMany({
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
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ratingReview.count({ where }),
    ]);

    return {
      reviews: reviews.map((review) => ({
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
    };
  }

  // ── POST /ratings/:ratingId/reviews ──

  async createReview(
    userId: string,
    ratingId: number,
    data: { review_type: string; comment?: string },
  ) {
    const { review_type, comment } = data;

    // 리뷰 타입 검증
    if (!['helpful', 'not_helpful', 'comment'].includes(review_type)) {
      throw new BadRequestException(
        'Invalid review type. Must be helpful, not_helpful, or comment',
      );
    }

    // 댓글 타입인 경우 댓글 내용 필요
    if (review_type === 'comment' && (!comment || comment.trim() === '')) {
      throw new BadRequestException('Comment is required for comment type reviews');
    }

    // 평가 존재 확인
    const rating = await this.prisma.playerAbilityRating.findUnique({
      where: { rating_id: ratingId },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    // 자신의 평가에는 리뷰할 수 없음
    if (rating.user_id === userId) {
      throw new BadRequestException('You cannot review your own rating');
    }

    // 이미 같은 타입의 리뷰를 했는지 확인
    const existingReview = await this.prisma.ratingReview.findUnique({
      where: {
        rating_id_user_id_review_type: {
          rating_id: ratingId,
          user_id: userId,
          review_type,
        },
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already submitted this type of review for this rating');
    }

    // helpful/not_helpful의 경우 반대 타입이 있으면 삭제 (토글)
    if (review_type === 'helpful' || review_type === 'not_helpful') {
      const oppositeType = review_type === 'helpful' ? 'not_helpful' : 'helpful';
      await this.prisma.ratingReview.deleteMany({
        where: {
          rating_id: ratingId,
          user_id: userId,
          review_type: oppositeType,
        },
      });
    }

    // 리뷰 생성
    const review = await this.prisma.ratingReview.create({
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
    await this.updateHelpfulCount(ratingId);

    return {
      ...review,
      user: {
        ...review.user,
        profile_image_url: review.user.profile_image_url ?? undefined,
      },
      created_at: review.created_at.toISOString(),
    };
  }

  // ── GET /all-ratings ──

  async findAllRatings(params: {
    page?: number;
    limit?: number;
    seasonId?: string;
    sortBy?: 'recent' | 'popular' | 'rating';
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const sortBy = params.sortBy || 'recent';
    const offset = (page - 1) * limit;

    // Where 조건 구성
    const whereClause: { season_id?: number } = {};
    if (params.seasonId && params.seasonId !== 'all') {
      whereClause.season_id = parseInt(params.seasonId, 10);
    }

    // 정렬 조건 구성
    let orderBy: Array<Record<string, string>>;
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
        orderBy = [{ overall_rating: 'desc' }, { helpful_count: 'desc' }, { created_at: 'desc' }];
        break;
      case 'recent':
      default:
        orderBy = [{ created_at: 'desc' }];
        break;
    }

    const [totalCount, ratings] = await Promise.all([
      this.prisma.playerAbilityRating.count({ where: whereClause }),
      this.prisma.playerAbilityRating.findMany({
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
      }),
    ]);

    return {
      ratings: ratings.map((rating) => ({
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
  }

  // ── GET /player-ratings-api ──

  async findPlayerRatings(params: {
    playerId: number;
    seasonId?: string;
    includeReviews: boolean;
    topRatingsLimit?: number;
    userRatingsLimit?: number;
    currentUserId: string | null;
  }) {
    const { playerId, seasonId, includeReviews, currentUserId } = params;
    const topRatingsLimit = params.topRatingsLimit || 5;
    const userRatingsLimit = params.userRatingsLimit || 10;

    if (!playerId || isNaN(playerId)) {
      throw new BadRequestException('Valid player ID is required');
    }

    // 선수 정보 조회
    const player = await this.prisma.player.findUnique({
      where: { player_id: playerId },
      select: {
        player_id: true,
        name: true,
        profile_image_url: true,
      },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    // 집계 데이터 조회
    let aggregate = null;

    if (seasonId && seasonId !== 'all') {
      aggregate = await this.prisma.playerAbilityAggregate.findUnique({
        where: {
          player_id_season_id: {
            player_id: playerId,
            season_id: parseInt(seasonId, 10),
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
      aggregate = await this.prisma.playerAbilityAggregate.findFirst({
        where: { player_id: playerId },
        include: {
          season: {
            select: {
              season_id: true,
              season_name: true,
            },
          },
        },
        orderBy: { last_updated: 'desc' },
      });
    }

    // 사용자 평가들 조회 (최신순)
    const ratingsWhere: { player_id: number; season_id?: number } = {
      player_id: playerId,
    };
    if (seasonId && seasonId !== 'all') {
      ratingsWhere.season_id = parseInt(seasonId, 10);
    }

    const reviewsInclude = includeReviews
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
            orderBy: { created_at: 'desc' as const },
          },
        }
      : {};

    const userRatings = await this.prisma.playerAbilityRating.findMany({
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
        ...reviewsInclude,
      },
      orderBy: [{ helpful_count: 'desc' }, { total_reviews: 'desc' }, { created_at: 'desc' }],
      take: userRatingsLimit,
    });

    // 인기 평가들 조회 (도움됨 수가 많은 순)
    const topRatings = await this.prisma.playerAbilityRating.findMany({
      where: {
        ...ratingsWhere,
        helpful_count: { gt: 0 },
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
        ...reviewsInclude,
      },
      orderBy: [
        { helpful_count: 'desc' },
        { total_reviews: 'desc' },
        { overall_rating: 'desc' },
        { created_at: 'desc' },
      ],
      take: topRatingsLimit,
    });

    // 현재 사용자가 이미 평가했는지 확인
    let hasUserRated = false;
    if (currentUserId) {
      const existingRating = await this.prisma.playerAbilityRating.findFirst({
        where: {
          player_id: playerId,
          user_id: currentUserId,
          ...(seasonId && seasonId !== 'all' ? { season_id: parseInt(seasonId, 10) } : {}),
        },
      });
      hasUserRated = !!existingRating;
    }

    return {
      player: {
        ...player,
        profile_image_url: player.profile_image_url ?? undefined,
      },
      aggregate: aggregate
        ? {
            ...aggregate,
            last_updated: aggregate.last_updated.toISOString(),
          }
        : undefined,
      user_ratings: userRatings.map((rating) =>
        formatRatingResponse(rating as unknown as Record<string, unknown>),
      ),
      top_ratings: topRatings.map((rating) =>
        formatRatingResponse(rating as unknown as Record<string, unknown>),
      ),
      has_user_rated: hasUserRated,
    };
  }

  // ── Private Helpers ──

  /** 선수/시즌별 능력치 집계 데이터를 업데이트합니다 */
  private async updatePlayerAbilityAggregate(playerId: number, seasonId: number | null) {
    try {
      const ratings = await this.prisma.playerAbilityRating.findMany({
        where: {
          player_id: playerId,
          season_id: seasonId,
        },
      });

      if (ratings.length === 0) return;

      // 평균 계산
      const aggregateData: Record<string, number> = {};

      for (const field of ABILITY_FIELDS) {
        const values = ratings
          .map((r) => r[field as keyof typeof r] as number)
          .filter((v) => v !== null && v !== undefined);

        if (values.length > 0) {
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          aggregateData[`avg_${field}`] = Math.round(avg * 100) / 100;
        }
      }

      // Aggregate 데이터 upsert
      const whereClause = seasonId
        ? {
            player_id_season_id: {
              player_id: playerId,
              season_id: seasonId,
            },
          }
        : { player_id: playerId };

      await this.prisma.playerAbilityAggregate.upsert({
        where: whereClause,
        update: {
          ...aggregateData,
          total_ratings: ratings.length,
          last_updated: new Date(),
        },
        create: {
          player_id: playerId,
          season_id: seasonId,
          ...aggregateData,
          total_ratings: ratings.length,
          last_updated: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating aggregate:', error);
    }
  }

  /** 평가의 helpful_count 및 total_reviews를 업데이트합니다 */
  private async updateHelpfulCount(ratingId: number) {
    try {
      const [helpfulCount, totalReviews] = await Promise.all([
        this.prisma.ratingReview.count({
          where: {
            rating_id: ratingId,
            review_type: 'helpful',
          },
        }),
        this.prisma.ratingReview.count({
          where: {
            rating_id: ratingId,
            review_type: { in: ['helpful', 'not_helpful', 'comment'] },
          },
        }),
      ]);

      await this.prisma.playerAbilityRating.update({
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
}
