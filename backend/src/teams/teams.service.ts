import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { inferLeague } from '../common/utils';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(seasonId?: number) {
    let whereClause = {};

    if (seasonId) {
      whereClause = { team_seasons: { some: { season_id: seasonId } } };
    }

    const baseTeams = await this.prisma.team.findMany({
      where: whereClause,
      orderBy: { team_name: 'asc' },
      include: {
        _count: { select: { team_seasons: true } },
        team_seasons: {
          select: {
            season: { select: { season_id: true, season_name: true, year: true } },
          },
        },
      },
    });

    const allTeamIds = baseTeams.map((t) => t.team_id);

    const [allPlayerStats, allStandings] = await Promise.all([
      this.prisma.playerMatchStats.groupBy({
        by: ['team_id', 'player_id'],
        where: { team_id: { in: allTeamIds }, player_id: { not: null } },
        _count: { player_id: true },
      }),
      this.prisma.standing.findMany({
        where: { team_id: { in: allTeamIds } },
        select: {
          team_id: true,
          position: true,
          season: {
            select: {
              season_id: true,
              season_name: true,
              year: true,
              category: true,
              end_date: true,
            },
          },
        },
        orderBy: [{ season_id: 'asc' }],
      }),
    ]);

    // 팀별 출전 수 상위 3명 추출
    const teamPlayerStatsMap = new Map<number, { player_id: number; appearances: number }[]>();
    for (const stat of allPlayerStats) {
      if (stat.player_id === null || stat.team_id === null) continue;
      if (!teamPlayerStatsMap.has(stat.team_id)) {
        teamPlayerStatsMap.set(stat.team_id, []);
      }
      teamPlayerStatsMap.get(stat.team_id)!.push({
        player_id: stat.player_id,
        appearances: stat._count.player_id,
      });
    }
    teamPlayerStatsMap.forEach((stats, teamId) => {
      stats.sort((a, b) => b.appearances - a.appearances);
      teamPlayerStatsMap.set(teamId, stats.slice(0, 3));
    });

    // 필요한 선수 정보 조회
    const allPlayerIds = new Set<number>();
    teamPlayerStatsMap.forEach((stats) => stats.forEach((s) => allPlayerIds.add(s.player_id)));

    const allPlayers =
      allPlayerIds.size > 0
        ? await this.prisma.player.findMany({
            where: { player_id: { in: Array.from(allPlayerIds) } },
            select: { player_id: true, name: true, jersey_number: true },
          })
        : [];
    const playerMap = new Map(allPlayers.map((p) => [p.player_id, p]));

    // 팀별 standings 맵
    const standingsMap = new Map<number, typeof allStandings>();
    for (const standing of allStandings) {
      if (standing.team_id === null) continue;
      if (!standingsMap.has(standing.team_id)) standingsMap.set(standing.team_id, []);
      standingsMap.get(standing.team_id)!.push(standing);
    }

    const now = new Date();
    const teamsWithReps = baseTeams.map((team) => {
      const teamStats = teamPlayerStatsMap.get(team.team_id) ?? [];
      const representative_players = teamStats.map((stat) => {
        const player = playerMap.get(stat.player_id);
        return player
          ? { ...player, appearances: stat.appearances }
          : {
              player_id: stat.player_id,
              name: 'Unknown',
              jersey_number: null,
              appearances: stat.appearances,
            };
      });

      const standings = standingsMap.get(team.team_id) ?? [];
      const championships = standings
        .filter((s) => (s.position ?? 0) === 1)
        .filter((s) => s.season?.end_date && new Date(s.season.end_date) <= now)
        .filter((s) => {
          const league = inferLeague(s.season?.season_name ?? null);
          return (
            league === 'super' ||
            league === 'cup' ||
            league === 'g-league' ||
            s.season?.season_id === 2 ||
            s.season?.season_id === 1
          );
        })
        .map((s) => ({
          season_id: s.season?.season_id ?? 0,
          season_name: s.season?.season_name ?? null,
          year: s.season?.year ?? null,
        }));

      return {
        ...team,
        representative_players,
        championships_count: championships.length,
        championships,
      };
    });

    return { data: teamsWithReps };
  }

  async findOne(teamId: number) {
    const team = await this.prisma.team.findUnique({ where: { team_id: teamId } });
    if (!team) throw new NotFoundException('팀을 찾을 수 없습니다.');
    return team;
  }

  async findRecentForm(teamId: number, beforeDate: string) {
    if (!beforeDate) throw new BadRequestException('before date is required');

    const recentMatches = await this.prisma.match.findMany({
      where: {
        OR: [{ home_team_id: teamId }, { away_team_id: teamId }],
        match_date: { lt: beforeDate },
        home_score: { not: null },
        away_score: { not: null },
      },
      select: {
        match_id: true,
        match_date: true,
        home_team_id: true,
        away_team_id: true,
        home_score: true,
        away_score: true,
        penalty_home_score: true,
        penalty_away_score: true,
        home_team: { select: { team_id: true, team_name: true } },
        away_team: { select: { team_id: true, team_name: true } },
      },
      orderBy: { match_date: 'desc' },
      take: 5,
    });

    return recentMatches.map((match) => ({
      match_id: match.match_id,
      match_date: match.match_date.toISOString(),
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      home_score: match.home_score,
      away_score: match.away_score,
      penalty_home_score: match.penalty_home_score,
      penalty_away_score: match.penalty_away_score,
      home_team: match.home_team,
      away_team: match.away_team,
    }));
  }

  async findStats(teamId: number, seasonId?: number) {
    const matches = await this.prisma.match.findMany({
      where: {
        AND: [
          seasonId ? { season_id: seasonId } : {},
          { OR: [{ home_team_id: teamId }, { away_team_id: teamId }] },
        ],
      },
      select: {
        home_team_id: true,
        away_team_id: true,
        home_score: true,
        away_score: true,
        penalty_home_score: true,
        penalty_away_score: true,
      },
      orderBy: { match_date: 'asc' },
    });

    let total = 0,
      wins = 0,
      losses = 0,
      draws = 0,
      goalsFor = 0,
      goalsAgainst = 0;

    for (const m of matches) {
      total += 1;
      const isHome = m.home_team_id === teamId;
      const gf = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
      const ga = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
      goalsFor += gf;
      goalsAgainst += ga;

      if (gf > ga) {
        wins += 1;
      } else if (gf < ga) {
        losses += 1;
      } else {
        const pf = isHome ? (m.penalty_home_score ?? null) : (m.penalty_away_score ?? null);
        const pa = isHome ? (m.penalty_away_score ?? null) : (m.penalty_home_score ?? null);
        if (pf !== null && pa !== null && (pf !== 0 || pa !== 0)) {
          if (pf > pa) wins += 1;
          else if (pf < pa) losses += 1;
          else draws += 1;
        } else {
          draws += 1;
        }
      }
    }

    return {
      matches: total,
      wins,
      draws,
      losses,
      goals_for: goalsFor,
      goals_against: goalsAgainst,
      goal_diff: goalsFor - goalsAgainst,
      points: wins * 3 + draws,
      win_rate: total > 0 ? Math.round((wins / total) * 100) : 0,
    };
  }

  async findLastMatchLineups(teamId: number, beforeDate: string) {
    if (!beforeDate) throw new BadRequestException('before date is required');

    const lastMatch = await this.prisma.match.findFirst({
      where: {
        OR: [{ home_team_id: teamId }, { away_team_id: teamId }],
        match_date: { lt: beforeDate },
        home_score: { not: null },
        away_score: { not: null },
      },
      orderBy: { match_date: 'desc' },
      select: { match_id: true },
    });

    if (!lastMatch) return [];

    const lineups = await this.prisma.playerMatchStats.findMany({
      where: { match_id: lastMatch.match_id, team_id: teamId },
      select: {
        player: { select: { player_id: true, name: true, jersey_number: true } },
        position: true,
        minutes_played: true,
        goals: true,
        assists: true,
      },
    });

    return lineups.map((p) => {
      let participation_status: 'starting' | 'substitute' | 'bench';
      if (p.minutes_played && p.minutes_played > 0) {
        participation_status = p.minutes_played >= 10 ? 'starting' : 'substitute';
      } else {
        participation_status = 'bench';
      }

      return {
        player_id: p.player?.player_id || 0,
        player_name: p.player?.name || 'Unknown',
        jersey_number: p.player?.jersey_number,
        position: p.position || 'Unknown',
        participation_status,
      };
    });
  }

  async findHighlights(teamId: number) {
    const pmsGrouped = await this.prisma.playerMatchStats.groupBy({
      by: ['player_id'],
      where: { team_id: teamId },
      _count: { match_id: true },
      _sum: { goals: true },
    });

    let topApps: { player_id: number; appearances: number } | null = null;
    let topGoals: { player_id: number; goals: number } | null = null;

    for (const g of pmsGrouped) {
      const appearances = g._count?.match_id ?? 0;
      const goals = g._sum?.goals ?? 0;
      if (!topApps || appearances > topApps.appearances) {
        topApps = { player_id: g.player_id as number, appearances };
      }
      if (!topGoals || goals > topGoals.goals) {
        topGoals = { player_id: g.player_id as number, goals };
      }
    }

    const [topAppsPlayer, topGoalsPlayer] = await Promise.all([
      topApps?.player_id
        ? this.prisma.player.findUnique({
            where: { player_id: topApps.player_id },
            select: { player_id: true, name: true },
          })
        : Promise.resolve(null),
      topGoals?.player_id
        ? this.prisma.player.findUnique({
            where: { player_id: topGoals.player_id },
            select: { player_id: true, name: true },
          })
        : Promise.resolve(null),
    ]);

    const now = new Date();
    const standings = await this.prisma.standing.findMany({
      where: { team_id: teamId },
      select: {
        position: true,
        season: {
          select: {
            season_id: true,
            season_name: true,
            year: true,
            category: true,
            end_date: true,
          },
        },
      },
      orderBy: [{ season_id: 'asc' }],
    });

    const championships = standings
      .filter((s) => (s.position ?? 0) === 1)
      .filter((s) => s.season?.end_date && new Date(s.season.end_date) <= now)
      .filter((s) => {
        const league = inferLeague(s.season?.season_name ?? null);
        return (
          league === 'super' ||
          league === 'cup' ||
          league === 'g-league' ||
          s.season?.season_id === 2 ||
          s.season?.season_id === 1
        );
      })
      .map((s) => ({
        season_id: s.season?.season_id ?? 0,
        season_name: s.season?.season_name ?? null,
        year: s.season?.year ?? null,
      }));

    let bestSuper: number | null = null;
    let bestChallenge: number | null = null;
    let bestCup: number | null = null;
    let bestGLeague: number | null = null;

    for (const row of standings) {
      const pos = row.position ?? null;
      if (pos === null) continue;
      const league = inferLeague(row.season?.season_name ?? null);
      if (league === 'super' && (bestSuper === null || pos < bestSuper)) bestSuper = pos;
      else if (league === 'challenge' && (bestChallenge === null || pos < bestChallenge))
        bestChallenge = pos;
      else if (league === 'cup' && (bestCup === null || pos < bestCup)) bestCup = pos;
      else if (league === 'g-league' && (bestGLeague === null || pos < bestGLeague))
        bestGLeague = pos;
    }

    type LeagueCode = 'super' | 'cup' | 'g-league' | 'challenge';
    const candidates: Array<{ league: LeagueCode; pos: number | null }> = [
      { league: 'super', pos: bestSuper },
      { league: 'cup', pos: bestCup },
      { league: 'g-league', pos: bestGLeague },
      { league: 'challenge', pos: bestChallenge },
    ];
    let best_overall: { position: number | null; league: LeagueCode | null } = {
      position: null,
      league: null,
    };
    for (const c of candidates) {
      if (c.pos == null) continue;
      if (best_overall.position == null || c.pos < best_overall.position) {
        best_overall = { position: c.pos, league: c.league };
      }
    }

    return {
      top_appearances: topAppsPlayer
        ? {
            player_id: topAppsPlayer.player_id,
            name: topAppsPlayer.name,
            appearances: topApps?.appearances ?? 0,
          }
        : null,
      top_scorer: topGoalsPlayer
        ? {
            player_id: topGoalsPlayer.player_id,
            name: topGoalsPlayer.name,
            goals: topGoals?.goals ?? 0,
          }
        : null,
      championships: { count: championships.length, seasons: championships },
      best_positions: {
        super: bestSuper,
        challenge: bestChallenge,
        cup: bestCup,
        'g-league': bestGLeague,
      },
      best_overall,
      best_position: best_overall.position,
    };
  }

  async findPlayers(teamId: number, scope: 'current' | 'all', order: 'default' | 'stats') {
    const whereClause =
      scope === 'current'
        ? { player_team_history: { some: { team_id: teamId, is_active: true } } }
        : { player_team_history: { some: { team_id: teamId } } };

    const players = await this.prisma.player.findMany({
      where: whereClause,
      select: { player_id: true, name: true, jersey_number: true },
      orderBy: order === 'default' ? [{ jersey_number: 'asc' }, { name: 'asc' }] : undefined,
    });

    if (order === 'stats') {
      const grouped = await this.prisma.playerMatchStats.groupBy({
        by: ['player_id'],
        where: { team_id: teamId },
        _count: { match_id: true },
        _sum: { goals: true, assists: true },
      });
      const orderMap = new Map<number, { apps: number; goals: number; assists: number }>();
      for (const g of grouped) {
        orderMap.set(g.player_id ?? 0, {
          apps: g._count?.match_id ?? 0,
          goals: g._sum?.goals ?? 0,
          assists: g._sum?.assists ?? 0,
        });
      }
      players.sort((a, b) => {
        const sa = orderMap.get(a.player_id) ?? { apps: 0, goals: 0, assists: 0 };
        const sb = orderMap.get(b.player_id) ?? { apps: 0, goals: 0, assists: 0 };
        if (sb.apps !== sa.apps) return sb.apps - sa.apps;
        if (sb.goals !== sa.goals) return sb.goals - sa.goals;
        if (sb.assists !== sa.assists) return sb.assists - sa.assists;
        return (a.name ?? '').localeCompare(b.name ?? '');
      });
    }

    return players;
  }

  async findSeasonStandings(teamId: number) {
    const [seasons, teamStandings, teamSeasonStats] = await Promise.all([
      this.prisma.season.findMany({
        select: { season_id: true, season_name: true, year: true, category: true, end_date: true },
        orderBy: [{ season_id: 'asc' }],
      }),
      this.prisma.standing.findMany({
        where: { team_id: teamId },
        select: { season_id: true, position: true, points: true, matches_played: true },
      }),
      this.prisma.teamSeasonStats.findMany({
        where: { team_id: teamId },
        select: { season_id: true, matches_played: true, points: true },
      }),
    ]);

    const now = new Date();
    const standingsBySeason = new Map(
      teamStandings.filter((r) => r.season_id != null).map((r) => [r.season_id!, r]),
    );
    const statsBySeason = new Map(
      teamSeasonStats.filter((r) => r.season_id != null).map((r) => [r.season_id!, r]),
    );

    return seasons.map((s) => {
      const league = inferLeague(s.season_name);
      const st = standingsBySeason.get(s.season_id);
      const isSeasonEnded = s.end_date != null && new Date(s.end_date) <= now;

      if (st) {
        return {
          season_id: s.season_id,
          season_name: s.season_name,
          year: s.year,
          category: s.category,
          league,
          participated: true,
          position: st.position ?? null,
          matches_played: st.matches_played ?? 0,
          points: st.points ?? 0,
          isSeasonEnded,
        };
      }

      if (league === 'cup') {
        const stat = statsBySeason.get(s.season_id);
        if (stat) {
          return {
            season_id: s.season_id,
            season_name: s.season_name,
            year: s.year,
            category: s.category,
            league,
            participated: true,
            position: null,
            matches_played: stat.matches_played ?? 0,
            points: stat.points ?? 0,
            isSeasonEnded,
          };
        }
      }

      return {
        season_id: s.season_id,
        season_name: s.season_name,
        year: s.year,
        category: s.category,
        league,
        participated: false,
        position: null,
        matches_played: 0,
        points: 0,
        isSeasonEnded,
      };
    });
  }
}
