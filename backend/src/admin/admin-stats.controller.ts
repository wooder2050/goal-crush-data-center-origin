import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminStatsService, BackupData } from './admin-stats.service';
import { AdminGuard } from '../common/guards/auth.guard';

@ApiTags('Admin - Stats')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminStatsController {
  constructor(private readonly adminStatsService: AdminStatsService) {}

  // ── POST /admin/stats/regenerate ──
  @Post('stats/regenerate')
  @ApiOperation({ summary: '모든 통계 데이터 재생성' })
  regenerate(
    @Query('season_id') season_id?: string,
    @Query('type') type?: string,
  ) {
    return this.adminStatsService.regenerate({ season_id, type });
  }

  // ── POST /admin/stats/backup ──
  @Post('stats/backup')
  @ApiOperation({ summary: '통계 데이터 백업 생성' })
  createBackup(@Query('season_id') season_id?: string) {
    return this.adminStatsService.createBackup(season_id);
  }

  // ── PUT /admin/stats/backup ──
  @Put('stats/backup')
  @ApiOperation({ summary: '백업 데이터 복원' })
  restoreBackup(@Body() body: { data: BackupData; season_id?: string }) {
    return this.adminStatsService.restoreBackup(body);
  }

  // ── GET /admin/stats/player-stats-debug ──
  @Get('stats/player-stats-debug')
  @ApiOperation({ summary: '선수 통계 디버깅 정보' })
  playerStatsDebug(
    @Query('season_id') season_id?: string,
    @Query('player_id') player_id?: string,
  ) {
    return this.adminStatsService.playerStatsDebug({ season_id, player_id });
  }

  // ── GET /admin/stats/validate ──
  @Get('stats/validate')
  @ApiOperation({ summary: '통계 데이터 무결성 검증' })
  validate(@Query('season_id') season_id?: string) {
    return this.adminStatsService.validate(season_id);
  }

  // ── POST /admin/stats/restore-h2h ──
  @Post('stats/restore-h2h')
  @ApiOperation({ summary: 'H2H 통계 복구' })
  restoreH2H() {
    return this.adminStatsService.restoreH2H();
  }

  // ── POST /admin/seasons/:seasonId/standings/fix-penalties ──
  @Post('seasons/:seasonId/standings/fix-penalties')
  @ApiOperation({ summary: '시즌 순위표 페널티 수정 (시즌 23 전용)' })
  fixPenalties(@Param('seasonId', ParseIntPipe) seasonId: number) {
    return this.adminStatsService.fixPenalties(seasonId);
  }
}
