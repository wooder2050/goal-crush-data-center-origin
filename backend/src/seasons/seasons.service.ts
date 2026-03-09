import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SeasonCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type LeagueType = 'super' | 'challenge' | 'playoff' | 'cup' | 'g-league' | 'other';

type ChampionLabel = '우승팀' | '승격팀' | '1위' | '현재 1위' | null;

export interface ChampionTeam {
  team_id: number | null;
  team_name: string | null;
  logo: string | null;
}

interface FindAllParams {
  name?: string;
  year?: number;
  page?: number;
  limit?: number;
}

interface CreateSeasonDto {
  season_name: string;
  year: number;
  category?: string;
  start_date?: string;
  end_date?: string;
}

interface UpdateSeasonDto {
  season_name: string;
  year: number;
  category?: string;
  start_date?: string;
  end_date?: string;
}

const VALID_CATEGORIES = [
  'SUPER_LEAGUE',
  'CHALLENGE_LEAGUE',
  'G_LEAGUE',
  'PLAYOFF',
  'SBS_CUP',
  'CHAMPION_MATCH',
  'GIFA_CUP',
  'OTHER',
];

@Injectable()
export class SeasonsService {
  constructor(private readonly prisma: PrismaService) {}

  private inferLeague(seasonName: string | null): LeagueType {
    if (!seasonName) return 'other';
    const name = seasonName.toLowerCase();
    if (name.includes('super') || name.includes('슈퍼')) return 'super';
    if (name.includes('challenge') || name.includes('챌린지')) return 'challenge';
    if (name.includes('playoff') || name.includes('플레이오프')) return 'playoff';
    if (name.includes('champion') || name.includes('챔피언')) return 'cup';
    if (name.includes('sbs') || name.includes('cup') || name.includes('컵')) return 'cup';
    if (name.includes('g-league') || name.includes('g리그') || name.includes('G리그'))
      return 'g-league';
    return 'other';
  }

  private validateSeasonInput(data: { season_name: string; year: number }) {
    if (!data.season_name || !data.year) {
      throw new BadRequestException('시즌명과 연도는 필수입니다.');
    }
    if (data.season_name.length < 3 || data.season_name.length > 100) {
      throw new BadRequestException('시즌명은 3자 이상 100자 이하여야 합니다.');
    }
    if (isNaN(data.year) || data.year < 2020 || data.year > 2030) {
      throw new BadRequestException('연도는 2020년에서 2030년 사이여야 합니다.');
    }
  }

  private validateCategory(category?: string) {
    if (category && !VALID_CATEGORIES.includes(category)) {
      throw new BadRequestException('유효하지 않은 카테고리입니다.');
    }
  }

