import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard, AuthUser } from '../common/guards/auth.guard';
import { SupportsService } from './supports.service';

@ApiTags('Supports')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('supports')
export class SupportsController {
  constructor(private readonly supportsService: SupportsService) {}

  // ── GET /supports ──

  @Get()
  @ApiOperation({
    summary: '응원 조회',
    description:
      'matchId가 있으면 특정 경기의 사용자 응원을, 없으면 모든 응원 목록을 반환합니다',
  })
  @ApiQuery({ name: 'matchId', required: false, type: Number, description: '경기 ID' })
  findSupports(
    @Req() req: { user: AuthUser },
    @Query('matchId') matchId?: string,
  ) {
    const userId = req.user.userId;

    if (matchId) {
      return this.supportsService.findByMatch(userId, parseInt(matchId, 10));
    }

    return this.supportsService.findAll(userId);
  }

  // ── POST /supports ──

  @Post()
  @ApiOperation({
    summary: '응원 등록',
    description: '경기에 대한 응원을 등록합니다 (기존 응원이 있으면 업데이트)',
  })
  create(
    @Req() req: { user: AuthUser },
    @Body()
    body: {
      matchId: number;
      teamId: number;
      supportType?: string;
      message?: string;
    },
  ) {
    return this.supportsService.create(req.user.userId, body);
  }

  // ── DELETE /supports?matchId=X ──

  @Delete()
  @ApiOperation({
    summary: '응원 취소 (경기 기준)',
    description: '특정 경기에 대한 사용자의 응원을 삭제합니다',
  })
  @ApiQuery({ name: 'matchId', required: true, type: Number, description: '경기 ID' })
  removeByMatch(
    @Req() req: { user: AuthUser },
    @Query('matchId') matchId: string,
  ) {
    return this.supportsService.removeByMatch(req.user.userId, parseInt(matchId, 10));
  }

  // ── DELETE /supports/:supportId ──

  @Delete(':supportId')
  @ApiOperation({
    summary: '응원 삭제 (ID 기준)',
    description: '특정 응원을 ID로 삭제합니다 (본인 응원만 삭제 가능)',
  })
  @ApiParam({ name: 'supportId', type: Number, description: '응원 ID' })
  removeById(
    @Req() req: { user: AuthUser },
    @Param('supportId', ParseIntPipe) supportId: number,
  ) {
    return this.supportsService.removeById(req.user.userId, supportId);
  }
}
