import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('Stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  // ─── Head-to-Head ───────────────────────────────────────────────

  @Get('head-to-head')
  @ApiOperation({
    summary: '팀 간 상대전적',
    description: '두 팀 간의 상대전적 통계를 반환합니다',
  })
  @ApiQuery({ name: 'team1_id', required: true, type: Number, description: '팀 1 ID' })
  @ApiQuery({ name: 'team2_id', required: true, type: Number, description: '팀 2 ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '최근 경기 수 (기본: 10)',
  })
  getHeadToHead(
    @Query('team1_id') team1Id: string,
    @Query('team2_id') team2Id: string,
    @Query('limit') limit?: string,
  ) {
    return this.statsService.getHeadToHead(
      parseInt(team1Id, 10),
      parseInt(team2Id, 10),
      limit ? parseInt(limit, 10) || 10 : 10,
    );
  }

  // ─── Player Match Stats ─────────────────────────────────────────

  @Get('player-match')
  @ApiOperation({
    summary: '선수 경기 통계',
    description: '선수의 경기별 통계를 반환합니다',
  })
  @ApiQuery({ name: 'match_id', required: false, type: Number, description: '경기 ID' })
  @ApiQuery({ name: 'player_id', required: false, type: Number, description: '선수 ID' })
  getPlayerMatchStats(@Query('match_id') matchId?: string, @Query('player_id') playerId?: string) {
    return this.statsService.getPlayerMatchStats(
      matchId ? parseInt(matchId, 10) || undefined : undefined,
      playerId ? parseInt(playerId, 10) || undefined : undefined,
    );
  }

  // ─── Top Ratings ────────────────────────────────────────────────

  @Get('player-match/top-ratings')
  @ApiOperation({
    summary: '시즌별 평균 평점 TOP N',
    description: '시즌별 평균 평점이 높은 선수 목록을 반환합니다',
  })
  @ApiQuery({ name: 'season_id', required: true, type: Number, description: '시즌 ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '조회 수 (기본: 10, 최대: 50)',
  })
  getTopRatings(@Query('season_id') seasonId: string, @Query('limit') limit?: string) {
    const parsedLimit = Math.max(1, Math.min(parseInt(limit || '10', 10), 50));
    return this.statsService.getTopRatings(parseInt(seasonId, 10), parsedLimit);
  }

  // ─── Top xT Ratings ─────────────────────────────────────────────

  @Get('player-match/top-xt-ratings')
  @ApiOperation({
    summary: '시즌별 평균 xT 평점 TOP N',
    description: '시즌별 평균 xT 평점이 높은 선수 목록을 반환합니다',
  })
  @ApiQuery({ name: 'season_id', required: true, type: Number, description: '시즌 ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '조회 수 (기본: 10, 최대: 50)',
  })
  getTopXtRatings(@Query('season_id') seasonId: string, @Query('limit') limit?: string) {
    const parsedLimit = Math.max(1, Math.min(parseInt(limit || '10', 10), 50));
    return this.statsService.getTopXtRatings(parseInt(seasonId, 10), parsedLimit);
  }

  // ─── Player Season Stats ────────────────────────────────────────

  @Get('player-season')
  @ApiOperation({
    summary: '선수 시즌 통계',
    description: '선수의 시즌별 통계를 반환합니다',
  })
  @ApiQuery({ name: 'season_id', required: false, type: Number, description: '시즌 ID' })
  @ApiQuery({ name: 'player_id', required: false, type: Number, description: '선수 ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '조회 수' })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['goals', 'appearances', 'assists'],
    description: '정렬 기준 (기본: goals)',
  })
  getPlayerSeasonStats(
    @Query('season_id') seasonId?: string,
    @Query('player_id') playerId?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    return this.statsService.getPlayerSeasonStats(
      seasonId ? parseInt(seasonId, 10) || undefined : undefined,
      playerId ? parseInt(playerId, 10) || undefined : undefined,
      limit ? parseInt(limit, 10) || undefined : undefined,
      (sort || 'goals') as 'goals' | 'appearances' | 'assists',
    );
  }

  // ─── Top Scorers ────────────────────────────────────────────────

  @Get('player-season/top-scorers')
  @ApiOperation({
    summary: '득점왕',
    description: '시즌별 또는 커리어 누적 득점왕 목록을 반환합니다',
  })
  @ApiQuery({
    name: 'season_id',
    required: false,
    type: Number,
    description: '시즌 ID (미입력 시 커리어 누적)',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '조회 수 (기본: 10)' })
  getTopScorers(@Query('season_id') seasonId?: string, @Query('limit') limit?: string) {
    return this.statsService.getTopScorers(
      seasonId ? parseInt(seasonId, 10) || undefined : undefined,
      limit ? parseInt(limit, 10) || 10 : 10,
    );
  }

  // ─── Top Appearances ───────────────────────────────────────────

  @Get('player-season/top-appearances')
  @ApiOperation({
    summary: '출전 경기 순위',
    description: '출전 경기가 많은 순서대로 선수 목록을 반환합니다',
  })
  @ApiQuery({ name: 'season_id', required: false, type: Number, description: '시즌 ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '조회 수 (기본: 10)' })
  getTopAppearances(@Query('season_id') seasonId?: string, @Query('limit') limit?: string) {
    return this.statsService.getTopAppearances(
      seasonId ? parseInt(seasonId, 10) || undefined : undefined,
      limit ? parseInt(limit, 10) || 10 : 10,
    );
  }

  // ─── Top Assists ────────────────────────────────────────────────

  @Get('player-season/top-assists')
  @ApiOperation({
    summary: '어시스트 순위',
    description: '어시스트가 많은 순서대로 선수 목록을 반환합니다',
  })
  @ApiQuery({ name: 'season_id', required: false, type: Number, description: '시즌 ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '조회 수 (기본: 10)' })
  getTopAssists(@Query('season_id') seasonId?: string, @Query('limit') limit?: string) {
    return this.statsService.getTopAssists(
      seasonId ? parseInt(seasonId, 10) || undefined : undefined,
      limit ? parseInt(limit, 10) || 10 : 10,
    );
  }

  // ─── Player vs Team ─────────────────────────────────────────────

  @Get('player-vs-team')
  @ApiOperation({
    summary: '선수 상대팀별 기록',
    description: '특정 선수의 상대팀별 공격포인트 통계를 반환합니다',
  })
  @ApiQuery({ name: 'player_id', required: true, type: Number, description: '선수 ID' })
  @ApiQuery({
    name: 'season_id',
    required: false,
    type: Number,
    description: '시즌 ID (미입력 시 전체)',
  })
  getPlayerVsTeam(@Query('player_id') playerId: string, @Query('season_id') seasonId?: string) {
    return this.statsService.getPlayerVsTeam(
      parseInt(playerId, 10),
      seasonId && seasonId !== 'all' ? parseInt(seasonId, 10) || undefined : undefined,
    );
  }

  // ─── Team Season Stats ──────────────────────────────────────────

  @Get('team-season')
  @ApiOperation({
    summary: '팀 시즌 통계',
    description: '팀의 시즌별 통계를 반환합니다',
  })
  @ApiQuery({ name: 'season_id', required: false, type: Number, description: '시즌 ID' })
  @ApiQuery({ name: 'team_id', required: false, type: Number, description: '팀 ID' })
  getTeamSeasonStats(@Query('season_id') seasonId?: string, @Query('team_id') teamId?: string) {
    return this.statsService.getTeamSeasonStats(
      seasonId ? parseInt(seasonId, 10) || undefined : undefined,
      teamId ? parseInt(teamId, 10) || undefined : undefined,
    );
  }

  // ─── Goalkeeper Rankings ────────────────────────────────────────

  @Get('goalkeeper-rankings')
  @ApiOperation({
    summary: '골키퍼 랭킹',
    description: '골키퍼별 실점, 클린시트 등의 랭킹을 반환합니다',
  })
  @ApiQuery({ name: 'season_id', required: false, type: Number, description: '시즌 ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 건수 (기본: 20)',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    description:
      '정렬 기준 (goals_conceded_per_match, clean_sheets, clean_sheet_percentage, matches_played)',
  })
  @ApiQuery({
    name: 'min_matches',
    required: false,
    type: Number,
    description: '최소 출전 경기 수 (기본: 3)',
  })
  @ApiQuery({
    name: 'appearance_type',
    required: false,
    enum: ['starter', 'substitute', 'all'],
    description: '출전 유형 (기본: all)',
  })
  getGoalkeeperRankings(
    @Query('season_id') seasonId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort_by') sortBy?: string,
    @Query('min_matches') minMatches?: string,
    @Query('appearance_type') appearanceType?: string,
  ) {
    return this.statsService.getGoalkeeperRankings(
      seasonId ? Number(seasonId) || undefined : undefined,
      page ? parseInt(page, 10) || 1 : 1,
      limit ? parseInt(limit, 10) || 20 : 20,
      sortBy || 'goals_conceded_per_match',
      minMatches ? parseInt(minMatches, 10) || 3 : 3,
      (appearanceType || 'all') as 'starter' | 'substitute' | 'all',
    );
  }

  // ─── Group League Standings ─────────────────────────────────────

  @Get('group-league-standings')
  @ApiOperation({
    summary: '조별 리그 순위표',
    description: '시즌별 조별 리그 순위표를 반환합니다',
  })
  @ApiQuery({ name: 'season_id', required: true, type: Number, description: '시즌 ID' })
  @ApiQuery({
    name: 'tournament_stage',
    required: false,
    description: '토너먼트 스테이지 (all, group_stage 등)',
  })
  @ApiQuery({ name: 'group_stage', required: false, description: '조별 필터 (all, A, B 등)' })
  getGroupLeagueStandings(
    @Query('season_id') seasonId: string,
    @Query('tournament_stage') tournamentStage?: string,
    @Query('group_stage') groupStage?: string,
  ) {
    return this.statsService.getGroupLeagueStandings(
      parseInt(seasonId, 10),
      tournamentStage || undefined,
      groupStage || undefined,
    );
  }

  // ─── Penalty Shootout ───────────────────────────────────────────

  @Get('penalty-shootout')
  @ApiOperation({
    summary: '승부차기 통계',
    description: '키커 또는 골키퍼의 승부차기 통계를 반환합니다',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['kicker', 'goalkeeper'],
    description: '유형 (기본: kicker)',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    description:
      '정렬 기준 (total, success_rate_high, success_rate_low, save_rate_high, save_rate_low)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 건수 (기본: 20)',
  })
  @ApiQuery({
    name: 'min_attempts',
    required: false,
    type: Number,
    description: '최소 시도 수 (기본: 1)',
  })
  @ApiQuery({ name: 'season_id', required: false, type: Number, description: '시즌 ID' })
  getPenaltyShootout(
    @Query('type') type?: string,
    @Query('sort_by') sortBy?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('min_attempts') minAttempts?: string,
    @Query('season_id') seasonId?: string,
  ) {
    return this.statsService.getPenaltyShootout(
      type || 'kicker',
      sortBy || 'total',
      page ? parseInt(page, 10) || 1 : 1,
      limit ? parseInt(limit, 10) || 20 : 20,
      minAttempts ? parseInt(minAttempts, 10) || 1 : 1,
      seasonId ? parseInt(seasonId, 10) || undefined : undefined,
    );
  }

  // ─── Scoring Rankings ───────────────────────────────────────────

  @Get('scoring-rankings')
  @ApiOperation({
    summary: '득점 랭킹',
    description: '선수별 득점/어시스트/공격포인트 랭킹을 반환합니다',
  })
  @ApiQuery({ name: 'season_id', required: false, type: Number, description: '시즌 ID' })
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
    description:
      '정렬 기준 (attack_points, goals, assists, matches_played, goals_per_match, assists_per_match, attack_points_per_match)',
  })
  @ApiQuery({
    name: 'min_matches',
    required: false,
    type: Number,
    description: '최소 출전 경기 수 (기본: 3)',
  })
  getScoringRankings(
    @Query('season_id') seasonId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort_by') sortBy?: string,
    @Query('min_matches') minMatches?: string,
  ) {
    return this.statsService.getScoringRankings(
      seasonId ? Number(seasonId) || undefined : undefined,
      page ? parseInt(page, 10) || 1 : 1,
      limit ? parseInt(limit, 10) || 10 : 10,
      sortBy || 'attack_points',
      minMatches ? parseInt(minMatches, 10) || 3 : 3,
    );
  }

  // ─── Starter Win Rate ──────────────────────────────────────────

  @Get('starter-win-rate')
  @ApiOperation({
    summary: '선발 승률',
    description: '선수별 선발/교체 출전 시 승률 랭킹을 반환합니다',
  })
  @ApiQuery({ name: 'season_id', required: false, type: Number, description: '시즌 ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 건수 (기본: 20)',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    description: '정렬 기준 (win_rate_desc, win_rate_asc, matches_played)',
  })
  @ApiQuery({
    name: 'min_matches',
    required: false,
    type: Number,
    description: '최소 출전 경기 수 (기본: 5)',
  })
  @ApiQuery({
    name: 'appearance_type',
    required: false,
    enum: ['starter', 'substitute', 'all'],
    description: '출전 유형 (기본: starter)',
  })
  getStarterWinRate(
    @Query('season_id') seasonId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort_by') sortBy?: string,
    @Query('min_matches') minMatches?: string,
    @Query('appearance_type') appearanceType?: string,
  ) {
    return this.statsService.getStarterWinRate(
      seasonId ? Number(seasonId) || undefined : undefined,
      page ? parseInt(page, 10) || 1 : 1,
      limit ? parseInt(limit, 10) || 20 : 20,
      sortBy || 'win_rate_desc',
      minMatches ? parseInt(minMatches, 10) || 5 : 5,
      (appearanceType || 'starter') as 'starter' | 'substitute' | 'all',
    );
  }

  // ─── Team Rankings ─────────────────────────────────────────────

  @Get('team-rankings')
  @ApiOperation({
    summary: '팀 랭킹',
    description: '팀별 승률, 득실차 등의 랭킹을 반환합니다',
  })
  @ApiQuery({ name: 'season_id', required: false, type: Number, description: '시즌 ID' })
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
    description:
      '정렬 기준 (win_rate, goal_difference, goals_for, goals_against, goals_for_per_match, goals_against_per_match, matches_played)',
  })
  getTeamRankings(
    @Query('season_id') seasonId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort_by') sortBy?: string,
  ) {
    return this.statsService.getTeamRankings(
      seasonId ? Number(seasonId) || undefined : undefined,
      page ? parseInt(page, 10) || 1 : 1,
      limit ? parseInt(limit, 10) || 10 : 10,
      sortBy || 'win_rate',
    );
  }
}
