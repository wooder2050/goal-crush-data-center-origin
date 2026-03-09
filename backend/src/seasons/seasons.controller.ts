import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SeasonsService } from './seasons.service';

@ApiTags('Seasons')
@Controller('seasons')
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Get()
  @ApiOperation({ summary: '시즌 목록', description: '시즌 목록을 반환합니다 (페이지네이션 지원)' })
  @ApiQuery({ name: 'name', required: false, description: '시즌명 검색' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: '연도 필터' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 건수' })
  findAll(
    @Query('name') name?: string,
    @Query('year') year?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.seasonsService.findAll({
      name: name || undefined,
      year: year ? parseInt(year, 10) || undefined : undefined,
      page: page ? parseInt(page, 10) || undefined : undefined,
      limit: limit ? parseInt(limit, 10) || undefined : undefined,
    });
  }

  @Get('simple')
  @ApiOperation({ summary: '간단한 시즌 목록', description: 'ID, 이름, 연도만 반환' })
  findSimple() {
    return this.seasonsService.findSimple();
  }

  @Get('summary')
  @ApiOperation({ summary: '시즌 요약 통계', description: '팀별 시즌 통계를 반환' })
  findSummary() {
    return this.seasonsService.findSummary();
  }

  @Get(':seasonId')
  @ApiOperation({ summary: '시즌 상세', description: '특정 시즌의 상세 정보를 반환' })
  @ApiParam({ name: 'seasonId', type: Number, description: '시즌 ID' })
  findOne(@Param('seasonId', ParseIntPipe) seasonId: number) {
    return this.seasonsService.findOne(seasonId);
  }

  @Get(':seasonId/summary')
  @ApiOperation({
    summary: '시즌 요약',
    description: '특정 시즌의 경기 수, 참가 팀 수, 완료율 등을 반환',
  })
  @ApiParam({ name: 'seasonId', type: Number, description: '시즌 ID' })
  findSeasonSummary(@Param('seasonId', ParseIntPipe) seasonId: number) {
    return this.seasonsService.findSeasonSummary(seasonId);
  }

  @Get(':seasonId/standing')
  @ApiOperation({ summary: '시즌 순위표', description: '특정 시즌의 순위표를 반환' })
  @ApiParam({ name: 'seasonId', type: Number, description: '시즌 ID' })
  findStanding(@Param('seasonId', ParseIntPipe) seasonId: number) {
    return this.seasonsService.findStanding(seasonId);
  }

  @Get(':seasonId/teams/:teamId/players')
  @ApiOperation({
    summary: '시즌 팀 선수 목록',
    description: '특정 시즌에서 특정 팀에 출전한 선수 목록을 반환',
  })
  @ApiParam({ name: 'seasonId', type: Number, description: '시즌 ID' })
  @ApiParam({ name: 'teamId', type: Number, description: '팀 ID' })
  findTeamPlayers(
    @Param('seasonId', ParseIntPipe) seasonId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
  ) {
    return this.seasonsService.findTeamPlayers(seasonId, teamId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '시즌 생성', description: '새 시즌을 생성합니다' })
  create(
    @Body()
    body: {
      season_name: string;
      year: number;
      category?: string;
      start_date?: string;
      end_date?: string;
    },
  ) {
    return this.seasonsService.create(body);
  }

  @Put(':seasonId')
  @ApiOperation({ summary: '시즌 수정', description: '시즌 정보를 수정합니다' })
  @ApiParam({ name: 'seasonId', type: Number, description: '시즌 ID' })
  update(
    @Param('seasonId', ParseIntPipe) seasonId: number,
    @Body()
    body: {
      season_name: string;
      year: number;
      category?: string;
      start_date?: string;
      end_date?: string;
    },
  ) {
    return this.seasonsService.update(seasonId, body);
  }

  @Delete(':seasonId')
  @ApiOperation({ summary: '시즌 삭제', description: '시즌을 삭제합니다' })
  @ApiParam({ name: 'seasonId', type: Number, description: '시즌 ID' })
  remove(@Param('seasonId', ParseIntPipe) seasonId: number) {
    return this.seasonsService.remove(seasonId);
  }
}
