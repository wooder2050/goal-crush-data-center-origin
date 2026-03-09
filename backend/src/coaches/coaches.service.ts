import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function isLeague(category: string | null): boolean {
  return (
    category === 'G_LEAGUE' ||
    category === 'SUPER_LEAGUE' ||
    category === 'CHALLENGE_LEAGUE' ||
    category === 'PLAYOFF' ||
    category === 'OTHER'
  );
}

export interface CoachSeasonStats {
  season_id: number;
  season_name: string;
  year: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
  win_rate: number;
  goal_difference: number;
  teams: string[];
  teams_detailed: Array<{ team_id: number; team_name: string; logo: string | null }>;
  position: number | null;
}

export interface CoachTrophyItem {
  season_id: number;
  season_name: string;
  category: string | null;
}

export interface CoachTrophies {
  coach_id: number;
  total: number;
  league_wins: number;
  cup_wins: number;
  items: CoachTrophyItem[];
}

interface FindAllParams {
  search?: string;
  limit: number;
  offset: number;
  order?: string;
}

@Injectable()
export class CoachesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── GET /coaches ──────────────────────────────────────────────────
  async findAll(params: FindAllParams) {
    const { search, limit, offset, order } = params;

    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

    const total = await this.prisma.coach.count({ where });

    const needsComputedOrder = order === 'total' || order === 'wins' || order === 'win_rate';

    let coaches: Awaited<ReturnType<typeof this.prisma.coach.findMany>>;

    if (needsComputedOrder) {
      const allCoaches = await this.prisma.coach.findMany({
        where,
        select: { coach_id: true },
      });
      const allCoachIds = allCoaches.map((c) => c.coach_id);

      const matchRows = allCoachIds.length
        ? await this.prisma.matchCoach.findMany({
            where: { role: 'head', coach_id: { in: allCoachIds } },
            select: {
              coach_id: true,
              team_id: true,
              match: {
                select: {
                  home_team_id: true,
                  away_team_id: true,
                  home_score: true,
                  away_score: true,
                  penalty_home_score: true,
                  penalty_away_score: true,
                },
              },
            },
          })
        : [];

      const metrics = new Map<
        number,
        { total: number; away: number; wins: number; winRate: number }
      >();
      for (const id of allCoachIds) {
        metrics.set(id, { total: 0, away: 0, wins: 0, winRate: 0 });
      }

      for (const r of matchRows) {
        const coachId = r.coach_id;
        const teamId = r.team_id ?? null;
        const m = metrics.get(coachId)!;
        const match = r.match;
        const isHome = teamId != null && match?.home_team_id === teamId;
        const ts = isHome ? match?.home_score : match?.away_score;
        const os = isHome ? match?.away_score : match?.home_score;

        if (ts == null || os == null) continue;

        m.total += 1;
        if (teamId != null && match?.away_team_id === teamId) m.away += 1;

        const pkT = isHome ? match?.penalty_home_score : match?.penalty_away_score;
        const pkO = isHome ? match?.penalty_away_score : match?.penalty_home_score;
        if (ts > os) {
          m.wins += 1;
        } else if (ts === os && pkT != null && pkO != null) {
          if (pkT > pkO) m.wins += 1;
        }
      }

      for (const [cid, m] of metrics.entries()) {
        metrics.set(cid, { ...m, winRate: m.total > 0 ? m.wins / m.total : 0 });
      }

      const sorted = allCoachIds.sort((a, b) => {
        const ma = metrics.get(a)!;
        const mb = metrics.get(b)!;
        if (order === 'total') return mb.total - ma.total;
        if (order === 'wins') return mb.wins - ma.wins;
        if (order === 'win_rate') return mb.winRate - ma.winRate;
        return mb.total - ma.total;
      });

      const pageIds = sorted.slice(offset, offset + limit);
      const pageCoaches = await this.prisma.coach.findMany({
        where: { coach_id: { in: pageIds } },
        include: {
          team_coach_history: {
            include: { team: true, season: true },
            orderBy: { start_date: 'desc' },
          },
        },
      });

      const orderIndex = new Map<number, number>(pageIds.map((id, idx) => [id, idx]));
      pageCoaches.sort((a, b) => orderIndex.get(a.coach_id)! - orderIndex.get(b.coach_id)!);

      const computedCoaches = pageCoaches.map((c) => {
        const m = metrics.get(c.coach_id) ?? {
          total: 0,
          away: 0,
          wins: 0,
          winRate: 0,
        };
        return {
          ...c,
          total_matches: m.total,
          wins: m.wins,
          win_rate: Math.round(m.winRate * 100),
          away_matches: m.away,
        };
      });
      coaches = computedCoaches;
    } else {
      coaches = await this.prisma.coach.findMany({
        where,
        include: {
          team_coach_history: {
            include: { team: true, season: true },
            orderBy: { start_date: 'desc' },
          },
        },
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
      });
    }

    // 현재팀 검증: team_coach_history.is_current = true 기준
    const coachIds = coaches.map((c) => c.coach_id);
    const currentTeamHistories =
      coachIds.length > 0
        ? await this.prisma.teamCoachHistory.findMany({
            where: { coach_id: { in: coachIds }, is_current: true },
            include: {
              team: { select: { team_id: true, team_name: true, logo: true } },
            },
          })
        : [];

    const coachIdToVerified = new Map<
      number,
      { team_id: number; team_name: string; logo: string | null; last_match_date: string }
    >();
    for (const history of currentTeamHistories) {
      if (history.team) {
        coachIdToVerified.set(history.coach_id, {
          team_id: history.team.team_id,
          team_name: history.team.team_name,
          logo: history.team.logo,
          last_match_date: history.start_date?.toISOString() ?? '',
        });
      }
    }

    // 총 경기 수 (needsComputedOrder가 아닌 경우)
    let coachIdToMatchCount = new Map<number, number>();
    if (!needsComputedOrder) {
      const matchCoachesWithResults = await this.prisma.matchCoach.findMany({
        where: {
          role: 'head',
          match: { home_score: { not: null }, away_score: { not: null } },
        },
        select: { coach_id: true },
      });
      const countMap = new Map<number, number>();
      for (const mc of matchCoachesWithResults) {
        countMap.set(mc.coach_id, (countMap.get(mc.coach_id) ?? 0) + 1);
      }
      coachIdToMatchCount = countMap;
    }

    const enriched = coaches
      .map((c) => {
        const base: Record<string, unknown> = {
          ...c,
          current_team_verified: coachIdToVerified.get(c.coach_id) ?? null,
          has_current_team: coachIdToVerified.has(c.coach_id),
        };
        if (!needsComputedOrder) {
          base.total_matches = coachIdToMatchCount.get(c.coach_id) ?? 0;
        }
        return base;
      })
      .sort((a, b) => {
        if (needsComputedOrder) return 0;
        const bt = (b as { total_matches?: number }).total_matches ?? 0;
        const at = (a as { total_matches?: number }).total_matches ?? 0;
        return bt - at;
      });

    return { coaches: enriched, total, limit, offset };
  }

  // ── GET /coaches/:coachId ─────────────────────────────────────────
  async findOne(coachId: number) {
    const coach = await this.prisma.coach.findUnique({
      where: { coach_id: coachId },
      include: {
        team_coach_history: {
          include: { team: true, season: true },
          orderBy: { start_date: 'desc' },
        },
        match_coaches: {
          include: {
            match: {
              include: { home_team: true, away_team: true, season: true },
            },
            team: true,
          },
          orderBy: { match: { match_date: 'desc' } },
          take: 20,
        },
      },
    });

    if (!coach) {
      throw new NotFoundException('감독을 찾을 수 없습니다.');
    }

    // Collect team-season pairs for season-specific team names
    const historySeasonTeamPairs = coach.team_coach_history
      .filter((h) => h.team_id && h.season_id)
      .map((h) => ({ team_id: h.team_id!, season_id: h.season_id! }));

    const matchSeasonTeamPairs = coach.match_coaches
      .filter((mc) => mc.team_id && mc.match?.season_id)
      .map((mc) => ({ team_id: mc.team_id!, season_id: mc.match!.season_id! }));

    const matchTeamSeasonPairs: { team_id: number; season_id: number }[] = [];
    for (const mc of coach.match_coaches) {
      const seasonId = mc.match?.season_id;
      if (seasonId) {
        if (mc.match?.home_team?.team_id) {
          matchTeamSeasonPairs.push({ team_id: mc.match.home_team.team_id, season_id: seasonId });
        }
        if (mc.match?.away_team?.team_id) {
          matchTeamSeasonPairs.push({ team_id: mc.match.away_team.team_id, season_id: seasonId });
        }
      }
    }

    const allTeamSeasonPairs = [
      ...historySeasonTeamPairs,
      ...matchSeasonTeamPairs,
      ...matchTeamSeasonPairs,
    ];

    const teamSeasonNames =
      allTeamSeasonPairs.length > 0
        ? await this.prisma.teamSeasonName.findMany({
            where: {
              OR: allTeamSeasonPairs.map((p) => ({
                team_id: p.team_id,
                season_id: p.season_id,
              })),
            },
            select: { team_id: true, season_id: true, team_name: true },
          })
        : [];

    const teamSeasonNameMap = new Map<string, string>();
    for (const tsn of teamSeasonNames) {
      teamSeasonNameMap.set(`${tsn.team_id}-${tsn.season_id}`, tsn.team_name);
    }

    // Apply season-specific team names to team_coach_history
    const team_coach_history = coach.team_coach_history.map((h) => {
      const seasonSpecificName =
        h.team_id && h.season_id ? teamSeasonNameMap.get(`${h.team_id}-${h.season_id}`) : undefined;
      return {
        ...h,
        team: h.team ? { ...h.team, team_name: seasonSpecificName ?? h.team.team_name } : null,
      };
    });

    // Apply season-specific team names to match_coaches
    const match_coaches = coach.match_coaches.map((mc) => {
      const seasonId = mc.match?.season_id;
      const coachTeamSeasonName =
        mc.team_id && seasonId ? teamSeasonNameMap.get(`${mc.team_id}-${seasonId}`) : undefined;
      const homeTeamSeasonName =
        mc.match?.home_team?.team_id && seasonId
          ? teamSeasonNameMap.get(`${mc.match.home_team.team_id}-${seasonId}`)
          : undefined;
      const awayTeamSeasonName =
        mc.match?.away_team?.team_id && seasonId
          ? teamSeasonNameMap.get(`${mc.match.away_team.team_id}-${seasonId}`)
          : undefined;

      return {
        ...mc,
        team: mc.team ? { ...mc.team, team_name: coachTeamSeasonName ?? mc.team.team_name } : null,
        match: mc.match
          ? {
              ...mc.match,
              home_team: mc.match.home_team
                ? {
                    ...mc.match.home_team,
                    team_name: homeTeamSeasonName ?? mc.match.home_team.team_name,
                  }
                : null,
              away_team: mc.match.away_team
                ? {
                    ...mc.match.away_team,
                    team_name: awayTeamSeasonName ?? mc.match.away_team.team_name,
                  }
                : null,
            }
          : null,
      };
    });

    // Current team via raw query on team_current_head_coach view
    const verified = await this.prisma.$queryRaw<
      Array<{
        team_id: number;
        team_name: string;
        logo: string | null;
        coach_id: number;
        last_match_date: Date;
      }>
    >`SELECT team_id, team_name, logo, coach_id, last_match_date FROM public.team_current_head_coach WHERE coach_id = ${coachId} LIMIT 1`;
    const current_team_verified = verified[0] ?? null;
    const has_current_team = Boolean(current_team_verified);

    return {
      ...coach,
      team_coach_history,
      match_coaches,
      current_team_verified,
      has_current_team,
    };
  }

  // ── GET /coaches/:coachId/current-team ────────────────────────────
  async findCurrentTeam(coachId: number) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        team_id: number;
        team_name: string;
        logo: string | null;
        coach_id: number;
        coach_name: string;
        nationality: string | null;
        profile_image_url: string | null;
        last_match_date: Date;
      }>
    >`SELECT team_id, team_name, logo, coach_id, coach_name, nationality, profile_image_url, last_match_date
      FROM public.team_current_head_coach
      WHERE coach_id = ${coachId}
      LIMIT 1`;

    return rows[0] ?? null;
  }

  // ── GET /coaches/:coachId/stats ───────────────────────────────────
  async findStats(coachId: number) {
    const season_stats = await this.computeCoachSeasonStats(coachId);
    const total_matches = season_stats.reduce((acc, s) => acc + (s.matches_played ?? 0), 0);

    return { coach_id: coachId, season_stats, total_matches };
  }

  // ── GET /coaches/:coachId/trophies ────────────────────────────────
  async findTrophies(coachId: number): Promise<CoachTrophies> {
    return this.computeCoachTrophies(coachId);
  }

  // ── GET /coaches/:coachId/overview ────────────────────────────────
  async findOverview(coachId: number) {
    const season_stats = await this.computeCoachSeasonStats(coachId);
    const total_matches = season_stats.reduce((acc, s) => acc + (s.matches_played ?? 0), 0);
    const trophies = await this.computeCoachTrophies(coachId);

    return { coach_id: coachId, season_stats, total_matches, trophies };
  }

  // ── GET /coaches/:coachId/full ────────────────────────────────────
  async findFull(coachId: number) {
    const coach = await this.prisma.coach.findUnique({
      where: { coach_id: coachId },
      include: {
        team_coach_history: {
          include: { team: true, season: true },
          orderBy: [{ start_date: 'desc' }],
        },
        match_coaches: {
          include: {
            match: { include: { home_team: true, away_team: true } },
            team: true,
          },
          orderBy: [{ match: { match_date: 'asc' } }],
        },
      },
    });

    if (!coach) {
      throw new NotFoundException('감독을 찾을 수 없습니다.');
    }

    // Fetch season-specific team names for team_coach_history
    const historySeasonTeamPairs = coach.team_coach_history
      .filter((h) => h.team_id && h.season_id)
      .map((h) => ({ team_id: h.team_id!, season_id: h.season_id! }));

    const teamSeasonNames =
      historySeasonTeamPairs.length > 0
        ? await this.prisma.teamSeasonName.findMany({
            where: {
              OR: historySeasonTeamPairs.map((p) => ({
                team_id: p.team_id,
                season_id: p.season_id,
              })),
            },
            select: { team_id: true, season_id: true, team_name: true },
          })
        : [];

    const teamSeasonNameMap = new Map<string, string>();
    for (const tsn of teamSeasonNames) {
      teamSeasonNameMap.set(`${tsn.team_id}-${tsn.season_id}`, tsn.team_name);
    }

    const team_coach_history = coach.team_coach_history.map((h) => {
      const seasonSpecificName =
        h.team_id && h.season_id ? teamSeasonNameMap.get(`${h.team_id}-${h.season_id}`) : undefined;
      return {
        ...h,
        team: h.team ? { ...h.team, team_name: seasonSpecificName ?? h.team.team_name } : null,
      };
    });

    // Overview
    const season_stats = await this.computeCoachSeasonStats(coachId);
    const total_matches = season_stats.reduce((acc, s) => acc + (s.matches_played ?? 0), 0);
    const trophies = await this.computeCoachTrophies(coachId);

    // Current team via Prisma introspected table
    const current_team_verified = await this.prisma.team_current_head_coach.findFirst({
      where: { coach_id: coachId },
    });

    return {
      coach: { ...coach, team_coach_history },
      overview: {
        coach_id: coachId,
        season_stats,
        total_matches,
        trophies,
      },
      current_team_verified,
    };
  }

  // ── Private: computeCoachSeasonStats ──────────────────────────────
  private async computeCoachSeasonStats(coachId: number): Promise<CoachSeasonStats[]> {
    const matchCoaches = await this.prisma.matchCoach.findMany({
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

    for (const mc of matchCoaches) {
      const match = mc.match;
      const team = mc.team;
      if (!match) continue;
      const seasonId = match.season_id;
      if (seasonId == null) continue;

      const isHomeTeam = match.home_team_id === team?.team_id;
      const teamScore = isHomeTeam ? match.home_score : match.away_score;
      const opponentScore = isHomeTeam ? match.away_score : match.home_score;

      if (teamScore == null || opponentScore == null) continue;

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

      const pkTeam = isHomeTeam ? match.penalty_home_score : match.penalty_away_score;
      const pkOpp = isHomeTeam ? match.penalty_away_score : match.penalty_home_score;

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

      stats.goals_for += teamScore;
      stats.goals_against += opponentScore;

      if (team?.team_name) stats.teams.add(team.team_name);
      if (team?.team_id != null) stats.teamIds.add(team.team_id);
    }

    const seasonStatsArray = Array.from(seasonStatsMap.values());

    // Standing positions
    const seasonIds = Array.from(seasonStatsMap.keys());
    const unionTeamIds = (() => {
      const set = new Set<number>();
      for (const s of seasonStatsArray) {
        for (const id of s.teamIds) set.add(id);
      }
      return Array.from(set);
    })();

    if (seasonIds.length > 0 && unionTeamIds.length > 0) {
      const standingRows = await this.prisma.standing.findMany({
        where: {
          season_id: { in: seasonIds },
          team_id: { in: unionTeamIds },
        },
        select: { season_id: true, team_id: true, position: true },
      });

      for (const s of seasonStatsArray) {
        const teamIdSet = s.teamIds;
        let minPos: number | null = null;
        for (const row of standingRows) {
          if (row.season_id === s.season_id && row.team_id != null && teamIdSet.has(row.team_id)) {
            const pos = row.position;
            if (typeof pos === 'number') {
              minPos = minPos == null ? pos : Math.min(minPos, pos);
            }
          }
        }
        s.position = minPos;
      }
    } else {
      for (const s of seasonStatsArray) s.position = null;
    }

    // Team logos
    const allTeamIds = Array.from(
      seasonStatsArray.reduce((set, s) => {
        for (const id of s.teamIds) set.add(id);
        return set;
      }, new Set<number>()),
    );

    const teamRows =
      allTeamIds.length > 0
        ? await this.prisma.team.findMany({
            where: { team_id: { in: allTeamIds } },
            select: { team_id: true, team_name: true, logo: true },
          })
        : [];
    const teamMap = new Map(teamRows.map((t) => [t.team_id, t]));

    // Season-specific team names
    const teamSeasonPairs: { team_id: number; season_id: number }[] = [];
    for (const s of seasonStatsArray) {
      for (const tid of s.teamIds) {
        teamSeasonPairs.push({ team_id: tid, season_id: s.season_id });
      }
    }

    const teamSeasonNames =
      teamSeasonPairs.length > 0
        ? await this.prisma.teamSeasonName.findMany({
            where: {
              OR: teamSeasonPairs.map((p) => ({
                team_id: p.team_id,
                season_id: p.season_id,
              })),
            },
            select: { team_id: true, season_id: true, team_name: true },
          })
        : [];

    const teamSeasonNameMap = new Map<string, string>();
    for (const tsn of teamSeasonNames) {
      teamSeasonNameMap.set(`${tsn.team_id}-${tsn.season_id}`, tsn.team_name);
    }

    const season_stats: CoachSeasonStats[] = seasonStatsArray
      .map((s) => {
        const matches_played = s.matches_played ?? 0;
        const win_rate = matches_played > 0 ? Math.round((s.wins / matches_played) * 100) : 0;
        const goal_difference = (s.goals_for ?? 0) - (s.goals_against ?? 0);

        const teams = Array.from(s.teamIds).map((id) => {
          const seasonSpecificName = teamSeasonNameMap.get(`${id}-${s.season_id}`);
          if (seasonSpecificName) return seasonSpecificName;
          const t = teamMap.get(id);
          return t?.team_name ?? 'Unknown';
        });

        const teams_detailed = Array.from(s.teamIds).map((id) => {
          const t = teamMap.get(id);
          const seasonSpecificName = teamSeasonNameMap.get(`${id}-${s.season_id}`);
          return {
            team_id: id,
            team_name: seasonSpecificName ?? t?.team_name ?? 'Unknown',
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

  // ── Private: computeCoachTrophies ─────────────────────────────────
  private async computeCoachTrophies(coachId: number): Promise<CoachTrophies> {
    const now = new Date();
    const wins = await this.prisma.standing.findMany({
      where: {
        position: 1,
        season: { end_date: { not: null, lte: now } },
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
      const coachMatches = await this.prisma.matchCoach.findMany({
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

    const pairSet = new Set(coachSeasonTeamPairs.map((p) => `${p.season_id}:${p.team_id}`));

    const items: CoachTrophyItem[] = wins
      .filter(
        (w) =>
          w.season_id != null && w.team_id != null && pairSet.has(`${w.season_id}:${w.team_id}`),
      )
      .map((w) => ({
        season_id: w.season_id!,
        season_name: w.season?.season_name ?? 'Unknown',
        category: (w.season as { category?: string } | null)?.category ?? null,
      }))
      .filter((it) => {
        if (!it) return false;
        if (it.season_name?.includes('조별')) return false;
        if (it.category === 'PLAYOFF' || it.category === 'CHALLENGE_LEAGUE') return false;
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
}
