import type { TeamSeasonNameResult } from '@/app/api/types';
import { prisma } from '@/lib/prisma';

import type {
  CareerStatRow,
  GoalScorerRow,
  HomeMatch,
  HomePageData,
  HomeStanding,
  LatestMatchGoals,
  PlayerStatRow,
  SeasonSummaryStats,
  StandingsGroup,
} from './types';

// ── ExtendedPrismaClient ──────────────────────────────

interface ExtendedPrismaClient {
  teamSeasonName: {
    findMany: (args: {
      where: {
        OR?: Array<{ team_id: number; season_id: number }>;
        season_id?: number;
      };
      select: {
        team_id: boolean;
        season_id?: boolean;
        team_name: boolean;
      };
    }) => Promise<TeamSeasonNameResult[]>;
  };
}

// ── Helpers ───────────────────────────────────────────

function serializeMatch(
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
    is_date_confirmed: boolean;
    home_team: {
      team_id: number;
      team_name: string;
      logo: string | null;
    } | null;
    away_team: {
      team_id: number;
      team_name: string;
      logo: string | null;
    } | null;
    season: { season_id: number; season_name: string } | null;
  },
  teamNameMap: Map<string, string>
): HomeMatch {
  const homeTeamName =
    match.home_team && match.season_id
      ? (teamNameMap.get(`${match.home_team_id}-${match.season_id}`) ??
        match.home_team.team_name)
      : (match.home_team?.team_name ?? '');

  const awayTeamName =
    match.away_team && match.season_id
      ? (teamNameMap.get(`${match.away_team_id}-${match.season_id}`) ??
        match.away_team.team_name)
      : (match.away_team?.team_name ?? '');

  return {
    match_id: match.match_id,
    match_date: match.match_date.toISOString(),
    home_score: match.home_score,
    away_score: match.away_score,
    penalty_home_score: match.penalty_home_score,
    penalty_away_score: match.penalty_away_score,
    status: match.status,
    is_date_confirmed: match.is_date_confirmed,
    season: match.season
      ? {
          season_id: match.season.season_id,
          season_name: match.season.season_name,
        }
      : null,
    home_team: match.home_team
      ? {
          team_id: match.home_team.team_id,
          team_name: homeTeamName,
          logo: match.home_team.logo,
        }
      : null,
    away_team: match.away_team
      ? {
          team_id: match.away_team.team_id,
          team_name: awayTeamName,
          logo: match.away_team.logo,
        }
      : null,
  };
}

async function buildTeamNameMap(
  matches: Array<{
    home_team_id: number | null;
    away_team_id: number | null;
    season_id: number | null;
  }>
): Promise<Map<string, string>> {
  const pairs = matches.flatMap((m) => {
    const result: Array<{ team_id: number; season_id: number }> = [];
    if (m.home_team_id != null && m.season_id != null) {
      result.push({ team_id: m.home_team_id, season_id: m.season_id });
    }
    if (m.away_team_id != null && m.season_id != null) {
      result.push({ team_id: m.away_team_id, season_id: m.season_id });
    }
    return result;
  });

  if (pairs.length === 0) return new Map();

  const teamSeasonNames = await (
    prisma as unknown as ExtendedPrismaClient
  ).teamSeasonName.findMany({
    where: { OR: pairs },
    select: { team_id: true, season_id: true, team_name: true },
  });

  return new Map(
    teamSeasonNames.map((t) => [`${t.team_id}-${t.season_id}`, t.team_name])
  );
}

// ── Data Fetch Functions ──────────────────────────────

async function getLatestSeason(): Promise<{
  season_id: number;
  season_name: string;
} | null> {
  const season = await prisma.season.findFirst({
    orderBy: { season_id: 'desc' },
    select: { season_id: true, season_name: true },
  });
  return season;
}

async function getRecentCompletedMatches(): Promise<HomeMatch[]> {
  const matches = await prisma.match.findMany({
    where: { status: 'completed' },
    orderBy: { match_date: 'desc' },
    take: 5,
    include: {
      home_team: { select: { team_id: true, team_name: true, logo: true } },
      away_team: { select: { team_id: true, team_name: true, logo: true } },
      season: { select: { season_id: true, season_name: true } },
    },
  });

  const teamNameMap = await buildTeamNameMap(matches);
  return matches.map((m) => serializeMatch(m, teamNameMap));
}

