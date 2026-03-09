import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard, OptionalAuthGuard, AuthUser } from '../common/guards/auth.guard';
import { RatingsService } from './ratings.service';

@ApiTags('Ratings')
@Controller()
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  // ── GET /ratings ──

  @Get('ratings')
  @ApiOperation({
    summary: '평가 목록 조회',
    description:
      '선수 능력치 평가 목록을 반환합니다 (페이지네이션, 필터, 정렬 지원)',
  })
  @ApiQuery({ name: 'player_id', required: false, type: Number, description: '선수 ID 필터' })
  @ApiQuery({ name: 'user_id', required: false, description: '사용자 ID 필터' })
  @ApiQuery({ name: 'season_id', required: false, type: Number, description: '시즌 ID 필터' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 건수 (기본: 10)',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    description: '정렬 기준 (기본: created_at)',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    description: '정렬 순서 (기본: desc)',
  })
  findAll(
    @Query('player_id') playerId?: string,
    @Query('user_id') userId?: string,
    @Query('season_id') seasonId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort_by') sortBy?: string,
    @Query('order') order?: string,
  ) {
    return this.ratingsService.findAll({
      playerId: playerId ? parseInt(playerId, 10) || undefined : undefined,
      userId: userId || undefined,
      seasonId: seasonId || undefined,
      page: page ? parseInt(page, 10) || undefined : undefined,
      limit: limit ? parseInt(limit, 10) || undefined : undefined,
      sortBy: sortBy || undefined,
      order: order as 'asc' | 'desc' | undefined,
    });
  }

  // ── POST /ratings ──

  @Post('ratings')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '평가 생성',
    description: '선수 능력치 평가를 생성합니다',
  })
  create(
    @Req() req: { user: AuthUser },
    @Body() body: Record<string, unknown>,
  ) {
    return this.ratingsService.create(req.user.userId, body);
  }

  // ── GET /ratings/:ratingId ──

  @Get('ratings/:ratingId')
  @ApiOperation({
    summary: '평가 상세 조회',
    description: '특정 평가의 상세 정보를 반환합니다 (리뷰 포함)',
  })
  @ApiParam({ name: 'ratingId', type: Number, description: '평가 ID' })
  findOne(@Param('ratingId', ParseIntPipe) ratingId: number) {
    return this.ratingsService.findOne(ratingId);
  }

  // ── PUT /ratings/:ratingId ──

  @Put('ratings/:ratingId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '평가 수정',
    description: '본인의 평가를 수정합니다',
  })
  @ApiParam({ name: 'ratingId', type: Number, description: '평가 ID' })
  update(
    @Req() req: { user: AuthUser },
    @Param('ratingId', ParseIntPipe) ratingId: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.ratingsService.update(req.user.userId, ratingId, body);
  }

  // ── DELETE /ratings/:ratingId ──

  @Delete('ratings/:ratingId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '평가 삭제',
    description: '본인의 평가를 삭제합니다',
  })
  @ApiParam({ name: 'ratingId', type: Number, description: '평가 ID' })
  remove(
    @Req() req: { user: AuthUser },
    @Param('ratingId', ParseIntPipe) ratingId: number,
  ) {
    return this.ratingsService.remove(req.user.userId, ratingId);
  }

  // ── GET /ratings/:ratingId/reviews ──

  @Get('ratings/:ratingId/reviews')
  @ApiOperation({
    summary: '평가 리뷰 목록 조회',
    description: '특정 평가의 리뷰 목록을 반환합니다',
  })
  @ApiParam({ name: 'ratingId', type: Number, description: '평가 ID' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['helpful', 'not_helpful', 'comment'],
    description: '리뷰 타입 필터',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 건수 (기본: 10)',
  })
  findReviews(
    @Param('ratingId', ParseIntPipe) ratingId: number,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ratingsService.findReviews(ratingId, {
      type: type || undefined,
      page: page ? parseInt(page, 10) || undefined : undefined,
      limit: limit ? parseInt(limit, 10) || undefined : undefined,
    });
  }

  // ── POST /ratings/:ratingId/reviews ──

  @Post('ratings/:ratingId/reviews')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '평가 리뷰 작성',
    description: '평가에 대한 리뷰를 작성합니다 (도움됨/도움안됨/댓글)',
  })
  @ApiParam({ name: 'ratingId', type: Number, description: '평가 ID' })
  createReview(
    @Req() req: { user: AuthUser },
    @Param('ratingId', ParseIntPipe) ratingId: number,
    @Body() body: { review_type: string; comment?: string },
  ) {
    return this.ratingsService.createReview(req.user.userId, ratingId, body);
  }

  // ── GET /all-ratings ──

  @Get('all-ratings')
  @ApiOperation({
    summary: '전체 평가 목록',
    description:
      '모든 선수의 평가를 페이지네이션으로 반환합니다 (인기순, 평점순, 최신순 정렬 지원)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 건수 (기본: 10)',
  })
  @ApiQuery({ name: 'season_id', required: false, description: '시즌 ID 필터 (all=전체)' })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    enum: ['recent', 'popular', 'rating'],
    description: '정렬 기준 (기본: recent)',
  })
  findAllRatings(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('season_id') seasonId?: string,
    @Query('sort_by') sortBy?: string,
  ) {
    return this.ratingsService.findAllRatings({
      page: page ? parseInt(page, 10) || undefined : undefined,
      limit: limit ? parseInt(limit, 10) || undefined : undefined,
      seasonId: seasonId || undefined,
      sortBy: (sortBy as 'recent' | 'popular' | 'rating') || undefined,
    });
  }

  // ── GET /player-ratings-api ──

  @Get('player-ratings-api')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({
    summary: '선수별 평가 데이터',
    description:
      '특정 선수의 능력치 평가 데이터를 조회합니다 (집계, 사용자 평가, 인기 평가 포함)',
  })
  @ApiQuery({ name: 'player_id', required: true, type: Number, description: '선수 ID' })
  @ApiQuery({ name: 'season_id', required: false, description: '시즌 ID (all=전체)' })
  @ApiQuery({
    name: 'include_reviews',
    required: false,
    description: '리뷰 포함 여부 (true/false)',
  })
  @ApiQuery({
    name: 'top_ratings_limit',
    required: false,
    type: Number,
    description: '인기 평가 수 (기본: 5)',
  })
  @ApiQuery({
    name: 'user_ratings_limit',
    required: false,
    type: Number,
    description: '사용자 평가 수 (기본: 10)',
  })
  findPlayerRatings(
    @Req() req: { user: AuthUser | null },
    @Query('player_id') playerId: string,
    @Query('season_id') seasonId?: string,
    @Query('include_reviews') includeReviews?: string,
    @Query('top_ratings_limit') topRatingsLimit?: string,
    @Query('user_ratings_limit') userRatingsLimit?: string,
  ) {
    return this.ratingsService.findPlayerRatings({
      playerId: parseInt(playerId, 10),
      seasonId: seasonId || undefined,
      includeReviews: includeReviews === 'true',
      topRatingsLimit: topRatingsLimit
        ? parseInt(topRatingsLimit, 10) || undefined
        : undefined,
      userRatingsLimit: userRatingsLimit
        ? parseInt(userRatingsLimit, 10) || undefined
        : undefined,
      currentUserId: req.user?.userId || null,
    });
  }
}
