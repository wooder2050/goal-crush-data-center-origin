import {
  Controller,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminTeamsService } from './admin-teams.service';
import { AdminGuard } from '../common/guards/auth.guard';

@ApiTags('Admin - Teams & Coaches')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminTeamsController {
  constructor(private readonly adminTeamsService: AdminTeamsService) {}

  // ── POST /admin/teams ──
  @Post('teams')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '팀 생성' })
  createTeam(
    @Body()
    body: {
      team_name: string;
      founded_year?: number;
      description?: string;
      primary_color?: string;
      secondary_color?: string;
      logo?: string;
    },
  ) {
    return this.adminTeamsService.createTeam(body);
  }

  // ── PUT /admin/teams/:teamId ──
  @Put('teams/:teamId')
  @ApiOperation({ summary: '팀 수정' })
  updateTeam(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body()
    body: {
      team_name?: string;
      founded_year?: number;
      description?: string;
      primary_color?: string;
      secondary_color?: string;
      logo?: string;
    },
  ) {
    return this.adminTeamsService.updateTeam(teamId, body);
  }

  // ── DELETE /admin/teams/:teamId ──
  @Delete('teams/:teamId')
  @ApiOperation({ summary: '팀 삭제' })
  deleteTeam(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.adminTeamsService.deleteTeam(teamId);
  }

  // ── POST /admin/coaches ──
  @Post('coaches')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '감독 생성' })
  createCoach(
    @Body()
    body: {
      name: string;
      birth_date?: string;
      nationality?: string;
      profile_image_url?: string;
    },
  ) {
    return this.adminTeamsService.createCoach(body);
  }

  // ── PUT /admin/coaches/:coachId ──
  @Put('coaches/:coachId')
  @ApiOperation({ summary: '감독 수정' })
  updateCoach(
    @Param('coachId', ParseIntPipe) coachId: number,
    @Body()
    body: {
      name?: string;
      birth_date?: string;
      nationality?: string;
      profile_image_url?: string;
    },
  ) {
    return this.adminTeamsService.updateCoach(coachId, body);
  }

  // ── DELETE /admin/coaches/:coachId ──
  @Delete('coaches/:coachId')
  @ApiOperation({ summary: '감독 삭제' })
  deleteCoach(@Param('coachId', ParseIntPipe) coachId: number) {
    return this.adminTeamsService.deleteCoach(coachId);
  }
}
