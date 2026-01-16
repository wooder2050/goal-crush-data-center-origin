import type { PrismaClient } from '@prisma/client';

import type {
  CoachDetail,
  CoachFull,
  CoachOverview,
  CoachSeasonStats,
  CoachTrophies,
  CoachWithHistory,
  Season,
  TeamCurrentHeadCoach,
} from '@/lib/types/database';

// Simple in-memory TTL cache for server-side usage
type CacheEntry<T> = { value: T; expiresAt: number };
const __coachCache = new Map<string, CacheEntry<unknown>>();

function cacheGet<T>(key: string): T | undefined {
  const entry = __coachCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    __coachCache.delete(key);
    return undefined;
  }
  return entry.value;
}

function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  __coachCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function isLeague(category: string | null) {
  return (
    category === 'G_LEAGUE' ||
    category === 'SUPER_LEAGUE' ||
    category === 'CHALLENGE_LEAGUE' ||
    category === 'PLAYOFF' ||
    category === 'OTHER'
  );
}

export async function getTeamsByIdsCached(
  db: PrismaClient,
  teamIds: number[],
  ttlMs = 5 * 60 * 1000
): Promise<
  Map<number, { team_id: number; team_name: string; logo: string | null }>
> {
  const uniqueIds = Array.from(new Set(teamIds));
  const result = new Map<
    number,
    { team_id: number; team_name: string; logo: string | null }
  >();

  const missing: number[] = [];
  for (let i = 0; i < uniqueIds.length; i++) {
    const id = uniqueIds[i];
    const cached = cacheGet<{
      team_id: number;
      team_name: string;
      logo: string | null;
    }>(`team:${id}`);
    if (cached) {
      result.set(id, cached);
    } else {
      missing.push(id);
    }
  }

  if (missing.length > 0) {
    const rows = await db.team.findMany({
      where: { team_id: { in: missing } },
      select: { team_id: true, team_name: true, logo: true },
    });
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const payload = {
        team_id: r.team_id,
        team_name: r.team_name,
        logo: r.logo ?? null,
      };
      cacheSet(`team:${r.team_id}`, payload, ttlMs);
      result.set(r.team_id, payload);
    }
  }

  return result;
}

