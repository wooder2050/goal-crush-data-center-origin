import type { MatchTeamSeasonNameResult } from '@/app/api/types';
import { prisma } from '@/lib/prisma';
import type { MatchWithTeams } from '@/lib/types';

// ── Types ──────────────────────────────────────────────

export type InitialMatchDetailData = {
  match: MatchWithTeams;
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

  return { match: serializedMatch };
}
