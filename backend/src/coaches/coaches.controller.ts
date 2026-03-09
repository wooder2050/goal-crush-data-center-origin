import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CoachesService } from './coaches.service';

@ApiTags('Coaches')
@Controller('coaches')
export class CoachesController {
  constructor(private readonly coachesService: CoachesService) {}

  @Get()
  @ApiOperation({
    summary: '감독 목록',
    description: '감독 목록을 반환합니다 (검색, 페이지네이션, 정렬 지원)',
  })
  @ApiQuery({ name: 'search', required: false, description: '감독명 검색' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 건수 (기본 50)',
  })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: '오프셋 (기본 0)' })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['total', 'wins', 'win_rate'],
    description: '정렬 기준',
  })
  findAll(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('order') order?: string,
  ) {
    return this.coachesService.findAll({
      search: search || undefined,
      limit: limit ? parseInt(limit, 10) || 50 : 50,
      offset: offset ? parseInt(offset, 10) || 0 : 0,
      order: order || undefined,
    });
  }

  @Get(':coachId')
  @ApiOperation({
    summary: '감독 상세',
    description: '특정 감독의 상세 정보 (이력 + 최근 경기)를 반환',
  })
  @ApiParam({ name: 'coachId', type: Number, description: '감독 ID' })
  findOne(@Param('coachId', ParseIntPipe) coachId: number) {
    return this.coachesService.findOne(coachId);
  }

  @Get(':coachId/current-team')
  @ApiOperation({
    summary: '감독 현재 팀',
    description: 'team_current_head_coach 뷰 기준 현재 소속 팀을 반환',
  })
  @ApiParam({ name: 'coachId', type: Number, description: '감독 ID' })
  findCurrentTeam(@Param('coachId', ParseIntPipe) coachId: number) {
    return this.coachesService.findCurrentTeam(coachId);
  }

  @Get(':coachId/stats')
  @ApiOperation({
    summary: '감독 시즌별 통계',
    description: '감독의 시즌별 경기 통계를 반환',
  })
  @ApiParam({ name: 'coachId', type: Number, description: '감독 ID' })
  findStats(@Param('coachId', ParseIntPipe) coachId: number) {
    return this.coachesService.findStats(coachId);
  }

  @Get(':coachId/trophies')
  @ApiOperation({
    summary: '감독 우승 기록',
    description: '감독의 우승 트로피 목록을 반환',
  })
  @ApiParam({ name: 'coachId', type: Number, description: '감독 ID' })
  findTrophies(@Param('coachId', ParseIntPipe) coachId: number) {
    return this.coachesService.findTrophies(coachId);
  }

  @Get(':coachId/overview')
  @ApiOperation({
    summary: '감독 개요',
    description: '시즌별 통계 + 우승 기록을 합친 개요를 반환',
  })
  @ApiParam({ name: 'coachId', type: Number, description: '감독 ID' })
  findOverview(@Param('coachId', ParseIntPipe) coachId: number) {
    return this.coachesService.findOverview(coachId);
  }

  @Get(':coachId/full')
  @ApiOperation({
    summary: '감독 전체 데이터',
    description: '감독 상세 + 개요 + 현재 팀 정보를 한번에 반환',
  })
  @ApiParam({ name: 'coachId', type: Number, description: '감독 ID' })
  findFull(@Param('coachId', ParseIntPipe) coachId: number) {
    return this.coachesService.findFull(coachId);
  }
}
