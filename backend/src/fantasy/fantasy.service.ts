import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ── Helper: player data formatting ──

interface PlayerTeamHistory {
  team: {
    team_id: number;
    team_name: string;
    logo: string | null;
    primary_color: string | null;
    secondary_color: string | null;
  };
}

interface PlayerSeasonStat {
  goals: number | null;
  assists: number | null;
  matches_played: number | null;
}

interface PlayerData {
  player_id: number;
  name: string;
  profile_image_url: string | null;
  jersey_number: number | null;
  player_team_history: PlayerTeamHistory[];
  player_season_stats: PlayerSeasonStat[];
}

function formatPlayer(player: PlayerData) {
  return {
    player_id: player.player_id,
    name: player.name,
    profile_image_url: player.profile_image_url || undefined,
    jersey_number: player.jersey_number || undefined,
    current_team: player.player_team_history[0]?.team
      ? {
          team_id: player.player_team_history[0].team.team_id,
          team_name: player.player_team_history[0].team.team_name,
          logo: player.player_team_history[0].team.logo || undefined,
          primary_color:
            player.player_team_history[0].team.primary_color || undefined,
          secondary_color:
            player.player_team_history[0].team.secondary_color || undefined,
        }
      : undefined,
    season_stats: player.player_season_stats[0]
      ? {
          goals: player.player_season_stats[0].goals || 0,
          assists: player.player_season_stats[0].assists || 0,
          matches_played: player.player_season_stats[0].matches_played || 0,
        }
      : { goals: 0, assists: 0, matches_played: 0 },
  };
}

// ── Helper: team composition validation ──

function validateTeamComposition(
  players: Array<{
    player_id: number;
    team_id?: number;
    name: string;
    position?: string;
  }>,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (players.length !== 5) {
    errors.push('정확히 5명의 선수를 선택해야 합니다.');
  }

  const teamCounts = new Map<number, number>();
  players.forEach((player) => {
    if (player.team_id) {
      teamCounts.set(
        player.team_id,
        (teamCounts.get(player.team_id) || 0) + 1,
      );
    }
  });

  teamCounts.forEach((count, teamId) => {
    if (count > 2) {
      errors.push(
        `같은 팀에서 최대 2명까지만 선택할 수 있습니다. (팀 ID: ${teamId})`,
      );
    }
  });

  const playerIds = players.map((p) => p.player_id);
  const uniquePlayerIds = new Set(playerIds);
  if (playerIds.length !== uniquePlayerIds.size) {
    errors.push('중복된 선수를 선택할 수 없습니다.');
  }

  return { isValid: errors.length === 0, errors };
}

// ── Helper: monthly season dates ──

function getMonthlySeasonDates(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const firstMonday = new Date(firstDay);
  const dayOfWeek = firstDay.getDay();

  let daysToAdd: number;
  if (dayOfWeek === 1) {
    daysToAdd = 0;
  } else if (dayOfWeek === 0) {
    daysToAdd = 1;
  } else {
    daysToAdd = 8 - dayOfWeek;
  }

  firstMonday.setDate(firstDay.getDate() + daysToAdd);

  const start = new Date(firstMonday);
  start.setUTCHours(15, 0, 0, 0);

  const end = new Date(firstMonday);
  end.setDate(firstMonday.getDate() + 15);
  end.setUTCHours(14, 59, 59, 999);

  const lock = new Date(firstMonday);
  lock.setDate(firstMonday.getDate() + 16);
  lock.setUTCHours(15, 0, 0, 0);

  return { start, end, lock };
}

// ── Helper: check if recommendation is outdated (24h) ──

function isRecommendationOutdated(createdAt: Date | undefined): boolean {
  if (!createdAt) return true;
  const now = new Date();
  const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  return diffHours > 24;
}

// ── Fantasy scoring constants ──

const FANTASY_RULES = {
  rules: {
    appearance: { played: 2, starter_bonus: 1 },
    attack: { goal: 4, assist: 2, multiple_goal_contribution_bonus: 1 },
    defense: {
      clean_sheet: 3,
      goalkeeper_save_per_2: 1,
      important_block_or_tackle: 2,
    },
    deductions: {
      yellow_card: -1,
      red_card: -2,
      own_goal: -2,
      missed_penalty: -2,
    },
  },
};

interface PlayerMatchPerformance {
  player_id: number;
  match_id: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  minutes_played: number;
  saves: number;
  position: string | null;
  team_id: number | null;
}

interface TeamMatchData {
  team_id: number;
  goals_conceded: number;
  is_clean_sheet: boolean;
}

function calculatePlayerFantasyPoints(
  performance: PlayerMatchPerformance,
  teamData: TeamMatchData,
  isStarter = false,
) {
  const rules = FANTASY_RULES.rules;

  let appearance_points = 0;
  let goal_points = 0;
  let assist_points = 0;
  let clean_sheet_points = 0;
  let save_points = 0;
  const defensive_points = 0;
  const penalty_points = 0;
  let card_points = 0;
  let bonus_points = 0;

  if (performance.minutes_played > 0) {
    appearance_points = rules.appearance.played;
    if (isStarter) {
      appearance_points += rules.appearance.starter_bonus;
    }
  }

  if (performance.goals > 0) {
    goal_points = performance.goals * rules.attack.goal;
    if (performance.goals + performance.assists >= 2) {
      bonus_points += rules.attack.multiple_goal_contribution_bonus;
    }
  }

  if (performance.assists > 0) {
    assist_points = performance.assists * rules.attack.assist;
  }

  if (
    teamData.is_clean_sheet &&
    performance.position &&
    ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(
      performance.position.toUpperCase(),
    )
  ) {
    clean_sheet_points = rules.defense.clean_sheet;
  }

  if (performance.saves > 0) {
    save_points =
      Math.floor(performance.saves / 2) * rules.defense.goalkeeper_save_per_2;
  }

  if (performance.yellow_cards > 0) {
    card_points += performance.yellow_cards * rules.deductions.yellow_card;
  }

  if (performance.red_cards > 0) {
    card_points += performance.red_cards * rules.deductions.red_card;
  }

  const total_points =
    appearance_points +
    goal_points +
    assist_points +
    clean_sheet_points +
    save_points +
    defensive_points +
    penalty_points +
    card_points +
    bonus_points;

  return {
    appearance_points,
    goal_points,
    assist_points,
    clean_sheet_points,
    save_points,
    defensive_points,
    penalty_points,
    card_points,
    bonus_points,
    total_points,
  };
}

// ── Player include for team history + stats ──

