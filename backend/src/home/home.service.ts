import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HomeMatch {
  match_id: number;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
  status: string | null;
  season: { season_id: number; season_name: string } | null;
  home_team: { team_id: number; team_name: string; logo: string | null } | null;
  away_team: { team_id: number; team_name: string; logo: string | null } | null;
}

export interface HomeStanding {
  standing_id: number;
  position: number;
  matches_played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goals_for: number | null;
  goals_against: number | null;
  goal_difference: number | null;
  points: number | null;
  form: string | null;
  group_name: string | null;
  team: { team_id: number; team_name: string; logo: string | null } | null;
}

export interface StandingsGroup {
  group_name: string;
  standings: HomeStanding[];
}

export interface PlayerStatRow {
  player_id: number | null;
  player_name: string | null;
  player_image: string | null;
  team_name: string | null;
  team_logo: string | null;
  team_primary_color: string | null;
  team_secondary_color: string | null;
  goals: number | null;
  assists: number | null;
  matches_played: number | null;
  avg_rating: number | null;
}

export interface CareerStatRow {
  player_id: number;
  player_name: string | null;
  player_image: string | null;
  team_name: string | null;
  team_primary_color: string | null;
  team_secondary_color: string | null;
  goals: number;
  assists: number;
  matches_played: number;
  goals_per_match: number;
  assists_per_match: number;
  attack_points: number;
  attack_points_per_match: number;
}