export async function computeCoachSeasonStats(
  db: PrismaClient,
  coachId: number
): Promise<CoachSeasonStats[]> {
  const matchCoaches = await db.matchCoach.findMany({
    where: { coach_id: coachId, role: 'head' },
    select: {
      team: { select: { team_id: true, team_name: true } },
      match: {
        select: {
          season_id: true,
          home_team_id: true,
          away_team_id: true,
          home_score: true,
          away_score: true,
          penalty_home_score: true,
          penalty_away_score: true,
          season: { select: { season_name: true } },
        },
      },
    },
    orderBy: { match: { match_date: 'asc' } },
  });

  const seasonStatsMap = new Map<
    number,
    {
      season_id: number;
      season_name: string;
      matches_played: number;
      wins: number;
      draws: number;
      losses: number;
      goals_for: number;
      goals_against: number;
      teams: Set<string>;
      teamIds: Set<number>;
      position?: number | null;
    }
  >();

  for (let i = 0; i < matchCoaches.length; i++) {
    const mc = matchCoaches[i];
    const match = mc.match;
    const team = mc.team;
    if (!match) continue;
    const seasonId = match.season_id;
    if (seasonId == null) continue;
    const seasonName = match.season?.season_name || 'Unknown';

    if (!seasonStatsMap.has(seasonId)) {
      seasonStatsMap.set(seasonId, {
        season_id: seasonId,
        season_name: seasonName,
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        teams: new Set<string>(),
        teamIds: new Set<number>(),
        position: null,
      });
    }

    const stats = seasonStatsMap.get(seasonId)!;
    stats.matches_played++;

    const isHomeTeam = match.home_team_id === team?.team_id;
    const teamScore = isHomeTeam ? match.home_score : match.away_score;
    const opponentScore = isHomeTeam ? match.away_score : match.home_score;
    const pkTeam = isHomeTeam
      ? match.penalty_home_score
      : match.penalty_away_score;
    const pkOpp = isHomeTeam
      ? match.penalty_away_score
      : match.penalty_home_score;

    if (teamScore !== null && opponentScore !== null) {
      if (teamScore > opponentScore) {
        stats.wins++;
      } else if (teamScore < opponentScore) {
        stats.losses++;
      } else {
        if (pkTeam !== null && pkOpp !== null) {
          if (pkTeam > pkOpp) stats.wins++;
          else if (pkTeam < pkOpp) stats.losses++;
        }
      }

      stats.goals_for += teamScore ?? 0;
      stats.goals_against += opponentScore ?? 0;
    }

    if (team?.team_name) stats.teams.add(team.team_name);
    if (team?.team_id != null) stats.teamIds.add(team.team_id);
  }

  const seasonStatsArray = Array.from(seasonStatsMap.values());

  // 최소 순위 계산: 단일 조회
  const seasonIds = Array.from(seasonStatsMap.keys());
  const unionTeamIdsForStanding = (() => {
    const set = new Set<number>();
    for (let i = 0; i < seasonStatsArray.length; i++) {
      const ids = Array.from(seasonStatsArray[i].teamIds);
      for (let j = 0; j < ids.length; j++) set.add(ids[j]);
    }
    return Array.from(set);
  })();

  if (seasonIds.length > 0 && unionTeamIdsForStanding.length > 0) {
    const standingRows = await db.standing.findMany({
      where: {
        season_id: { in: seasonIds },
        team_id: { in: unionTeamIdsForStanding },
      },
      select: { season_id: true, team_id: true, position: true },
    });
    for (let i = 0; i < seasonStatsArray.length; i++) {
      const s = seasonStatsArray[i];
      const teamIdSet = new Set(Array.from(s.teamIds));
      let minPos: number | null = null;
      for (let k = 0; k < standingRows.length; k++) {
        const row = standingRows[k];
        if (
          row.season_id === s.season_id &&
          row.team_id != null &&
          teamIdSet.has(row.team_id)
        ) {
          const pos = row.position;
          if (typeof pos === 'number')
            minPos = minPos == null ? pos : Math.min(minPos, pos);
        }
      }
      s.position = minPos;
    }
  } else {
    for (let i = 0; i < seasonStatsArray.length; i++)
      seasonStatsArray[i].position = null;
  }

  // 팀 로고 캐싱 조회
  const unionTeamIds = (() => {
    const set = new Set<number>();
    for (let i = 0; i < seasonStatsArray.length; i++) {
      const ids = Array.from(seasonStatsArray[i].teamIds);
      for (let j = 0; j < ids.length; j++) set.add(ids[j]);
    }
    return Array.from(set);
  })();
  const teamMap =
    unionTeamIds.length > 0
      ? await getTeamsByIdsCached(db, unionTeamIds)
      : new Map();

  const season_stats: CoachSeasonStats[] = seasonStatsArray
    .map((s) => {
      const matches_played = s.matches_played ?? 0;
      const win_rate =
        matches_played > 0 ? Math.round((s.wins / matches_played) * 100) : 0;
      const goal_difference = (s.goals_for ?? 0) - (s.goals_against ?? 0);
      const teams = Array.from(s.teams);
      const teams_detailed = Array.from(s.teamIds).map((id) => {
        const t = teamMap.get(id);
        return {
          team_id: id,
          team_name: t?.team_name ?? 'Unknown',
          logo: t?.logo ?? null,
        };
      });
      return {
        season_id: s.season_id,
        season_name: s.season_name,
        year: 0,
        matches_played,
        wins: s.wins ?? 0,
        draws: 0,
        losses: s.losses ?? 0,
        goals_for: s.goals_for ?? 0,
        goals_against: s.goals_against ?? 0,
        points: 0,
        win_rate,
        goal_difference,
        teams,
        teams_detailed,
        position: s.position ?? null,
      };
    })
    .sort((a, b) => a.season_id - b.season_id);

  return season_stats;
}

// Cached wrappers
export async function getCoachSeasonStatsCached(
  db: PrismaClient,
  coachId: number,
  ttlMs = 60 * 1000
) {
  const key = `coach:season_stats:${coachId}`;
  const cached = cacheGet<CoachSeasonStats[]>(key);
  if (cached) return cached;
  const data = await computeCoachSeasonStats(db, coachId);
  cacheSet(key, data, ttlMs);
  return data;
}

export async function getCoachTrophiesCached(
  db: PrismaClient,
  coachId: number,
  ttlMs = 60 * 1000
) {
  const key = `coach:trophies:${coachId}`;
  const cached = cacheGet<CoachTrophies>(key);
  if (cached) return cached;
  const data = await computeCoachTrophies(db, coachId);
  cacheSet(key, data, ttlMs);
  return data;
}

