import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  AdminMatchesService,
  CreateMatchData,
  UpdateMatchData,
  CreateActionData,
  UpdateActionData,
  DetailedStatData,
  CreateLineupData,
  PossessionData,
} from './admin-matches.service';
import { AdminGuard } from '../common/guards/auth.guard';

@ApiTags('Admin - Matches')
@Controller('admin/matches')
@UseGuards(AdminGuard)
export class AdminMatchesController {
  constructor(private readonly adminMatchesService: AdminMatchesService) {}

  // ── GET /admin/matches ──
  @Get()
  @ApiOperation({ summary: '관리자 경기 목록 조회' })
  findAll(
    @Query('status') status?: string,
    @Query('season_id') season_id?: string,
    @Query('team_id') team_id?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminMatchesService.findAll({ status, season_id, team_id, limit });
  }

  // ── POST /admin/matches ──
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '새 경기 등록' })
  create(@Body() body: CreateMatchData) {
    return this.adminMatchesService.create(body);
  }

  // ── POST /admin/matches/migrate-coordinates ──
  @Post('migrate-coordinates')
  @ApiOperation({ summary: '경기 좌표 반전 마이그레이션' })
  migrateCoordinates(@Body() body: { matchIds: number[] }) {
    return this.adminMatchesService.migrateCoordinates(body.matchIds);
  }

  // ── GET /admin/matches/:matchId ──
  @Get(':matchId')
  @ApiOperation({ summary: '특정 경기 상세 조회' })
  findOne(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.findOne(matchId);
  }

  // ── PUT /admin/matches/:matchId ──
  @Put(':matchId')
  @ApiOperation({ summary: '경기 정보 업데이트 (PUT)' })
  update(@Param('matchId', ParseIntPipe) matchId: number, @Body() body: UpdateMatchData) {
    return this.adminMatchesService.update(matchId, body);
  }

  // ── PATCH /admin/matches/:matchId ──
  @Patch(':matchId')
  @ApiOperation({ summary: '경기 정보 업데이트 (PATCH)' })
  patch(@Param('matchId', ParseIntPipe) matchId: number, @Body() body: UpdateMatchData) {
    return this.adminMatchesService.update(matchId, body);
  }

  // ── DELETE /admin/matches/:matchId ──
  @Delete(':matchId')
  @ApiOperation({ summary: '경기 삭제' })
  remove(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.remove(matchId);
  }

  // ── GET /admin/matches/:matchId/actions ──
  @Get(':matchId/actions')
  @ApiOperation({ summary: '경기 이벤트 액션 조회' })
  getActions(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.getActions(matchId);
  }

  // ── POST /admin/matches/:matchId/actions ──
  @Post(':matchId/actions')
  @ApiOperation({ summary: '새 액션 추가' })
  createAction(@Param('matchId', ParseIntPipe) matchId: number, @Body() body: CreateActionData) {
    return this.adminMatchesService.createAction(matchId, body);
  }

  // ── DELETE /admin/matches/:matchId/actions (undo last) ──
  @Delete(':matchId/actions')
  @ApiOperation({ summary: '마지막 액션 삭제 (Undo)' })
  deleteLastAction(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Query('period_id') periodId?: string,
  ) {
    return this.adminMatchesService.deleteLastAction(matchId, periodId);
  }

  // ── GET /admin/matches/:matchId/actions/pass-map ──
  @Get(':matchId/actions/pass-map')
  @ApiOperation({ summary: '패스맵 데이터 조회' })
  getPassMap(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.getPassMap(matchId);
  }

  // ── GET /admin/matches/:matchId/actions/:actionId ──
  @Get(':matchId/actions/:actionId')
  @ApiOperation({ summary: '특정 액션 조회' })
  getAction(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Param('actionId', ParseIntPipe) actionId: number,
  ) {
    return this.adminMatchesService.getAction(matchId, actionId);
  }

  // ── PATCH /admin/matches/:matchId/actions/:actionId ──
  @Patch(':matchId/actions/:actionId')
  @ApiOperation({ summary: '액션 수정' })
  updateAction(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Param('actionId', ParseIntPipe) actionId: number,
    @Body() body: UpdateActionData,
  ) {
    return this.adminMatchesService.updateAction(matchId, actionId, body);
  }

  // ── DELETE /admin/matches/:matchId/actions/:actionId ──
  @Delete(':matchId/actions/:actionId')
  @ApiOperation({ summary: '특정 액션 삭제' })
  deleteAction(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Param('actionId', ParseIntPipe) actionId: number,
  ) {
    return this.adminMatchesService.deleteAction(matchId, actionId);
  }

  // ── GET /admin/matches/:matchId/assists ──
  @Get(':matchId/assists')
  @ApiOperation({ summary: '어시스트 목록 조회' })
  getAssists(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.getAssists(matchId);
  }

  // ── POST /admin/matches/:matchId/assists ──
  @Post(':matchId/assists')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '어시스트 추가' })
  createAssist(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body() body: { player_id: number; goal_id: number; description?: string },
  ) {
    return this.adminMatchesService.createAssist(matchId, body);
  }

  // ── GET /admin/matches/:matchId/coaches ──
  @Get(':matchId/coaches')
  @ApiOperation({ summary: '경기 감독 목록 조회' })
  getMatchCoaches(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.getMatchCoaches(matchId);
  }

  // ── POST /admin/matches/:matchId/coaches ──
  @Post(':matchId/coaches')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '경기 감독 추가' })
  addMatchCoach(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body() body: { team_id: number; coach_id: number; role: string },
  ) {
    return this.adminMatchesService.addMatchCoach(matchId, body);
  }

  // ── DELETE /admin/matches/:matchId/coaches/:coachId ──
  @Delete(':matchId/coaches/:coachId')
  @ApiOperation({ summary: '경기 감독 삭제' })
  removeMatchCoach(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Param('coachId', ParseIntPipe) coachId: number,
  ) {
    return this.adminMatchesService.removeMatchCoach(matchId, coachId);
  }

  // ── GET /admin/matches/:matchId/detailed-stats ──
  @Get(':matchId/detailed-stats')
  @ApiOperation({ summary: '경기 상세 통계 조회' })
  getDetailedStats(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.getDetailedStats(matchId);
  }

  // ── POST /admin/matches/:matchId/detailed-stats ──
  @Post(':matchId/detailed-stats')
  @ApiOperation({ summary: '상세 통계 추가/업데이트' })
  createOrUpdateDetailedStats(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body() body: DetailedStatData,
  ) {
    return this.adminMatchesService.createOrUpdateDetailedStats(matchId, body);
  }

  // ── DELETE /admin/matches/:matchId/detailed-stats ──
  @Delete(':matchId/detailed-stats')
  @ApiOperation({ summary: '상세 통계 삭제' })
  deleteDetailedStats(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Query('player_id', ParseIntPipe) playerId: number,
  ) {
    return this.adminMatchesService.deleteDetailedStats(matchId, playerId);
  }

  // ── POST /admin/matches/:matchId/detailed-stats/bulk ──
  @Post(':matchId/detailed-stats/bulk')
  @ApiOperation({ summary: '상세 통계 일괄 저장' })
  bulkSaveDetailedStats(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body() body: { stats: DetailedStatData[] },
  ) {
    return this.adminMatchesService.bulkSaveDetailedStats(matchId, body.stats);
  }

  // ── GET /admin/matches/:matchId/goals ──
  @Get(':matchId/goals')
  @ApiOperation({ summary: '골 목록 조회' })
  getGoals(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.getGoals(matchId);
  }

  // ── POST /admin/matches/:matchId/goals ──
  @Post(':matchId/goals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '골 추가' })
  createGoal(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body()
    body: { player_id: number; goal_time: number; goal_type?: string; description?: string },
  ) {
    return this.adminMatchesService.createGoal(matchId, body);
  }

  // ── GET /admin/matches/:matchId/lineups ──
  @Get(':matchId/lineups')
  @ApiOperation({ summary: '라인업 조회' })
  getLineups(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.getLineups(matchId);
  }

  // ── POST /admin/matches/:matchId/lineups ──
  @Post(':matchId/lineups')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '라인업 추가' })
  createLineup(@Param('matchId', ParseIntPipe) matchId: number, @Body() body: CreateLineupData) {
    return this.adminMatchesService.createLineup(matchId, body);
  }

  // ── GET /admin/matches/:matchId/penalties ──
  @Get(':matchId/penalties')
  @ApiOperation({ summary: '페널티킥 목록 조회' })
  getPenalties(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.getPenalties(matchId);
  }

  // ── POST /admin/matches/:matchId/penalties ──
  @Post(':matchId/penalties')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '페널티킥 추가' })
  createPenalty(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body()
    body: {
      team_id: number;
      player_id: number;
      goalkeeper_id: number;
      is_scored: boolean;
      order: number;
    },
  ) {
    return this.adminMatchesService.createPenalty(matchId, body);
  }

  // ── GET /admin/matches/:matchId/possession ──
  @Get(':matchId/possession')
  @ApiOperation({ summary: '점유율 조회' })
  getPossession(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.getPossession(matchId);
  }

  // ── POST /admin/matches/:matchId/possession ──
  @Post(':matchId/possession')
  @ApiOperation({ summary: '점유율 일괄 저장' })
  savePossession(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body() body: { possessions: PossessionData[] },
  ) {
    return this.adminMatchesService.savePossession(matchId, body.possessions);
  }

  // ── POST /admin/matches/:matchId/ratings ──
  @Post(':matchId/ratings')
  @ApiOperation({ summary: '평점 계산 후 DB 저장' })
  generateRatings(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.generateRatings(matchId);
  }

  // ── DELETE /admin/matches/:matchId/ratings ──
  @Delete(':matchId/ratings')
  @ApiOperation({ summary: '저장된 평점 삭제' })
  deleteRatings(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.deleteRatings(matchId);
  }

  // ── GET /admin/matches/:matchId/substitutions ──
  @Get(':matchId/substitutions')
  @ApiOperation({ summary: '교체 목록 조회' })
  getSubstitutions(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.getSubstitutions(matchId);
  }

  // ── POST /admin/matches/:matchId/substitutions ──
  @Post(':matchId/substitutions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '교체 추가' })
  createSubstitution(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Body()
    body: {
      team_id: number;
      player_in_id: number;
      player_out_id: number;
      substitution_time: number;
      description?: string;
    },
  ) {
    return this.adminMatchesService.createSubstitution(matchId, body);
  }

  // ── DELETE /admin/matches/:matchId/substitutions/:substitutionId ──
  @Delete(':matchId/substitutions/:substitutionId')
  @ApiOperation({ summary: '교체 삭제' })
  deleteSubstitution(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Param('substitutionId', ParseIntPipe) substitutionId: number,
  ) {
    return this.adminMatchesService.deleteSubstitution(matchId, substitutionId);
  }

  // ── POST /admin/matches/:matchId/update-stats ──
  @Post(':matchId/update-stats')
  @ApiOperation({ summary: '경기 완료 후 통계 업데이트' })
  updateMatchStats(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.updateMatchStats(matchId);
  }

  // ── POST /admin/matches/:matchId/xt-ratings ──
  @Post(':matchId/xt-ratings')
  @ApiOperation({ summary: 'xT 평점 생성' })
  generateXtRatings(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.generateXtRatings(matchId);
  }

  // ── GET /admin/matches/:matchId/xt-ratings ──
  @Get(':matchId/xt-ratings')
  @ApiOperation({ summary: 'xT 평점 조회' })
  getXtRatings(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.getXtRatings(matchId);
  }

  // ── DELETE /admin/matches/:matchId/xt-ratings ──
  @Delete(':matchId/xt-ratings')
  @ApiOperation({ summary: 'xT 평점 삭제' })
  deleteXtRatings(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.adminMatchesService.deleteXtRatings(matchId);
  }
}
