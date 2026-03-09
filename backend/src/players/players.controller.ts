import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PlayersService } from './players.service';

@ApiTags('Players')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  @ApiOperation({
    summary: '선수 목록',
    description: '선수 목록을 반환합니다 (페이지네이션, 필터, 정렬 지원)',
  })
  @ApiQuery({ name: 'name', required: false, description: '선수명 검색' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 건수' })
  @ApiQuery({ name: 'team_id', required: false, type: Number, description: '팀 ID 필터' })
  @ApiQuery({ name: 'season_id', required: false, type: Number, description: '시즌 ID 필터' })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['apps', 'goals', 'assists'],
    description: '정렬 기준 (기본: apps)',
  })
  @ApiQuery({ name: 'position', required: false, description: '포지션 필터' })
  findAll(
    @Query('name') name?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('team_id') teamId?: string,
    @Query('season_id') seasonId?: string,
    @Query('order') order?: string,
    @Query('position') position?: string,
  ) {
    return this.playersService.findAll({
      name: name || undefined,
      page: page ? parseInt(page, 10) || undefined : undefined,
      limit: limit ? parseInt(limit, 10) || undefined : undefined,
      teamId: teamId ? parseInt(teamId, 10) || undefined : undefined,
      seasonId: seasonId ? parseInt(seasonId, 10) || undefined : undefined,
      order: (['apps', 'goals', 'assists'].includes(order ?? '') ? order : undefined) as
        | 'apps'
        | 'goals'
        | 'assists'
        | undefined,
      position: position || undefined,
    });
  }

  @Get('page')
  @ApiOperation({
    summary: '선수 목록 (페이지)',
    description: '무한 스크롤용 페이지네이션 선수 목록',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 건수 (기본: 20)',
  })
  @ApiQuery({ name: 'name', required: false, description: '선수명 검색' })
  findPage(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('name') name?: string,
  ) {
    return this.playersService.findPage({
      page: page ? parseInt(page, 10) || undefined : undefined,
      limit: limit ? parseInt(limit, 10) || undefined : undefined,
      name: name || undefined,
    });
  }

  @Get('summaries')
  @ApiOperation({
    summary: '선수 요약 일괄 조회',
    description: '여러 선수의 시즌 및 통계 요약을 ID 목록으로 일괄 조회',
  })
  @ApiQuery({
    name: 'ids',
    required: true,
    description: '선수 ID 목록 (쉼표 구분, 예: 1,2,3)',
  })
  findSummaries(@Query('ids') idsParam: string) {
    if (!idsParam) return {};
    const ids = idsParam
      .split(',')
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n));
    return this.playersService.findSummaries(ids);
  }

  @Get(':playerId')
  @ApiOperation({ summary: '선수 상세', description: '특정 선수의 상세 정보를 반환' })
  @ApiParam({ name: 'playerId', type: Number, description: '선수 ID' })
  findOne(@Param('playerId', ParseIntPipe) playerId: number) {
    return this.playersService.findOne(playerId);
  }

  @Get(':playerId/goalkeeper-stats')
  @ApiOperation({
    summary: '골키퍼 통계',
    description: '선수의 골키퍼 출전 통계 (실점, 클린시트, 시즌별 상세)',
  })
  @ApiParam({ name: 'playerId', type: Number, description: '선수 ID' })
  @ApiQuery({ name: 'season_id', required: false, type: Number, description: '시즌 ID 필터' })
  findGoalkeeperStats(
    @Param('playerId', ParseIntPipe) playerId: number,
    @Query('season_id') seasonId?: string,
  ) {
    return this.playersService.findGoalkeeperStats(
      playerId,
      seasonId ? parseInt(seasonId, 10) || undefined : undefined,
    );
  }

  @Get(':playerId/summary')
  @ApiOperation({
    summary: '선수 상세 요약',
    description: '시즌별 기록, 팀 히스토리, 득점 경기 등 종합 정보',
  })
  @ApiParam({ name: 'playerId', type: Number, description: '선수 ID' })
  @ApiQuery({
    name: 'team_id',
    required: false,
    type: Number,
    description: '팀 ID (팀별 통계 필터)',
  })
  findPlayerSummary(
    @Param('playerId', ParseIntPipe) playerId: number,
    @Query('team_id') teamId?: string,
  ) {
    return this.playersService.findPlayerSummary(
      playerId,
      teamId ? parseInt(teamId, 10) || undefined : undefined,
    );
  }

  @Get(':playerId/team')
  @ApiOperation({
    summary: '선수 현재 팀',
    description: '선수의 현재 소속 팀 정보를 반환',
  })
  @ApiParam({ name: 'playerId', type: Number, description: '선수 ID' })
  findPlayerWithTeam(@Param('playerId', ParseIntPipe) playerId: number) {
    return this.playersService.findPlayerWithTeam(playerId);
  }
}
