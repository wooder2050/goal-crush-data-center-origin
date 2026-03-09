import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── helpers ──

  private readonly teamSelect = {
    team_id: true,
    team_name: true,
    logo: true,
    primary_color: true,
    secondary_color: true,
  } as const;

  private hasMatchStarted(match: { match_date: Date; status: string | null }): boolean {
    const now = new Date();
    return match.match_date < now && match.status !== 'scheduled';
  }

  // ── GET: 특정 경기의 사용자 응원 조회 ──

  async findByMatch(userId: string, matchId: number) {
    const support = await this.prisma.matchSupport.findFirst({
      where: {
        user_id: userId,
        match_id: matchId,
      },
      include: {
        team: { select: this.teamSelect },
      },
    });

    return { support };
  }

  // ── GET: 사용자의 모든 응원 목록 조회 ──

  async findAll(userId: string) {
    const supports = await this.prisma.matchSupport.findMany({
      where: { user_id: userId },
      include: {
        team: { select: this.teamSelect },
        match: {
          select: {
            match_id: true,
            match_date: true,
            status: true,
            home_team: {
              select: {
                team_id: true,
                team_name: true,
                logo: true,
              },
            },
            away_team: {
              select: {
                team_id: true,
                team_name: true,
                logo: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return { supports };
  }

  // ── POST: 응원 등록 (upsert) ──

  async create(
    userId: string,
    body: {
      matchId: number;
      teamId: number;
      supportType?: string;
      message?: string;
    },
  ) {
    const { matchId, teamId, supportType = 'cheer', message } = body;

    if (!matchId || !teamId) {
      throw new BadRequestException('Match ID and Team ID are required');
    }

    // 경기 존재 여부 확인
    const match = await this.prisma.match.findUnique({
      where: { match_id: matchId },
      include: {
        home_team: { select: { team_id: true } },
        away_team: { select: { team_id: true } },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // 선택한 팀이 해당 경기에 참여하는지 확인
    const isValidTeam = teamId === match.home_team?.team_id || teamId === match.away_team?.team_id;

    if (!isValidTeam) {
      throw new BadRequestException('Team is not participating in this match');
    }

    // 경기가 이미 시작되었는지 확인
    if (this.hasMatchStarted(match as { match_date: Date; status: string | null })) {
      throw new BadRequestException('Cannot support after match has started');
    }

    // 기존 응원이 있다면 업데이트, 없다면 생성
    const existingSupport = await this.prisma.matchSupport.findFirst({
      where: {
        user_id: userId,
        match_id: matchId,
      },
    });

    const support = existingSupport
      ? await this.prisma.matchSupport.update({
          where: { support_id: existingSupport.support_id },
          data: {
            team_id: teamId,
            support_type: supportType,
            message: message || null,
            updated_at: new Date(),
          },
          include: { team: { select: this.teamSelect } },
        })
      : await this.prisma.matchSupport.create({
          data: {
            user_id: userId,
            match_id: matchId,
            team_id: teamId,
            support_type: supportType,
            message: message || null,
          },
          include: { team: { select: this.teamSelect } },
        });

    return { support };
  }

  // ── DELETE: 경기 기준 응원 취소 ──

  async removeByMatch(userId: string, matchId: number) {
    if (!matchId) {
      throw new BadRequestException('Match ID is required');
    }

    const match = await this.prisma.match.findUnique({
      where: { match_id: matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (this.hasMatchStarted(match as { match_date: Date; status: string | null })) {
      throw new BadRequestException('Cannot cancel support after match has started');
    }

    await this.prisma.matchSupport.deleteMany({
      where: {
        user_id: userId,
        match_id: matchId,
      },
    });

    return { message: 'Support cancelled successfully' };
  }

  // ── DELETE: ID 기준 응원 삭제 ──

  async removeById(userId: string, supportId: number) {
    const existingSupport = await this.prisma.matchSupport.findUnique({
      where: { support_id: supportId },
      include: { match: true },
    });

    if (!existingSupport) {
      throw new NotFoundException('Support not found');
    }

    if (existingSupport.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own support');
    }

    if (
      this.hasMatchStarted(existingSupport.match as { match_date: Date; status: string | null })
    ) {
      throw new BadRequestException('Cannot delete support after match has started');
    }

    await this.prisma.matchSupport.delete({
      where: { support_id: supportId },
    });

    return { message: 'Support deleted successfully' };
  }
}
