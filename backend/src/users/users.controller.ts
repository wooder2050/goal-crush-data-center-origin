import { Controller, Get, Put, Post, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard, AuthUser } from '../common/guards/auth.guard';
import { UsersService } from './users.service';

@ApiTags('User Points')
@Controller('user')
export class UserPointsController {
  constructor(private readonly usersService: UsersService) {}

  @Get('points')
  @ApiOperation({
    summary: '사용자 포인트 조회',
    description: '특정 사용자의 총 포인트와 포인트 내역을 조회합니다',
  })
  @ApiQuery({ name: 'userId', required: true, description: '사용자 ID' })
  getPoints(@Query('userId') userId: string) {
    return this.usersService.getPoints(userId);
  }
}

@ApiTags('Users Profile')
@Controller('users')
export class UsersProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '프로필 조회',
    description: '로그인한 사용자의 프로필 정보를 반환합니다',
  })
  getProfile(@Req() req: { user: AuthUser }) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Put('profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '프로필 저장',
    description: '로그인한 사용자의 닉네임을 저장합니다',
  })
  updateProfile(
    @Req() req: { user: AuthUser },
    @Body() body: { korean_nickname: string },
  ) {
    return this.usersService.updateProfile(req.user.userId, body.korean_nickname);
  }

  @Post('profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '닉네임 중복 확인',
    description: '닉네임이 사용 가능한지 확인합니다',
  })
  checkNickname(
    @Req() req: { user: AuthUser },
    @Body() body: { korean_nickname: string },
  ) {
    return this.usersService.checkNickname(req.user.userId, body.korean_nickname);
  }
}