async function getInterleagueMatchesList(
  seasonId: number
): Promise<HomeMatch[]> {
  const matches = await prisma.match.findMany({
    where: {
      season_id: seasonId,
      group_stage: null,
      description: { contains: '인터리그' },
    },
    orderBy: [{ is_date_confirmed: 'desc' }, { match_date: 'asc' }],
    include: {
      home_team: { select: { team_id: true, team_name: true, logo: true } },
      away_team: { select: { team_id: true, team_name: true, logo: true } },
      season: { select: { season_id: true, season_name: true } },
    },
  });

  const teamNameMap = await buildTeamNameMap(matches);
  return matches.map((m) => serializeMatch(m, teamNameMap));
}

async function getUpcomingMatchesList(limit: number = 5): Promise<HomeMatch[]> {
  const matches = await prisma.match.findMany({
    where: { match_date: { gt: new Date() }, is_date_confirmed: true },
    orderBy: { match_date: 'asc' },
    take: limit,
    include: {
      home_team: { select: { team_id: true, team_name: true, logo: true } },
      away_team: { select: { team_id: true, team_name: true, logo: true } },
      season: { select: { season_id: true, season_name: true } },
    },
  });

  const teamNameMap = await buildTeamNameMap(matches);
  return matches.map((m) => serializeMatch(m, teamNameMap));
}

