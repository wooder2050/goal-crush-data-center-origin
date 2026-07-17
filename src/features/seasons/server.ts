import type { SeasonWithStats } from '@/features/seasons/api-prisma';
import { prisma } from '@/lib/prisma';
import type { Season } from '@/lib/types';
import { inferLeague } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────

export type SeasonsPageResponse = {
  items: SeasonWithStats[];
  totalCount: number;
  nextPage: number | null;
  hasNextPage: boolean;
  currentPage: number;
};

export type InitialSeasonsPageData = {
  seasonsPage: SeasonsPageResponse;
};

export type SeasonSummaryMatch = {
  match_id: number;
  match_date: string;
  home_team_name: string | null;
  away_team_name: string | null;
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
};

export type SeasonSummaryStanding = {
  position: number;
  team_name: string | null;
  points: number | null;
  wins: number | null;
  losses: number | null;
};

export type SeasonSsrSummary = {
  total_matches: number;
  completed_matches: number;
  recent_results: SeasonSummaryMatch[];
  top_standings: SeasonSummaryStanding[];
};

export type InitialSeasonDetailData = {
  season: Season;
  summary: SeasonSsrSummary;
};

// ── /seasons list ──────────────────────────────────────

/**
 * Fetches the first page of seasons for SSR.
 * Replicates the paginated GET logic from /api/seasons/route.ts.
 */
