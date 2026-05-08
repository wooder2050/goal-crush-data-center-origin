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
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { AdminGuard, AuthGuard, AuthUser } from '../common/guards/auth.guard';
import { FantasyService } from './fantasy.service';

@ApiTags('Fantasy')
@Controller('fantasy')
export class FantasyController {
  constructor(private readonly fantasyService: FantasyService) {}

  // ── GET /fantasy/players/available ── (AuthGuard)

  @Get('players/available')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '선택 가능 선수 목록 조회',
    description: '현재 시즌의 활성 선수 및 AI 추천 선수 목록을 반환합니다',
  })
  @ApiQuery({ name: 'season_id', required: true, type: Number })
  @ApiQuery({ name: 'fantasy_season_id', required: true, type: Number })
  getAvailablePlayers(
    @Query('season_id') seasonId: string,
    @Query('fantasy_season_id') fantasySeasonId: string,
  ) {
    return this.fantasyService.getAvailablePlayers(seasonId, fantasySeasonId);
  }

  // ── GET /fantasy/players/recommendations ──

  @Get('players/recommendations')
  @ApiOperation({
    summary: 'AI 판타지 선수 추천 조회',
    description: '판타지 시즌별 AI 추천 선수 목록을 반환합니다',
  })
  @ApiQuery({ name: 'fantasy_season_id', required: true, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRecommendations(
    @Query('fantasy_season_id') fantasySeasonId: string,
    @Query('limit') limit?: string,
  ) {
    return this.fantasyService.getRecommendations(fantasySeasonId, limit);
  }

  // ── POST /fantasy/players/recommendations ──

  @Post('players/recommendations')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'AI 추천 데이터 새로 생성 (관리자용)',
    description: '판타지 시즌에 대한 AI 추천 데이터를 새로 생성합니다',
  })
  createRecommendations(@Body() body: { fantasy_season_id: number }) {
    return this.fantasyService.createRecommendations(body.fantasy_season_id);
  }

  // ── GET /fantasy/rankings ──

  @Get('rankings')
  @ApiOperation({
    summary: '월간 판타지 랭킹 조회',
    description: '판타지 시즌별 팀 랭킹을 페이지네이션으로 반환합니다',
  })
  @ApiQuery({ name: 'fantasy_season_id', required: true, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRankings(
    @Query('fantasy_season_id') fantasySeasonId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.fantasyService.getRankings(fantasySeasonId, page, limit);
  }

  // ── POST /fantasy/rankings ──

  @Post('rankings')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: '월간 랭킹 스냅샷 생성 (관리자용)',
    description: '현재 랭킹 상태를 스냅샷으로 저장합니다',
  })
  createRankingSnapshot(@Body() body: { fantasy_season_id: number }) {
    return this.fantasyService.createRankingSnapshot(body.fantasy_season_id);
  }

  // ── GET /fantasy/rankings/:seasonId ──

  @Get('rankings/:seasonId')
  @ApiOperation({
    summary: '시즌별 판타지 랭킹 조회',
    description: '특정 판타지 시즌의 랭킹을 조회합니다 (사용자 랭킹 포함 가능)',
  })
  @ApiParam({ name: 'seasonId', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'user_ranking', required: false, type: String })
  getRankingsBySeason(
    @Param('seasonId', ParseIntPipe) seasonId: number,
    @Req() req: { user?: AuthUser },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('user_ranking') userRanking?: string,
  ) {
    return this.fantasyService.getRankingsBySeason(
      seasonId,
      page,
      limit,
      userRanking,
      req.user?.userId,
    );
  }

  // ── POST /fantasy/scoring ──

  @Post('scoring')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: '판타지 점수 계산',
    description: '경기별 또는 시즌별 판타지 점수를 계산합니다',
  })
  calculateScoring(@Body() body: { type: string; match_id?: number; season_id?: number }) {
    return this.fantasyService.calculateScoring(body);
  }

  // ── GET /fantasy/seasons ──

  @Get('seasons')
  @ApiOperation({
    summary: '판타지 시즌 목록 조회',
    description: '판타지 시즌 목록을 반환합니다 (연도, 월, 활성 상태 필터 지원)',
  })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'active', required: false, type: String })
  getSeasons(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('active') active?: string,
  ) {
    return this.fantasyService.getSeasons(year, month, active);
  }

  // ── POST /fantasy/seasons ──

  @Post('seasons')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: '판타지 시즌 생성 (관리자용)',
    description: '새로운 판타지 시즌을 생성합니다',
  })
  createSeason(@Body() body: { season_id: number; year: number; month: number }) {
    return this.fantasyService.createSeason(body);
  }

  // ── GET /fantasy/seasons/:seasonId ──

  @Get('seasons/:seasonId')
  @ApiOperation({
    summary: '판타지 시즌 상세 조회',
    description: '특정 판타지 시즌의 상세 정보를 반환합니다',
  })
  @ApiParam({ name: 'seasonId', type: Number })
  getSeasonById(@Param('seasonId', ParseIntPipe) seasonId: number) {
    return this.fantasyService.getSeasonById(seasonId);
  }

  // ── GET /fantasy/teams/my-team ── (AuthGuard)
  // NOTE: This must be defined BEFORE /fantasy/teams/:teamId to avoid route conflict

  @Get('teams/my-team')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '내 판타지 팀 조회',
    description: '현재 사용자의 판타지 팀 정보를 반환합니다',
  })
  @ApiQuery({ name: 'fantasy_season_id', required: true, type: Number })
  getMyTeam(@Req() req: { user: AuthUser }, @Query('fantasy_season_id') fantasySeasonId: string) {
    return this.fantasyService.getMyTeam(req.user.userId, fantasySeasonId);
  }

  // ── GET /fantasy/teams/detail/:teamId ──

  @Get('teams/detail/:teamId')
  @ApiOperation({
    summary: '판타지 팀 상세 조회',
    description: '특정 판타지 팀의 상세 정보를 반환합니다 (누구나 접근 가능)',
  })
  @ApiParam({ name: 'teamId', type: Number })
  getTeamDetail(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.fantasyService.getTeamDetail(teamId);
  }

  // ── GET /fantasy/teams/edit-data/:seasonId ── (AuthGuard)

  @Get('teams/edit-data/:seasonId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '팀 수정용 데이터 조회',
    description: '팀 수정 페이지에 필요한 데이터를 반환합니다 (기존 팀, 선수 목록, 추천 선수)',
  })
  @ApiParam({ name: 'seasonId', type: Number })
  getTeamEditData(
    @Req() req: { user: AuthUser },
    @Param('seasonId', ParseIntPipe) seasonId: number,
  ) {
    return this.fantasyService.getTeamEditData(req.user.userId, seasonId);
  }

  // ── GET /fantasy/teams ── (AuthGuard)

  @Get('teams')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '사용자의 판타지 팀 조회',
    description: '현재 사용자의 모든 판타지 팀 또는 특정 시즌 팀을 반환합니다',
  })
  @ApiQuery({ name: 'fantasy_season_id', required: false, type: Number })
  getTeams(@Req() req: { user: AuthUser }, @Query('fantasy_season_id') fantasySeasonId?: string) {
    return this.fantasyService.getTeams(req.user.userId, fantasySeasonId);
  }

  // ── POST /fantasy/teams ── (AuthGuard)

  @Post('teams')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '판타지 팀 생성',
    description: '새로운 판타지 팀을 생성합니다',
  })
  createTeam(
    @Req() req: { user: AuthUser },
    @Body()
    body: {
      fantasy_season_id: number;
      team_name?: string;
      player_selections: Array<{ player_id: number; position: string }>;
    },
  ) {
    return this.fantasyService.createTeam(req.user.userId, body);
  }

  // ── GET /fantasy/teams/:teamId ──

  @Get('teams/:teamId')
  @ApiOperation({
    summary: '특정 판타지 팀 조회',
    description: '팀 ID로 특정 판타지 팀 정보를 반환합니다',
  })
  @ApiParam({ name: 'teamId', type: Number })
  getTeamById(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.fantasyService.getTeamById(teamId);
  }

  // ── PUT /fantasy/teams/:teamId ── (AuthGuard)

  @Put('teams/:teamId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '판타지 팀 수정',
    description: '본인의 판타지 팀을 수정합니다',
  })
  @ApiParam({ name: 'teamId', type: Number })
  updateTeam(
    @Req() req: { user: AuthUser },
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body()
    body: {
      team_name?: string;
      player_selections?: Array<{ player_id: number; position?: string }>;
    },
  ) {
    return this.fantasyService.updateTeam(req.user.userId, teamId, body);
  }

  // ── DELETE /fantasy/teams/:teamId ── (AuthGuard)

  @Delete('teams/:teamId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '판타지 팀 삭제',
    description: '본인의 판타지 팀을 삭제합니다',
  })
  @ApiParam({ name: 'teamId', type: Number })
  deleteTeam(@Req() req: { user: AuthUser }, @Param('teamId', ParseIntPipe) teamId: number) {
    return this.fantasyService.deleteTeam(req.user.userId, teamId);
  }
}