async function getStandings(seasonId: number): Promise<StandingsGroup[]> {
  const teamSeasonNames = await (
    prisma as unknown as ExtendedPrismaClient
  ).teamSeasonName.findMany({
    where: { season_id: seasonId },
    select: { team_id: true, team_name: true },
  });

  const teamNameMap = new Map<number, string>();
  teamSeasonNames.forEach((t) => {
    teamNameMap.set(t.team_id, t.team_name);
  });

  // group_league_standings에서 조별 순위 조회
  const groupStandings = await prisma.groupLeagueStanding.findMany({
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

  // 조별 데이터가 없으면 기존 standings 테이블에서 조회
  if (groupStandings.length === 0) {
    const standings = await prisma.standing.findMany({
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

    const teamIds = standings
      .map((s) => s.team_id)
      .filter((id): id is number => id != null);
    const recentFormMap = await buildRecentFormMap(seasonId, teamIds);

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
          form:
            s.team_id != null ? (recentFormMap.get(s.team_id) ?? null) : null,
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

  // 조별 데이터가 있으면 그룹별로 분류
  const teamIds = groupStandings
    .map((s) => s.team_id)
    .filter((id): id is number => id != null);
  const recentFormMap = await buildRecentFormMap(seasonId, teamIds);

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
    if (existing) {
      existing.push(standing);
    } else {
      groupMap.set(name, [standing]);
    }
  }

  return Array.from(groupMap.entries()).map(([name, standings]) => ({
    group_name: name,
    standings,
  }));
}

async function buildRecentFormMap(
  seasonId: number,
  teamIds: number[]
): Promise<Map<number, string>> {
  if (teamIds.length === 0) return new Map();

  const recentMatches = await prisma.match.findMany({
    where: {
      season_id: seasonId,
      status: 'completed',
      OR: [
        { home_team_id: { in: teamIds } },
        { away_team_id: { in: teamIds } },
      ],
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
        if (teamScore !== opponentScore) {
          return teamScore > opponentScore ? 'W' : 'L';
        }
        // 동점 시 승부차기 결과로 판정
        const teamPK = isHome ? m.penalty_home_score : m.penalty_away_score;
        const opponentPK = isHome ? m.penalty_away_score : m.penalty_home_score;
        if (teamPK != null && opponentPK != null) {
          return teamPK > opponentPK ? 'W' : 'L';
        }
        return 'W'; // PK 데이터 없으면 기본 승리 처리
      })
      .join('');

    if (form) formMap.set(teamId, form);
  }

  return formMap;
}

async function getTopScorersList(
  seasonId: number,
  limit: number = 5
): Promise<PlayerStatRow[]> {
  const teamSeasonNames = await prisma.teamSeasonName.findMany({
    where: { season_id: seasonId },
    select: { team_id: true, team_name: true },
  });
  const teamNameMap = new Map<number, string>();
  teamSeasonNames.forEach((t) => {
    teamNameMap.set(t.team_id, t.team_name);
  });

  const stats = await prisma.playerSeasonStats.findMany({
    where: { season_id: seasonId },
    include: {
      player: {
        select: { player_id: true, name: true, profile_image_url: true },
      },
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

async function getTopAssistsList(
  seasonId: number,
  limit: number = 5
): Promise<PlayerStatRow[]> {
  const teamSeasonNames = await prisma.teamSeasonName.findMany({
    where: { season_id: seasonId },
    select: { team_id: true, team_name: true },
  });
  const teamNameMap = new Map<number, string>();
  teamSeasonNames.forEach((t) => {
    teamNameMap.set(t.team_id, t.team_name);
  });

  const stats = await prisma.playerSeasonStats.findMany({
    where: { season_id: seasonId },
    include: {
      player: {
        select: { player_id: true, name: true, profile_image_url: true },
      },
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

async function getTopRatingsList(
  seasonId: number,
  limit: number = 5
): Promise<PlayerStatRow[]> {
  const teamSeasonNames = await prisma.teamSeasonName.findMany({
    where: { season_id: seasonId },
    select: { team_id: true, team_name: true },
  });
  const teamNameMap = new Map<number, string>();
  teamSeasonNames.forEach((t) => {
    teamNameMap.set(t.team_id, t.team_name);
  });

  const grouped = await prisma.playerMatchRating.groupBy({
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
    prisma.player.findMany({
      where: { player_id: { in: playerIds } },
      select: { player_id: true, name: true, profile_image_url: true },
    }),
    prisma.team.findMany({
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

async function getTopXtRatingsList(
  seasonId: number,
  limit: number = 5
): Promise<PlayerStatRow[]> {
  const teamSeasonNames = await prisma.teamSeasonName.findMany({
    where: { season_id: seasonId },
    select: { team_id: true, team_name: true },
  });
  const teamNameMap = new Map<number, string>();
  teamSeasonNames.forEach((t) => {
    teamNameMap.set(t.team_id, t.team_name);
  });

  const grouped = await prisma.playerMatchXtRating.groupBy({
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
    prisma.player.findMany({
      where: { player_id: { in: playerIds } },
      select: { player_id: true, name: true, profile_image_url: true },
    }),
    prisma.team.findMany({
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

async function getCareerStats(
  limit: number = 5,
  minMatches: number = 10
): Promise<{
  scorers: CareerStatRow[];
  assists: CareerStatRow[];
  goalsPerMatch: CareerStatRow[];
  assistsPerMatch: CareerStatRow[];
  attackPoints: CareerStatRow[];
  attackPointsPerMatch: CareerStatRow[];
}> {
  const stats = await prisma.playerSeasonStats.findMany({
    include: {
      player: {
        select: { player_id: true, name: true, profile_image_url: true },
      },
      team: {
        select: {
          team_id: true,
          team_name: true,
          primary_color: true,
          secondary_color: true,
        },
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
        existing.latest_team_secondary_color =
          stat.team.secondary_color ?? null;
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
      p.matches_played > 0
        ? Math.round((p.goals / p.matches_played) * 100) / 100
        : 0,
    assists_per_match:
      p.matches_played > 0
        ? Math.round((p.assists / p.matches_played) * 100) / 100
        : 0,
    attack_points: p.goals + p.assists,
    attack_points_per_match:
      p.matches_played > 0
        ? Math.round(((p.goals + p.assists) / p.matches_played) * 100) / 100
        : 0,
  });

  const scorers = [...allPlayers]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, limit)
    .map(toRow);

  const assisters = [...allPlayers]
    .sort((a, b) => b.assists - a.assists)
    .slice(0, limit)
    .map(toRow);

  const qualifiedPlayers = allPlayers.filter(
    (p) => p.matches_played >= minMatches
  );

  const goalsPerMatch = [...qualifiedPlayers]
    .sort((a, b) => {
      const aGpm = a.matches_played > 0 ? a.goals / a.matches_played : 0;
      const bGpm = b.matches_played > 0 ? b.goals / b.matches_played : 0;
      return bGpm - aGpm;
    })
    .slice(0, limit)
    .map(toRow);

  const assistsPerMatch = [...qualifiedPlayers]
    .sort((a, b) => {
      const aApm = a.matches_played > 0 ? a.assists / a.matches_played : 0;
      const bApm = b.matches_played > 0 ? b.assists / b.matches_played : 0;
      return bApm - aApm;
    })
    .slice(0, limit)
    .map(toRow);

  const attackPoints = [...allPlayers]
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
    .slice(0, limit)
    .map(toRow);

  const attackPointsPerMatch = [...qualifiedPlayers]
    .sort((a, b) => {
      const aAp =
        a.matches_played > 0 ? (a.goals + a.assists) / a.matches_played : 0;
      const bAp =
        b.matches_played > 0 ? (b.goals + b.assists) / b.matches_played : 0;
      return bAp - aAp;
    })
    .slice(0, limit)
    .map(toRow);

  return {
    scorers,
    assists: assisters,
    goalsPerMatch,
    assistsPerMatch,
    attackPoints,
    attackPointsPerMatch,
  };
}

async function getLatestMatchGoalScorers(): Promise<LatestMatchGoals | null> {
  const latestMatch = await prisma.match.findFirst({
    where: { status: 'completed' },
    orderBy: { match_date: 'desc' },
    include: {
      home_team: { select: { team_id: true, team_name: true, logo: true } },
      away_team: { select: { team_id: true, team_name: true, logo: true } },
      season: { select: { season_id: true, season_name: true } },
    },
  });

  if (!latestMatch) return null;

  const teamNameMap = await buildTeamNameMap([latestMatch]);
  const homeMatch = serializeMatch(latestMatch, teamNameMap);

  const goals = await prisma.goal.findMany({
    where: { match_id: latestMatch.match_id },
    include: {
      player: {
        select: { player_id: true, name: true, jersey_number: true },
      },
    },
    orderBy: { goal_time: 'asc' },
  });

  const playerIds = goals.map((g) => g.player_id);
  const allPlayerStats = await prisma.playerMatchStats.findMany({
    where: {
      match_id: latestMatch.match_id,
      player_id: { in: playerIds },
    },
    include: {
      team: { select: { team_id: true, team_name: true } },
    },
  });

  const playerTeamMap = new Map(
    allPlayerStats.map((ps) => [ps.player_id, ps.team ?? null])
  );

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

async function getSeasonSummaryStats(
  seasonId: number
): Promise<SeasonSummaryStats> {
  const [totalMatches, completedMatches, totalGoals, participatingTeams] =
    await Promise.all([
      prisma.match.count({ where: { season_id: seasonId } }),
      prisma.match.count({
        where: { season_id: seasonId, status: 'completed' },
      }),
      prisma.goal.count({
        where: { match: { season_id: seasonId } },
      }),
      prisma.teamSeason.count({ where: { season_id: seasonId } }),
    ]);

  return {
    totalMatches,
    completedMatches,
    totalGoals,
    avgGoalsPerMatch: completedMatches > 0 ? totalGoals / completedMatches : 0,
    participatingTeams,
  };
}

// ── Aggregator ────────────────────────────────────────

export async function getHomePageData(): Promise<HomePageData> {
  const currentSeason = await getLatestSeason();

  if (!currentSeason) {
    return {
      currentSeason: { season_id: 0, season_name: '' },
      recentMatches: [],
      upcomingMatches: [],
      interleagueMatches: [],
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
    interleagueMatches,
    standings,
    topScorers,
    topAssists,
    topRatings,
    topXtRatings,
    latestMatchGoals,
    seasonSummary,
    careerStats,
  ] = await Promise.all([
    getRecentCompletedMatches(),
    getUpcomingMatchesList(),
    getInterleagueMatchesList(currentSeason.season_id),
    getStandings(currentSeason.season_id),
    getTopScorersList(currentSeason.season_id),
    getTopAssistsList(currentSeason.season_id),
    getTopRatingsList(currentSeason.season_id),
    getTopXtRatingsList(currentSeason.season_id).catch(
      () => [] as PlayerStatRow[]
    ),
    getLatestMatchGoalScorers(),
    getSeasonSummaryStats(currentSeason.season_id),
    getCareerStats(),
  ]);

  return {
    currentSeason,
    recentMatches,
    upcomingMatches,
    interleagueMatches,
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