export async function computeCoachTrophies(
  db: PrismaClient,
  coachId: number
): Promise<CoachTrophies> {
  // 시즌 종료된 경우만 우승으로 인정 (end_date가 존재하고 현재 날짜 이전)
  const now = new Date();
  const wins = await db.standing.findMany({
    where: {
      position: 1,
      season: {
        end_date: {
          not: null,
          lte: now,
        },
      },
    },
    select: {
      season_id: true,
      team_id: true,
      season: { select: { season_name: true, category: true, end_date: true } },
    },
  });
  const seasonTeamPairs = wins
    .filter((w) => w.season_id != null && w.team_id != null)
    .map((w) => ({ season_id: w.season_id!, team_id: w.team_id! }));

  let coachSeasonTeamPairs: Array<{ season_id: number; team_id: number }> = [];
  if (seasonTeamPairs.length > 0) {
    const coachMatches = await db.matchCoach.findMany({
      where: {
        coach_id: coachId,
        role: 'head',
        team_id: { in: seasonTeamPairs.map((p) => p.team_id) },
        match: { season_id: { in: seasonTeamPairs.map((p) => p.season_id) } },
      },
      select: { team_id: true, match: { select: { season_id: true } } },
    });
    coachSeasonTeamPairs = coachMatches
      .filter((m) => m.team_id != null && m.match?.season_id != null)
      .map((m) => ({ season_id: m.match!.season_id!, team_id: m.team_id! }));
  }

  const pairSet = new Set(
    coachSeasonTeamPairs.map((p) => `${p.season_id}:${p.team_id}`)
  );
  const items: CoachTrophies['items'] = wins
    .filter(
      (w) =>
        w.season_id != null &&
        w.team_id != null &&
        pairSet.has(`${w.season_id}:${w.team_id}`)
    )
    .map((w) => ({
      season_id: w.season_id!,
      season_name: w.season?.season_name ?? 'Unknown',
      category:
        (w.season as Partial<Pick<Season, 'category'>> | null)?.category ??
        null,
    }))
    .filter((it) => {
      if (!it) return false;
      if (it.season_name?.includes('조별')) return false;
      if (it.category === 'PLAYOFF' || it.category === 'CHALLENGE_LEAGUE')
        return false;

      return true;
    });

  const league_wins = items.filter((i) => isLeague(i.category ?? null)).length;
  const cup_wins = items.length - league_wins;
  return {
    coach_id: coachId,
    total: items.length,
    league_wins,
    cup_wins,
    items,
  };
}

export async function fetchCoaches(): Promise<{
  coaches: CoachWithHistory[];
  total: number;
}> {
  const response = await fetch('/api/coaches');
  if (!response.ok) {
    throw new Error('Failed to fetch coaches');
  }
  return response.json();
}

export async function fetchCoachDetail(
  coachId: number
): Promise<CoachDetail | null> {
  const response = await fetch(`/api/coaches/${coachId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch coach detail');
  }
  return response.json();
}

export async function fetchCoachStats(
  coachId: number
): Promise<{ season_stats: CoachSeasonStats[] }> {
  const response = await fetch(`/api/coaches/${coachId}/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch coach stats');
  }
  return response.json();
}

export async function fetchCoachCurrentTeam(
  coachId: number
): Promise<TeamCurrentHeadCoach | null> {
  const res = await fetch(`/api/coaches/${coachId}/current-team`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchCoachTrophies(
  coachId: number
): Promise<CoachTrophies> {
  const res = await fetch(`/api/coaches/${coachId}/trophies`);
  if (!res.ok) {
    throw new Error('Failed to fetch trophies');
  }
  return res.json();
}

export async function fetchCoachOverview(
  coachId: number
): Promise<CoachOverview> {
  const res = await fetch(`/api/coaches/${coachId}/overview`);
  if (!res.ok) {
    throw new Error('Failed to fetch coach overview');
  }
  return res.json();
}

export async function fetchCoachFull(coachId: number): Promise<CoachFull> {
  const res = await fetch(`/api/coaches/${coachId}/full`);
  if (!res.ok) {
    throw new Error('Failed to fetch full coach data');
  }
  return res.json();
}

// Infinite (paginated) coaches page API
export type CoachesPageItem = CoachWithHistory & {
  current_team_verified: {
    team_id: number;
    team_name: string;
    logo: string | null;
    last_match_date: string;
  } | null;
  has_current_team: boolean;
  total_matches: number;
};

export async function getCoachesPagePrisma(
  page: number,
  pageSize = 6,
  opts?: { order?: 'total' | 'wins' | 'win_rate' }
): Promise<{
  items: CoachesPageItem[];
  nextPage: number | null;
  totalCount: number;
}> {
  const offset = (page - 1) * pageSize;
  const params = new URLSearchParams({
    limit: String(pageSize),
    offset: String(offset),
  });
  if (opts?.order) params.set('order', opts.order);
  const res = await fetch(`/api/coaches?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch coaches page');
  }
  const data = await res.json();
  const { coaches, total } = data as {
    coaches: CoachesPageItem[];
    total: number;
  };
  const nextPage = offset + coaches.length < total ? page + 1 : null;
  return { items: coaches, nextPage, totalCount: total };
}