const playerSelectWithTeamAndStats = (seasonId: number) => ({
  player_id: true,
  name: true,
  profile_image_url: true,
  jersey_number: true,
  player_team_history: {
    where: { is_active: true },
    include: {
      team: {
        select: {
          team_id: true,
          team_name: true,
          logo: true,
          primary_color: true,
          secondary_color: true,
        },
      },
    },
    take: 1,
  },
  player_season_stats: {
    where: { season_id: seasonId },
    select: {
      goals: true,
      assists: true,
      matches_played: true,
    },
    take: 1,
  },
});

@Injectable()
export class FantasyService {
  constructor(private readonly prisma: PrismaService) {}

  // ── GET /fantasy/players/available ──

  async getAvailablePlayers(
    seasonIdStr: string,
    fantasySeasonIdStr: string,
  ) {
    if (!seasonIdStr || !fantasySeasonIdStr) {
      throw new BadRequestException(
        'season_id and fantasy_season_id are required',
      );
    }

    const seasonIdNum = parseInt(seasonIdStr);
    const fantasySeasonIdNum = parseInt(fantasySeasonIdStr);

    if (isNaN(seasonIdNum) || isNaN(fantasySeasonIdNum)) {
      throw new BadRequestException(
        'Invalid season_id or fantasy_season_id',
      );
    }

    const availablePlayers = await this.prisma.player.findMany({
      include: {
        player_team_history: {
          where: { season_id: seasonIdNum, is_active: true },
          include: {
            team: {
              select: {
                team_id: true,
                team_name: true,
                logo: true,
                primary_color: true,
                secondary_color: true,
              },
            },
          },
        },
        player_season_stats: {
          where: { season_id: seasonIdNum },
          select: { goals: true, assists: true, matches_played: true },
        },
      },
    });

    const recommendations =
      await this.prisma.fantasyAIRecommendation.findMany({
        where: { fantasy_season_id: fantasySeasonIdNum },
        include: {
          player: {
            include: {
              player_team_history: {
                where: { season_id: seasonIdNum, is_active: true },
                include: {
                  team: {
                    select: {
                      team_id: true,
                      team_name: true,
                      logo: true,
                      primary_color: true,
                      secondary_color: true,
                    },
                  },
                },
              },
              player_season_stats: {
                where: { season_id: seasonIdNum },
                select: { goals: true, assists: true, matches_played: true },
              },
            },
          },
        },
        orderBy: { recommendation_score: 'desc' },
        take: 20,
      });

    const formattedPlayers = availablePlayers
      .filter((player) => player.player_team_history.length > 0)
      .map((p) => formatPlayer(p as unknown as PlayerData));

    const recommendedPlayers = recommendations
      .map((rec) => formatPlayer(rec.player as unknown as PlayerData))
      .filter((player) => player.current_team);

    return { availablePlayers: formattedPlayers, recommendedPlayers };
  }

  // ── GET /fantasy/players/recommendations ──

  async getRecommendations(fantasySeasonIdStr: string, limitStr?: string) {
    const fantasySeasonId = parseInt(fantasySeasonIdStr);
    const limit = limitStr ? parseInt(limitStr) : 10;

    if (isNaN(fantasySeasonId)) {
      throw new BadRequestException('잘못된 쿼리 파라미터입니다.');
    }

    const fantasySeason = await this.prisma.fantasySeason.findUnique({
      where: { fantasy_season_id: fantasySeasonId },
      select: {
        fantasy_season_id: true,
        year: true,
        month: true,
        is_active: true,
        season_id: true,
      },
    });

    if (!fantasySeason) {
      throw new NotFoundException('판타지 시즌을 찾을 수 없습니다.');
    }

    const recommendationInclude = {
      player: {
        select: {
          player_id: true,
          name: true,
          profile_image_url: true,
          jersey_number: true,
          player_team_history: {
            where: { is_active: true },
            include: {
              team: {
                select: {
                  team_id: true,
                  team_name: true,
                  logo: true,
                  primary_color: true,
                  secondary_color: true,
                },
              },
            },
            take: 1,
          },
          player_season_stats: {
            where: { season_id: fantasySeason.season_id },
            take: 1,
          },
        },
      },
    } as const;

    let recommendations = await this.prisma.fantasyAIRecommendation.findMany({
      where: { fantasy_season_id: fantasySeasonId },
      include: recommendationInclude,
      orderBy: { recommendation_score: 'desc' },
      take: limit,
    });

    if (
      recommendations.length === 0 ||
      isRecommendationOutdated(recommendations[0]?.created_at)
    ) {
      await this.generateAIRecommendations(
        fantasySeasonId,
        fantasySeason.season_id,
      );

      recommendations = await this.prisma.fantasyAIRecommendation.findMany({
        where: { fantasy_season_id: fantasySeasonId },
        include: recommendationInclude,
        orderBy: { recommendation_score: 'desc' },
        take: limit,
      });
    }

    return {
      fantasy_season_id: fantasySeasonId,
      recommendations: recommendations.map((rec) => ({
        ...rec,
        player: {
          ...rec.player,
          current_team: rec.player.player_team_history[0]?.team || null,
          season_stats: rec.player.player_season_stats[0] || null,
        },
      })),
      generated_at: recommendations[0]?.created_at || new Date(),
    };
  }

  // ── POST /fantasy/players/recommendations ──

  async createRecommendations(fantasySeasonId: number) {
    if (!fantasySeasonId) {
      throw new BadRequestException('fantasy_season_id가 필요합니다.');
    }

    const fantasySeason = await this.prisma.fantasySeason.findUnique({
      where: { fantasy_season_id: fantasySeasonId },
    });

    if (!fantasySeason) {
      throw new NotFoundException('판타지 시즌을 찾을 수 없습니다.');
    }

    const result = await this.generateAIRecommendations(
      fantasySeasonId,
      fantasySeason.season_id,
    );

    return {
      message: 'AI 추천이 새로 생성되었습니다.',
      fantasy_season_id: fantasySeasonId,
      recommendations_count: result.length,
    };
  }

  // ── GET /fantasy/rankings ──

