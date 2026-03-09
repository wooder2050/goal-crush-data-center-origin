import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  AuthGuard,
  OptionalAuthGuard,
  AuthUser,
} from '../common/guards/auth.guard';
import { CommunityService } from './community.service';

@ApiTags('Community')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // ──────────────────────────────────────
  // Posts
  // ──────────────────────────────────────

  @Get('posts')
  @ApiOperation({ summary: '게시글 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'team_id', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  getPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('team_id') teamId?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.communityService.getPosts({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      category: category || undefined,
      team_id: teamId || undefined,
      sortBy: sortBy || undefined,
    });
  }

  @Post('posts')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '새 게시글 작성' })
  createPost(
    @Req() req: { user: AuthUser },
    @Body() body: { title: string; content: string; category: string; team_id?: string },
  ) {
    return this.communityService.createPost(req.user.userId, body);
  }

  // ──────────────────────────────────────
  // Single Post
  // ──────────────────────────────────────

  @Get('posts/:postId')
  @ApiOperation({ summary: '게시글 상세 조회' })
  @ApiParam({ name: 'postId', type: Number })
  getPost(@Param('postId', ParseIntPipe) postId: number) {
    return this.communityService.getPost(postId);
  }

  // ──────────────────────────────────────
  // Comments
  // ──────────────────────────────────────

  @Post('posts/:postId/comments')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '댓글 작성' })
  @ApiParam({ name: 'postId', type: Number })
  createComment(
    @Req() req: { user: AuthUser },
    @Param('postId', ParseIntPipe) postId: number,
    @Body() body: { content: string; parent_comment_id?: number },
  ) {
    return this.communityService.createComment(req.user.userId, postId, body);
  }

  // ──────────────────────────────────────
  // Like (legacy)
  // ──────────────────────────────────────

  @Post('posts/:postId/like')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '게시글 좋아요/좋아요 취소 (레거시)' })
  @ApiParam({ name: 'postId', type: Number })
  toggleLikeLegacy(
    @Req() req: { user: AuthUser },
    @Param('postId', ParseIntPipe) postId: number,
    @Body() body: { action: string },
  ) {
    return this.communityService.toggleLikeLegacy(req.user.userId, postId, body);
  }

  @Get('posts/:postId/like')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '게시글 좋아요 상태 확인 (레거시)' })
  @ApiParam({ name: 'postId', type: Number })
  getLikeStatus(
    @Req() req: { user: AuthUser },
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.communityService.getLikeStatus(req.user.userId, postId);
  }

  // ──────────────────────────────────────
  // Likes (new toggle)
  // ──────────────────────────────────────

  @Post('posts/:postId/likes')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '게시글 좋아요 토글' })
  @ApiParam({ name: 'postId', type: Number })
  toggleLike(
    @Req() req: { user: AuthUser },
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.communityService.toggleLike(req.user.userId, postId);
  }

  @Get('posts/:postId/likes')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: '게시글 좋아요 상태 조회' })
  @ApiParam({ name: 'postId', type: Number })
  getLikesStatus(
    @Req() req: { user: AuthUser | null },
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.communityService.getLikesStatus(
      req.user?.userId || null,
      postId,
    );
  }

  // ──────────────────────────────────────
  // View tracking
  // ──────────────────────────────────────

  @Post('posts/:postId/view')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: '게시글 조회 추적' })
  @ApiParam({ name: 'postId', type: Number })
  trackView(
    @Req() req: { user: AuthUser | null; ip?: string },
    @Param('postId', ParseIntPipe) postId: number,
    @Headers('x-forwarded-for') forwarded?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
    return this.communityService.trackView(
      postId,
      req.user?.userId || null,
      ip,
      userAgent || 'unknown',
    );
  }

  // ──────────────────────────────────────
  // Stats
  // ──────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: '커뮤니티 전체 통계 조회' })
  getStats() {
    return this.communityService.getStats();
  }

  @Get('stats/mvp-votes')
  @ApiOperation({ summary: '유저 MVP 투표 결과 조회' })
  @ApiQuery({ name: 'seasonId', required: true, type: Number })
  getStatsMvpVotes(@Query('seasonId') seasonId: string) {
    if (!seasonId) {
      return { success: false, error: 'seasonId 파라미터가 필요합니다.' };
    }
    return this.communityService.getStatsMvpVotes(parseInt(seasonId, 10));
  }

  @Get('stats/today-posts')
  @ApiOperation({ summary: '오늘 게시글 수 조회' })
  getTodayPosts() {
    return this.communityService.getTodayPosts();
  }

  @Get('stats/weekly-growth')
  @ApiOperation({ summary: '주간 성장률 조회' })
  getWeeklyGrowth() {
    return this.communityService.getWeeklyGrowth();
  }

  // ──────────────────────────────────────
  // Hot topics
  // ──────────────────────────────────────

  @Get('hot-topics')
  @ApiOperation({ summary: '인기 토픽 조회' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHotTopics(@Query('limit') limit?: string) {
    return this.communityService.getHotTopics(
      limit ? parseInt(limit, 10) : 5,
    );
  }

  // ──────────────────────────────────────
  // Activity leaders
  // ──────────────────────────────────────

  @Get('activity/leaders')
  @ApiOperation({ summary: '활동 리더보드 조회' })
  getActivityLeaders() {
    return this.communityService.getActivityLeaders();
  }

  // ──────────────────────────────────────
  // Recent badges
  // ──────────────────────────────────────

  @Get('badges/recent')
  @ApiOperation({ summary: '최근 배지 조회' })
  getRecentBadges() {
    return this.communityService.getRecentBadges();
  }

  // ──────────────────────────────────────
  // MVP votes
  // ──────────────────────────────────────

  @Get('mvp-votes')
  @ApiOperation({ summary: 'MVP 투표 결과 조회' })
  @ApiQuery({ name: 'season_id', required: false, type: Number })
  @ApiQuery({ name: 'vote_type', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMvpVotes(
    @Query('season_id') seasonId?: string,
    @Query('vote_type') voteType?: string,
    @Query('limit') limit?: string,
  ) {
    return this.communityService.getMvpVotes({
      season_id: seasonId ? parseInt(seasonId, 10) : undefined,
      vote_type: voteType || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('mvp-votes')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'MVP 투표' })
  castMvpVote(
    @Req() req: { user: AuthUser },
    @Body()
    body: {
      season_id: number;
      player_id: number;
      vote_type?: string;
      match_id?: number;
    },
  ) {
    return this.communityService.castMvpVote(req.user.userId, body);
  }

  // ──────────────────────────────────────
  // MVP voting current
  // ──────────────────────────────────────

  @Get('mvp-voting/current')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: '최신 리그 경기 MVP 선수 조회' })
  getMvpVotingCurrent(@Req() req: { user: AuthUser | null }) {
    return this.communityService.getMvpVotingCurrent(
      req.user?.userId || null,
    );
  }

  // ──────────────────────────────────────
  // Team communities
  // ──────────────────────────────────────

  @Get('team-communities')
  @ApiOperation({ summary: '팀별 커뮤니티 현황 조회' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTeamCommunities(@Query('limit') limit?: string) {
    return this.communityService.getTeamCommunities(
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('team-communities/:teamId')
  @ApiOperation({ summary: '특정 팀 커뮤니티 정보 조회' })
  @ApiParam({ name: 'teamId', type: Number })
  getTeamCommunity(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.communityService.getTeamCommunity(teamId);
  }
}
