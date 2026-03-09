import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TeamsService } from './teams.service';

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: '팀 목록', description: '전체 팀 목록을 반환합니다' })
  @ApiQuery({ name: 'season_id', required: false, type: Number, description: '시즌 ID 필터' })
  findAll(@Query('season_id') seasonId?: string) {
    return this.teamsService.findAll(seasonId ? parseInt(seasonId, 10) || undefined : undefined);
  }

  @Get(':teamId')
  @ApiOperation({ summary: '팀 상세', description: '특정 팀의 상세 정보를 반환' })
  @ApiParam({ name: 'teamId', type: Number, description: '팀 ID' })
  findOne(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamsService.findOne(teamId);
  }

  @Get(':teamId/recent-form')
  @ApiOperation({ summary: '팀 최근 전적', description: '최근 5경기 결과를 반환' })
  @ApiParam({ name: 'teamId', type: Number, description: '팀 ID' })
  @ApiQuery({ name: 'before', required: true, description: '기준 날짜 (ISO 8601)' })
  findRecentForm(@Param('teamId', ParseIntPipe) teamId: number, @Query('before') before: string) {
    return this.teamsService.findRecentForm(teamId, before);
  }

  @Get(':teamId/stats')
  @ApiOperation({ summary: '팀 통계', description: '팀의 누적 통계를 반환' })
  @ApiParam({ name: 'teamId', type: Number, description: '팀 ID' })
  @ApiQuery({ name: 'season_id', required: false, type: Number, description: '시즌 ID 필터' })
  findStats(@Param('teamId', ParseIntPipe) teamId: number, @Query('season_id') seasonId?: string) {
    return this.teamsService.findStats(
      teamId,
      seasonId ? parseInt(seasonId, 10) || undefined : undefined,
    );
  }

  @Get(':teamId/last-match-lineups')
  @ApiOperation({ summary: '마지막 경기 라인업', description: '가장 최근 경기의 라인업을 반환' })
  @ApiParam({ name: 'teamId', type: Number, description: '팀 ID' })
  @ApiQuery({ name: 'before', required: true, description: '기준 날짜 (ISO 8601)' })
  findLastMatchLineups(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Query('before') before: string,
  ) {
    return this.teamsService.findLastMatchLineups(teamId, before);
  }

  @Get(':teamId/highlights')
  @ApiOperation({ summary: '팀 하이라이트', description: '팀의 역대 기록 및 업적을 반환' })
  @ApiParam({ name: 'teamId', type: Number, description: '팀 ID' })
  findHighlights(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamsService.findHighlights(teamId);
  }

  @Get(':teamId/players')
  @ApiOperation({ summary: '팀 선수 목록', description: '팀 소속 선수 목록을 반환' })
  @ApiParam({ name: 'teamId', type: Number, description: '팀 ID' })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['current', 'all'],
    description: '범위 (기본: current)',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['default', 'stats'],
    description: '정렬 (기본: default)',
  })
  findPlayers(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Query('scope') scope?: string,
    @Query('order') order?: string,
  ) {
    return this.teamsService.findPlayers(
      teamId,
      (scope === 'all' ? 'all' : 'current') as 'current' | 'all',
      (order === 'stats' ? 'stats' : 'default') as 'default' | 'stats',
    );
  }

  @Get(':teamId/season-standings')
  @ApiOperation({ summary: '팀 시즌별 순위', description: '팀의 전체 시즌 참가 기록을 반환' })
  @ApiParam({ name: 'teamId', type: Number, description: '팀 ID' })
  findSeasonStandings(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamsService.findSeasonStandings(teamId);
  }
}
