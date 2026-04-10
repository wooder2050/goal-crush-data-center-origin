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
    profile_image_url: string | null;
  } | null;
  top_scorer: {
    player_id: number;
    name: string;
    goals: number;
    profile_image_url: string | null;
  } | null;
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

export type TeamFormationPosition = {
  position: string;
  player_id: number;
  name: string;
  count: number;
  jersey_number: number | null;
  profile_image_url: string | null;
  total_players: number;
};

export type TeamFormation = {
  positions: TeamFormationPosition[];
  season_name: string | null;
};

export type TeamRecentMatch = {
  match_id: number;
  match_date: string;
  season_name: string | null;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
  home_team: { team_id: number; team_name: string; logo: string | null };
  away_team: { team_id: number; team_name: string; logo: string | null };
};

export type TeamPlayerStatRow = {
  player_id: number;
  name: string;
  profile_image_url: string | null;
  team_name: string | null;
  team_logo: string | null;
  value: number;
};

export type InitialTeamDetailData = {
  team: Team;
  stats: TeamStats;
  highlights: TeamHighlights;
  players: Array<{
    player_id: number;
    name: string;
    jersey_number: number | null;
    profile_image_url: string | null;
    is_current: boolean;
  }>;
  formation: TeamFormation;
  recentForm: TeamRecentMatch[];
  topScorers: TeamPlayerStatRow[];
  topAssists: TeamPlayerStatRow[];
  topRated: TeamPlayerStatRow[];
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

  const [stats, highlights, players, formation, recentForm, topPlayers] =
    await Promise.all([
      fetchTeamStats(teamId),
      fetchTeamHighlights(teamId),
      fetchTeamPlayers(teamId),
      fetchTeamFormation(teamId),
      fetchTeamRecentForm(teamId),
      fetchTeamTopPlayers(teamId),
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
    formation,
    recentForm,
    topScorers: topPlayers.topScorers,
    topAssists: topPlayers.topAssists,
    topRated: topPlayers.topRated,
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
    where: { team_id: teamId, minutes_played: { gt: 0 } },
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
          select: { player_id: true, name: true, profile_image_url: true },
        })
      : Promise.resolve(null),
    topGoals?.player_id
      ? prisma.player.findUnique({
          where: { player_id: topGoals.player_id },
          select: { player_id: true, name: true, profile_image_url: true },
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
          profile_image_url: topAppsPlayer.profile_image_url ?? null,
        }
      : null,
    top_scorer: topGoalsPlayer
      ? {
          player_id: topGoalsPlayer.player_id,
          name: topGoalsPlayer.name,
          goals: topGoals?.goals ?? 0,
          profile_image_url: topGoalsPlayer.profile_image_url ?? null,
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
  Array<{
    player_id: number;
    name: string;
    jersey_number: number | null;
    profile_image_url: string | null;
    is_current: boolean;
  }>
> {
  // 현재 진행 중인 최신 시즌 찾기 (전체 기준)
  // 의도: 이번 시즌에 참가하지 않는 팀(개벤져스, 아나콘다 등)은
  // 아무도 "현재" 뱃지가 붙지 않도록 전체 최신 시즌 기준으로 판별
  const currentSeason = await prisma.season.findFirst({
    orderBy: { season_id: 'desc' },
    select: { season_id: true },
  });
  const currentSeasonId = currentSeason?.season_id ?? null;

  // 현재 시즌에 이 팀 소속으로 minutes_played > 0인 선수 ID
  const currentPlayerIds = new Set<number>();
  if (currentSeasonId) {
    const pms = await prisma.playerMatchStats.findMany({
      where: {
        team_id: teamId,
        player_id: { not: null },
        minutes_played: { gt: 0 },
        match: { season_id: currentSeasonId },
      },
      select: { player_id: true },
      distinct: ['player_id'],
    });
    for (const p of pms) {
      if (p.player_id) currentPlayerIds.add(p.player_id);
    }
  }

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
      profile_image_url: true,
    },
  });

  const playersWithCurrent = players.map((p) => ({
    player_id: p.player_id,
    name: p.name,
    jersey_number: p.jersey_number,
    profile_image_url: p.profile_image_url,
    is_current: currentPlayerIds.has(p.player_id),
  }));

  // stats 기반 정렬 (현재 멤버 우선 > 출전 > 골 > 도움 > 이름)
  const grouped = await prisma.playerMatchStats.groupBy({
    by: ['player_id'],
    where: { team_id: teamId, minutes_played: { gt: 0 } },
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

  playersWithCurrent.sort((a, b) => {
    // 현재 멤버 우선
    if (a.is_current !== b.is_current) return a.is_current ? -1 : 1;
    const sa = orderMap.get(a.player_id) ?? { apps: 0, goals: 0, assists: 0 };
    const sb = orderMap.get(b.player_id) ?? { apps: 0, goals: 0, assists: 0 };
    if (sb.apps !== sa.apps) return sb.apps - sa.apps;
    if (sb.goals !== sa.goals) return sb.goals - sa.goals;
    if (sb.assists !== sa.assists) return sb.assists - sa.assists;
    return (a.name ?? '').localeCompare(b.name ?? '');
  });

  return playersWithCurrent;
}

// ─── Formation (올시즌 선발 포지션) ───

async function fetchTeamFormation(teamId: number): Promise<TeamFormation> {
  const latestMatch = await prisma.match.findFirst({
    where: {
      OR: [{ home_team_id: teamId }, { away_team_id: teamId }],
      season_id: { not: null },
    },
    orderBy: { match_date: 'desc' },
    select: { season_id: true },
  });

  if (!latestMatch?.season_id) return { positions: [], season_name: null };

  const seasonId = latestMatch.season_id;
  const season = await prisma.season.findUnique({
    where: { season_id: seasonId },
    select: { season_name: true },
  });

  const matchIds = await prisma.match.findMany({
    where: {
      season_id: seasonId,
      OR: [{ home_team_id: teamId }, { away_team_id: teamId }],
    },
    select: { match_id: true },
  });

  const stats = await prisma.playerMatchStats.findMany({
    where: {
      match_id: { in: matchIds.map((m) => m.match_id) },
      team_id: teamId,
      position: { not: null },
      minutes_played: { gt: 0 },
    },
    select: {
      player_id: true,
      position: true,
      player: {
        select: { name: true, jersey_number: true, profile_image_url: true },
      },
    },
  });

  const positionMap = new Map<
    string,
    Map<
      number,
      {
        name: string;
        count: number;
        jersey_number: number | null;
        profile_image_url: string | null;
      }
    >
  >();

  for (const s of stats) {
    if (!s.position || !s.player_id) continue;
    if (!positionMap.has(s.position)) positionMap.set(s.position, new Map());
    const players = positionMap.get(s.position)!;
    const existing = players.get(s.player_id);
    if (existing) {
      existing.count += 1;
    } else {
      players.set(s.player_id, {
        name: s.player?.name ?? '-',
        count: 1,
        jersey_number: s.player?.jersey_number ?? null,
        profile_image_url: s.player?.profile_image_url ?? null,
      });
    }
  }

  const positionOrder = ['GK', 'DF', 'MF', 'FW'];
  const usedPlayerIds = new Set<number>();
  const positions: TeamFormationPosition[] = [];

  for (const pos of positionOrder) {
    const players = positionMap.get(pos);
    if (!players) continue;
    const sorted = Array.from(players.entries())
      .filter(([pid]) => !usedPlayerIds.has(pid))
      .sort((a, b) => b[1].count - a[1].count);
    if (sorted.length === 0) continue;
    const top = sorted[0];
    positions.push({
      position: pos,
      player_id: top[0],
      name: top[1].name,
      count: top[1].count,
      jersey_number: top[1].jersey_number,
      profile_image_url: top[1].profile_image_url,
      total_players: sorted.length,
    });
    usedPlayerIds.add(top[0]);
  }

  if (positions.length < 5) {
    for (const pos of ['MF', 'DF', 'FW']) {
      if (positions.length >= 5) break;
      const players = positionMap.get(pos);
      if (!players) continue;
      const sorted = Array.from(players.entries())
        .filter(([pid]) => !usedPlayerIds.has(pid))
        .sort((a, b) => b[1].count - a[1].count);
      for (const [pid, data] of sorted) {
        if (positions.length >= 5) break;
        positions.push({
          position: pos,
          player_id: pid,
          name: data.name,
          count: data.count,
          jersey_number: data.jersey_number,
          profile_image_url: data.profile_image_url,
          total_players: positionMap.get(pos)?.size ?? 0,
        });
        usedPlayerIds.add(pid);
      }
    }
  }

  positions.sort((a, b) => {
    const order: Record<string, number> = { GK: 0, DF: 1, MF: 2, FW: 3 };
    return (order[a.position] ?? 99) - (order[b.position] ?? 99);
  });

  return { positions, season_name: season?.season_name ?? null };
}

// ─── Recent Form (최근 5경기) ───

async function fetchTeamRecentForm(teamId: number): Promise<TeamRecentMatch[]> {
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ home_team_id: teamId }, { away_team_id: teamId }],
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
      season: { select: { season_name: true } },
      home_team: { select: { team_id: true, team_name: true, logo: true } },
      away_team: { select: { team_id: true, team_name: true, logo: true } },
    },
    orderBy: { match_date: 'desc' },
    take: 10,
  });

  return matches.map((m) => ({
    match_id: m.match_id,
    match_date: m.match_date.toISOString(),
    season_name: m.season?.season_name ?? null,
    home_team_id: m.home_team_id ?? 0,
    away_team_id: m.away_team_id ?? 0,
    home_score: m.home_score,
    away_score: m.away_score,
    penalty_home_score: m.penalty_home_score,
    penalty_away_score: m.penalty_away_score,
    home_team: m.home_team
      ? {
          team_id: m.home_team.team_id,
          team_name: m.home_team.team_name,
          logo: m.home_team.logo ?? null,
        }
      : { team_id: 0, team_name: '-', logo: null },
    away_team: m.away_team
      ? {
          team_id: m.away_team.team_id,
          team_name: m.away_team.team_name,
          logo: m.away_team.logo ?? null,
        }
      : { team_id: 0, team_name: '-', logo: null },
  }));
}

