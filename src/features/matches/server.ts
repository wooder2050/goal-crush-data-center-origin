import type { MatchTeamSeasonNameResult } from '@/app/api/types';
import { prisma } from '@/lib/prisma';
import type { MatchWithTeams } from '@/lib/types';

// ── Types ──────────────────────────────────────────────

export type SeasonMatchItem = {
  match_id: number;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  status: string | null;
  is_date_confirmed: boolean;
  home_team: { team_id: number; team_name: string; logo: string | null } | null;
  away_team: { team_id: number; team_name: string; logo: string | null } | null;
};

export type InitialMatchDetailData = {
  match: MatchWithTeams;
  recentSeasonMatches: SeasonMatchItem[];
};

// Prisma 클라이언트에 teamSeasonName 메서드가 없는 문제를 해결하기 위한 타입 확장
interface ExtendedPrismaClient {
  teamSeasonName: {
    findMany: (args: {
      where: {
        OR: Array<{
          team_id: number;
          season_id: number;
        }>;
      };
      select: {
        team_id: boolean;
        team_name: boolean;
      };
    }) => Promise<MatchTeamSeasonNameResult[]>;
  };
}

// ── /matches archive ─────────────────────────────────

export interface MatchesArchiveData {
  seasons: Array<{ season_id: number; season_name: string }>;
  recentMatches: Array<SerializedArchiveMatch>;
  upcomingMatches: Array<SerializedArchiveMatch>;
}

interface SerializedArchiveMatch {
  match_id: number;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
  status: string | null;
  is_date_confirmed: boolean;
  season: { season_id: number; season_name: string } | null;
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
}

export async function getMatchesArchiveData(): Promise<MatchesArchiveData> {
  const matchInclude = {
    home_team: { select: { team_id: true, team_name: true, logo: true } },
    away_team: { select: { team_id: true, team_name: true, logo: true } },
    season: { select: { season_id: true, season_name: true } },
  } as const;

  const [seasons, recentRaw, upcomingRaw] = await Promise.all([
    prisma.season.findMany({
      select: { season_id: true, season_name: true },
      orderBy: { season_id: 'desc' },
    }),
    prisma.match.findMany({
      where: { status: 'completed' },
      orderBy: { match_date: 'desc' },
      take: 10,
      include: matchInclude,
    }),
    prisma.match.findMany({
      where: { match_date: { gt: new Date() }, is_date_confirmed: true },
      orderBy: { match_date: 'asc' },
      take: 10,
      include: matchInclude,
    }),
  ]);

  const allMatches = [...recentRaw, ...upcomingRaw];
  const pairs = allMatches.flatMap((m) => {
    const result: Array<{ team_id: number; season_id: number }> = [];
    if (m.home_team_id != null && m.season_id != null)
      result.push({ team_id: m.home_team_id, season_id: m.season_id });
    if (m.away_team_id != null && m.season_id != null)
      result.push({ team_id: m.away_team_id, season_id: m.season_id });
    return result;
  });

  const teamNameMap = new Map<string, string>();
  if (pairs.length > 0) {
    const names = await (
      prisma as unknown as ExtendedPrismaClient
    ).teamSeasonName.findMany({
      where: { OR: pairs },
      select: { team_id: true, team_name: true },
    });
    names.forEach((t: MatchTeamSeasonNameResult) =>
      teamNameMap.set(`${t.team_id}`, t.team_name)
    );
  }

  const serialize = (
    m: (typeof recentRaw)[number]
  ): SerializedArchiveMatch => ({
    match_id: m.match_id,
    match_date: m.match_date.toISOString(),
    home_score: m.home_score,
    away_score: m.away_score,
    penalty_home_score: m.penalty_home_score,
    penalty_away_score: m.penalty_away_score,
    status: m.status,
    is_date_confirmed: m.is_date_confirmed,
    season: m.season
      ? { season_id: m.season.season_id, season_name: m.season.season_name }
      : null,
    home_team: m.home_team
      ? {
          team_id: m.home_team.team_id,
          team_name:
            teamNameMap.get(`${m.home_team.team_id}`) ?? m.home_team.team_name,
          logo: m.home_team.logo,
        }
      : null,
    away_team: m.away_team
      ? {
          team_id: m.away_team.team_id,
          team_name:
            teamNameMap.get(`${m.away_team.team_id}`) ?? m.away_team.team_name,
          logo: m.away_team.logo,
        }
      : null,
  });

  return {
    seasons,
    recentMatches: recentRaw.map(serialize),
    upcomingMatches: upcomingRaw.map(serialize),
  };
}

