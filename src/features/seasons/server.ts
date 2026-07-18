import type { SeasonWithStats } from '@/features/seasons/api-prisma';
import { prisma } from '@/lib/prisma';
import { stageLabel } from '@/lib/tournament';
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
  /** 컵(토너먼트) 시즌에서만 채워지는 라운드 라벨 (예: 8강) */
  stage_label: string | null;
};

export type SeasonSummaryStanding = {
  position: number;
  team_name: string | null;
  points: number | null;
  wins: number | null;
  losses: number | null;
};

/** 컵(토너먼트) 시즌 전용 요약 */
export type SeasonCupSummary = {
  /** 결승 완료 시 우승팀명 */
  champion_team_name: string | null;
  /** 진행 중일 때 현재(다음 예정 또는 최근 완료) 라운드 라벨 */
  current_stage_label: string | null;
};

export type SeasonSsrSummary = {
  total_matches: number;
  completed_matches: number;
  recent_results: SeasonSummaryMatch[];
  top_standings: SeasonSummaryStanding[];
  /** 컵 시즌이 아니면 null */
  cup: SeasonCupSummary | null;
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
    include: { _count: { select: { matches: true } } },
  });

  if (!season) return null;

  const totalMatches = season._count.matches;

  // 컵(토너먼트) 시즌은 리그식 순위·승점 표기가 부적절하므로 순위 요약 제외
  const isCupSeason = ['GIFA_CUP', 'SBS_CUP', 'CHAMPION_MATCH'].includes(
    season.category ?? ''
  );

  const completedWhere = {
    season_id: seasonId,
    status: 'completed',
    home_score: { not: null },
    away_score: { not: null },
  } as const;

  const [completedMatches, recentMatches, topStandings, nextScheduled] =
    await Promise.all([
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
          tournament_stage: true,
          home_team_id: true,
          away_team_id: true,
          home_team: { select: { team_name: true } },
          away_team: { select: { team_name: true } },
        },
      }),
      isCupSeason
        ? Promise.resolve([])
        : prisma.standing.findMany({
            where: { season_id: seasonId },
            orderBy: { position: 'asc' },
            take: 5,
            select: {
              position: true,
              points: true,
              wins: true,
              losses: true,
              team_id: true,
              team: { select: { team_name: true } },
            },
          }),
      // 컵: 현재(다음 예정) 라운드 판단용
      isCupSeason
        ? prisma.match.findFirst({
            where: {
              season_id: seasonId,
              status: 'scheduled',
              home_score: null,
              away_score: null,
            },
            orderBy: { match_date: 'asc' },
            select: { tournament_stage: true },
          })
        : Promise.resolve(null),
    ]);

  // 시즌 당시 팀명으로 치환 (api/matches/season/[season_id]와 동일한 규칙)
  const teamIds = Array.from(
    new Set(
      [
        ...recentMatches.flatMap((m) => [m.home_team_id, m.away_team_id]),
        ...topStandings.map((s) => s.team_id),
      ].filter((id): id is number => id !== null)
    )
  );

  const teamSeasonNames =
    teamIds.length > 0
      ? await prisma.teamSeasonName.findMany({
          where: { team_id: { in: teamIds }, season_id: seasonId },
          select: { team_id: true, team_name: true },
        })
      : [];

  const teamNameMap = new Map(
    teamSeasonNames.map((t) => [t.team_id, t.team_name])
  );

  const resolveTeamName = (
    teamId: number | null,
    fallback: string | null | undefined
  ): string | null =>
    (teamId !== null ? teamNameMap.get(teamId) : undefined) ?? fallback ?? null;

  // 컵 시즌: 우승팀(결승 완료 시) 또는 현재 라운드
  let cup: SeasonCupSummary | null = null;
  if (isCupSeason) {
    const finalMatch = recentMatches.find(
      (m) => m.tournament_stage === 'final'
    );
    let championTeamName: string | null = null;
    if (
      finalMatch &&
      finalMatch.home_score !== null &&
      finalMatch.away_score !== null
    ) {
      // 승자가 명확할 때만 판정 — 동점인데 승부차기 기록이 없으면 미확정으로 두고 폴백에 맡긴다
      let homeWon: boolean | null = null;
      if (finalMatch.home_score !== finalMatch.away_score) {
        homeWon = finalMatch.home_score > finalMatch.away_score;
      } else if (
        finalMatch.penalty_home_score !== null &&
        finalMatch.penalty_away_score !== null &&
        finalMatch.penalty_home_score !== finalMatch.penalty_away_score
      ) {
        homeWon = finalMatch.penalty_home_score > finalMatch.penalty_away_score;
      }
      if (homeWon !== null) {
        championTeamName = homeWon
          ? resolveTeamName(
              finalMatch.home_team_id,
              finalMatch.home_team?.team_name
            )
          : resolveTeamName(
              finalMatch.away_team_id,
              finalMatch.away_team?.team_name
            );
      }
    }

    // 폴백: 스테이지 데이터가 없는 과거 컵 시즌(예: 2025 GIFA컵)은
    // 종료된 경우에 한해 순위표 1위를 우승팀으로 사용 (시즌 목록과 동일 규칙)
    const seasonEnded =
      season.end_date !== null && season.end_date.getTime() < Date.now();
    if (!championTeamName && seasonEnded) {
      const winner = await prisma.standing.findFirst({
        where: { season_id: seasonId, position: 1 },
        select: { team_id: true, team: { select: { team_name: true } } },
      });
      if (winner?.team_id != null) {
        // 순위표 팀은 teamNameMap 수집 범위 밖일 수 있어 시즌 당시 팀명을 직접 조회
        const seasonName = await prisma.teamSeasonName.findFirst({
          where: { team_id: winner.team_id, season_id: seasonId },
          select: { team_name: true },
        });
        championTeamName =
          seasonName?.team_name ?? winner.team?.team_name ?? null;
      }
    }

    cup = {
      champion_team_name: championTeamName,
      current_stage_label: championTeamName
        ? null
        : (stageLabel(nextScheduled?.tournament_stage) ??
          stageLabel(recentMatches[0]?.tournament_stage)),
    };
  }

  const summary: SeasonSsrSummary = {
    total_matches: totalMatches,
    completed_matches: completedMatches,
    recent_results: recentMatches.map((m) => ({
      match_id: m.match_id,
      match_date: m.match_date.toISOString(),
      home_team_name: resolveTeamName(m.home_team_id, m.home_team?.team_name),
      away_team_name: resolveTeamName(m.away_team_id, m.away_team?.team_name),
      home_score: m.home_score,
      away_score: m.away_score,
      penalty_home_score: m.penalty_home_score,
      penalty_away_score: m.penalty_away_score,
      stage_label: isCupSeason ? stageLabel(m.tournament_stage) : null,
    })),
    top_standings: topStandings.map((s) => ({
      position: s.position,
      team_name: resolveTeamName(s.team_id, s.team?.team_name),
      points: s.points,
      wins: s.wins,
      losses: s.losses,
    })),
    cup,
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