export interface GoalScorerRow {
  goal_id: number;
  player_id: number;
  player_name: string;
  jersey_number: number | null;
  goal_time: number | null;
  goal_type: string | null;
  team: { team_id: number; team_name: string } | null;
}

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomePageData() {
    const currentSeason = await this.getLatestSeason();

    if (!currentSeason) {
      return {
        currentSeason: { season_id: 0, season_name: '' },
        recentMatches: [],
        upcomingMatches: [],
        standings: [],
        topScorers: [],
        topAssists: [],
        topRatings: [],
        topXtRatings: [],
        latestMatchGoals: null,
        seasonSummary: {
          totalMatches: 0,
          completedMatches: 0,
          totalGoals: 0,
          avgGoalsPerMatch: 0,
          participatingTeams: 0,
        },
        careerTopScorers: [],
        careerTopAssists: [],
        careerGoalsPerMatch: [],
        careerAssistsPerMatch: [],
        careerAttackPoints: [],
        careerAttackPointsPerMatch: [],
      };
    }

    const [
      recentMatches,
      upcomingMatches,
      standings,
      topScorers,
      topAssists,
      topRatings,
      topXtRatings,
      latestMatchGoals,
      seasonSummary,
      careerStats,
    ] = await Promise.all([
      this.getRecentCompletedMatches(),
      this.getUpcomingMatchesList(),
      this.getStandings(currentSeason.season_id),
      this.getTopScorersList(currentSeason.season_id),
      this.getTopAssistsList(currentSeason.season_id),
      this.getTopRatingsList(currentSeason.season_id),
      this.getTopXtRatingsList(currentSeason.season_id).catch(() => [] as PlayerStatRow[]),
      this.getLatestMatchGoalScorers(),
      this.getSeasonSummaryStats(currentSeason.season_id),
      this.getCareerStats(),
    ]);

    return {
      currentSeason,
      recentMatches,
      upcomingMatches,
      standings,
      topScorers,
      topAssists,
      topRatings,
      topXtRatings,
      latestMatchGoals,
      seasonSummary,
      careerTopScorers: careerStats.scorers,
      careerTopAssists: careerStats.assists,
      careerGoalsPerMatch: careerStats.goalsPerMatch,
      careerAssistsPerMatch: careerStats.assistsPerMatch,
      careerAttackPoints: careerStats.attackPoints,
      careerAttackPointsPerMatch: careerStats.attackPointsPerMatch,
    };
  }

  // ── Private helpers ──────────────────────────────────

  private async getLatestSeason() {
    return this.prisma.season.findFirst({
      orderBy: { season_id: 'desc' },
      select: { season_id: true, season_name: true },
    });
  }

  private async buildTeamNameMap(
    matches: Array<{
      home_team_id: number | null;
      away_team_id: number | null;
      season_id: number | null;
    }>,
  ): Promise<Map<string, string>> {
    const pairs = matches.flatMap((m) => {
      const result: Array<{ team_id: number; season_id: number }> = [];
      if (m.home_team_id != null && m.season_id != null)
        result.push({ team_id: m.home_team_id, season_id: m.season_id });
      if (m.away_team_id != null && m.season_id != null)
        result.push({ team_id: m.away_team_id, season_id: m.season_id });
      return result;
    });

    if (pairs.length === 0) return new Map();

    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: { OR: pairs },
      select: { team_id: true, season_id: true, team_name: true },
    });

    return new Map(teamSeasonNames.map((t) => [`${t.team_id}-${t.season_id}`, t.team_name]));
  }

  private serializeMatch(
    match: {
      match_id: number;
      match_date: Date;
      home_score: number | null;
      away_score: number | null;
      penalty_home_score: number | null;
      penalty_away_score: number | null;
      status: string | null;
      season_id: number | null;
      home_team_id: number | null;
      away_team_id: number | null;
      home_team: { team_id: number; team_name: string; logo: string | null } | null;
      away_team: { team_id: number; team_name: string; logo: string | null } | null;
      season: { season_id: number; season_name: string } | null;
    },
    teamNameMap: Map<string, string>,
  ): HomeMatch {
    const homeTeamName =
      match.home_team && match.season_id
        ? (teamNameMap.get(`${match.home_team_id}-${match.season_id}`) ?? match.home_team.team_name)
        : (match.home_team?.team_name ?? '');

    const awayTeamName =
      match.away_team && match.season_id
        ? (teamNameMap.get(`${match.away_team_id}-${match.season_id}`) ?? match.away_team.team_name)
        : (match.away_team?.team_name ?? '');

    return {
      match_id: match.match_id,
      match_date: match.match_date.toISOString(),
      home_score: match.home_score,
      away_score: match.away_score,
      penalty_home_score: match.penalty_home_score,
      penalty_away_score: match.penalty_away_score,
      status: match.status,
      season: match.season
        ? { season_id: match.season.season_id, season_name: match.season.season_name }
        : null,
      home_team: match.home_team
        ? { team_id: match.home_team.team_id, team_name: homeTeamName, logo: match.home_team.logo }
        : null,
      away_team: match.away_team
        ? { team_id: match.away_team.team_id, team_name: awayTeamName, logo: match.away_team.logo }
        : null,
    };
  }

  private async getRecentCompletedMatches(): Promise<HomeMatch[]> {
    const matches = await this.prisma.match.findMany({
      where: { status: 'completed' },
      orderBy: { match_date: 'desc' },
      take: 5,
      include: {
        home_team: { select: { team_id: true, team_name: true, logo: true } },
        away_team: { select: { team_id: true, team_name: true, logo: true } },
        season: { select: { season_id: true, season_name: true } },
      },
    });

    const teamNameMap = await this.buildTeamNameMap(matches);
    return matches.map((m) => this.serializeMatch(m, teamNameMap));
  }

  private async getUpcomingMatchesList(limit = 5): Promise<HomeMatch[]> {
    const matches = await this.prisma.match.findMany({
      where: { match_date: { gt: new Date() } },
      orderBy: { match_date: 'asc' },
      take: limit,
      include: {
        home_team: { select: { team_id: true, team_name: true, logo: true } },
        away_team: { select: { team_id: true, team_name: true, logo: true } },
        season: { select: { season_id: true, season_name: true } },
      },
    });

    const teamNameMap = await this.buildTeamNameMap(matches);
    return matches.map((m) => this.serializeMatch(m, teamNameMap));
  }

  private async getStandings(seasonId: number): Promise<StandingsGroup[]> {
    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: { season_id: seasonId },
      select: { team_id: true, team_name: true },
    });
    const teamNameMap = new Map<number, string>();
    teamSeasonNames.forEach((t) => teamNameMap.set(t.team_id, t.team_name));

    const groupStandings = await this.prisma.groupLeagueStanding.findMany({
      where: { season_id: seasonId },
      select: {
        group_standing_id: true,
        group_name: true,
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
        team_id: true,
        team: { select: { team_id: true, team_name: true, logo: true } },
      },
      orderBy: [{ group_name: 'asc' }, { position: 'asc' }],
    });

    if (groupStandings.length === 0) {
      const standings = await this.prisma.standing.findMany({
        where: { season_id: seasonId },
        select: {
          standing_id: true,
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
          team_id: true,
          team: { select: { team_id: true, team_name: true, logo: true } },
        },
        orderBy: { position: 'asc' },
      });

      const teamIds = standings.map((s) => s.team_id).filter((id): id is number => id != null);
      const recentFormMap = await this.buildRecentFormMap(seasonId, teamIds);

      return [
        {
          group_name: '전체',
          standings: standings.map((s) => ({
            standing_id: s.standing_id,
            position: s.position,
            matches_played: s.matches_played,
            wins: s.wins,
            draws: s.draws,
            losses: s.losses,
            goals_for: s.goals_for,
            goals_against: s.goals_against,
            goal_difference: s.goal_difference,
            points: s.points,
            form: s.team_id != null ? (recentFormMap.get(s.team_id) ?? null) : null,
            group_name: null,
            team: s.team
              ? {
                  team_id: s.team.team_id,
                  team_name:
                    s.team_id != null
                      ? (teamNameMap.get(s.team_id) ?? s.team.team_name)
                      : s.team.team_name,
                  logo: s.team.logo,
                }
              : null,
          })),
        },
      ];
    }

    const teamIds = groupStandings.map((s) => s.team_id).filter((id): id is number => id != null);
    const recentFormMap = await this.buildRecentFormMap(seasonId, teamIds);

    const groupMap = new Map<string, HomeStanding[]>();
    for (const s of groupStandings) {
      const name = s.group_name ?? '기타';
      const standing: HomeStanding = {
        standing_id: s.group_standing_id,
        position: s.position,
        matches_played: s.matches_played,
        wins: s.wins,
        draws: s.draws,
        losses: s.losses,
        goals_for: s.goals_for,
        goals_against: s.goals_against,
        goal_difference: s.goal_difference,
        points: s.points,
        form: s.team_id != null ? (recentFormMap.get(s.team_id) ?? null) : null,
        group_name: s.group_name,
        team: s.team
          ? {
              team_id: s.team.team_id,
              team_name:
                s.team_id != null
                  ? (teamNameMap.get(s.team_id) ?? s.team.team_name)
                  : s.team.team_name,
              logo: s.team.logo,
            }
          : null,
      };

      const existing = groupMap.get(name);
      if (existing) existing.push(standing);
      else groupMap.set(name, [standing]);
    }

    return Array.from(groupMap.entries()).map(([name, standings]) => ({
      group_name: name,
      standings,
    }));
  }

  private async buildRecentFormMap(
    seasonId: number,
    teamIds: number[],
  ): Promise<Map<number, string>> {
    if (teamIds.length === 0) return new Map();

    const recentMatches = await this.prisma.match.findMany({
      where: {
        season_id: seasonId,
        status: 'completed',
        OR: [{ home_team_id: { in: teamIds } }, { away_team_id: { in: teamIds } }],
      },
      select: {
        home_team_id: true,
        away_team_id: true,
        home_score: true,
        away_score: true,
        penalty_home_score: true,
        penalty_away_score: true,
        match_date: true,
      },
      orderBy: { match_date: 'desc' },
    });

    const formMap = new Map<number, string>();
    for (const teamId of teamIds) {
      const teamMatches = recentMatches
        .filter((m) => m.home_team_id === teamId || m.away_team_id === teamId)
        .slice(0, 5);

      const form = teamMatches
        .map((m) => {
          const isHome = m.home_team_id === teamId;
          const teamScore = isHome ? m.home_score : m.away_score;
          const opponentScore = isHome ? m.away_score : m.home_score;
          if (teamScore == null || opponentScore == null) return '';
          if (teamScore !== opponentScore) return teamScore > opponentScore ? 'W' : 'L';
          const teamPK = isHome ? m.penalty_home_score : m.penalty_away_score;
          const opponentPK = isHome ? m.penalty_away_score : m.penalty_home_score;
          if (teamPK != null && opponentPK != null) return teamPK > opponentPK ? 'W' : 'L';
          return 'W';
        })
        .join('');

      if (form) formMap.set(teamId, form);
    }

    return formMap;
  }

  private async getTopScorersList(seasonId: number, limit = 5): Promise<PlayerStatRow[]> {
    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: { season_id: seasonId },
      select: { team_id: true, team_name: true },
    });
    const teamNameMap = new Map<number, string>();
    teamSeasonNames.forEach((t) => teamNameMap.set(t.team_id, t.team_name));

    const stats = await this.prisma.playerSeasonStats.findMany({
      where: { season_id: seasonId },
      include: {
        player: { select: { player_id: true, name: true, profile_image_url: true } },
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
      orderBy: { goals: 'desc' },
      take: limit,
    });

    return stats.map((s) => ({
      player_id: s.player?.player_id ?? null,
      player_name: s.player?.name ?? null,
      player_image: s.player?.profile_image_url ?? null,
      team_name:
        s.team_id != null
          ? (teamNameMap.get(s.team_id) ?? s.team?.team_name ?? null)
          : (s.team?.team_name ?? null),
      team_logo: s.team?.logo ?? null,
      team_primary_color: s.team?.primary_color ?? null,
      team_secondary_color: s.team?.secondary_color ?? null,
      goals: s.goals,
      assists: s.assists,
      matches_played: s.matches_played,
      avg_rating: null,
    }));
  }

  private async getTopAssistsList(seasonId: number, limit = 5): Promise<PlayerStatRow[]> {
    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: { season_id: seasonId },
      select: { team_id: true, team_name: true },
    });
    const teamNameMap = new Map<number, string>();
    teamSeasonNames.forEach((t) => teamNameMap.set(t.team_id, t.team_name));

    const stats = await this.prisma.playerSeasonStats.findMany({
      where: { season_id: seasonId },
      include: {
        player: { select: { player_id: true, name: true, profile_image_url: true } },
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
      orderBy: { assists: 'desc' },
      take: limit,
    });

    return stats.map((s) => ({
      player_id: s.player?.player_id ?? null,
      player_name: s.player?.name ?? null,
      player_image: s.player?.profile_image_url ?? null,
      team_name:
        s.team_id != null
          ? (teamNameMap.get(s.team_id) ?? s.team?.team_name ?? null)
          : (s.team?.team_name ?? null),
      team_logo: s.team?.logo ?? null,
      team_primary_color: s.team?.primary_color ?? null,
      team_secondary_color: s.team?.secondary_color ?? null,
      goals: s.goals,
      assists: s.assists,
      matches_played: s.matches_played,
      avg_rating: null,
    }));
  }

  private async getTopRatingsList(seasonId: number, limit = 5): Promise<PlayerStatRow[]> {
    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: { season_id: seasonId },
      select: { team_id: true, team_name: true },
    });
    const teamNameMap = new Map<number, string>();
    teamSeasonNames.forEach((t) => teamNameMap.set(t.team_id, t.team_name));

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
        select: {
          team_id: true,
          team_name: true,
          logo: true,
          primary_color: true,
          secondary_color: true,
        },
      }),
    ]);

    const playerMap = new Map(players.map((p) => [p.player_id, p]));
    const teamMap = new Map(teams.map((t) => [t.team_id, t]));

    return grouped.map((g) => {
      const player = playerMap.get(g.player_id);
      const team = teamMap.get(g.team_id);
      return {
        player_id: player?.player_id ?? null,
        player_name: player?.name ?? null,
        player_image: player?.profile_image_url ?? null,
        team_name: teamNameMap.get(g.team_id) ?? team?.team_name ?? null,
        team_logo: team?.logo ?? null,
        team_primary_color: team?.primary_color ?? null,
        team_secondary_color: team?.secondary_color ?? null,
        goals: null,
        assists: null,
        matches_played: g._count.rating_id,
        avg_rating: Math.round((g._avg.rating ?? 0) * 100) / 100,
      };
    });
  }

  private async getTopXtRatingsList(seasonId: number, limit = 5): Promise<PlayerStatRow[]> {
    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: { season_id: seasonId },
      select: { team_id: true, team_name: true },
    });
    const teamNameMap = new Map<number, string>();
    teamSeasonNames.forEach((t) => teamNameMap.set(t.team_id, t.team_name));

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
        select: {
          team_id: true,
          team_name: true,
          logo: true,
          primary_color: true,
          secondary_color: true,
        },
      }),
    ]);

    const playerMap = new Map(players.map((p) => [p.player_id, p]));
    const teamMap = new Map(teams.map((t) => [t.team_id, t]));

    return grouped.map((g) => {
      const player = playerMap.get(g.player_id);
      const team = teamMap.get(g.team_id);
      return {
        player_id: player?.player_id ?? null,
        player_name: player?.name ?? null,
        player_image: player?.profile_image_url ?? null,
        team_name: teamNameMap.get(g.team_id) ?? team?.team_name ?? null,
        team_logo: team?.logo ?? null,
        team_primary_color: team?.primary_color ?? null,
        team_secondary_color: team?.secondary_color ?? null,
        goals: null,
        assists: null,
        matches_played: g._count.xt_rating_id,
        avg_rating: Math.round((g._avg.xt_rating ?? 0) * 100) / 100,
      };
    });
  }

  private async getCareerStats(limit = 5, minMatches = 10) {
    const stats = await this.prisma.playerSeasonStats.findMany({
      include: {
        player: { select: { player_id: true, name: true, profile_image_url: true } },
        team: {
          select: { team_id: true, team_name: true, primary_color: true, secondary_color: true },
        },
      },
      orderBy: { season_id: 'asc' },
    });

    const playerMap = new Map<
      number,
      {
        player_id: number;
        player_name: string | null;
        player_image: string | null;
        latest_team_name: string | null;
        latest_team_primary_color: string | null;
        latest_team_secondary_color: string | null;
        goals: number;
        assists: number;
        matches_played: number;
      }
    >();

    for (const stat of stats) {
      const playerId = stat.player?.player_id;
      if (!playerId) continue;

      const existing = playerMap.get(playerId);
      if (existing) {
        existing.goals += stat.goals ?? 0;
        existing.assists += stat.assists ?? 0;
        existing.matches_played += stat.matches_played ?? 0;
        if (stat.team?.team_name) {
          existing.latest_team_name = stat.team.team_name;
          existing.latest_team_primary_color = stat.team.primary_color ?? null;
          existing.latest_team_secondary_color = stat.team.secondary_color ?? null;
        }
      } else {
        playerMap.set(playerId, {
          player_id: playerId,
          player_name: stat.player?.name ?? null,
          player_image: stat.player?.profile_image_url ?? null,
          latest_team_name: stat.team?.team_name ?? null,
          latest_team_primary_color: stat.team?.primary_color ?? null,
          latest_team_secondary_color: stat.team?.secondary_color ?? null,
          goals: stat.goals ?? 0,
          assists: stat.assists ?? 0,
          matches_played: stat.matches_played ?? 0,
        });
      }
    }

    const allPlayers = Array.from(playerMap.values());

    const toRow = (p: (typeof allPlayers)[number]): CareerStatRow => ({
      player_id: p.player_id,
      player_name: p.player_name,
      player_image: p.player_image,
      team_name: p.latest_team_name,
      team_primary_color: p.latest_team_primary_color,
      team_secondary_color: p.latest_team_secondary_color,
      goals: p.goals,
      assists: p.assists,
      matches_played: p.matches_played,
      goals_per_match:
        p.matches_played > 0 ? Math.round((p.goals / p.matches_played) * 100) / 100 : 0,
      assists_per_match:
        p.matches_played > 0 ? Math.round((p.assists / p.matches_played) * 100) / 100 : 0,
      attack_points: p.goals + p.assists,
      attack_points_per_match:
        p.matches_played > 0
          ? Math.round(((p.goals + p.assists) / p.matches_played) * 100) / 100
          : 0,
    });

    const qualifiedPlayers = allPlayers.filter((p) => p.matches_played >= minMatches);

    return {
      scorers: [...allPlayers]
        .sort((a, b) => b.goals - a.goals)
        .slice(0, limit)
        .map(toRow),
      assists: [...allPlayers]
        .sort((a, b) => b.assists - a.assists)
        .slice(0, limit)
        .map(toRow),
      goalsPerMatch: [...qualifiedPlayers]
        .sort(
          (a, b) =>
            (b.matches_played > 0 ? b.goals / b.matches_played : 0) -
            (a.matches_played > 0 ? a.goals / a.matches_played : 0),
        )
        .slice(0, limit)
        .map(toRow),
      assistsPerMatch: [...qualifiedPlayers]
        .sort(
          (a, b) =>
            (b.matches_played > 0 ? b.assists / b.matches_played : 0) -
            (a.matches_played > 0 ? a.assists / a.matches_played : 0),
        )
        .slice(0, limit)
        .map(toRow),
      attackPoints: [...allPlayers]
        .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
        .slice(0, limit)
        .map(toRow),
      attackPointsPerMatch: [...qualifiedPlayers]
        .sort(
          (a, b) =>
            (b.matches_played > 0 ? (b.goals + b.assists) / b.matches_played : 0) -
            (a.matches_played > 0 ? (a.goals + a.assists) / a.matches_played : 0),
        )
        .slice(0, limit)
        .map(toRow),
    };
  }

  private async getLatestMatchGoalScorers(): Promise<{
    match: HomeMatch;
    goals: GoalScorerRow[];
  } | null> {
    const latestMatch = await this.prisma.match.findFirst({
      where: { status: 'completed' },
      orderBy: { match_date: 'desc' },
      include: {
        home_team: { select: { team_id: true, team_name: true, logo: true } },
        away_team: { select: { team_id: true, team_name: true, logo: true } },
        season: { select: { season_id: true, season_name: true } },
      },
    });

    if (!latestMatch) return null;

    const teamNameMap = await this.buildTeamNameMap([latestMatch]);
    const homeMatch = this.serializeMatch(latestMatch, teamNameMap);

    const goals = await this.prisma.goal.findMany({
      where: { match_id: latestMatch.match_id },
      include: {
        player: { select: { player_id: true, name: true, jersey_number: true } },
      },
      orderBy: { goal_time: 'asc' },
    });

    const playerIds = goals.map((g) => g.player_id);
    const allPlayerStats = await this.prisma.playerMatchStats.findMany({
      where: { match_id: latestMatch.match_id, player_id: { in: playerIds } },
      include: { team: { select: { team_id: true, team_name: true } } },
    });

    const playerTeamMap = new Map(allPlayerStats.map((ps) => [ps.player_id, ps.team ?? null]));

    const goalsWithTeam: GoalScorerRow[] = goals.map((goal) => ({
      goal_id: goal.goal_id,
      player_id: goal.player_id,
      player_name: goal.player.name,
      jersey_number: goal.player.jersey_number,
      goal_time: goal.goal_time,
      goal_type: goal.goal_type,
      team: playerTeamMap.get(goal.player_id) ?? null,
    }));

    return { match: homeMatch, goals: goalsWithTeam };
  }

  private async getSeasonSummaryStats(seasonId: number) {
    const [totalMatches, completedMatches, totalGoals, participatingTeams] = await Promise.all([
      this.prisma.match.count({ where: { season_id: seasonId } }),
      this.prisma.match.count({ where: { season_id: seasonId, status: 'completed' } }),
      this.prisma.goal.count({ where: { match: { season_id: seasonId } } }),
      this.prisma.teamSeason.count({ where: { season_id: seasonId } }),
    ]);

    return {
      totalMatches,
      completedMatches,
      totalGoals,
      avgGoalsPerMatch: completedMatches > 0 ? totalGoals / completedMatches : 0,
      participatingTeams,
    };
  }
}