// ── /matches/[matchId] detail ─────────────────────────

/**
 * Fetches a single match with teams, season, and coaches for SSR.
 * Replicates the GET logic from /api/matches/[match_id]/route.ts.
 */
export async function getInitialMatchDetailData(
  matchId: number
): Promise<InitialMatchDetailData | null> {
  const match = await prisma.match.findUnique({
    where: { match_id: matchId },
    include: {
      home_team: true,
      away_team: true,
      season: true,
      home_coach: true,
      away_coach: true,
    },
  });

  if (!match) return null;

  // 시즌별 팀명 조회
  const teamSeasonNames =
    match.home_team_id != null &&
    match.away_team_id != null &&
    match.season_id != null
      ? await (
          prisma as unknown as ExtendedPrismaClient
        ).teamSeasonName.findMany({
          where: {
            OR: [
              { team_id: match.home_team_id, season_id: match.season_id },
              { team_id: match.away_team_id, season_id: match.season_id },
            ],
          },
          select: {
            team_id: true,
            team_name: true,
          },
        })
      : [];

  const homeTeamSeasonName = teamSeasonNames.find(
    (t: MatchTeamSeasonNameResult) => t.team_id === match.home_team_id
  );
  const awayTeamSeasonName = teamSeasonNames.find(
    (t: MatchTeamSeasonNameResult) => t.team_id === match.away_team_id
  );

  // Date → string 직렬화
  const { highlight_url = null, full_video_url = null } = match as {
    highlight_url?: string | null;
    full_video_url?: string | null;
  };

  const serializeTeam = (team: NonNullable<typeof match.home_team>) => ({
    team_id: team.team_id,
    team_name: team.team_name,
    logo: team.logo ?? null,
    primary_color: team.primary_color ?? null,
    secondary_color: team.secondary_color ?? null,
    founded_year: team.founded_year ?? null,
    description: team.description ?? null,
    created_at: team.created_at?.toISOString() ?? null,
    updated_at: team.updated_at?.toISOString() ?? null,
  });

  const serializeSeason = (season: NonNullable<typeof match.season>) => ({
    season_id: season.season_id,
    season_name: season.season_name,
    year: season.year,
    start_date: season.start_date?.toISOString() ?? null,
    end_date: season.end_date?.toISOString() ?? null,
    category: season.category as MatchWithTeams['season']['category'],
    created_at: season.created_at?.toISOString() ?? null,
    updated_at: season.updated_at?.toISOString() ?? null,
  });

  const serializeCoach = (coach: NonNullable<typeof match.home_coach>) => ({
    coach_id: coach.coach_id,
    name: coach.name,
    birth_date: coach.birth_date?.toISOString() ?? null,
    nationality: coach.nationality ?? null,
    profile_image_url: coach.profile_image_url ?? null,
    created_at: coach.created_at?.toISOString() ?? null,
  });

  const serializedMatch: MatchWithTeams = {
    match_id: match.match_id,
    match_date: match.match_date.toISOString(),
    season_id: match.season_id,
    home_team_id: match.home_team_id,
    away_team_id: match.away_team_id,
    home_coach_id: match.home_coach_id ?? null,
    away_coach_id: match.away_coach_id ?? null,
    home_score: match.home_score,
    away_score: match.away_score,
    penalty_home_score: match.penalty_home_score,
    penalty_away_score: match.penalty_away_score,
    location: match.location,
    status: match.status,
    description: match.description,
    group_stage: match.group_stage ?? null,
    tournament_stage: match.tournament_stage ?? null,
    highlight_url,
    full_video_url,
    is_date_confirmed: match.is_date_confirmed,
    rating_nationwide: match.rating_nationwide
      ? Number(match.rating_nationwide)
      : null,
    rating_metropolitan: match.rating_metropolitan
      ? Number(match.rating_metropolitan)
      : null,
    broadcast_time: match.broadcast_time ?? null,
    summary: (match as unknown as { summary?: string | null }).summary ?? null,
    created_at: match.created_at?.toISOString() ?? null,
    updated_at: match.updated_at?.toISOString() ?? null,
    home_team: match.home_team
      ? {
          ...serializeTeam(match.home_team),
          team_name: homeTeamSeasonName?.team_name || match.home_team.team_name,
        }
      : ({} as MatchWithTeams['home_team']),
    away_team: match.away_team
      ? {
          ...serializeTeam(match.away_team),
          team_name: awayTeamSeasonName?.team_name || match.away_team.team_name,
        }
      : ({} as MatchWithTeams['away_team']),
    season: match.season
      ? serializeSeason(match.season)
      : ({} as MatchWithTeams['season']),
    home_coach: match.home_coach ? serializeCoach(match.home_coach) : null,
    away_coach: match.away_coach ? serializeCoach(match.away_coach) : null,
  };

  // 같은 시즌의 이전 5경기 + 현재 + 다음 2경기 조회
  let recentSeasonMatches: SeasonMatchItem[] = [];
  if (match.season_id && match.match_date) {
    const teamSelect = {
      select: { team_id: true, team_name: true, logo: true },
    } as const;

    const [prevRaw, nextRaw] = await Promise.all([
      prisma.match.findMany({
        where: {
          season_id: match.season_id,
          match_date: { lt: match.match_date },
        },
        orderBy: { match_date: 'desc' },
        take: 5,
        include: { home_team: teamSelect, away_team: teamSelect },
      }),
      prisma.match.findMany({
        where: {
          season_id: match.season_id,
          match_date: { gt: match.match_date },
        },
        orderBy: { match_date: 'asc' },
        take: 2,
        include: { home_team: teamSelect, away_team: teamSelect },
      }),
    ]);

    const serializeItem = (m: (typeof prevRaw)[number]): SeasonMatchItem => ({
      match_id: m.match_id,
      match_date: m.match_date.toISOString(),
      home_score: m.home_score,
      away_score: m.away_score,
      status: m.status,
      is_date_confirmed: m.is_date_confirmed,
      home_team: m.home_team
        ? {
            team_id: m.home_team.team_id,
            team_name: m.home_team.team_name,
            logo: m.home_team.logo,
          }
        : null,
      away_team: m.away_team
        ? {
            team_id: m.away_team.team_id,
            team_name: m.away_team.team_name,
            logo: m.away_team.logo,
          }
        : null,
    });

    const currentItem: SeasonMatchItem = {
      match_id: match.match_id,
      match_date: match.match_date.toISOString(),
      home_score: match.home_score,
      away_score: match.away_score,
      status: match.status,
      is_date_confirmed: match.is_date_confirmed,
      home_team: match.home_team
        ? {
            team_id: match.home_team.team_id,
            team_name: match.home_team.team_name,
            logo: match.home_team.logo,
          }
        : null,
      away_team: match.away_team
        ? {
            team_id: match.away_team.team_id,
            team_name: match.away_team.team_name,
            logo: match.away_team.logo,
          }
        : null,
    };

    recentSeasonMatches = [
      ...prevRaw.reverse().map(serializeItem),
      currentItem,
      ...nextRaw.map(serializeItem),
    ];
  }

  return { match: serializedMatch, recentSeasonMatches };
}
