import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AppearanceType = 'starter' | 'substitute' | 'all';

interface PlayerCareerStatsEntry {
  player_id: number;
  player_name: string;
  player_image: string;
  total_goals: number;
  total_assists: number;
  total_matches_played: number;
  teams: Set<string>;
  team_logos: Set<string>;
  seasons: Set<string>;
  latest_team_name: string;
  latest_team_logo: string;
}

interface GoalkeeperStatsEntry {
  player_id: number;
  player_name: string | undefined;
  player_image: string | null | undefined;
  matches_played: number;
  goals_conceded: number;
  clean_sheets: number;
  teams: Set<string>;
  team_logos: Set<string>;
  team_ids: Set<number>;
  seasons: Set<string>;
  current_team_id: number | null;
  current_team_name: string | null;
  current_team_logo: string | null;
}

interface AttackPointStatsEntry {
  player_id: number;
  player_name: string | undefined;
  player_image: string | null | undefined;
  matches_played: number;
  goals: number;
  assists: number;
  attack_points: number;
  teams: Set<string>;
  team_logos: Set<string>;
  team_ids: Set<number>;
  seasons: Set<string>;
  current_team_id: number | null;
  current_team_name: string | null | undefined;
  current_team_logo: string | null | undefined;
}

interface TeamStatsEntry {
  team_id: number;
  team_name: string | undefined;
  team_logo: string | null | undefined;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  win_rate: number | string;
  seasons: Set<string>;
}

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Head-to-Head ───────────────────────────────────────────────

  async getHeadToHead(team1Id: number, team2Id: number, limit: number = 10) {
    if (team1Id === team2Id) {
      throw new BadRequestException('team1_id and team2_id must be different');
    }

    const [team1, team2] = await Promise.all([
      this.prisma.team.findUnique({
        where: { team_id: team1Id },
        select: { team_id: true, team_name: true, logo: true },
      }),
      this.prisma.team.findUnique({
        where: { team_id: team2Id },
        select: { team_id: true, team_name: true, logo: true },
      }),
    ]);

    if (!team1 || !team2) {
      throw new NotFoundException('One or both teams not found');
    }

    const matches = await this.prisma.match.findMany({
      where: {
        OR: [
          { home_team_id: team1Id, away_team_id: team2Id },
          { home_team_id: team2Id, away_team_id: team1Id },
        ],
        AND: [{ home_score: { not: null } }, { away_score: { not: null } }],
      },
      include: {
        home_team: { select: { team_name: true } },
        away_team: { select: { team_name: true } },
        season: { select: { season_name: true } },
      },
      orderBy: { match_date: 'desc' },
    });

    if (matches.length === 0) {
      return {
        team1_id: team1Id,
        team2_id: team2Id,
        team1_name: team1.team_name,
        team2_name: team2.team_name,
        team1_logo: team1.logo || undefined,
        team2_logo: team2.logo || undefined,
        total_matches: 0,
        team1_wins: 0,
        team2_wins: 0,
        draws: 0,
        team1_goals: 0,
        team2_goals: 0,
        recent_matches: [],
        biggest_win_team1: null,
        biggest_win_team2: null,
      };
    }

    let team1Wins = 0;
    let team2Wins = 0;
    let draws = 0;
    let team1Goals = 0;
    let team2Goals = 0;
    let biggestWinTeam1: {
      match_date: string;
      score: string;
      season: string;
      margin: number;
    } | null = null;
    let biggestWinTeam2: {
      match_date: string;
      score: string;
      season: string;
      margin: number;
    } | null = null;
    let maxMarginTeam1 = -1;
    let maxMarginTeam2 = -1;

    matches.forEach((match) => {
      const homeScore = match.home_score || 0;
      const awayScore = match.away_score || 0;

      let team1Score: number;
      let team2Score: number;

      if (match.home_team_id === team1Id) {
        team1Score = homeScore;
        team2Score = awayScore;
      } else {
        team1Score = awayScore;
        team2Score = homeScore;
      }

      team1Goals += team1Score;
      team2Goals += team2Score;

      if (team1Score > team2Score) {
        team1Wins++;
        const margin = team1Score - team2Score;
        if (margin > maxMarginTeam1) {
          maxMarginTeam1 = margin;
          biggestWinTeam1 = {
            match_date: match.match_date.toISOString().split('T')[0],
            score: `${team1Score}-${team2Score}`,
            season: match.season?.season_name || 'Unknown',
            margin,
          };
        }
      } else if (team2Score > team1Score) {
        team2Wins++;
        const margin = team2Score - team1Score;
        if (margin > maxMarginTeam2) {
          maxMarginTeam2 = margin;
          biggestWinTeam2 = {
            match_date: match.match_date.toISOString().split('T')[0],
            score: `${team2Score}-${team1Score}`,
            season: match.season?.season_name || 'Unknown',
            margin,
          };
        }
      } else {
        draws++;
      }
    });

    const recentMatches = matches.slice(0, limit).map((match) => {
      const homeScore = match.home_score || 0;
      const awayScore = match.away_score || 0;

      return {
        match_id: match.match_id,
        match_date: match.match_date.toISOString().split('T')[0],
        home_team_name: match.home_team?.team_name || '',
        away_team_name: match.away_team?.team_name || '',
        home_score: homeScore,
        away_score: awayScore,
        season_name: match.season?.season_name || 'Unknown',
        location: match.location || undefined,
        penalty_home_score: match.penalty_home_score || undefined,
        penalty_away_score: match.penalty_away_score || undefined,
      };
    });

    return {
      team1_id: team1Id,
      team2_id: team2Id,
      team1_name: team1.team_name,
      team2_name: team2.team_name,
      team1_logo: team1.logo || undefined,
      team2_logo: team2.logo || undefined,
      total_matches: matches.length,
      team1_wins: team1Wins,
      team2_wins: team2Wins,
      draws,
      team1_goals: team1Goals,
      team2_goals: team2Goals,
      recent_matches: recentMatches,
      biggest_win_team1: biggestWinTeam1,
      biggest_win_team2: biggestWinTeam2,
    };
  }

  // ─── Player Match Stats ─────────────────────────────────────────

  async getPlayerMatchStats(matchId?: number, playerId?: number) {
    const whereClause: Record<string, number> = {};

    if (matchId) whereClause.match_id = matchId;
    if (playerId) whereClause.player_id = playerId;

    const stats = await this.prisma.playerMatchStats.findMany({
      where: whereClause,
      orderBy: matchId ? { player_id: 'asc' } : { match_id: 'desc' },
    });

    return stats;
  }

  // ─── Top Ratings ────────────────────────────────────────────────

  async getTopRatings(seasonId: number, limit: number = 10) {
    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: { season_id: seasonId },
      select: { team_id: true, team_name: true },
    });
    const teamNameMap = new Map<number, string>();
    teamSeasonNames.forEach((tsn) => {
      teamNameMap.set(tsn.team_id, tsn.team_name);
    });

    const grouped = await this.prisma.playerMatchRating.groupBy({
      by: ['player_id', 'team_id'],
      where: { match: { season_id: seasonId } },
      _avg: { rating: true },
      _count: { rating_id: true },
      orderBy: { _avg: { rating: 'desc' } },
      take: limit,
    });

    if (grouped.length === 0) return [];

    const playerIds = grouped.map((g) => g.player_id);
    const teamIds = Array.from(new Set(grouped.map((g) => g.team_id)));

    const [players, teams] = await Promise.all([
      this.prisma.player.findMany({
        where: { player_id: { in: playerIds } },
        select: { player_id: true, name: true, profile_image_url: true },
      }),
      this.prisma.team.findMany({
        where: { team_id: { in: teamIds } },
        select: { team_id: true, team_name: true, logo: true },
      }),
    ]);

    const playerMap = new Map(players.map((p) => [p.player_id, p]));
    const teamMap = new Map(teams.map((t) => [t.team_id, t]));

    return grouped.map((g) => {
      const player = playerMap.get(g.player_id);
      const team = teamMap.get(g.team_id);
      const seasonTeamName = teamNameMap.get(g.team_id) ?? team?.team_name;

      return {
        player_id: g.player_id,
        player_name: player?.name ?? null,
        player_image: player?.profile_image_url ?? null,
        team_id: g.team_id,
        team_name: seasonTeamName ?? null,
        team_logo: team?.logo ?? null,
        avg_rating: Math.round((g._avg.rating ?? 0) * 100) / 100,
        matches_rated: g._count.rating_id,
      };
    });
  }

  // ─── Top xT Ratings ─────────────────────────────────────────────

  async getTopXtRatings(seasonId: number, limit: number = 10) {
    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: { season_id: seasonId },
      select: { team_id: true, team_name: true },
    });
    const teamNameMap = new Map<number, string>();
    teamSeasonNames.forEach((tsn) => {
      teamNameMap.set(tsn.team_id, tsn.team_name);
    });

    const grouped = await this.prisma.playerMatchXtRating.groupBy({
      by: ['player_id', 'team_id'],
      where: { match: { season_id: seasonId } },
      _avg: { xt_rating: true },
      _count: { xt_rating_id: true },
      orderBy: { _avg: { xt_rating: 'desc' } },
      take: limit,
    });

    if (grouped.length === 0) return [];

    const playerIds = grouped.map((g) => g.player_id);
    const teamIds = Array.from(new Set(grouped.map((g) => g.team_id)));

    const [players, teams] = await Promise.all([
      this.prisma.player.findMany({
        where: { player_id: { in: playerIds } },
        select: { player_id: true, name: true, profile_image_url: true },
      }),
      this.prisma.team.findMany({
        where: { team_id: { in: teamIds } },
        select: { team_id: true, team_name: true, logo: true },
      }),
    ]);

    const playerMap = new Map(players.map((p) => [p.player_id, p]));
    const teamMap = new Map(teams.map((t) => [t.team_id, t]));

    return grouped.map((g) => {
      const player = playerMap.get(g.player_id);
      const team = teamMap.get(g.team_id);
      const seasonTeamName = teamNameMap.get(g.team_id) ?? team?.team_name;

      return {
        player_id: g.player_id,
        player_name: player?.name ?? null,
        player_image: player?.profile_image_url ?? null,
        team_id: g.team_id,
        team_name: seasonTeamName ?? null,
        team_logo: team?.logo ?? null,
        avg_rating: Math.round((g._avg.xt_rating ?? 0) * 100) / 100,
        matches_rated: g._count.xt_rating_id,
      };
    });
  }

  // ─── Player Season Stats ────────────────────────────────────────

  async getPlayerSeasonStats(
    seasonId?: number,
    playerId?: number,
    limit?: number,
    sort: 'goals' | 'appearances' | 'assists' = 'goals',
  ) {
    const stats = await this.prisma.playerSeasonStats.findMany({
      where: {
        ...(seasonId && { season_id: seasonId }),
        ...(playerId && { player_id: playerId }),
      },
      include: {
        player: { select: { name: true } },
        team: { select: { team_name: true, logo: true } },
      },
      orderBy:
        sort === 'appearances'
          ? { matches_played: 'desc' }
          : sort === 'assists'
            ? { assists: 'desc' }
            : { goals: 'desc' },
      take: limit || undefined,
    });

    return stats.map((s) => ({
      ...s,
      player_name: s.player?.name ?? null,
      team_name: s.team?.team_name ?? null,
      team_logo: s.team?.logo ?? null,
    }));
  }

  // ─── Top Scorers ────────────────────────────────────────────────

  async getTopScorers(seasonId?: number, limit: number = 10) {
    if (seasonId) {
      const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
        where: { season_id: seasonId },
        select: { team_id: true, team_name: true },
      });
      const teamSeasonNamesMap = new Map<number, string>();
      teamSeasonNames.forEach((tsn) => {
        teamSeasonNamesMap.set(tsn.team_id, tsn.team_name);
      });

      const stats = await this.prisma.playerSeasonStats.findMany({
        where: { season_id: seasonId },
        include: {
          player: {
            select: { player_id: true, name: true, profile_image_url: true },
          },
          team: {
            select: { team_id: true, team_name: true, logo: true },
          },
        },
        orderBy: { goals: 'desc' },
        take: limit,
      });

      return stats.map((stat) => {
        const seasonTeamName =
          stat.team_id != null
            ? (teamSeasonNamesMap.get(stat.team_id) ?? stat.team?.team_name)
            : stat.team?.team_name;

        return {
          stat_id: stat.stat_id,
          player_id: stat.player?.player_id || null,
          season_id: stat.season_id,
          team_id: stat.team_id,
          matches_played: stat.matches_played,
          goals: stat.goals,
          assists: stat.assists,
          yellow_cards: stat.yellow_cards,
          red_cards: stat.red_cards,
          minutes_played: stat.minutes_played,
          saves: stat.saves,
          created_at: stat.created_at,
          updated_at: stat.updated_at,
          player_name: stat.player?.name || null,
          player_image: stat.player?.profile_image_url || null,
          team_name: seasonTeamName || null,
          team_logo: stat.team?.logo || null,
        };
      });
    } else {
      // Career cumulative top scorers
      const stats = await this.prisma.playerSeasonStats.findMany({
        include: {
          player: {
            select: { player_id: true, name: true, profile_image_url: true },
          },
          team: {
            select: { team_id: true, team_name: true, logo: true },
          },
          season: {
            select: { season_id: true, season_name: true },
          },
        },
      });

      const playerCareerStats = new Map<number, PlayerCareerStatsEntry>();

      stats.forEach((stat) => {
        const playerId = stat.player?.player_id;
        if (!playerId) return;

        if (!playerCareerStats.has(playerId)) {
          playerCareerStats.set(playerId, {
            player_id: playerId,
            player_name: stat.player?.name || '',
            player_image: stat.player?.profile_image_url || '',
            total_goals: 0,
            total_assists: 0,
            total_matches_played: 0,
            teams: new Set<string>(),
            team_logos: new Set<string>(),
            seasons: new Set<string>(),
            latest_team_name: '',
            latest_team_logo: '',
          });
        }

        const playerStats = playerCareerStats.get(playerId)!;
        playerStats.total_goals += stat.goals || 0;
        playerStats.total_assists += stat.assists || 0;
        playerStats.total_matches_played += stat.matches_played || 0;

        if (!playerStats.player_image && stat.player?.profile_image_url) {
          playerStats.player_image = stat.player.profile_image_url;
        }

        if (stat.team?.team_name) {
          playerStats.teams.add(stat.team.team_name);
          playerStats.latest_team_name = stat.team.team_name;
        }

        if (stat.team?.logo) {
          playerStats.team_logos.add(stat.team.logo);
          playerStats.latest_team_logo = stat.team.logo;
        }

        if (stat.season?.season_name) {
          playerStats.seasons.add(stat.season.season_name);
        }
      });

      return Array.from(playerCareerStats.values())
        .sort((a, b) => b.total_goals - a.total_goals)
        .slice(0, limit)
        .map((player) => ({
          player_id: player.player_id,
          player_name: player.player_name,
          player_image: player.player_image || '',
          team_name: player.latest_team_name,
          team_logo: player.latest_team_logo || '',
          goals: player.total_goals,
          assists: player.total_assists,
          matches_played: player.total_matches_played,
          total_teams: Array.from(player.teams).length,
          total_seasons: Array.from(player.seasons).length,
        }));
    }
  }

  // ─── Top Appearances ───────────────────────────────────────────

  async getTopAppearances(seasonId?: number, limit: number = 10) {
    const parsedSeasonId = seasonId || null;

    const teamSeasonNamesMap = new Map<number, string>();
    if (parsedSeasonId) {
      const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
        where: { season_id: parsedSeasonId },
        select: { team_id: true, team_name: true },
      });
      teamSeasonNames.forEach((tsn) => {
        teamSeasonNamesMap.set(tsn.team_id, tsn.team_name);
      });
    }

    const stats = await this.prisma.playerSeasonStats.findMany({
      where: {
        ...(parsedSeasonId && { season_id: parsedSeasonId }),
      },
      include: {
        player: { select: { name: true, profile_image_url: true } },
        team: { select: { team_id: true, team_name: true, logo: true } },
      },
      orderBy: { matches_played: 'desc' },
      take: limit,
    });

    return stats.map((s) => {
      const seasonTeamName =
        s.team_id != null && parsedSeasonId
          ? (teamSeasonNamesMap.get(s.team_id) ?? s.team?.team_name)
          : s.team?.team_name;

      return {
        ...s,
        player_name: s.player?.name ?? null,
        player_image: s.player?.profile_image_url ?? null,
        team_name: seasonTeamName ?? null,
        team_logo: s.team?.logo ?? null,
      };
    });
  }

  // ─── Top Assists ────────────────────────────────────────────────

  async getTopAssists(seasonId?: number, limit: number = 10) {
    const parsedSeasonId = seasonId || null;

    const teamSeasonNamesMap = new Map<number, string>();
    if (parsedSeasonId) {
      const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
        where: { season_id: parsedSeasonId },
        select: { team_id: true, team_name: true },
      });
      teamSeasonNames.forEach((tsn) => {
        teamSeasonNamesMap.set(tsn.team_id, tsn.team_name);
      });
    }

    const stats = await this.prisma.playerSeasonStats.findMany({
      where: {
        ...(parsedSeasonId && { season_id: parsedSeasonId }),
      },
      include: {
        player: { select: { name: true, profile_image_url: true } },
        team: { select: { team_id: true, team_name: true, logo: true } },
      },
      orderBy: { assists: 'desc' },
      take: limit,
    });

    return stats.map((s) => {
      const seasonTeamName =
        s.team_id != null && parsedSeasonId
          ? (teamSeasonNamesMap.get(s.team_id) ?? s.team?.team_name)
          : s.team?.team_name;

      return {
        ...s,
        player_name: s.player?.name ?? null,
        player_image: s.player?.profile_image_url ?? null,
        team_name: seasonTeamName ?? null,
        team_logo: s.team?.logo ?? null,
      };
    });
  }

  // ─── Player vs Team ─────────────────────────────────────────────

  async getPlayerVsTeam(playerId: number, seasonId?: number) {
    const player = await this.prisma.player.findUnique({
      where: { player_id: playerId },
      select: { player_id: true, name: true, profile_image_url: true },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    let seasonWhere = {};
    if (seasonId) {
      seasonWhere = { match: { season_id: seasonId } };
    }

    const playerMatchStats = await this.prisma.playerMatchStats.findMany({
      where: {
        player_id: playerId,
        minutes_played: { gt: 0 },
        ...seasonWhere,
      },
      select: {
        match_id: true,
        team_id: true,
        goals: true,
        assists: true,
        minutes_played: true,
        match: {
          select: {
            home_team_id: true,
            away_team_id: true,
            season_id: true,
          },
        },
      },
    });

    const opponentStatsMap = new Map<
      number,
      { matches_played: number; goals: number; assists: number; attack_points: number }
    >();

    for (const stat of playerMatchStats) {
      const playerTeamId = stat.team_id;
      const match = stat.match;
      if (!match) continue;

      let opponentTeamId: number;
      if (match.home_team_id === playerTeamId && match.away_team_id !== null) {
        opponentTeamId = match.away_team_id;
      } else if (match.away_team_id === playerTeamId && match.home_team_id !== null) {
        opponentTeamId = match.home_team_id;
      } else {
        continue;
      }

      if (!opponentStatsMap.has(opponentTeamId)) {
        opponentStatsMap.set(opponentTeamId, {
          matches_played: 0,
          goals: 0,
          assists: 0,
          attack_points: 0,
        });
      }

      const opponentStats = opponentStatsMap.get(opponentTeamId)!;
      opponentStats.matches_played += 1;
      opponentStats.goals += stat.goals || 0;
      opponentStats.assists += stat.assists || 0;
      opponentStats.attack_points += (stat.goals || 0) + (stat.assists || 0);
    }

    const opponentTeamIds = Array.from(opponentStatsMap.keys());
    const opponentTeams = await this.prisma.team.findMany({
      where: { team_id: { in: opponentTeamIds } },
      select: { team_id: true, team_name: true, logo: true },
    });

    const opponentTeamMap = new Map(opponentTeams.map((team) => [team.team_id, team]));

    const teamRecords = Array.from(opponentStatsMap.entries())
      .map(([opponentTeamId, stats]) => {
        const team = opponentTeamMap.get(opponentTeamId);
        if (!team) return null;

        return {
          opponent_team_id: opponentTeamId,
          opponent_team_name: team.team_name,
          opponent_team_logo: team.logo,
          matches_played: stats.matches_played,
          goals: stats.goals,
          assists: stats.assists,
          attack_points: stats.attack_points,
          goals_per_match:
            stats.matches_played > 0 ? (stats.goals / stats.matches_played).toFixed(2) : '0.00',
          assists_per_match:
            stats.matches_played > 0 ? (stats.assists / stats.matches_played).toFixed(2) : '0.00',
          attack_points_per_match:
            stats.matches_played > 0
              ? (stats.attack_points / stats.matches_played).toFixed(2)
              : '0.00',
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.attack_points - a!.attack_points);

    return {
      player_id: player.player_id,
      player_name: player.name,
      player_image: player.profile_image_url,
      team_records: teamRecords,
    };
  }

  // ─── Team Season Stats ──────────────────────────────────────────

  async getTeamSeasonStats(seasonId?: number, teamId?: number) {
    const whereClause: Record<string, number> = {};

    if (seasonId) whereClause.season_id = seasonId;
    if (teamId) whereClause.team_id = teamId;

    const stats = await this.prisma.teamSeasonStats.findMany({
      where: whereClause,
      orderBy: seasonId ? { points: 'desc' } : { season_id: 'desc' },
    });

    return stats;
  }

  // ─── Goalkeeper Rankings ────────────────────────────────────────

  private isGoalkeeperAppearance(position: string | null, goals_conceded: number | null): boolean {
    return position === 'GK' || (position !== 'GK' && (goals_conceded || 0) > 0);
  }

  async getGoalkeeperRankings(
    seasonId?: number,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'goals_conceded_per_match',
    minMatches: number = 3,
    appearanceType: AppearanceType = 'all',
  ) {
    const filterSeasonId = seasonId;

    // Get active team history for current team info
    const activeTeamHistory = await this.prisma.playerTeamHistory.findMany({
      where: { is_active: true },
      include: {
        team: {
          select: { team_id: true, team_name: true, logo: true },
        },
      },
    });

    const playerCurrentTeamMap = new Map<
      number,
      { team_id: number | null; team_name: string | null; team_logo: string | null }
    >();
    activeTeamHistory.forEach((history) => {
      if (history.player_id && !playerCurrentTeamMap.has(history.player_id)) {
        playerCurrentTeamMap.set(history.player_id, {
          team_id: history.team?.team_id || null,
          team_name: history.team?.team_name || null,
          team_logo: history.team?.logo || null,
        });
      }
    });

    const playerMatchStats = await this.prisma.playerMatchStats.findMany({
      where: {
        ...(filterSeasonId && { match: { season_id: filterSeasonId } }),
      },
      include: {
        player: {
          select: { player_id: true, name: true, profile_image_url: true },
        },
        team: {
          select: { team_id: true, team_name: true, logo: true },
        },
        match: {
          select: {
            match_id: true,
            match_date: true,
            season_id: true,
            season: {
              select: { season_id: true, season_name: true, year: true },
            },
          },
        },
      },
      orderBy: { match: { match_date: 'desc' } },
    });

    const substitutions = await this.prisma.substitution.findMany({
      where: {
        ...(filterSeasonId && { match: { season_id: filterSeasonId } }),
      },
      select: { match_id: true, player_in_id: true },
    });

    const subInSet = new Set(substitutions.map((s) => `${s.match_id}-${s.player_in_id}`));

    // Season team names
    const seasonIds = Array.from(
      new Set(
        playerMatchStats.map((m) => m.match?.season_id).filter((id): id is number => id != null),
      ),
    );
    const teamIds = Array.from(
      new Set(
        playerMatchStats.map((s) => s.team?.team_id).filter((id): id is number => id != null),
      ),
    );

    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: {
        season_id: { in: seasonIds },
        team_id: { in: teamIds },
      },
      select: { team_id: true, season_id: true, team_name: true },
    });

    const teamSeasonNameMap = new Map<string, string>();
    teamSeasonNames.forEach((tsn) => {
      teamSeasonNameMap.set(`${tsn.season_id}-${tsn.team_id}`, tsn.team_name);
    });

    // Filter goalkeeper appearances
    let goalkeeperStats = playerMatchStats.filter((stat) =>
      this.isGoalkeeperAppearance(stat.position, stat.goals_conceded),
    );

    if (appearanceType === 'starter') {
      goalkeeperStats = goalkeeperStats.filter(
        (stat) => !subInSet.has(`${stat.match_id}-${stat.player_id}`),
      );
    } else if (appearanceType === 'substitute') {
      goalkeeperStats = goalkeeperStats.filter((stat) =>
        subInSet.has(`${stat.match_id}-${stat.player_id}`),
      );
    }

    // Calculate match team goals for clean sheet detection
    const matchTeamGoalsMap = new Map<string, number>();
    for (const stat of playerMatchStats) {
      if (!stat.match_id || !stat.team_id) continue;
      const matchTeamKey = `${stat.match_id}-${stat.team_id}`;
      const currentGoals = matchTeamGoalsMap.get(matchTeamKey) || 0;
      matchTeamGoalsMap.set(matchTeamKey, currentGoals + (stat.goals_conceded || 0));
    }

    // Aggregate per player
    const playerStatsMap = new Map<string, GoalkeeperStatsEntry>();

    goalkeeperStats.forEach((stat) => {
      const playerId = stat.player?.player_id;
      if (!playerId) return;

      const key = `${playerId}`;

      if (!playerStatsMap.has(key)) {
        const currentTeam = playerCurrentTeamMap.get(playerId);
        const fallbackTeam =
          !currentTeam && stat.team
            ? {
                team_id: stat.team.team_id,
                team_name: stat.team.team_name,
                team_logo: stat.team.logo,
              }
            : null;
        const teamInfo = currentTeam || fallbackTeam;

        playerStatsMap.set(key, {
          player_id: playerId,
          player_name: stat.player?.name,
          player_image: stat.player?.profile_image_url,
          matches_played: 0,
          goals_conceded: 0,
          clean_sheets: 0,
          teams: new Set<string>(),
          team_logos: new Set<string>(),
          team_ids: new Set<number>(),
          seasons: new Set<string>(),
          current_team_id: teamInfo?.team_id || null,
          current_team_name: teamInfo?.team_name || null,
          current_team_logo: teamInfo?.team_logo || null,
        });
      }

      const playerStats = playerStatsMap.get(key)!;
      playerStats.matches_played += 1;
      playerStats.goals_conceded += stat.goals_conceded || 0;

      if (stat.position === 'GK' && stat.match_id && stat.team_id) {
        const matchTeamKey = `${stat.match_id}-${stat.team_id}`;
        const teamGoalsConceded = matchTeamGoalsMap.get(matchTeamKey) || 0;
        if (teamGoalsConceded === 0) {
          playerStats.clean_sheets += 1;
        }
      }

      if (stat.team?.team_name) {
        const seasonTeamId = stat.match?.season_id;
        const tId = stat.team.team_id;
        const seasonTeamName =
          seasonTeamId && tId
            ? (teamSeasonNameMap.get(`${seasonTeamId}-${tId}`) ?? stat.team.team_name)
            : stat.team.team_name;
        playerStats.teams.add(seasonTeamName);
      }

      if (stat.team?.logo) playerStats.team_logos.add(stat.team.logo);
      if (stat.team?.team_id) playerStats.team_ids.add(stat.team.team_id);
      if (stat.match?.season?.season_name) playerStats.seasons.add(stat.match.season.season_name);
    });

    const rankings = Array.from(playerStatsMap.values())
      .filter((stats) => stats.matches_played >= minMatches)
      .map((stats) => ({
        ...stats,
        teams: Array.from(stats.teams).join(', '),
        team_logos: Array.from(stats.team_logos),
        team_ids: Array.from(stats.team_ids),
        seasons: Array.from(stats.seasons).join(', '),
        goals_conceded_per_match:
          stats.matches_played > 0
            ? (stats.goals_conceded / stats.matches_played).toFixed(2)
            : '0.00',
        clean_sheet_percentage:
          stats.matches_played > 0
            ? ((stats.clean_sheets / stats.matches_played) * 100).toFixed(1)
            : '0.0',
      }));

    rankings.sort((a, b) => {
      switch (sortBy) {
        case 'clean_sheets':
          return b.clean_sheets - a.clean_sheets;
        case 'clean_sheet_percentage':
          return parseFloat(b.clean_sheet_percentage) - parseFloat(a.clean_sheet_percentage);
        case 'matches_played':
          return b.matches_played - a.matches_played;
        case 'goals_conceded_per_match':
        default:
          return parseFloat(a.goals_conceded_per_match) - parseFloat(b.goals_conceded_per_match);
      }
    });

    const totalCount = rankings.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginatedRankings = rankings.slice(offset, offset + limit);

    const rankedResults = paginatedRankings.map((player, index) => ({
      ...player,
      rank: offset + index + 1,
    }));

    return {
      season_filter: filterSeasonId || 'all',
      appearance_type: appearanceType,
      sort_by: sortBy,
      min_matches: minMatches,
      total_goalkeepers: totalCount,
      total_pages: totalPages,
      current_page: page,
      per_page: limit,
      rankings: rankedResults,
    };
  }

  // ─── Group League Standings ─────────────────────────────────────

  async getGroupLeagueStandings(seasonId: number, tournamentStage?: string, groupStage?: string) {
    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: { season_id: seasonId },
      select: { team_id: true, team_name: true },
    });
    const teamSeasonNamesMap = new Map<number, string>();
    teamSeasonNames.forEach((tsn) => {
      teamSeasonNamesMap.set(tsn.team_id, tsn.team_name);
    });

    const applySeasonTeamNames = <
      T extends {
        team_id?: number | null;
        team?: { team_id: number; team_name: string; logo: string | null } | null;
      },
    >(
      standings: T[],
    ) => {
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
    };

    const isOverall = !tournamentStage || tournamentStage === 'all';

    if (isOverall) {
      const standings = await this.prisma.standing.findMany({
        where: { season_id: seasonId },
        include: {
          team: {
            select: { team_id: true, team_name: true, logo: true },
          },
        },
        orderBy: [{ points: 'desc' }, { goal_difference: 'desc' }, { goals_for: 'desc' }],
      });

      return applySeasonTeamNames(standings);
    } else {
      const where: {
        season_id: number;
        tournament_stage?: string;
        group_stage?: string;
      } = { season_id: seasonId };

      if (tournamentStage && tournamentStage !== 'all') {
        if (tournamentStage === 'group_stage') {
          where.tournament_stage = 'group_league';
        } else {
          where.tournament_stage = tournamentStage;
        }
      }

      if (groupStage && groupStage !== 'all') {
        where.group_stage = groupStage;
      }

      const standings = await this.prisma.groupLeagueStanding.findMany({
        where,
        include: {
          team: {
            select: { team_id: true, team_name: true, logo: true },
          },
        },
        orderBy: [{ points: 'desc' }, { goal_difference: 'desc' }, { goals_for: 'desc' }],
      });

      if (standings.length === 0) {
        const fallbackStandings = await this.prisma.standing.findMany({
          where: { season_id: seasonId },
          include: {
            team: {
              select: { team_id: true, team_name: true, logo: true },
            },
          },
          orderBy: [{ points: 'desc' }, { goal_difference: 'desc' }, { goals_for: 'desc' }],
        });
        return applySeasonTeamNames(fallbackStandings);
      }

      return applySeasonTeamNames(standings);
    }
  }

  // ─── Penalty Shootout ───────────────────────────────────────────

  async getPenaltyShootout(
    type: string = 'kicker',
    sortBy: string = 'total',
    page: number = 1,
    limit: number = 20,
    minAttempts: number = 1,
    seasonId?: number,
  ) {
    const offset = (page - 1) * limit;
    const seasonFilter = seasonId ? `AND m.season_id = ${seasonId}` : '';

    if (type === 'kicker') {
      let orderBy = '';
      switch (sortBy) {
        case 'total':
          orderBy = 'total_kicks DESC, success_rate DESC';
          break;
        case 'success_rate_high':
          orderBy = 'success_rate DESC, total_kicks DESC';
          break;
        case 'success_rate_low':
          orderBy = 'success_rate ASC, total_kicks DESC';
          break;
        default:
          orderBy = 'total_kicks DESC, success_rate DESC';
      }

      const kickerStats = await this.prisma.$queryRawUnsafe<
        {
          player_id: number;
          player_name: string;
          player_image: string | null;
          total_kicks: bigint;
          successful_kicks: bigint;
          failed_kicks: bigint;
          success_rate: number;
          teams: string;
          team_logos: string;
          first_team_id: number | null;
          first_team_name: string | null;
        }[]
      >(`
        WITH kicker_stats AS (
          SELECT
            p.kicker_id as player_id,
            COUNT(*) as total_kicks,
            COUNT(*) FILTER (WHERE p.is_successful = true) as successful_kicks,
            COUNT(*) FILTER (WHERE p.is_successful = false) as failed_kicks,
            ROUND(100.0 * COUNT(*) FILTER (WHERE p.is_successful = true) / NULLIF(COUNT(*), 0), 1) as success_rate
          FROM penalty_shootout_details p
          JOIN matches m ON p.match_id = m.match_id
          WHERE 1=1 ${seasonFilter}
          GROUP BY p.kicker_id
          HAVING COUNT(*) >= ${minAttempts}
        ),
        player_teams AS (
          SELECT
            sub.player_id,
            STRING_AGG(sub.team_name, ', ' ORDER BY sub.team_name) as teams,
            STRING_AGG(sub.logo, ',' ORDER BY sub.team_name) FILTER (WHERE sub.logo IS NOT NULL) as team_logos,
            MIN(sub.team_id) as first_team_id,
            MIN(sub.team_name) as first_team_name
          FROM (
            SELECT DISTINCT pth.player_id, t.team_id, t.team_name, t.logo
            FROM player_team_history pth
            JOIN teams t ON pth.team_id = t.team_id
            WHERE pth.is_active = true
          ) AS sub
          GROUP BY sub.player_id
        )
        SELECT
          ks.player_id,
          pl.name as player_name,
          pl.profile_image_url as player_image,
          ks.total_kicks,
          ks.successful_kicks,
          ks.failed_kicks,
          ks.success_rate,
          COALESCE(pt.teams, '') as teams,
          COALESCE(pt.team_logos, '') as team_logos,
          pt.first_team_id,
          pt.first_team_name
        FROM kicker_stats ks
        JOIN players pl ON ks.player_id = pl.player_id
        LEFT JOIN player_teams pt ON ks.player_id = pt.player_id
        ORDER BY ${orderBy}
        LIMIT ${limit} OFFSET ${offset}
      `);

      const rankings = kickerStats.map((stat, index) => ({
        rank: offset + index + 1,
        player_id: stat.player_id,
        player_name: stat.player_name,
        player_image: stat.player_image,
        total_kicks: Number(stat.total_kicks),
        successful_kicks: Number(stat.successful_kicks),
        failed_kicks: Number(stat.failed_kicks),
        success_rate: Number(stat.success_rate),
        teams: stat.teams,
        team_logos: stat.team_logos ? stat.team_logos.split(',').filter(Boolean) : [],
        first_team_id: stat.first_team_id,
        first_team_name: stat.first_team_name,
      }));

      const totalKickersResult = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(`
        SELECT COUNT(*) as count FROM (
          SELECT p.kicker_id
          FROM penalty_shootout_details p
          JOIN matches m ON p.match_id = m.match_id
          WHERE 1=1 ${seasonFilter}
          GROUP BY p.kicker_id
          HAVING COUNT(*) >= ${minAttempts}
        ) sub
      `);
      const totalKickers = Number(totalKickersResult[0]?.count || 0);

      return {
        type: 'kicker',
        rankings,
        total_players: totalKickers,
        current_page: page,
        total_pages: Math.ceil(totalKickers / limit),
        per_page: limit,
      };
    } else {
      // Goalkeeper stats
      let orderBy = '';
      switch (sortBy) {
        case 'total':
          orderBy = 'total_faced DESC, save_rate DESC';
          break;
        case 'save_rate_high':
          orderBy = 'save_rate DESC, total_faced DESC';
          break;
        case 'save_rate_low':
          orderBy = 'save_rate ASC, total_faced DESC';
          break;
        default:
          orderBy = 'total_faced DESC, save_rate DESC';
      }

      const goalkeeperStats = await this.prisma.$queryRawUnsafe<
        {
          player_id: number;
          player_name: string;
          player_image: string | null;
          total_faced: bigint;
          saves: bigint;
          conceded: bigint;
          save_rate: number;
          teams: string;
          team_logos: string;
          first_team_id: number | null;
          first_team_name: string | null;
        }[]
      >(`
        WITH goalkeeper_stats AS (
          SELECT
            p.goalkeeper_id as player_id,
            COUNT(*) as total_faced,
            COUNT(*) FILTER (WHERE p.is_successful = false) as saves,
            COUNT(*) FILTER (WHERE p.is_successful = true) as conceded,
            ROUND(100.0 * COUNT(*) FILTER (WHERE p.is_successful = false) / NULLIF(COUNT(*), 0), 1) as save_rate
          FROM penalty_shootout_details p
          JOIN matches m ON p.match_id = m.match_id
          WHERE 1=1 ${seasonFilter}
          GROUP BY p.goalkeeper_id
          HAVING COUNT(*) >= ${minAttempts}
        ),
        player_teams AS (
          SELECT
            sub.player_id,
            STRING_AGG(sub.team_name, ', ' ORDER BY sub.team_name) as teams,
            STRING_AGG(sub.logo, ',' ORDER BY sub.team_name) FILTER (WHERE sub.logo IS NOT NULL) as team_logos,
            MIN(sub.team_id) as first_team_id,
            MIN(sub.team_name) as first_team_name
          FROM (
            SELECT DISTINCT pth.player_id, t.team_id, t.team_name, t.logo
            FROM player_team_history pth
            JOIN teams t ON pth.team_id = t.team_id
            WHERE pth.is_active = true
          ) AS sub
          GROUP BY sub.player_id
        )
        SELECT
          gs.player_id,
          pl.name as player_name,
          pl.profile_image_url as player_image,
          gs.total_faced,
          gs.saves,
          gs.conceded,
          gs.save_rate,
          COALESCE(pt.teams, '') as teams,
          COALESCE(pt.team_logos, '') as team_logos,
          pt.first_team_id,
          pt.first_team_name
        FROM goalkeeper_stats gs
        JOIN players pl ON gs.player_id = pl.player_id
        LEFT JOIN player_teams pt ON gs.player_id = pt.player_id
        ORDER BY ${orderBy}
        LIMIT ${limit} OFFSET ${offset}
      `);

      const rankings = goalkeeperStats.map((stat, index) => ({
        rank: offset + index + 1,
        player_id: stat.player_id,
        player_name: stat.player_name,
        player_image: stat.player_image,
        total_faced: Number(stat.total_faced),
        saves: Number(stat.saves),
        conceded: Number(stat.conceded),
        save_rate: Number(stat.save_rate),
        teams: stat.teams,
        team_logos: stat.team_logos ? stat.team_logos.split(',').filter(Boolean) : [],
        first_team_id: stat.first_team_id,
        first_team_name: stat.first_team_name,
      }));

      const totalGoalkeepersResult = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(`
        SELECT COUNT(*) as count FROM (
          SELECT p.goalkeeper_id
          FROM penalty_shootout_details p
          JOIN matches m ON p.match_id = m.match_id
          WHERE 1=1 ${seasonFilter}
          GROUP BY p.goalkeeper_id
          HAVING COUNT(*) >= ${minAttempts}
        ) sub
      `);
      const totalGoalkeepers = Number(totalGoalkeepersResult[0]?.count || 0);

      return {
        type: 'goalkeeper',
        rankings,
        total_players: totalGoalkeepers,
        current_page: page,
        total_pages: Math.ceil(totalGoalkeepers / limit),
        per_page: limit,
      };
    }
  }

  // ─── Scoring Rankings ───────────────────────────────────────────

  async getScoringRankings(
    seasonId?: number,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'attack_points',
    minMatches: number = 3,
  ) {
    const filterSeasonId = seasonId;

    const playerMatchStats = await this.prisma.playerMatchStats.findMany({
      where: {
        ...(filterSeasonId && { match: { season_id: filterSeasonId } }),
      },
      include: {
        player: {
          select: { player_id: true, name: true, profile_image_url: true },
        },
        team: {
          select: { team_id: true, team_name: true, logo: true },
        },
        match: {
          select: {
            season_id: true,
            season: {
              select: { season_id: true, season_name: true, year: true },
            },
          },
        },
      },
    });

    // Season team names
    const teamSeasonNamesMap = new Map<string, string>();
    if (filterSeasonId) {
      const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
        where: { season_id: filterSeasonId },
        select: { team_id: true, team_name: true },
      });
      teamSeasonNames.forEach((tsn) => {
        teamSeasonNamesMap.set(`${tsn.team_id}`, tsn.team_name);
      });
    }

    // Active team histories
    const activeTeamHistories = await this.prisma.playerTeamHistory.findMany({
      where: { is_active: true },
      include: {
        team: {
          select: { team_id: true, team_name: true, logo: true },
        },
      },
    });

    const playerCurrentTeamMap = new Map<
      number,
      { team_id: number; team_name: string; logo: string | null }
    >();
    activeTeamHistories.forEach((history) => {
      if (history.player_id && history.team) {
        if (!playerCurrentTeamMap.has(history.player_id)) {
          playerCurrentTeamMap.set(history.player_id, {
            team_id: history.team.team_id,
            team_name: history.team.team_name,
            logo: history.team.logo,
          });
        }
      }
    });

    // Aggregate per player
    const playerStatsMap = new Map<string, AttackPointStatsEntry>();

    playerMatchStats.forEach((stat) => {
      const playerId = stat.player?.player_id;
      if (!playerId) return;

      const key = `${playerId}`;

      const teamId = stat.team?.team_id;
      const seasonTeamName =
        teamId && filterSeasonId
          ? teamSeasonNamesMap.get(`${teamId}`) || stat.team?.team_name
          : stat.team?.team_name;

      if (!playerStatsMap.has(key)) {
        const currentTeam = playerCurrentTeamMap.get(playerId);
        const currentTeamSeasonName =
          currentTeam?.team_id && filterSeasonId
            ? teamSeasonNamesMap.get(`${currentTeam.team_id}`) || currentTeam?.team_name
            : currentTeam?.team_name;

        playerStatsMap.set(key, {
          player_id: playerId,
          player_name: stat.player?.name,
          player_image: stat.player?.profile_image_url,
          matches_played: 0,
          goals: 0,
          assists: 0,
          attack_points: 0,
          teams: new Set<string>(),
          team_logos: new Set<string>(),
          team_ids: new Set<number>(),
          seasons: new Set<string>(),
          current_team_id: currentTeam?.team_id || null,
          current_team_name: currentTeamSeasonName || null,
          current_team_logo: currentTeam?.logo || null,
        });
      }

      const playerStats = playerStatsMap.get(key)!;
      playerStats.matches_played += 1;
      playerStats.goals += stat.goals || 0;
      playerStats.assists += stat.assists || 0;
      playerStats.attack_points = playerStats.goals + playerStats.assists;

      if (seasonTeamName) playerStats.teams.add(seasonTeamName);
      if (stat.team?.logo) playerStats.team_logos.add(stat.team.logo);
      if (stat.team?.team_id) playerStats.team_ids.add(stat.team.team_id);
      if (stat.match?.season?.season_name) playerStats.seasons.add(stat.match.season.season_name);
    });

    const rankings = Array.from(playerStatsMap.values())
      .filter((stats) => stats.matches_played >= minMatches)
      .map((stats) => {
        const teamLogosArray = Array.from(stats.team_logos) as string[];
        if (stats.current_team_logo) {
          const filteredLogos = teamLogosArray.filter((logo) => logo !== stats.current_team_logo);
          filteredLogos.unshift(stats.current_team_logo);
          teamLogosArray.length = 0;
          teamLogosArray.push(...filteredLogos);
        }

        return {
          ...stats,
          teams: Array.from(stats.teams).join(', '),
          team_logos: teamLogosArray,
          team_ids: Array.from(stats.team_ids),
          seasons: Array.from(stats.seasons).join(', '),
          first_team_id: stats.current_team_id,
          first_team_name: stats.current_team_name,
          goals_per_match:
            stats.matches_played > 0 ? (stats.goals / stats.matches_played).toFixed(2) : '0.00',
          assists_per_match:
            stats.matches_played > 0 ? (stats.assists / stats.matches_played).toFixed(2) : '0.00',
          attack_points_per_match:
            stats.matches_played > 0
              ? (stats.attack_points / stats.matches_played).toFixed(2)
              : '0.00',
        };
      });

    rankings.sort((a, b) => {
      switch (sortBy) {
        case 'goals':
          return b.goals - a.goals;
        case 'assists':
          return b.assists - a.assists;
        case 'matches_played':
          return b.matches_played - a.matches_played;
        case 'goals_per_match':
          return parseFloat(b.goals_per_match) - parseFloat(a.goals_per_match);
        case 'assists_per_match':
          return parseFloat(b.assists_per_match) - parseFloat(a.assists_per_match);
        case 'attack_points_per_match':
          return parseFloat(b.attack_points_per_match) - parseFloat(a.attack_points_per_match);
        case 'attack_points':
        default:
          return b.attack_points - a.attack_points;
      }
    });

    const totalCount = rankings.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginatedRankings = rankings.slice(offset, offset + limit);

    const rankedResults = paginatedRankings.map((player, index) => ({
      ...player,
      rank: offset + index + 1,
    }));

    return {
      season_filter: filterSeasonId || 'all',
      sort_by: sortBy,
      min_matches: minMatches,
      total_players: totalCount,
      total_pages: totalPages,
      current_page: page,
      per_page: limit,
      rankings: rankedResults,
    };
  }

  // ─── Starter Win Rate ──────────────────────────────────────────

  async getStarterWinRate(
    seasonId?: number,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'win_rate_desc',
    minMatches: number = 5,
    appearanceType: AppearanceType = 'starter',
  ) {
    const filterSeasonId = seasonId;

    const playerMatchStats = await this.prisma.playerMatchStats.findMany({
      where: {
        ...(filterSeasonId && { match: { season_id: filterSeasonId } }),
      },
      select: {
        player_id: true,
        match_id: true,
        team_id: true,
        player: {
          select: { player_id: true, name: true, profile_image_url: true },
        },
        team: {
          select: { team_id: true, team_name: true, logo: true },
        },
        match: {
          select: {
            match_id: true,
            home_team_id: true,
            away_team_id: true,
            home_score: true,
            away_score: true,
            penalty_home_score: true,
            penalty_away_score: true,
            season_id: true,
            season: {
              select: { season_id: true, season_name: true },
            },
          },
        },
      },
    });

    // Season team names
    const teamSeasonNamesMap = new Map<string, string>();
    if (filterSeasonId) {
      const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
        where: { season_id: filterSeasonId },
        select: { team_id: true, team_name: true },
      });
      teamSeasonNames.forEach((tsn) => {
        teamSeasonNamesMap.set(`${tsn.team_id}`, tsn.team_name);
      });
    }

    // Active team histories
    const activeTeamHistories = await this.prisma.playerTeamHistory.findMany({
      where: { is_active: true },
      include: {
        team: {
          select: { team_id: true, team_name: true, logo: true },
        },
      },
    });

    const playerCurrentTeamMap = new Map<
      number,
      { team_id: number; team_name: string; logo: string | null }
    >();
    activeTeamHistories.forEach((history) => {
      if (history.player_id && history.team) {
        if (!playerCurrentTeamMap.has(history.player_id)) {
          playerCurrentTeamMap.set(history.player_id, {
            team_id: history.team.team_id,
            team_name: history.team.team_name,
            logo: history.team.logo,
          });
        }
      }
    });

    // Substitutions
    const substitutions = await this.prisma.substitution.findMany({
      where: {
        ...(filterSeasonId && { match: { season_id: filterSeasonId } }),
      },
      select: { match_id: true, player_in_id: true },
    });

    const subInSet = new Set(substitutions.map((s) => `${s.match_id}-${s.player_in_id}`));

    // Filter by appearance type
    let filteredStats = playerMatchStats;

    if (appearanceType === 'starter') {
      filteredStats = playerMatchStats.filter(
        (stat) => !subInSet.has(`${stat.match_id}-${stat.player_id}`),
      );
    } else if (appearanceType === 'substitute') {
      filteredStats = playerMatchStats.filter((stat) =>
        subInSet.has(`${stat.match_id}-${stat.player_id}`),
      );
    }

    // Aggregate per player
    const playerStatsMap = new Map<
      number,
      {
        player_id: number;
        player_name: string | null;
        player_image: string | null;
        matches_played: number;
        wins: number;
        losses: number;
        teams: Set<string>;
        team_logos: Set<string>;
        team_ids: Set<number>;
        seasons: Set<string>;
        current_team_id: number | null;
        current_team_name: string | null;
        current_team_logo: string | null;
      }
    >();

    filteredStats.forEach((stat) => {
      const playerId = stat.player?.player_id;
      if (!playerId) return;

      const match = stat.match;
      if (!match || match.home_score === null || match.away_score === null || !stat.team_id) return;

      const teamId = stat.team?.team_id;
      const seasonTeamName =
        teamId && filterSeasonId
          ? teamSeasonNamesMap.get(`${teamId}`) || stat.team?.team_name
          : stat.team?.team_name;

      let isWin = false;

      if (stat.team_id === match.home_team_id) {
        if (match.home_score > match.away_score) {
          isWin = true;
        } else if (
          match.home_score === match.away_score &&
          match.penalty_home_score !== null &&
          match.penalty_away_score !== null
        ) {
          isWin = match.penalty_home_score > match.penalty_away_score;
        }
      } else if (stat.team_id === match.away_team_id) {
        if (match.away_score > match.home_score) {
          isWin = true;
        } else if (
          match.home_score === match.away_score &&
          match.penalty_home_score !== null &&
          match.penalty_away_score !== null
        ) {
          isWin = match.penalty_away_score > match.penalty_home_score;
        }
      }

      if (!playerStatsMap.has(playerId)) {
        const currentTeam = playerCurrentTeamMap.get(playerId);
        const currentTeamSeasonName =
          currentTeam?.team_id && filterSeasonId
            ? teamSeasonNamesMap.get(`${currentTeam.team_id}`) || currentTeam?.team_name
            : currentTeam?.team_name;

        playerStatsMap.set(playerId, {
          player_id: playerId,
          player_name: stat.player?.name || null,
          player_image: stat.player?.profile_image_url || null,
          matches_played: 0,
          wins: 0,
          losses: 0,
          teams: new Set(),
          team_logos: new Set(),
          team_ids: new Set(),
          seasons: new Set(),
          current_team_id: currentTeam?.team_id || null,
          current_team_name: currentTeamSeasonName || null,
          current_team_logo: currentTeam?.logo || null,
        });
      }

      const playerStats = playerStatsMap.get(playerId)!;
      playerStats.matches_played += 1;

      if (isWin) {
        playerStats.wins += 1;
      } else {
        playerStats.losses += 1;
      }

      if (seasonTeamName) playerStats.teams.add(seasonTeamName);
      if (stat.team?.logo) playerStats.team_logos.add(stat.team.logo);
      if (stat.team?.team_id) playerStats.team_ids.add(stat.team.team_id);
      if (match.season?.season_name) playerStats.seasons.add(match.season.season_name);
    });

    const rankings = Array.from(playerStatsMap.values())
      .filter((stats) => stats.matches_played >= minMatches)
      .map((stats) => {
        const winRate = stats.matches_played > 0 ? (stats.wins / stats.matches_played) * 100 : 0;

        const teamLogosArray = Array.from(stats.team_logos) as string[];
        if (stats.current_team_logo) {
          const filteredLogos = teamLogosArray.filter((logo) => logo !== stats.current_team_logo);
          filteredLogos.unshift(stats.current_team_logo);
          teamLogosArray.length = 0;
          teamLogosArray.push(...filteredLogos);
        }

        return {
          player_id: stats.player_id,
          player_name: stats.player_name,
          player_image: stats.player_image,
          matches_played: stats.matches_played,
          wins: stats.wins,
          losses: stats.losses,
          win_rate: winRate.toFixed(2),
          teams: Array.from(stats.teams).join(', '),
          team_logos: teamLogosArray,
          team_ids: Array.from(stats.team_ids),
          seasons: Array.from(stats.seasons).join(', '),
          first_team_id: stats.current_team_id,
          first_team_name: stats.current_team_name,
          first_team_logo: stats.current_team_logo,
        };
      });

    rankings.sort((a, b) => {
      switch (sortBy) {
        case 'win_rate_asc':
          if (parseFloat(a.win_rate) !== parseFloat(b.win_rate)) {
            return parseFloat(a.win_rate) - parseFloat(b.win_rate);
          }
          return b.losses - a.losses;
        case 'matches_played':
          return b.matches_played - a.matches_played;
        case 'win_rate_desc':
        default:
          if (parseFloat(a.win_rate) !== parseFloat(b.win_rate)) {
            return parseFloat(b.win_rate) - parseFloat(a.win_rate);
          }
          return b.wins - a.wins;
      }
    });

    const totalCount = rankings.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginatedRankings = rankings.slice(offset, offset + limit);

    const rankedResults = paginatedRankings.map((player, index) => ({
      ...player,
      rank: offset + index + 1,
    }));

    return {
      season_filter: filterSeasonId || 'all',
      appearance_type: appearanceType,
      sort_by: sortBy,
      min_matches: minMatches,
      total_players: totalCount,
      total_pages: totalPages,
      current_page: page,
      per_page: limit,
      rankings: rankedResults,
    };
  }

  // ─── Team Rankings ─────────────────────────────────────────────

  async getTeamRankings(
    seasonId?: number,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'win_rate',
  ) {
    const filterSeasonId = seasonId;

    const matchCount = await this.prisma.match.count({
      where: {
        ...(filterSeasonId && { season_id: filterSeasonId }),
        AND: [{ home_score: { not: null } }, { away_score: { not: null } }],
      },
    });

    if (matchCount === 0) {
      return {
        season_filter: filterSeasonId || 'all',
        sort_by: sortBy,
        total_teams: 0,
        total_pages: 0,
        current_page: page,
        per_page: limit,
        rankings: [],
      };
    }

    // Season team names
    const teamSeasonNamesMap = new Map<number, string>();
    if (filterSeasonId) {
      const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
        where: { season_id: filterSeasonId },
        select: { team_id: true, team_name: true },
      });
      teamSeasonNames.forEach((tsn) => {
        teamSeasonNamesMap.set(tsn.team_id, tsn.team_name);
      });
    }

    const matches = await this.prisma.match.findMany({
      where: {
        ...(filterSeasonId && { season_id: filterSeasonId }),
        AND: [{ home_score: { not: null } }, { away_score: { not: null } }],
      },
      include: {
        home_team: {
          select: { team_id: true, team_name: true, logo: true },
        },
        away_team: {
          select: { team_id: true, team_name: true, logo: true },
        },
        season: {
          select: { season_id: true, season_name: true, year: true },
        },
      },
    });

    const teamStatsMap = new Map<number, TeamStatsEntry>();

    matches.forEach((match) => {
      const homeTeamId = match.home_team?.team_id;
      const awayTeamId = match.away_team?.team_id;
      const homeScore = match.home_score || 0;
      const awayScore = match.away_score || 0;

      if (!homeTeamId || !awayTeamId) return;

      const homeTeamName = filterSeasonId
        ? (teamSeasonNamesMap.get(homeTeamId) ?? match.home_team?.team_name)
        : match.home_team?.team_name;
      const awayTeamName = filterSeasonId
        ? (teamSeasonNamesMap.get(awayTeamId) ?? match.away_team?.team_name)
        : match.away_team?.team_name;

      // Home team stats
      if (!teamStatsMap.has(homeTeamId)) {
        teamStatsMap.set(homeTeamId, {
          team_id: homeTeamId,
          team_name: homeTeamName,
          team_logo: match.home_team?.logo,
          matches_played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          win_rate: 0,
          seasons: new Set<string>(),
        });
      }

      const homeStats = teamStatsMap.get(homeTeamId)!;
      homeStats.matches_played += 1;
      homeStats.goals_for += homeScore;
      homeStats.goals_against += awayScore;

      if (homeScore > awayScore) {
        homeStats.wins += 1;
      } else if (homeScore === awayScore) {
        homeStats.draws += 1;
      } else {
        homeStats.losses += 1;
      }

      if (match.season?.season_name) homeStats.seasons.add(match.season.season_name);

      // Away team stats
      if (!teamStatsMap.has(awayTeamId)) {
        teamStatsMap.set(awayTeamId, {
          team_id: awayTeamId,
          team_name: awayTeamName,
          team_logo: match.away_team?.logo,
          matches_played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          win_rate: 0,
          seasons: new Set<string>(),
        });
      }

      const awayStats = teamStatsMap.get(awayTeamId)!;
      awayStats.matches_played += 1;
      awayStats.goals_for += awayScore;
      awayStats.goals_against += homeScore;

      if (awayScore > homeScore) {
        awayStats.wins += 1;
      } else if (awayScore === homeScore) {
        awayStats.draws += 1;
      } else {
        awayStats.losses += 1;
      }

      if (match.season?.season_name) awayStats.seasons.add(match.season.season_name);
    });

    const rankings = Array.from(teamStatsMap.values())
      .filter((stats) => stats.matches_played > 0)
      .map((stats) => {
        stats.goal_difference = stats.goals_for - stats.goals_against;
        stats.win_rate =
          stats.matches_played > 0 ? ((stats.wins / stats.matches_played) * 100).toFixed(1) : '0.0';

        return {
          ...stats,
          seasons: Array.from(stats.seasons).join(', '),
          goals_for_per_match:
            stats.matches_played > 0 ? (stats.goals_for / stats.matches_played).toFixed(1) : '0.0',
          goals_against_per_match:
            stats.matches_played > 0
              ? (stats.goals_against / stats.matches_played).toFixed(1)
              : '0.0',
        };
      });

    rankings.sort((a, b) => {
      switch (sortBy) {
        case 'goal_difference':
          return b.goal_difference - a.goal_difference;
        case 'goals_for':
          return b.goals_for - a.goals_for;
        case 'goals_against':
          return a.goals_against - b.goals_against;
        case 'goals_for_per_match':
          return parseFloat(b.goals_for_per_match) - parseFloat(a.goals_for_per_match);
        case 'goals_against_per_match':
          return parseFloat(a.goals_against_per_match) - parseFloat(b.goals_against_per_match);
        case 'matches_played':
          return b.matches_played - a.matches_played;
        case 'win_rate':
        default: {
          const aWinRate = parseFloat(String(a.win_rate));
          const bWinRate = parseFloat(String(b.win_rate));
          if (aWinRate !== bWinRate) return bWinRate - aWinRate;

          const aPoints = a.wins * 3 + a.draws;
          const bPoints = b.wins * 3 + b.draws;
          if (aPoints !== bPoints) return bPoints - aPoints;

          return b.goal_difference - a.goal_difference;
        }
      }
    });

    const totalCount = rankings.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginatedRankings = rankings.slice(offset, offset + limit);

    const rankedResults = paginatedRankings.map((team, index) => ({
      ...team,
      rank: offset + index + 1,
      points: team.wins * 3 + team.draws,
    }));

    return {
      season_filter: filterSeasonId || 'all',
      sort_by: sortBy,
      total_teams: totalCount,
      total_pages: totalPages,
      current_page: page,
      per_page: limit,
      rankings: rankedResults,
    };
  }
}
