import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminTeamsService {
  private readonly logger = new Logger(AdminTeamsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── POST /admin/teams ──
  async createTeam(data: {
    team_name: string;
    founded_year?: number;
    description?: string;
    primary_color?: string;
    secondary_color?: string;
    logo?: string;
  }) {
    if (!data.team_name || data.team_name.length === 0) {
      throw new BadRequestException('team_name is required');
    }
    if (data.team_name.length > 100) {
      throw new BadRequestException('team_name must be 100 characters or less');
    }

    // 팀명 중복 확인
    const existingTeam = await this.prisma.team.findUnique({
      where: { team_name: data.team_name },
    });

    if (existingTeam) {
      throw new BadRequestException('Team name already exists');
    }

    return this.prisma.team.create({
      data: {
        team_name: data.team_name,
        founded_year: data.founded_year,
        description: data.description,
        primary_color: data.primary_color || '#000000',
        secondary_color: data.secondary_color || '#FFFFFF',
        logo: data.logo,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  // ── PUT /admin/teams/:teamId ──
  async updateTeam(
    teamId: number,
    data: {
      team_name?: string;
      founded_year?: number;
      description?: string;
      primary_color?: string;
      secondary_color?: string;
      logo?: string;
    },
  ) {
    const existingTeam = await this.prisma.team.findUnique({
      where: { team_id: teamId },
    });

    if (!existingTeam) {
      throw new NotFoundException('Team not found');
    }

    // 팀명이 변경되는 경우 중복 확인
    if (data.team_name && data.team_name !== existingTeam.team_name) {
      const duplicateTeam = await this.prisma.team.findUnique({
        where: { team_name: data.team_name },
      });

      if (duplicateTeam) {
        throw new BadRequestException('Team name already exists');
      }
    }

    return this.prisma.team.update({
      where: { team_id: teamId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  // ── DELETE /admin/teams/:teamId ──
  async deleteTeam(teamId: number) {
    const existingTeam = await this.prisma.team.findUnique({
      where: { team_id: teamId },
    });

    if (!existingTeam) {
      throw new NotFoundException('Team not found');
    }

    const [matchCount, playerHistoryCount] = await this.prisma.$transaction([
      this.prisma.match.count({
        where: { OR: [{ home_team_id: teamId }, { away_team_id: teamId }] },
      }),
      this.prisma.playerTeamHistory.count({
        where: { team_id: teamId },
      }),
    ]);

    if (matchCount > 0 || playerHistoryCount > 0) {
      throw new BadRequestException({
        error: 'Cannot delete team with related matches or player history',
        details: { matches: matchCount, playerHistory: playerHistoryCount },
      });
    }

    await this.prisma.team.delete({ where: { team_id: teamId } });
    return { message: 'Team deleted successfully' };
  }

  // ── POST /admin/coaches ──
  async createCoach(data: {
    name: string;
    birth_date?: string;
    nationality?: string;
    profile_image_url?: string;
  }) {
    if (!data.name || data.name.length === 0) {
      throw new BadRequestException('name is required');
    }
    if (data.name.length > 255) {
      throw new BadRequestException('name must be 255 characters or less');
    }

    // 감독명 중복 확인
    const existingCoach = await this.prisma.coach.findFirst({
      where: { name: data.name },
    });

    if (existingCoach) {
      throw new BadRequestException('Coach name already exists');
    }

    return this.prisma.coach.create({
      data: {
        name: data.name,
        birth_date: data.birth_date ? new Date(data.birth_date) : null,
        nationality: data.nationality,
        profile_image_url: data.profile_image_url,
      },
    });
  }

  // ── PUT /admin/coaches/:coachId ──
  async updateCoach(
    coachId: number,
    data: {
      name?: string;
      birth_date?: string;
      nationality?: string;
      profile_image_url?: string;
    },
  ) {
    const existingCoach = await this.prisma.coach.findUnique({
      where: { coach_id: coachId },
    });

    if (!existingCoach) {
      throw new NotFoundException('Coach not found');
    }

    // 감독명이 변경되는 경우 중복 확인
    if (data.name && data.name !== existingCoach.name) {
      const duplicateCoach = await this.prisma.coach.findFirst({
        where: { name: data.name },
      });

      if (duplicateCoach) {
        throw new BadRequestException('Coach name already exists');
      }
    }

    const updateData: {
      name?: string;
      nationality?: string;
      profile_image_url?: string;
      birth_date?: Date | null;
    } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.nationality !== undefined) updateData.nationality = data.nationality;
    if (data.profile_image_url !== undefined) updateData.profile_image_url = data.profile_image_url;
    if (data.birth_date !== undefined) {
      updateData.birth_date = data.birth_date ? new Date(data.birth_date) : null;
    }

    return this.prisma.coach.update({
      where: { coach_id: coachId },
      data: updateData,
    });
  }

  // ── DELETE /admin/coaches/:coachId ──
  async deleteCoach(coachId: number) {
    const existingCoach = await this.prisma.coach.findUnique({
      where: { coach_id: coachId },
    });

    if (!existingCoach) {
      throw new NotFoundException('Coach not found');
    }

    const [matchCount, matchCoachCount, teamHistoryCount] = await this.prisma.$transaction([
      this.prisma.match.count({
        where: { OR: [{ home_coach_id: coachId }, { away_coach_id: coachId }] },
      }),
      this.prisma.matchCoach.count({
        where: { coach_id: coachId },
      }),
      this.prisma.teamCoachHistory.count({
        where: { coach_id: coachId },
      }),
    ]);

    if (matchCount > 0 || matchCoachCount > 0 || teamHistoryCount > 0) {
      throw new BadRequestException({
        error: 'Cannot delete coach with related matches or team history',
        details: {
          matches: matchCount,
          matchCoaches: matchCoachCount,
          teamHistory: teamHistoryCount,
        },
      });
    }

    await this.prisma.coach.delete({ where: { coach_id: coachId } });
    return { message: 'Coach deleted successfully' };
  }
}
