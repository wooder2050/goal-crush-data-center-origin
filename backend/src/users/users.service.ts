import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9\s]+$/;
const NICKNAME_MIN_LENGTH = 2;
const NICKNAME_MAX_LENGTH = 10;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPoints(userId: string) {
    if (!userId) {
      throw new BadRequestException('userId가 필요합니다');
    }

    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: { user_id: true, korean_nickname: true },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    const totalPointsResult = await this.prisma.userPoint.aggregate({
      where: { user_id: userId },
      _sum: { points_change: true },
    });

    const pointHistory = await this.prisma.userPoint.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    return {
      success: true,
      data: {
        user: { user_id: user.user_id, korean_nickname: user.korean_nickname },
        totalPoints: totalPointsResult._sum.points_change ?? 0,
        pointHistory,
      },
    };
  }

  async getProfile(userId: string) {
    const dbUser = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        korean_nickname: true,
        display_name: true,
        profile_image_url: true,
        bio: true,
        is_active: true,
        is_admin: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!dbUser) {
      return { user: null, hasNickname: false };
    }

    return {
      user: dbUser,
      hasNickname:
        !!dbUser.korean_nickname &&
        !dbUser.korean_nickname.startsWith('임시사용자'),
    };
  }

  async updateProfile(userId: string, koreanNickname: string) {
    this.validateNickname(koreanNickname);

    const existingUser = await this.prisma.user.findFirst({
      where: {
        korean_nickname: koreanNickname,
        NOT: { user_id: userId },
      },
    });

    if (existingUser) {
      throw new BadRequestException('이미 사용 중인 닉네임입니다');
    }

    const user = await this.prisma.user.upsert({
      where: { user_id: userId },
      update: { korean_nickname: koreanNickname, updated_at: new Date() },
      create: { user_id: userId, korean_nickname: koreanNickname },
    });

    return { user, message: '프로필이 성공적으로 저장되었습니다' };
  }

  async checkNickname(userId: string, koreanNickname: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        korean_nickname: koreanNickname,
        NOT: { user_id: userId },
      },
    });

    if (existingUser) {
      return { isAvailable: false, message: '이미 사용 중인 닉네임입니다' };
    }

    return { isAvailable: true, message: '사용 가능한 닉네임입니다' };
  }

  private validateNickname(nickname: string): void {
    if (!nickname || typeof nickname !== 'string') {
      throw new BadRequestException('닉네임을 입력해주세요');
    }

    const trimmed = nickname.trim();

    if (trimmed.length < NICKNAME_MIN_LENGTH || trimmed.length > NICKNAME_MAX_LENGTH) {
      throw new BadRequestException(
        `닉네임은 ${NICKNAME_MIN_LENGTH}자 이상 ${NICKNAME_MAX_LENGTH}자 이하로 입력해주세요`,
      );
    }

    if (!NICKNAME_REGEX.test(trimmed)) {
      throw new BadRequestException(
        '닉네임은 한글, 영문, 숫자, 공백만 사용할 수 있습니다',
      );
    }
  }
}
