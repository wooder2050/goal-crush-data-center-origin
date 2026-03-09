import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MatchesService } from './matches.service';

@ApiTags('Matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  // ── GET /matches ──

  @Get()
  @ApiOperation({
    summary: '경기 목록',
    description: '전체 경기 목록을 반환합니다 (시즌별 팀명 포함)',
  })
  findAll() {
    return this.matchesService.findAll();
  }

  // ── GET /matches/upcoming ──

  @Get('upcoming')
  @ApiOperation({
    summary: '예정된 경기',
    description: '예정된 경기 목록을 페이지네이션으로 반환합니다',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 건수 (기본 6, 최대 50)',
  })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: '오프셋' })
  @ApiQuery({ name: 'teamId', required: false, type: Number, description: '팀 ID 필터' })
  @ApiQuery({ name: 'seasonId', required: false, type: Number, description: '시즌 ID 필터' })
  findUpcoming(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('teamId') teamId?: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.matchesService.findUpcoming({
      limit: limit ? parseInt(limit, 10) || undefined : undefined,
      offset: offset ? parseInt(offset, 10) || undefined : undefined,
      teamId: teamId ? parseInt(teamId, 10) || undefined : undefined,
      seasonId: seasonId ? parseInt(seasonId, 10) || undefined : undefined,
    });
  }

  // ── GET /matches/season/:seasonId ──

  @Get('season/:seasonId')
  @ApiOperation({
    summary: '시즌별 경기 목록',
    description: '특정 시즌의 경기 목록을 반환합니다 (페이지네이션 및 그룹 필터 지원)',
  })
  @ApiParam({ name: 'seasonId', type: Number, description: '시즌 ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 건수' })
  @ApiQuery({ name: 'tournament_stage', required: false, description: '토너먼트 단계 필터' })
  @ApiQuery({ name: 'group_stage', required: false, description: '그룹 스테이지 필터' })
  findBySeasonId(
    @Param('seasonId', ParseIntPipe) seasonId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tournament_stage') tournamentStage?: string,
    @Query('group_stage') groupStage?: string,
  ) {
    return this.matchesService.findBySeasonId(seasonId, {
      page: page ? parseInt(page, 10) || undefined : undefined,
      limit: limit ? parseInt(limit, 10) || undefined : undefined,
      tournamentStage: tournamentStage || undefined,
      groupStage: groupStage || undefined,
    });
  }

  // ── GET /matches/:matchId ──

  @Get(':matchId')
  @ApiOperation({
    summary: '경기 상세',
    description: '특정 경기의 상세 정보를 반환합니다',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  findOne(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.matchesService.findOne(matchId);
  }

  // ── GET /matches/:matchId/goals ──

  @Get(':matchId/goals')
  @ApiOperation({
    summary: '경기 골 목록',
    description: '특정 경기의 골 목록을 반환합니다 (팀 정보 포함)',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  findGoals(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.matchesService.findGoals(matchId);
  }

  // ── GET /matches/:matchId/assists ──

  @Get(':matchId/assists')
  @ApiOperation({
    summary: '경기 어시스트 목록',
    description: '특정 경기의 어시스트 목록을 반환합니다',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  findAssists(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.matchesService.findAssists(matchId);
  }

  // ── GET /matches/:matchId/lineups ──

  @Get(':matchId/lineups')
  @ApiOperation({
    summary: '경기 라인업',
    description: '특정 경기의 라인업을 반환합니다 (선발/교체/벤치 분류 포함)',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  findLineups(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.matchesService.findLineups(matchId);
  }

  // ── GET /matches/:matchId/head-to-head ──

  @Get(':matchId/head-to-head')
  @ApiOperation({
    summary: '상대 전적 요약',
    description: '두 팀의 상대 전적 요약 통계를 반환합니다',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  findHeadToHead(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.matchesService.findHeadToHead(matchId);
  }

  // ── GET /matches/:matchId/head-to-head/list ──

  @Get(':matchId/head-to-head/list')
  @ApiOperation({
    summary: '상대 전적 경기 목록',
    description: '두 팀의 과거/미래 맞대결 경기 목록을 반환합니다',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['prev', 'next'],
    description: '조회 범위 (기본: prev)',
  })
  findHeadToHeadList(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Query('scope') scope?: string,
  ) {
    return this.matchesService.findHeadToHeadList(
      matchId,
      (scope === 'next' ? 'next' : 'prev') as 'prev' | 'next',
    );
  }

  // ── GET /matches/:matchId/head-to-head/coaches/list ──

  @Get(':matchId/head-to-head/coaches/list')
  @ApiOperation({
    summary: '감독 상대 전적 목록',
    description: '두 감독의 과거/미래 맞대결 경기 목록을 반환합니다',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['prev', 'next'],
    description: '조회 범위 (기본: prev)',
  })
  findHeadToHeadCoachesList(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Query('scope') scope?: string,
  ) {
    return this.matchesService.findHeadToHeadCoachesList(
      matchId,
      (scope === 'next' ? 'next' : 'prev') as 'prev' | 'next',
    );
  }

  // ── GET /matches/:matchId/key-players ──

  @Get(':matchId/key-players')
  @ApiOperation({
    summary: '주요 선수',
    description: '최근 10경기 기반으로 두 팀의 주요 선수(각 3명)를 반환합니다',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  findKeyPlayers(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.matchesService.findKeyPlayers(matchId);
  }

  // ── GET /matches/:matchId/penalties ──

  @Get(':matchId/penalties')
  @ApiOperation({
    summary: '승부차기 상세',
    description: '특정 경기의 승부차기 상세 정보를 반환합니다',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  findPenalties(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.matchesService.findPenalties(matchId);
  }

  // ── GET /matches/:matchId/predicted-lineups ──

  @Get(':matchId/predicted-lineups')
  @ApiOperation({
    summary: '예상 라인업',
    description: '최근 경기 데이터 기반으로 예상 라인업을 반환합니다',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  findPredictedLineups(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.matchesService.findPredictedLineups(matchId);
  }

  // ── GET /matches/:matchId/substitutions ──

  @Get(':matchId/substitutions')
  @ApiOperation({
    summary: '교체 목록',
    description: '특정 경기의 교체 목록을 반환합니다',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  findSubstitutions(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.matchesService.findSubstitutions(matchId);
  }

  // ── GET /matches/:matchId/ratings ──

  @Get(':matchId/ratings')
  @ApiOperation({
    summary: '선수 평점',
    description: '특정 경기의 선수 평점을 반환합니다',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  findRatings(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.matchesService.findRatings(matchId);
  }

  // ── GET /matches/:matchId/xt-ratings ──

  @Get(':matchId/xt-ratings')
  @ApiOperation({
    summary: 'xT 평점',
    description: '특정 경기의 xT(Expected Threat) 평점을 반환합니다',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  findXtRatings(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.matchesService.findXtRatings(matchId);
  }

  // ── GET /matches/:matchId/detailed-stats ──

  @Get(':matchId/detailed-stats')
  @ApiOperation({
    summary: '상세 통계',
    description: '특정 경기의 선수별 상세 통계를 반환합니다',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  findDetailedStats(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.matchesService.findDetailedStats(matchId);
  }

  // ── GET /matches/:matchId/supports ──

  @Get(':matchId/supports')
  @ApiOperation({
    summary: '응원 통계',
    description: '특정 경기의 응원 통계 및 최근 응원자 목록을 반환합니다',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  findSupports(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.matchesService.findSupports(matchId);
  }

  // ── GET /matches/:matchId/messages ──

  @Get(':matchId/messages')
  @ApiOperation({
    summary: '응원 메시지',
    description: '특정 경기의 응원 메시지를 페이지네이션으로 반환합니다',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 건수 (기본: 10)',
  })
  @ApiQuery({ name: 'teamId', required: false, type: Number, description: '팀 ID 필터' })
  findMessages(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.matchesService.findMessages(matchId, {
      page: page ? parseInt(page, 10) || undefined : undefined,
      limit: limit ? parseInt(limit, 10) || undefined : undefined,
      teamId: teamId ? parseInt(teamId, 10) || undefined : undefined,
    });
  }

  // ── GET /matches/:matchId/coaches ──

  @Get(':matchId/coaches')
  @ApiOperation({
    summary: '경기 감독',
    description: '특정 경기의 홈/어웨이 감독 정보를 반환합니다',
  })
  @ApiParam({ name: 'matchId', type: Number, description: '경기 ID' })
  findCoaches(@Param('matchId', ParseIntPipe) matchId: number) {
    return this.matchesService.findCoaches(matchId);
  }
}
