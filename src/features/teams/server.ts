import type { TeamStats } from '@/features/teams/api-prisma';
import type { TeamWithExtras } from '@/features/teams/types';
import { prisma } from '@/lib/prisma';
import type { Team } from '@/lib/types';
import { inferLeague } from '@/lib/utils';

// ─── Types ───

export type TeamHighlights = {
  top_appearances: {
    player_id: number;
    name: string;
    appearances: number;
  } | null;
  top_scorer: { player_id: number; name: string; goals: number } | null;
  championships: {
    count: number;
    seasons: Array<{
      season_id: number;
      season_name: string | null;
      year: number | null;
    }>;
  };
  best_positions: {
    super: number | null;
    challenge: number | null;
    cup: number | null;
    'g-league': number | null;
  };
  best_overall: {
    position: number | null;
    league: 'super' | 'cup' | 'challenge' | 'g-league' | null;
  };
  best_position: number | null;
};

export type InitialTeamsData = {
  teams: TeamWithExtras[];
};

export type InitialTeamDetailData = {
  team: Team;
  stats: TeamStats;
  highlights: TeamHighlights;
  players: Array<{
    player_id: number;
    name: string;
    jersey_number: number | null;
  }>;
};

// ─── /teams 목록 ───

export async function getInitialTeamsData(): Promise<InitialTeamsData> {
  const baseTeams = await prisma.team.findMany({
    orderBy: { team_name: 'asc' },
    include: {
      _count: { select: { team_seasons: true } },
      team_seasons: {
        select: {
          season: {
            select: { season_id: true, season_name: true, year: true },
          },
        },
      },
    },
  });

  const allTeamIds = baseTeams.map((t) => t.team_id);

  // 배치 쿼리 1: 모든 팀의 선수별 출전 통계
  const allPlayerStats = await prisma.playerMatchStats.groupBy({
    by: ['team_id', 'player_id'],
    where: { team_id: { in: allTeamIds }, player_id: { not: null } },
    _count: { player_id: true },
  });

  const teamPlayerStatsMap = new Map<
    number,
    { player_id: number; appearances: number }[]
  >();
  for (const stat of allPlayerStats) {
    if (stat.player_id === null || stat.team_id === null) continue;
    const teamId = stat.team_id;
    if (!teamPlayerStatsMap.has(teamId)) {
      teamPlayerStatsMap.set(teamId, []);
    }
    teamPlayerStatsMap.get(teamId)!.push({
      player_id: stat.player_id,
      appearances: stat._count.player_id,
    });
  }
  Array.from(teamPlayerStatsMap.entries()).forEach(([tid, stats]) => {
    stats.sort((a, b) => b.appearances - a.appearances);
    teamPlayerStatsMap.set(tid, stats.slice(0, 3));
  });

  // 배치 쿼리 2: 필요한 모든 선수 정보
  const allPlayerIds = new Set<number>();
  Array.from(teamPlayerStatsMap.values()).forEach((stats) => {
    for (const s of stats) {
      allPlayerIds.add(s.player_id);
    }
  });
  const allPlayers =
    allPlayerIds.size > 0
      ? await prisma.player.findMany({
          where: { player_id: { in: Array.from(allPlayerIds) } },
          select: { player_id: true, name: true, jersey_number: true },
        })
      : [];
  const playerMap = new Map(allPlayers.map((p) => [p.player_id, p]));

  // 배치 쿼리 3: 모든 팀의 standings
  const allStandings = await prisma.standing.findMany({
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
  });

  const standingsMap = new Map<number, (typeof allStandings)[number][]>();
  for (const standing of allStandings) {
    const teamId = standing.team_id;
    if (teamId === null) continue;
    if (!standingsMap.has(teamId)) {
      standingsMap.set(teamId, []);
    }
    standingsMap.get(teamId)!.push(standing);
  }

  const now = new Date();
  const teams = baseTeams.map((team) => {
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
      .filter((s) => {
        const endDate = s.season?.end_date;
        return endDate && new Date(endDate) <= now;
      })
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
      created_at: team.created_at?.toISOString() ?? null,
      updated_at: team.updated_at?.toISOString() ?? null,
      representative_players,
      championships_count: championships.length,
      championships,
    };
  });

  return { teams: teams as unknown as TeamWithExtras[] };
}