export async function getInitialSeasonsPageData(): Promise<InitialSeasonsPageData> {
  const PAGE_SIZE = 6;
  const pageNum = 1;

  const [seasons, totalCount] = await Promise.all([
    prisma.season.findMany({
      include: {
        _count: { select: { matches: true } },
      },
      orderBy: { season_id: 'desc' },
      skip: 0,
      take: PAGE_SIZE,
    }),
    prisma.season.count(),
  ]);

  const seasonIds = seasons.map((s) => s.season_id);

  const [winners, teamSeasonNames] = await Promise.all([
    prisma.standing.findMany({
      where: { season_id: { in: seasonIds }, position: 1 },
      select: {
        season_id: true,
        team: { select: { team_id: true, team_name: true, logo: true } },
      },
    }),
    prisma.teamSeasonName.findMany({
      where: { season_id: { in: seasonIds } },
      select: { team_id: true, season_id: true, team_name: true },
    }),
  ]);

  // Build team-season name map
  const teamSeasonNameMap = new Map<string, string>();
  for (const tsn of teamSeasonNames) {
    teamSeasonNameMap.set(`${tsn.season_id}-${tsn.team_id}`, tsn.team_name);
  }

  // Build winners-by-season map
  const winnersBySeason = new Map<
    number,
    Array<{ id: number | null; name: string | null; logo: string | null }>
  >();
  for (const w of winners) {
    if (w.season_id == null) continue;
    const arr = winnersBySeason.get(w.season_id) ?? [];
    const seasonTeamName =
      w.team?.team_id != null
        ? (teamSeasonNameMap.get(`${w.season_id}-${w.team.team_id}`) ??
          w.team?.team_name)
        : w.team?.team_name;
    arr.push({
      id: w.team?.team_id ?? null,
      name: seasonTeamName ?? null,
      logo: w.team?.logo ?? null,
    });
    winnersBySeason.set(w.season_id, arr);
  }

  // Map to SeasonWithStats (same logic as API route)
  const items: SeasonWithStats[] = seasons.map((season) => {
    const league = inferLeague(season.season_name);
    const pilotSeason =
      season.season_id === 1 || /파일럿|pilot/i.test(season.season_name);
    const firstSeason = season.season_id === 2;
    const secondSeason = season.season_id === 3;
    const isCompleted = Boolean(season.end_date);

    let label: SeasonWithStats['champion_label'] = null;
    let teams: NonNullable<SeasonWithStats['champion_teams']> = [];

    if (isCompleted) {
      if (
        league === 'super' ||
        league === 'cup' ||
        league === 'g-league' ||
        pilotSeason ||
        firstSeason
      ) {
        const arr = winnersBySeason.get(season.season_id) ?? [];
        const w = arr[0] ?? null;
        label = '우승팀';
        teams = w ? [{ team_id: w.id, team_name: w.name, logo: w.logo }] : [];
      } else if (league === 'challenge' || league === 'playoff') {
        const arr = winnersBySeason.get(season.season_id) ?? [];
        const w = arr[0] ?? null;
        label = '승격팀';
        teams = w ? [{ team_id: w.id, team_name: w.name, logo: w.logo }] : [];
      } else if (secondSeason) {
        const arr = winnersBySeason.get(season.season_id) ?? [];
        label = '1위';
        teams = arr.map((t) => ({
          team_id: t.id,
          team_name: t.name,
          logo: t.logo,
        }));
      }
    } else {
      if (
        league === 'super' ||
        league === 'cup' ||
        pilotSeason ||
        firstSeason
      ) {
        const arr = winnersBySeason.get(season.season_id) ?? [];
        const w = arr[0] ?? null;
        label = '1위';
        teams = w ? [{ team_id: w.id, team_name: w.name, logo: w.logo }] : [];
      } else if (league === 'g-league' || secondSeason) {
        const arr = winnersBySeason.get(season.season_id) ?? [];
        label = arr.length > 0 ? '현재 1위' : null;
        teams = arr.map((t) => ({
          team_id: t.id,
          team_name: t.name,
          logo: t.logo,
        }));
      } else {
        const arr = winnersBySeason.get(season.season_id) ?? [];
        const w = arr[0] ?? null;
        label = w ? '현재 1위' : null;
        teams = w ? [{ team_id: w.id, team_name: w.name, logo: w.logo }] : [];
      }
    }

    const first = teams.length > 0 ? teams[0] : null;

    return {
      season_id: season.season_id,
      season_name: season.season_name,
      year: season.year,
      start_date: season.start_date?.toISOString() ?? null,
      end_date: season.end_date?.toISOString() ?? null,
      category: season.category as Season['category'],
      created_at: season.created_at?.toISOString() ?? null,
      updated_at: season.updated_at?.toISOString() ?? null,
      match_count: season._count.matches,
      champion_team_id: first?.team_id ?? null,
      champion_team_name: first?.team_name ?? null,
      champion_team_logo: first?.logo ?? null,
      champion_label: label,
      champion_teams: teams,
    };
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasNextPage = pageNum < totalPages;
  const nextPage = hasNextPage ? pageNum + 1 : null;

  return {
    seasonsPage: {
      items,
      totalCount,
      nextPage,
      hasNextPage,
      currentPage: pageNum,
    },
  };
}

// ── /seasons/[seasonId] detail ─────────────────────────

/**
 * Fetches a single season by ID for SSR.
 * Replaces the previous pattern of fetching ALL seasons and finding by ID client-side.
 */
export async function getInitialSeasonDetailData(
  seasonId: number
): Promise<InitialSeasonDetailData | null> {
  const season = await prisma.season.findUnique({
    where: { season_id: seasonId },
  });

  if (!season) return null;

  const completedWhere = {
    season_id: seasonId,
    home_score: { not: null },
    away_score: { not: null },
  } as const;

  const [totalMatches, completedMatches, recentMatches, topStandings] =
    await Promise.all([
      prisma.match.count({ where: { season_id: seasonId } }),
      prisma.match.count({ where: completedWhere }),
      prisma.match.findMany({
        where: completedWhere,
        orderBy: { match_date: 'desc' },
        take: 5,
        select: {
          match_id: true,
          match_date: true,
          home_score: true,
          away_score: true,
          penalty_home_score: true,
          penalty_away_score: true,
          home_team: { select: { team_name: true } },
          away_team: { select: { team_name: true } },
        },
      }),
      prisma.standing.findMany({
        where: { season_id: seasonId },
        orderBy: { position: 'asc' },
        take: 5,
        select: {
          position: true,
          points: true,
          wins: true,
          losses: true,
          team: { select: { team_name: true } },
        },
      }),
    ]);

  const summary: SeasonSsrSummary = {
    total_matches: totalMatches,
    completed_matches: completedMatches,
    recent_results: recentMatches.map((m) => ({
      match_id: m.match_id,
      match_date: m.match_date.toISOString(),
      home_team_name: m.home_team?.team_name ?? null,
      away_team_name: m.away_team?.team_name ?? null,
      home_score: m.home_score,
      away_score: m.away_score,
      penalty_home_score: m.penalty_home_score,
      penalty_away_score: m.penalty_away_score,
    })),
    top_standings: topStandings.map((s) => ({
      position: s.position,
      team_name: s.team?.team_name ?? null,
      points: s.points,
      wins: s.wins,
      losses: s.losses,
    })),
  };

  return {
    summary,
    season: {
      season_id: season.season_id,
      season_name: season.season_name,
      year: season.year,
      start_date: season.start_date?.toISOString() ?? null,
      end_date: season.end_date?.toISOString() ?? null,
      category: season.category as Season['category'],
      created_at: season.created_at?.toISOString() ?? null,
      updated_at: season.updated_at?.toISOString() ?? null,
    },
  };
}