// ─── Top Players (통산 득점/도움/평점 TOP5) ───

async function fetchTeamTopPlayers(teamId: number): Promise<{
  topScorers: TeamPlayerStatRow[];
  topAssists: TeamPlayerStatRow[];
  topRated: TeamPlayerStatRow[];
}> {
  // 통산 선수별 통계 집계
  const grouped = await prisma.playerMatchStats.groupBy({
    by: ['player_id'],
    where: {
      team_id: teamId,
      player_id: { not: null },
      minutes_played: { gt: 0 },
    },
    _sum: { goals: true, assists: true },
    _count: { match_id: true },
  });

  const playerIds = grouped
    .map((g) => g.player_id)
    .filter((id): id is number => id !== null);

  if (playerIds.length === 0)
    return { topScorers: [], topAssists: [], topRated: [] };

  const [playersArr, team] = await Promise.all([
    prisma.player.findMany({
      where: { player_id: { in: playerIds } },
      select: { player_id: true, name: true, profile_image_url: true },
    }),
    prisma.team.findUnique({
      where: { team_id: teamId },
      select: { team_name: true, logo: true },
    }),
  ]);

  const playersMap = new Map(playersArr.map((p) => [p.player_id, p]));

  const toRow = (
    g: (typeof grouped)[number],
    value: number
  ): TeamPlayerStatRow => {
    const p = playersMap.get(g.player_id ?? 0);
    return {
      player_id: g.player_id ?? 0,
      name: p?.name ?? '-',
      profile_image_url: p?.profile_image_url ?? null,
      team_name: team?.team_name ?? null,
      team_logo: team?.logo ?? null,
      value,
    };
  };

  const topScorers = grouped
    .filter((g) => (g._sum.goals ?? 0) > 0)
    .sort((a, b) => (b._sum.goals ?? 0) - (a._sum.goals ?? 0))
    .slice(0, 5)
    .map((g) => toRow(g, g._sum.goals ?? 0));

  const topAssists = grouped
    .filter((g) => (g._sum.assists ?? 0) > 0)
    .sort((a, b) => (b._sum.assists ?? 0) - (a._sum.assists ?? 0))
    .slice(0, 5)
    .map((g) => toRow(g, g._sum.assists ?? 0));

  // 통산 평점: player_match_ratings
  const ratingsGrouped = await prisma.playerMatchRating.groupBy({
    by: ['player_id'],
    where: {
      team_id: teamId,
      player_id: { in: playerIds },
    },
    _avg: { rating: true },
    _count: { rating_id: true },
  });

  const topRated = ratingsGrouped
    .filter((r) => (r._count.rating_id ?? 0) >= 2 && r._avg.rating != null)
    .sort((a, b) => (b._avg.rating ?? 0) - (a._avg.rating ?? 0))
    .slice(0, 5)
    .map((r) => {
      const p = playersMap.get(r.player_id ?? 0);
      return {
        player_id: r.player_id ?? 0,
        name: p?.name ?? '-',
        profile_image_url: p?.profile_image_url ?? null,
        team_name: team?.team_name ?? null,
        team_logo: team?.logo ?? null,
        value: Math.round((r._avg.rating ?? 0) * 10) / 10,
      };
    });

  return { topScorers, topAssists, topRated };
}