  private validateDates(startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        throw new BadRequestException('시작일은 종료일보다 이전이어야 합니다.');
      }
    }
  }

  async findAll(params: FindAllParams) {
    const { name, year, page, limit } = params;
    const isPaginated = page && limit;

    const whereClause = {
      ...(name && { season_name: { contains: name, mode: 'insensitive' as const } }),
      ...(year && { year }),
    };

    const [seasons, totalCount] = await Promise.all([
      this.prisma.season.findMany({
        where: whereClause,
        include: { _count: { select: { matches: true } } },
        orderBy: { season_id: 'desc' },
        ...(isPaginated && { skip: (page - 1) * limit, take: limit }),
      }),
      isPaginated ? this.prisma.season.count({ where: whereClause }) : Promise.resolve(0),
    ]);

    const seasonIds = seasons.map((s) => s.season_id);

    const [winners, teamSeasonNames] = await Promise.all([
      this.prisma.standing.findMany({
        where: { season_id: { in: seasonIds }, position: 1 },
        select: {
          season_id: true,
          team: { select: { team_id: true, team_name: true, logo: true } },
        },
      }),
      this.prisma.teamSeasonName.findMany({
        where: { season_id: { in: seasonIds } },
        select: { team_id: true, season_id: true, team_name: true },
      }),
    ]);

    const teamSeasonNameMap = new Map<string, string>();
    for (const tsn of teamSeasonNames) {
      teamSeasonNameMap.set(`${tsn.season_id}-${tsn.team_id}`, tsn.team_name);
    }

    const winnersBySeason = new Map<number, ChampionTeam[]>();
    for (const w of winners) {
      if (w.season_id == null) continue;
      const arr = winnersBySeason.get(w.season_id) ?? [];
      const seasonTeamName =
        w.team?.team_id != null
          ? (teamSeasonNameMap.get(`${w.season_id}-${w.team.team_id}`) ?? w.team?.team_name)
          : w.team?.team_name;
      arr.push({
        team_id: w.team?.team_id ?? null,
        team_name: seasonTeamName ?? null,
        logo: w.team?.logo ?? null,
      });
      winnersBySeason.set(w.season_id, arr);
    }

    const items = seasons.map((season) => {
      const league = this.inferLeague(season.season_name);
      const pilotSeason = season.season_id === 1 || /파일럿|pilot/i.test(season.season_name);
      const firstSeason = season.season_id === 2;
      const secondSeason = season.season_id === 3;
      const isCompleted = Boolean(season.end_date);

      let label: ChampionLabel = null;
      let teams: ChampionTeam[] = [];

      if (isCompleted) {
        if (
          league === 'super' ||
          league === 'cup' ||
          league === 'g-league' ||
          pilotSeason ||
          firstSeason
        ) {
          const arr = winnersBySeason.get(season.season_id) ?? [];
          label = '우승팀';
          teams = arr[0] ? [arr[0]] : [];
        } else if (league === 'challenge' || league === 'playoff') {
          const arr = winnersBySeason.get(season.season_id) ?? [];
          label = '승격팀';
          teams = arr[0] ? [arr[0]] : [];
        } else if (secondSeason) {
          const arr = winnersBySeason.get(season.season_id) ?? [];
          label = '1위';
          teams = arr;
        }
      } else {
        if (league === 'super' || league === 'cup' || pilotSeason || firstSeason) {
          const arr = winnersBySeason.get(season.season_id) ?? [];
          label = '1위';
          teams = arr[0] ? [arr[0]] : [];
        } else if (league === 'g-league' || secondSeason) {
          const arr = winnersBySeason.get(season.season_id) ?? [];
          label = arr.length > 0 ? '현재 1위' : null;
          teams = arr;
        } else {
          const arr = winnersBySeason.get(season.season_id) ?? [];
          label = arr[0] ? '현재 1위' : null;
          teams = arr[0] ? [arr[0]] : [];
        }
      }

      const first = teams.length > 0 ? teams[0] : null;
      return {
        ...season,
        match_count: season._count.matches,
        champion_team_id: first?.team_id ?? null,
        champion_team_name: first?.team_name ?? null,
        champion_team_logo: first?.logo ?? null,
        champion_label: label,
        champion_teams: teams,
      };
    });

    if (isPaginated) {
      const totalPages = Math.ceil(totalCount / limit);
      return {
        items,
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        nextPage: page < totalPages ? page + 1 : null,
      };
    }

    return items;
  }

  async findOne(seasonId: number) {
    const season = await this.prisma.season.findUnique({
      where: { season_id: seasonId },
      include: { _count: { select: { matches: true } } },
    });

    if (!season) {
      throw new NotFoundException('시즌을 찾을 수 없습니다.');
    }

    return season;
  }

  async findSimple() {
    const seasons = await this.prisma.season.findMany({
      select: { season_id: true, season_name: true, year: true },
      orderBy: { season_id: 'desc' },
    });
    return { data: seasons };
  }

  async findSummary() {
    return this.prisma.teamSeasonStats.findMany({
      include: {
        team: { select: { team_id: true, team_name: true } },
        season: { select: { season_id: true, season_name: true, year: true } },
      },
      orderBy: [{ season_id: 'asc' }, { points: 'desc' }],
    });
  }

  async findSeasonSummary(seasonId: number) {
    const season = await this.prisma.season.findUnique({
      where: { season_id: seasonId },
      include: {
        matches: {
          select: {
            match_id: true,
            status: true,
            penalty_home_score: true,
            penalty_away_score: true,
          },
        },
        team_seasons: {
          include: { team: { select: { team_id: true, team_name: true } } },
        },
      },
    });

    if (!season) {
      throw new NotFoundException('시즌을 찾을 수 없습니다.');
    }

    const totalMatches = season.matches.length;
    const completedMatches = season.matches.filter((m) => m.status === 'completed').length;
    const penaltyMatches = season.matches.filter(
      (m) => m.penalty_home_score !== null || m.penalty_away_score !== null,
    ).length;
    const participatingTeams = season.team_seasons.length;
    const completionRate = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

    return [
      {
        season_id: season.season_id,
        season_name: season.season_name,
        year: season.year,
        total_matches: totalMatches,
        participating_teams: participatingTeams,
        completed_matches: completedMatches,
        penalty_matches: penaltyMatches,
        completion_rate: Math.round(completionRate * 100) / 100,
      },
    ];
  }

  async findStanding(seasonId: number) {
    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: { season_id: seasonId },
      select: { team_id: true, team_name: true },
    });
    const teamSeasonNamesMap = new Map<number, string>();
    teamSeasonNames.forEach((tsn) => teamSeasonNamesMap.set(tsn.team_id, tsn.team_name));

    const standings = await this.prisma.standing.findMany({
      where: { season_id: seasonId },
      select: {
        standing_id: true,
        season_id: true,
        team_id: true,
        position: true,
        matches_played: true,
        wins: true,
        draws: true,
        losses: true,
        goals_for: true,
        goals_against: true,
        goal_difference: true,
        points: true,
        form: true,
        created_at: true,
        updated_at: true,
        team: { select: { team_id: true, team_name: true, logo: true } },
      },
      orderBy: { position: 'asc' },
    });

    return standings.map((standing) => {
      const seasonTeamName =
        standing.team_id != null
          ? (teamSeasonNamesMap.get(standing.team_id) ?? standing.team?.team_name)
          : standing.team?.team_name;

      return {
        ...standing,
        team: standing.team
          ? { ...standing.team, team_name: seasonTeamName ?? standing.team.team_name }
          : null,
      };
    });
  }

  async findTeamPlayers(seasonId: number, teamId: number) {
    const players = await this.prisma.playerMatchStats.findMany({
      where: { match: { season_id: seasonId }, team_id: teamId },
      select: {
        player: { select: { player_id: true, name: true, jersey_number: true } },
        position: true,
      },
    });

    const uniquePlayersMap = new Map();
    players.forEach((p) => {
      if (p.player?.player_id && !uniquePlayersMap.has(p.player.player_id)) {
        uniquePlayersMap.set(p.player.player_id, {
          player_id: p.player.player_id,
          player_name: p.player.name || 'Unknown',
          jersey_number: p.player.jersey_number,
          position: p.position || 'Unknown',
        });
      }
    });

    return Array.from(uniquePlayersMap.values());
  }

  async create(dto: CreateSeasonDto) {
    this.validateSeasonInput({ season_name: dto.season_name, year: dto.year });
    this.validateCategory(dto.category);
    this.validateDates(dto.start_date, dto.end_date);

    const existingSeason = await this.prisma.season.findFirst({
      where: { season_name: dto.season_name },
    });
    if (existingSeason) {
      throw new BadRequestException('동일한 시즌명이 이미 존재합니다.');
    }

    const newSeason = await this.prisma.season.create({
      data: {
        season_name: dto.season_name,
        year: dto.year,
        category: (dto.category as SeasonCategory) || null,
        start_date: dto.start_date ? new Date(dto.start_date) : null,
        end_date: dto.end_date ? new Date(dto.end_date) : null,
      },
    });

    return { message: '시즌이 성공적으로 생성되었습니다.', season: newSeason };
  }

  async update(seasonId: number, dto: UpdateSeasonDto) {
    this.validateSeasonInput({ season_name: dto.season_name, year: dto.year });
    this.validateCategory(dto.category);
    this.validateDates(dto.start_date, dto.end_date);

    const existingSeason = await this.prisma.season.findUnique({
      where: { season_id: seasonId },
    });
    if (!existingSeason) {
      throw new NotFoundException('시즌을 찾을 수 없습니다.');
    }

    const duplicateSeason = await this.prisma.season.findFirst({
      where: { season_name: dto.season_name, season_id: { not: seasonId } },
    });
    if (duplicateSeason) {
      throw new BadRequestException('동일한 시즌명이 이미 존재합니다.');
    }

    const updatedSeason = await this.prisma.season.update({
      where: { season_id: seasonId },
      data: {
        season_name: dto.season_name,
        year: dto.year,
        category: (dto.category as SeasonCategory) || null,
        start_date: dto.start_date ? new Date(dto.start_date) : null,
        end_date: dto.end_date ? new Date(dto.end_date) : null,
      },
    });

    return { message: '시즌이 성공적으로 수정되었습니다.', season: updatedSeason };
  }

  async remove(seasonId: number) {
    const existingSeason = await this.prisma.season.findUnique({
      where: { season_id: seasonId },
    });
    if (!existingSeason) {
      throw new NotFoundException('존재하지 않는 시즌입니다.');
    }

    const matchCount = await this.prisma.match.count({ where: { season_id: seasonId } });
    if (matchCount > 0) {
      throw new BadRequestException({
        error: '경기가 있는 시즌은 삭제할 수 없습니다.',
        matchCount,
        seasonName: existingSeason.season_name,
      });
    }

    const standingCount = await this.prisma.standing.count({ where: { season_id: seasonId } });
    if (standingCount > 0) {
      throw new BadRequestException({
        error: '순위 데이터가 있는 시즌은 삭제할 수 없습니다.',
        relatedDataCount: standingCount,
        seasonName: existingSeason.season_name,
      });
    }

    await this.prisma.season.delete({ where: { season_id: seasonId } });

    return {
      message: '시즌이 삭제되었습니다.',
      deletedSeason: { id: seasonId, name: existingSeason.season_name },
    };
  }
}