  async getRankings(
    fantasySeasonIdStr: string,
    pageStr?: string,
    limitStr?: string,
  ) {
    const fantasySeasonId = parseInt(fantasySeasonIdStr);
    const page = pageStr ? parseInt(pageStr) : 1;
    const limit = limitStr ? parseInt(limitStr) : 20;

    if (isNaN(fantasySeasonId)) {
      throw new BadRequestException('잘못된 쿼리 파라미터입니다.');
    }

    const fantasySeason = await this.prisma.fantasySeason.findUnique({
      where: { fantasy_season_id: fantasySeasonId },
      select: {
        fantasy_season_id: true,
        year: true,
        month: true,
        is_active: true,
        season: { select: { season_name: true, category: true } },
      },
    });

    if (!fantasySeason) {
      throw new NotFoundException('판타지 시즌을 찾을 수 없습니다.');
    }

    const skip = (page - 1) * limit;

    const rankings = await this.prisma.fantasyTeam.findMany({
      where: { fantasy_season_id: fantasySeasonId },
      include: {
        user: {
          select: {
            korean_nickname: true,
            display_name: true,
            profile_image_url: true,
          },
        },
        player_selections: {
          include: {
            player: {
              select: {
                player_id: true,
                name: true,
                profile_image_url: true,
                jersey_number: true,
                player_team_history: {
                  where: { is_active: true },
                  include: {
                    team: {
                      select: {
                        team_id: true,
                        team_name: true,
                        logo: true,
                        primary_color: true,
                        secondary_color: true,
                      },
                    },
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: { selection_order: 'asc' },
        },
      },
      orderBy: [{ total_points: 'desc' }, { created_at: 'asc' }],
      skip,
      take: limit,
    });

    const totalTeams = await this.prisma.fantasyTeam.count({
      where: { fantasy_season_id: fantasySeasonId },
    });

    const rankedTeams = rankings.map((team, index) => ({
      ...team,
      rank_position: skip + index + 1,
    }));

    return {
      fantasy_season: fantasySeason,
      rankings: rankedTeams,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalTeams / limit),
        total_teams: totalTeams,
        per_page: limit,
      },
    };
  }

  // ── POST /fantasy/rankings ──

  async createRankingSnapshot(fantasySeasonId: number) {
    if (!fantasySeasonId) {
      throw new BadRequestException('fantasy_season_id가 필요합니다.');
    }

    const fantasySeason = await this.prisma.fantasySeason.findUnique({
      where: { fantasy_season_id: fantasySeasonId },
    });

    if (!fantasySeason) {
      throw new NotFoundException('판타지 시즌을 찾을 수 없습니다.');
    }

    await this.prisma.fantasyRanking.deleteMany({
      where: { fantasy_season_id: fantasySeasonId },
    });

    const currentRankings = await this.prisma.fantasyTeam.findMany({
      where: { fantasy_season_id: fantasySeasonId },
      orderBy: [{ total_points: 'desc' }, { created_at: 'asc' }],
    });

    const rankingSnapshots = currentRankings.map((team, index) => ({
      fantasy_season_id: fantasySeasonId,
      user_id: team.user_id,
      fantasy_team_id: team.fantasy_team_id,
      rank_position: index + 1,
      total_points: team.total_points,
    }));

    await this.prisma.fantasyRanking.createMany({
      data: rankingSnapshots,
    });

    return {
      message: '랭킹 스냅샷이 생성되었습니다.',
      total_teams: rankingSnapshots.length,
    };
  }

  // ── GET /fantasy/rankings/:seasonId ──

  async getRankingsBySeason(
    fantasySeasonId: number,
    pageStr?: string,
    limitStr?: string,
    userRanking?: string,
    currentUserId?: string,
  ) {
    if (isNaN(fantasySeasonId)) {
      throw new BadRequestException('Invalid season_id');
    }

    // User ranking request
    if (userRanking === 'true') {
      if (!currentUserId) {
        throw new UnauthorizedException('Unauthorized');
      }

      const userTeam = await this.prisma.fantasyTeam.findUnique({
        where: {
          user_id_fantasy_season_id: {
            user_id: currentUserId,
            fantasy_season_id: fantasySeasonId,
          },
        },
      });

      if (!userTeam) {
        return { userRanking: null };
      }

      const betterTeamsCount = await this.prisma.fantasyTeam.count({
        where: {
          fantasy_season_id: fantasySeasonId,
          OR: [
            { total_points: { gt: userTeam.total_points } },
            {
              total_points: userTeam.total_points,
              created_at: { lt: userTeam.created_at },
            },
          ],
        },
      });

      return {
        userRanking: {
          fantasy_team_id: userTeam.fantasy_team_id,
          team_name: userTeam.team_name,
          total_points: userTeam.total_points,
          rank_position: betterTeamsCount + 1,
        },
      };
    }

    // Full rankings
    const page = pageStr ? parseInt(pageStr) : 1;
    const limit = limitStr ? parseInt(limitStr) : 20;

    const fantasySeason = await this.prisma.fantasySeason.findUnique({
      where: { fantasy_season_id: fantasySeasonId },
      include: {
        season: { select: { season_name: true, category: true } },
        _count: { select: { fantasy_teams: true } },
      },
    });

    if (!fantasySeason) {
      throw new NotFoundException('Fantasy season not found');
    }

    const skip = (page - 1) * limit;

    const rankings = await this.prisma.fantasyTeam.findMany({
      where: { fantasy_season_id: fantasySeasonId },
      include: {
        user: {
          select: {
            user_id: true,
            korean_nickname: true,
            display_name: true,
            profile_image_url: true,
          },
        },
        player_selections: {
          include: {
            player: {
              select: { name: true, profile_image_url: true },
            },
          },
          orderBy: { points_earned: 'desc' },
          take: 3,
        },
      },
      orderBy: [{ total_points: 'desc' }, { created_at: 'asc' }],
      skip,
      take: limit,
    });

    const rankedTeams = rankings.map((team, index) => ({
      fantasy_team_id: team.fantasy_team_id,
      team_name: team.team_name,
      total_points: team.total_points,
      rank_position: skip + index + 1,
      user: team.user,
      fantasy_team: {
        team_name: team.team_name,
        player_selections: team.player_selections,
      },
    }));

    const totalTeams = await this.prisma.fantasyTeam.count({
      where: { fantasy_season_id: fantasySeasonId },
    });

    return {
      fantasy_season: fantasySeason,
      rankings: rankedTeams,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalTeams / limit),
        total_teams: totalTeams,
        per_page: limit,
      },
    };
  }

  // ── POST /fantasy/scoring ──

  async calculateScoring(body: {
    type: string;
    match_id?: number;
    season_id?: number;
  }) {
    const { type } = body;

    if (type === 'match') {
      if (!body.match_id) {
        throw new BadRequestException('match_id가 필요합니다.');
      }
      const result = await this.calculateMatchFantasyScores(body.match_id);
      return {
        message: '경기 판타지 점수 계산이 완료되었습니다.',
        result,
      };
    } else if (type === 'season') {
      if (!body.season_id) {
        throw new BadRequestException('season_id가 필요합니다.');
      }
      const result = await this.recalculateSeasonFantasyScores(body.season_id);
      return {
        message: '시즌 판타지 점수 재계산이 완료되었습니다.',
        result,
      };
    } else {
      throw new BadRequestException(
        '잘못된 타입입니다. "match" 또는 "season"을 지정해주세요.',
      );
    }
  }

  // ── GET /fantasy/seasons ──

  async getSeasons(yearStr?: string, monthStr?: string, active?: string) {
    const where: Record<string, unknown> = {};

    if (yearStr) where.year = parseInt(yearStr);
    if (monthStr) where.month = parseInt(monthStr);
    if (active === 'true') where.is_active = true;

    return this.prisma.fantasySeason.findMany({
      where,
      include: {
        season: { select: { season_name: true, category: true } },
        _count: { select: { fantasy_teams: true } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  // ── POST /fantasy/seasons ──

  async createSeason(body: {
    season_id: number;
    year: number;
    month: number;
  }) {
    const { season_id, year, month } = body;

    if (!season_id || !year || !month || month < 1 || month > 12) {
      throw new BadRequestException('입력값이 올바르지 않습니다.');
    }

    const existingSeason = await this.prisma.fantasySeason.findUnique({
      where: { season_id_year_month: { season_id, year, month } },
    });

    if (existingSeason) {
      throw new BadRequestException(
        '이미 해당 월의 판타지 시즌이 존재합니다.',
      );
    }

    const dates = getMonthlySeasonDates(year, month);

    return this.prisma.fantasySeason.create({
      data: {
        season_id,
        year,
        month,
        start_date: dates.start,
        end_date: dates.end,
        lock_date: dates.lock,
        is_active: true,
      },
      include: {
        season: { select: { season_name: true, category: true } },
      },
    });
  }

  // ── GET /fantasy/seasons/:seasonId ──

  async getSeasonById(fantasySeasonId: number) {
    if (isNaN(fantasySeasonId)) {
      throw new BadRequestException('Invalid season_id');
    }

    const fantasySeason = await this.prisma.fantasySeason.findUnique({
      where: { fantasy_season_id: fantasySeasonId },
      include: {
        season: {
          select: { season_id: true, season_name: true, category: true },
        },
      },
    });

    if (!fantasySeason) {
      throw new NotFoundException('Fantasy season not found');
    }

    return fantasySeason;
  }

  // ── GET /fantasy/teams ──

  async getTeams(userId: string, fantasySeasonIdStr?: string) {
    const dbUser = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!dbUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (!fantasySeasonIdStr) {
      return this.prisma.fantasyTeam.findMany({
        where: { user_id: userId },
        include: {
          fantasy_season: {
            select: {
              fantasy_season_id: true,
              year: true,
              month: true,
              start_date: true,
              end_date: true,
              lock_date: true,
              is_active: true,
            },
          },
          player_selections: {
            include: {
              player: {
                select: {
                  player_id: true,
                  name: true,
                  profile_image_url: true,
                  jersey_number: true,
                  player_team_history: {
                    where: { is_active: true },
                    include: {
                      team: {
                        select: {
                          team_id: true,
                          team_name: true,
                          logo: true,
                          primary_color: true,
                          secondary_color: true,
                        },
                      },
                    },
                    take: 1,
                  },
                },
              },
            },
            orderBy: { selection_order: 'asc' },
          },
        },
        orderBy: { fantasy_season: { year: 'desc' } },
      });
    }

    const fantasySeasonId = parseInt(fantasySeasonIdStr);

    const fantasyTeam = await this.prisma.fantasyTeam.findUnique({
      where: {
        user_id_fantasy_season_id: {
          user_id: userId,
          fantasy_season_id: fantasySeasonId,
        },
      },
      include: {
        fantasy_season: {
          select: {
            year: true,
            month: true,
            start_date: true,
            end_date: true,
            lock_date: true,
            is_active: true,
          },
        },
        player_selections: {
          include: {
            player: {
              select: {
                player_id: true,
                name: true,
                profile_image_url: true,
                jersey_number: true,
                player_team_history: {
                  where: { is_active: true },
                  include: {
                    team: {
                      select: {
                        team_id: true,
                        team_name: true,
                        logo: true,
                        primary_color: true,
                        secondary_color: true,
                      },
                    },
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: { selection_order: 'asc' },
        },
      },
    });

    if (!fantasyTeam) {
      throw new NotFoundException('판타지 팀을 찾을 수 없습니다.');
    }

    return fantasyTeam;
  }

  // ── POST /fantasy/teams ──

  async createTeam(
    userId: string,
    body: {
      fantasy_season_id: number;
      team_name?: string;
      player_selections: Array<{ player_id: number; position: string }>;
    },
  ) {
    const { fantasy_season_id, team_name, player_selections } = body;
    const player_ids = player_selections.map((sel) => sel.player_id);

    const dbUser = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!dbUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const fantasySeason = await this.prisma.fantasySeason.findUnique({
      where: { fantasy_season_id },
    });

    if (!fantasySeason) {
      throw new NotFoundException('판타지 시즌을 찾을 수 없습니다.');
    }

    const existingTeam = await this.prisma.fantasyTeam.findUnique({
      where: {
        user_id_fantasy_season_id: { user_id: userId, fantasy_season_id },
      },
    });

    if (existingTeam) {
      throw new BadRequestException(
        '이미 해당 시즌의 판타지 팀이 존재합니다.',
      );
    }

    const players = await this.prisma.player.findMany({
      where: { player_id: { in: player_ids } },
      include: {
        player_team_history: {
          where: { is_active: true },
          include: {
            team: { select: { team_id: true, team_name: true } },
          },
          take: 1,
        },
      },
    });

    if (players.length !== player_ids.length) {
      throw new BadRequestException('일부 선수를 찾을 수 없습니다.');
    }

    const playerSelections = players.map((player) => ({
      player_id: player.player_id,
      team_id: player.player_team_history[0]?.team?.team_id,
      name: player.name,
      position: undefined,
    }));

    const validation = validateTeamComposition(playerSelections);
    if (!validation.isValid) {
      throw new BadRequestException({
        error: '팀 편성 규칙 위반',
        details: validation.errors,
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const fantasyTeam = await tx.fantasyTeam.create({
        data: {
          user_id: userId,
          fantasy_season_id,
          team_name,
          is_locked: false,
        },
      });

      const selectionsData = await Promise.all(
        player_selections.map((selection, index) =>
          tx.fantasyPlayerSelection.create({
            data: {
              fantasy_team_id: fantasyTeam.fantasy_team_id,
              player_id: selection.player_id,
              position: selection.position,
              selection_order: index + 1,
            },
          }),
        ),
      );

      return { fantasyTeam, playerSelections: selectionsData };
    });

    return this.prisma.fantasyTeam.findUnique({
      where: { fantasy_team_id: result.fantasyTeam.fantasy_team_id },
      include: {
        fantasy_season: {
          select: {
            year: true,
            month: true,
            start_date: true,
            end_date: true,
            lock_date: true,
          },
        },
        player_selections: {
          include: {
            player: {
              select: {
                player_id: true,
                name: true,
                profile_image_url: true,
                jersey_number: true,
                player_team_history: {
                  where: { is_active: true },
                  include: {
                    team: {
                      select: {
                        team_id: true,
                        team_name: true,
                        logo: true,
                        primary_color: true,
                        secondary_color: true,
                      },
                    },
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: { selection_order: 'asc' },
        },
      },
    });
  }

  // ── GET /fantasy/teams/:teamId ──

  async getTeamById(teamId: number) {
    if (isNaN(teamId)) {
      throw new BadRequestException('유효하지 않은 팀 ID입니다.');
    }

    const fantasyTeam = await this.prisma.fantasyTeam.findUnique({
      where: { fantasy_team_id: teamId },
      include: {
        user: {
          select: {
            korean_nickname: true,
            display_name: true,
            profile_image_url: true,
          },
        },
        fantasy_season: {
          select: {
            year: true,
            month: true,
            start_date: true,
            end_date: true,
            lock_date: true,
            is_active: true,
          },
        },
        player_selections: {
          include: {
            player: {
              select: {
                player_id: true,
                name: true,
                profile_image_url: true,
                jersey_number: true,
                player_team_history: {
                  where: { is_active: true },
                  include: {
                    team: {
                      select: {
                        team_id: true,
                        team_name: true,
                        logo: true,
                        primary_color: true,
                        secondary_color: true,
                      },
                    },
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: { selection_order: 'asc' },
        },
      },
    });

    if (!fantasyTeam) {
      throw new NotFoundException('판타지 팀을 찾을 수 없습니다.');
    }

    return fantasyTeam;
  }

  // ── PUT /fantasy/teams/:teamId ──

  async updateTeam(
    userId: string,
    teamId: number,
    body: {
      team_name?: string;
      player_selections?: Array<{
        player_id: number;
        position?: string;
      }>;
    },
  ) {
    if (isNaN(teamId)) {
      throw new BadRequestException('유효하지 않은 팀 ID입니다.');
    }

    const existingTeam = await this.prisma.fantasyTeam.findUnique({
      where: { fantasy_team_id: teamId },
      include: {
        fantasy_season: true,
        player_selections: {
          include: {
            player: {
              include: {
                player_team_history: {
                  where: { is_active: true },
                  include: {
                    team: { select: { team_id: true, team_name: true } },
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!existingTeam) {
      throw new NotFoundException('판타지 팀을 찾을 수 없습니다.');
    }

    if (existingTeam.user_id !== userId) {
      throw new ForbiddenException('팀을 수정할 권한이 없습니다.');
    }

    if (existingTeam.is_locked) {
      throw new BadRequestException('잠금된 팀은 수정할 수 없습니다.');
    }

    const updateData: Record<string, unknown> = {};

    if (body.team_name !== undefined) {
      updateData.team_name = body.team_name;
    }

    if (body.player_selections) {
      const player_ids = body.player_selections.map((sel) => sel.player_id);

      const players = await this.prisma.player.findMany({
        where: { player_id: { in: player_ids } },
        include: {
          player_team_history: {
            where: { is_active: true },
            include: {
              team: { select: { team_id: true, team_name: true } },
            },
            take: 1,
          },
        },
      });

      if (players.length !== player_ids.length) {
        const foundPlayerIds = players.map((p) => p.player_id);
        const missingPlayerIds = player_ids.filter(
          (id) => !foundPlayerIds.includes(id),
        );
        throw new BadRequestException({
          error: '일부 선수를 찾을 수 없습니다.',
          missing_player_ids: missingPlayerIds,
        });
      }

      const playerSelections = players.map((player) => {
        const requestedSelection = body.player_selections!.find(
          (sel) => sel.player_id === player.player_id,
        );
        return {
          player_id: player.player_id,
          team_id: player.player_team_history[0]?.team?.team_id,
          name: player.name,
          position: requestedSelection?.position,
        };
      });

      const validation = validateTeamComposition(playerSelections);
      if (!validation.isValid) {
        throw new BadRequestException({
          error: '팀 편성 규칙 위반',
          details: validation.errors,
        });
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.fantasyPlayerSelection.deleteMany({
          where: { fantasy_team_id: teamId },
        });

        await Promise.all(
          body.player_selections!.map((selection, index) =>
            tx.fantasyPlayerSelection.create({
              data: {
                fantasy_team_id: teamId,
                player_id: selection.player_id,
                position: selection.position || undefined,
                selection_order: index + 1,
              },
            }),
          ),
        );

        if (Object.keys(updateData).length > 0) {
          await tx.fantasyTeam.update({
            where: { fantasy_team_id: teamId },
            data: updateData,
          });
        }
      });
    } else if (Object.keys(updateData).length > 0) {
      await this.prisma.fantasyTeam.update({
        where: { fantasy_team_id: teamId },
        data: updateData,
      });
    }

    return this.prisma.fantasyTeam.findUnique({
      where: { fantasy_team_id: teamId },
      include: {
        fantasy_season: {
          select: {
            year: true,
            month: true,
            start_date: true,
            end_date: true,
            lock_date: true,
          },
        },
        player_selections: {
          include: {
            player: {
              select: {
                player_id: true,
                name: true,
                profile_image_url: true,
                jersey_number: true,
                player_team_history: {
                  where: { is_active: true },
                  include: {
                    team: {
                      select: {
                        team_id: true,
                        team_name: true,
                        logo: true,
                        primary_color: true,
                        secondary_color: true,
                      },
                    },
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: { selection_order: 'asc' },
        },
      },
    });
  }

  // ── DELETE /fantasy/teams/:teamId ──

  async deleteTeam(userId: string, teamId: number) {
    if (isNaN(teamId)) {
      throw new BadRequestException('유효하지 않은 팀 ID입니다.');
    }

    const existingTeam = await this.prisma.fantasyTeam.findUnique({
      where: { fantasy_team_id: teamId },
      include: { fantasy_season: true },
    });

    if (!existingTeam) {
      throw new NotFoundException('판타지 팀을 찾을 수 없습니다.');
    }

    if (existingTeam.user_id !== userId) {
      throw new ForbiddenException('팀을 삭제할 권한이 없습니다.');
    }

    if (existingTeam.is_locked) {
      throw new BadRequestException('잠금된 팀은 삭제할 수 없습니다.');
    }

    await this.prisma.fantasyTeam.delete({
      where: { fantasy_team_id: teamId },
    });

    return { message: '판타지 팀이 삭제되었습니다.' };
  }

  // ── GET /fantasy/teams/detail/:teamId ──

  async getTeamDetail(teamId: number) {
    if (isNaN(teamId)) {
      throw new BadRequestException('Invalid team_id');
    }

    const fantasyTeam = await this.prisma.fantasyTeam.findUnique({
      where: { fantasy_team_id: teamId },
      include: {
        user: {
          select: {
            korean_nickname: true,
            display_name: true,
            profile_image_url: true,
          },
        },
        fantasy_season: {
          include: {
            season: { select: { season_name: true, category: true } },
          },
        },
        player_selections: {
          include: {
            player: {
              select: {
                player_id: true,
                name: true,
                profile_image_url: true,
              },
            },
            match_performances: {
              select: {
                total_points: true,
                goal_points: true,
                assist_points: true,
              },
            },
          },
          orderBy: { points_earned: 'desc' },
        },
      },
    });

    if (!fantasyTeam) {
      throw new NotFoundException('Team not found');
    }

    const betterTeamsCount = await this.prisma.fantasyTeam.count({
      where: {
        fantasy_season_id: fantasyTeam.fantasy_season_id,
        OR: [
          { total_points: { gt: fantasyTeam.total_points } },
          {
            total_points: fantasyTeam.total_points,
            created_at: { lt: fantasyTeam.created_at },
          },
        ],
      },
    });

    const totalTeams = await this.prisma.fantasyTeam.count({
      where: { fantasy_season_id: fantasyTeam.fantasy_season_id },
    });

    const rankPosition = betterTeamsCount + 1;

    const defaultPositions = ['GK', 'DF', 'MF', 'FW', 'FW'] as const;

    const playersWithPosition = fantasyTeam.player_selections.map(
      (selection, index) => ({
        player_id: selection.player.player_id,
        name: selection.player.name,
        profile_image_url: selection.player.profile_image_url || undefined,
        points_earned: selection.points_earned,
        position: selection.position || defaultPositions[index] || 'FW',
        season_stats: {
          goals: Math.round(
            selection.match_performances.reduce(
              (sum, perf) => sum + (perf.goal_points || 0) / 4,
              0,
            ),
          ),
          assists: Math.round(
            selection.match_performances.reduce(
              (sum, perf) => sum + (perf.assist_points || 0) / 2,
              0,
            ),
          ),
          matches_played: selection.match_performances.length,
        },
      }),
    );

    return {
      fantasyTeam: {
        team_name: fantasyTeam.team_name,
        total_points: fantasyTeam.total_points,
        rank_position: rankPosition,
        total_teams: totalTeams,
      },
      user: {
        name:
          fantasyTeam.user.display_name ||
          fantasyTeam.user.korean_nickname ||
          'Unknown User',
        avatar: fantasyTeam.user.profile_image_url,
      },
      fantasySeason: {
        fantasy_season_id: fantasyTeam.fantasy_season.fantasy_season_id,
        year: fantasyTeam.fantasy_season.year,
        month: fantasyTeam.fantasy_season.month,
        season_name: fantasyTeam.fantasy_season.season.season_name,
        category: fantasyTeam.fantasy_season.season.category,
      },
      players: playersWithPosition,
    };
  }

  // ── GET /fantasy/teams/edit-data/:seasonId ──

  async getTeamEditData(userId: string, fantasySeasonId: number) {
    if (isNaN(fantasySeasonId)) {
      throw new BadRequestException('Invalid season_id');
    }

    const fantasySeason = await this.prisma.fantasySeason.findUnique({
      where: { fantasy_season_id: fantasySeasonId },
      include: {
        season: {
          select: { season_id: true, season_name: true, category: true },
        },
      },
    });

    if (!fantasySeason) {
      throw new NotFoundException('Fantasy season not found');
    }

    const existingTeam = await this.prisma.fantasyTeam.findUnique({
      where: {
        user_id_fantasy_season_id: {
          user_id: userId,
          fantasy_season_id: fantasySeasonId,
        },
      },
      include: {
        player_selections: {
          include: {
            player: {
              select: playerSelectWithTeamAndStats(
                fantasySeason.season.season_id,
              ),
            },
          },
          orderBy: { selection_order: 'asc' },
        },
      },
    });

    if (!existingTeam) {
      throw new NotFoundException('Team not found');
    }

    const now = new Date();
    const isLocked = now > new Date(fantasySeason.lock_date);

    if (isLocked) {
      throw new ForbiddenException('Team editing is locked');
    }

    const availablePlayers = await this.prisma.player.findMany({
      include: {
        player_team_history: {
          where: {
            season_id: fantasySeason.season.season_id,
            is_active: true,
          },
          include: {
            team: {
              select: {
                team_id: true,
                team_name: true,
                logo: true,
                primary_color: true,
                secondary_color: true,
              },
            },
          },
        },
        player_season_stats: {
          where: { season_id: fantasySeason.season.season_id },
          select: { goals: true, assists: true, matches_played: true },
        },
      },
    });

    const recommendations =
      await this.prisma.fantasyAIRecommendation.findMany({
        where: { fantasy_season_id: fantasySeasonId },
        include: {
          player: {
            include: {
              player_team_history: {
                where: {
                  season_id: fantasySeason.season.season_id,
                  is_active: true,
                },
                include: {
                  team: {
                    select: {
                      team_id: true,
                      team_name: true,
                      logo: true,
                      primary_color: true,
                      secondary_color: true,
                    },
                  },
                },
              },
              player_season_stats: {
                where: { season_id: fantasySeason.season.season_id },
                select: { goals: true, assists: true, matches_played: true },
              },
            },
          },
        },
        orderBy: { recommendation_score: 'desc' },
        take: 20,
      });

    const formattedPlayers = availablePlayers
      .filter((player) => player.player_team_history.length > 0)
      .map((p) => formatPlayer(p as unknown as PlayerData));

    const recommendedPlayers = recommendations
      .map((rec) => formatPlayer(rec.player as unknown as PlayerData))
      .filter((player) => player.current_team);

    const defaultPositions = ['GK', 'DF', 'MF', 'FW', 'FW'] as const;

    const initialSelectedPlayers = existingTeam.player_selections.map(
      (selection, index) => {
        const player = selection.player as unknown as PlayerData;
        return {
          player_id: player.player_id,
          name: player.name,
          profile_image_url: player.profile_image_url || undefined,
          jersey_number: player.jersey_number || undefined,
          position: selection.position || defaultPositions[index] || 'FW',
          current_team: player.player_team_history[0]?.team
            ? {
                team_id: player.player_team_history[0].team.team_id,
                team_name: player.player_team_history[0].team.team_name,
                logo: player.player_team_history[0].team.logo || undefined,
                primary_color:
                  player.player_team_history[0].team.primary_color || undefined,
                secondary_color:
                  player.player_team_history[0].team.secondary_color ||
                  undefined,
              }
            : undefined,
          season_stats: player.player_season_stats[0]
            ? {
                goals: player.player_season_stats[0].goals || 0,
                assists: player.player_season_stats[0].assists || 0,
                matches_played:
                  player.player_season_stats[0].matches_played || 0,
              }
            : { goals: 0, assists: 0, matches_played: 0 },
        };
      },
    );

    return {
      fantasySeason: {
        fantasy_season_id: fantasySeason.fantasy_season_id,
        year: fantasySeason.year,
        month: fantasySeason.month,
        lock_date: fantasySeason.lock_date.toISOString(),
        season: { season_name: fantasySeason.season.season_name },
      },
      availablePlayers: formattedPlayers,
      recommendedPlayers,
      initialSelectedPlayers,
      initialTeamName: existingTeam.team_name || '',
      teamId: existingTeam.fantasy_team_id,
      isLocked,
    };
  }

  // ── GET /fantasy/teams/my-team ──

  async getMyTeam(userId: string, fantasySeasonIdStr: string) {
    if (!fantasySeasonIdStr) {
      throw new BadRequestException('fantasy_season_id가 필요합니다.');
    }

    const seasonId = parseInt(fantasySeasonIdStr);

    if (isNaN(seasonId)) {
      throw new BadRequestException(
        '유효하지 않은 fantasy_season_id입니다.',
      );
    }

    const fantasySeason = await this.prisma.fantasySeason.findUnique({
      where: { fantasy_season_id: seasonId },
      include: {
        season: {
          select: { season_id: true, season_name: true, category: true },
        },
      },
    });

    if (!fantasySeason) {
      throw new NotFoundException('판타지 시즌을 찾을 수 없습니다.');
    }

    const fantasyTeam = await this.prisma.fantasyTeam.findUnique({
      where: {
        user_id_fantasy_season_id: {
          user_id: userId,
          fantasy_season_id: seasonId,
        },
      },
      include: {
        player_selections: {
          include: {
            player: {
              select: {
                player_id: true,
                name: true,
                profile_image_url: true,
                jersey_number: true,
                player_team_history: {
                  where: { is_active: true },
                  include: {
                    team: {
                      select: {
                        team_id: true,
                        team_name: true,
                        logo: true,
                        primary_color: true,
                        secondary_color: true,
                      },
                    },
                  },
                  take: 1,
                },
                player_season_stats: {
                  where: { season_id: fantasySeason.season.season_id },
                  select: {
                    goals: true,
                    assists: true,
                    matches_played: true,
                  },
                  take: 1,
                },
              },
            },
            match_performances: {
              select: { total_points: true },
            },
          },
          orderBy: { selection_order: 'asc' },
        },
      },
    });

    if (!fantasyTeam) {
      throw new NotFoundException({
        error: '판타지 팀을 찾을 수 없습니다.',
        hasTeam: false,
      });
    }

    const now = new Date();
    const isLocked = now > new Date(fantasySeason.lock_date);

    const players = fantasyTeam.player_selections.map((selection) => ({
      player_id: selection.player.player_id,
      name: selection.player.name,
      position: selection.position || undefined,
      profile_image_url: selection.player.profile_image_url || undefined,
      jersey_number: selection.player.jersey_number || undefined,
      current_team: selection.player.player_team_history[0]?.team
        ? {
            team_id: selection.player.player_team_history[0].team.team_id,
            team_name:
              selection.player.player_team_history[0].team.team_name,
            logo:
              selection.player.player_team_history[0].team.logo || undefined,
            primary_color:
              selection.player.player_team_history[0].team.primary_color ||
              undefined,
            secondary_color:
              selection.player.player_team_history[0].team
                .secondary_color || undefined,
          }
        : undefined,
      season_stats: selection.player.player_season_stats[0]
        ? {
            goals: selection.player.player_season_stats[0].goals || 0,
            assists: selection.player.player_season_stats[0].assists || 0,
            matches_played:
              selection.player.player_season_stats[0].matches_played || 0,
          }
        : { goals: 0, assists: 0, matches_played: 0 },
      points_earned: selection.points_earned,
      match_performances: selection.match_performances,
    }));

    return {
      fantasySeason: {
        fantasy_season_id: fantasySeason.fantasy_season_id,
        year: fantasySeason.year,
        month: fantasySeason.month,
        lock_date: fantasySeason.lock_date.toISOString(),
        start_date: fantasySeason.start_date.toISOString(),
        season: {
          season_name: fantasySeason.season.season_name,
          category: fantasySeason.season.category,
        },
      },
      fantasyTeam: {
        fantasy_team_id: fantasyTeam.fantasy_team_id,
        team_name: fantasyTeam.team_name,
        total_points: fantasyTeam.total_points,
      },
      players,
      isLocked,
      hasTeam: true,
    };
  }

  // ── Private: Generate AI Recommendations ──

  private async generateAIRecommendations(
    fantasySeasonId: number,
    seasonId: number,
  ) {
    await this.prisma.fantasyAIRecommendation.deleteMany({
      where: { fantasy_season_id: fantasySeasonId },
    });

    const playerStats = await this.prisma.playerSeasonStats.findMany({
      where: { season_id: seasonId },
      include: {
        player: { select: { player_id: true, name: true } },
      },
    });

    const recommendations = playerStats
      .map((stat) => {
        const goals = stat.goals || 0;
        const assists = stat.assists || 0;
        const matchesPlayed = stat.matches_played || 1;
        const yellowCards = stat.yellow_cards || 0;
        const redCards = stat.red_cards || 0;

        let formScore = (goals * 4 + assists * 2) / matchesPlayed;
        formScore = Math.max(0, formScore - yellowCards * 0.5 - redCards * 2);

        const appearanceRate = matchesPlayed / 10;
        const appearanceBonus = Math.min(1, appearanceRate) * 2;

        const recommendationScore = formScore * 0.7 + appearanceBonus * 0.3;

        let reason = '';
        if (goals > 5) reason += '득점력 우수, ';
        if (assists > 3) reason += '어시스트 능력 우수, ';
        if (matchesPlayed >= 8) reason += '높은 출전률, ';
        if (yellowCards + redCards === 0) reason += '깨끗한 경기 운영, ';

        reason = reason.replace(/, $/, '') || '안정적인 성과';

        return {
          fantasy_season_id: fantasySeasonId,
          player_id: stat.player_id!,
          recommendation_score:
            Math.round(recommendationScore * 100) / 100,
          reason,
          form_score: Math.round(formScore * 100) / 100,
          fixture_difficulty: 5.0,
          price_value: Math.round(recommendationScore * 10) / 10,
        };
      })
      .filter((rec) => rec.recommendation_score > 0)
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, 50);

    if (recommendations.length > 0) {
      await this.prisma.fantasyAIRecommendation.createMany({
        data: recommendations,
      });
    }

    return recommendations;
  }

  // ── Private: Calculate match fantasy scores ──

  private async calculateMatchFantasyScores(matchId: number) {
    const match = await this.prisma.match.findUnique({
      where: { match_id: matchId },
      include: {
        home_team: { select: { team_id: true, team_name: true } },
        away_team: { select: { team_id: true, team_name: true } },
        player_match_stats: {
          include: {
            player: { select: { player_id: true, name: true } },
            team: { select: { team_id: true } },
          },
        },
      },
    });

    if (!match || !match.home_team || !match.away_team) {
      throw new BadRequestException('경기 정보를 찾을 수 없습니다.');
    }

    const homeTeamData: TeamMatchData = {
      team_id: match.home_team.team_id,
      goals_conceded: match.away_score || 0,
      is_clean_sheet: (match.away_score || 0) === 0,
    };

    const awayTeamData: TeamMatchData = {
      team_id: match.away_team.team_id,
      goals_conceded: match.home_score || 0,
      is_clean_sheet: (match.home_score || 0) === 0,
    };

    const activeFantasySeasons = await this.prisma.fantasySeason.findMany({
      where: { is_active: true },
    });

    const fantasyPerformances: Array<{
      selection_id: number;
      match_id: number;
      player_id: number;
      appearance_points: number;
      goal_points: number;
      assist_points: number;
      clean_sheet_points: number;
      save_points: number;
      defensive_points: number;
      penalty_points: number;
      card_points: number;
      bonus_points: number;
      total_points: number;
    }> = [];

    for (const playerStats of match.player_match_stats) {
      const performance: PlayerMatchPerformance = {
        player_id: playerStats.player_id || 0,
        match_id: matchId,
        goals: playerStats.goals || 0,
        assists: playerStats.assists || 0,
        yellow_cards: playerStats.yellow_cards || 0,
        red_cards: playerStats.red_cards || 0,
        minutes_played: playerStats.minutes_played || 0,
        saves: playerStats.saves || 0,
        position: playerStats.position,
        team_id: playerStats.team_id,
      };

      const teamData =
        performance.team_id === homeTeamData.team_id
          ? homeTeamData
          : awayTeamData;

      const isStarter = (performance.minutes_played || 0) >= 60;
      const points = calculatePlayerFantasyPoints(
        performance,
        teamData,
        isStarter,
      );

      for (const fantasySeason of activeFantasySeasons) {
        const playerSelections =
          await this.prisma.fantasyPlayerSelection.findMany({
            where: {
              player_id: performance.player_id,
              fantasy_team: {
                fantasy_season_id: fantasySeason.fantasy_season_id,
              },
            },
          });

        for (const selection of playerSelections) {
          fantasyPerformances.push({
            selection_id: selection.selection_id,
            match_id: matchId,
            player_id: performance.player_id,
            ...points,
          });
        }
      }
    }

    for (const perf of fantasyPerformances) {
      await this.prisma.fantasyMatchPerformance.upsert({
        where: {
          selection_id_match_id: {
            selection_id: perf.selection_id,
            match_id: perf.match_id,
          },
        },
        update: {
          appearance_points: perf.appearance_points,
          goal_points: perf.goal_points,
          assist_points: perf.assist_points,
          clean_sheet_points: perf.clean_sheet_points,
          save_points: perf.save_points,
          defensive_points: perf.defensive_points,
          penalty_points: perf.penalty_points,
          card_points: perf.card_points,
          bonus_points: perf.bonus_points,
          total_points: perf.total_points,
        },
        create: perf,
      });
    }

    await this.updateFantasyTeamTotals(
      activeFantasySeasons.map((s) => s.fantasy_season_id),
    );

    return {
      match_id: matchId,
      processed_performances: fantasyPerformances.length,
      fantasy_seasons: activeFantasySeasons.length,
    };
  }

  // ── Private: Recalculate season fantasy scores ──

  private async recalculateSeasonFantasyScores(seasonId: number) {
    const matches = await this.prisma.match.findMany({
      where: { season_id: seasonId, status: 'completed' },
      select: { match_id: true },
    });

    const results = [];
    for (const match of matches) {
      const result = await this.calculateMatchFantasyScores(match.match_id);
      results.push(result);
    }

    return {
      season_id: seasonId,
      processed_matches: results.length,
      results,
    };
  }

  // ── Private: Update fantasy team totals ──

  private async updateFantasyTeamTotals(fantasySeasonIds: number[]) {
    for (const fantasySeasonId of fantasySeasonIds) {
      const fantasyTeams = await this.prisma.fantasyTeam.findMany({
        where: { fantasy_season_id: fantasySeasonId },
        include: {
          player_selections: {
            include: { match_performances: true },
          },
        },
      });

      for (const team of fantasyTeams) {
        let totalPoints = 0;

        for (const selection of team.player_selections) {
          const selectionPoints = selection.match_performances.reduce(
            (sum, perf) => sum + perf.total_points,
            0,
          );

          await this.prisma.fantasyPlayerSelection.update({
            where: { selection_id: selection.selection_id },
            data: { points_earned: selectionPoints },
          });

          totalPoints += selectionPoints;
        }

        await this.prisma.fantasyTeam.update({
          where: { fantasy_team_id: team.fantasy_team_id },
          data: { total_points: totalPoints },
        });
      }
    }
  }
}