// ─── /teams/[teamId] 상세 ───

export async function getInitialTeamDetailData(
  teamId: number
): Promise<InitialTeamDetailData | null> {
  const team = await prisma.team.findUnique({
    where: { team_id: teamId },
  });

  if (!team) return null;

  const [stats, highlights, players] = await Promise.all([
    fetchTeamStats(teamId),
    fetchTeamHighlights(teamId),
    fetchTeamPlayers(teamId),
  ]);

  return {
    team: {
      ...team,
      created_at: team.created_at?.toISOString() ?? null,
      updated_at: team.updated_at?.toISOString() ?? null,
    } as unknown as Team,
    stats,
    highlights,
    players,
  };
}

async function fetchTeamStats(teamId: number): Promise<TeamStats> {
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ home_team_id: teamId }, { away_team_id: teamId }],
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

  let total = 0;
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (const m of matches) {
    total += 1;
    const isHome = m.home_team_id === teamId;
    const gf = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
    const ga = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
    goalsFor += gf;
    goalsAgainst += ga;

    if (gf > ga) {
      wins += 1;
      continue;
    }
    if (gf < ga) {
      losses += 1;
      continue;
    }

    const pf = isHome
      ? (m.penalty_home_score ?? null)
      : (m.penalty_away_score ?? null);
    const pa = isHome
      ? (m.penalty_away_score ?? null)
      : (m.penalty_home_score ?? null);

    if (pf !== null && pa !== null && (pf !== 0 || pa !== 0)) {
      if (pf > pa) wins += 1;
      else if (pf < pa) losses += 1;
      else draws += 1;
    } else {
      draws += 1;
    }
  }

  const goalDiff = goalsFor - goalsAgainst;
  const points = wins * 3 + draws * 1;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return {
    matches: total,
    wins,
    draws,
    losses,
    goals_for: goalsFor,
    goals_against: goalsAgainst,
    goal_diff: goalDiff,
    points,
    win_rate: winRate,
  };
}

async function fetchTeamHighlights(teamId: number): Promise<TeamHighlights> {
  const pmsGrouped = await prisma.playerMatchStats.groupBy({
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
      ? prisma.player.findUnique({
          where: { player_id: topApps.player_id },
          select: { player_id: true, name: true },
        })
      : Promise.resolve(null),
    topGoals?.player_id
      ? prisma.player.findUnique({
          where: { player_id: topGoals.player_id },
          select: { player_id: true, name: true },
        })
      : Promise.resolve(null),
  ]);

  const now = new Date();
  const standings = await prisma.standing.findMany({
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
    .filter((s) => {
      const endDate = s.season?.end_date;
      return endDate && new Date(endDate) <= now;
    })
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
    if (league === 'super') {
      if (bestSuper === null || pos < bestSuper) bestSuper = pos;
    } else if (league === 'challenge') {
      if (bestChallenge === null || pos < bestChallenge) bestChallenge = pos;
    } else if (league === 'cup') {
      if (bestCup === null || pos < bestCup) bestCup = pos;
    } else if (league === 'g-league') {
      if (bestGLeague === null || pos < bestGLeague) bestGLeague = pos;
    }
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
    championships: {
      count: championships.length,
      seasons: championships,
    },
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

async function fetchTeamPlayers(
  teamId: number
): Promise<
  Array<{ player_id: number; name: string; jersey_number: number | null }>
> {
  const players = await prisma.player.findMany({
    where: {
      player_team_history: {
        some: { team_id: teamId },
      },
    },
    select: {
      player_id: true,
      name: true,
      jersey_number: true,
    },
  });

  // stats 기반 정렬 (출전 > 골 > 도움 > 이름)
  const grouped = await prisma.playerMatchStats.groupBy({
    by: ['player_id'],
    where: { team_id: teamId },
    _count: { match_id: true },
    _sum: { goals: true, assists: true },
  });
  const orderMap = new Map<
    number,
    { apps: number; goals: number; assists: number }
  >();
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

  return players;
}
