import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// ── helper types ──

type TeamSeasonNameResult = {
  team_id: number;
  season_id?: number;
  team_name: string;
};

type PlayerMatchStatWithRelations = {
  stat_id: number;
  match_id: number | null;
  player_id: number | null;
  team_id: number | null;
  goals: number | null;
  assists: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  minutes_played: number | null;
  saves: number | null;
  position: string | null;
  card_type: string | null;
  player: {
    player_id: number;
    name: string;
    jersey_number: number | null;
    profile_image_url: string | null;
  } | null;
  team: {
    team_id: number;
    team_name: string;
  } | null;
};

type AggregatedPlayer = {
  player_id: number;
  team_id: number;
  player_name: string;
  jersey_number: number | null;
  position: string;
  total_minutes: number;
};

type PlayerAgg = {
  player_id: number;
  team_id: number;
  player_name: string;
  jersey_number: number | null;
  position: string | null;
  goals: number;
  assists: number;
  minutes: number;
  profile_image_url: string | null;
};

type Substitution = {
  substitution_id: number;
  match_id: number;
  player_in_id: number;
  player_out_id: number | null;
  team_id: number;
  substitution_time: number | null;
  substitution_reason: string | null;
};

type LineupPlayer = {
  stat_id: number;
  match_id: number;
  player_id: number;
  team_id: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  minutes_played: number;
  saves: number;
  position: string;
  player_name: string;
  jersey_number: number | null;
  profile_image_url: string | null;
  team_name: string;
  participation_status: string;
  card_type: string;
};

// ── helpers ──

const normalizePosition = (pos: string | null): 'GK' | 'DF' | 'MF' | 'FW' | 'UNK' => {
  const p = (pos || '').toUpperCase();
  if (p.includes('GK') || p.includes('GOAL')) return 'GK';
  if (p.includes('DF') || p.includes('DEF')) return 'DF';
  if (p.includes('MF') || p.includes('MID')) return 'MF';
  if (p.includes('FW') || p.includes('FWD') || p.includes('FOR')) return 'FW';
  return 'UNK';
};

const getPositionOrder = (position: string): number => {
  switch (position) {
    case 'Forward':
      return 0;
    case 'Midfielder':
      return 1;
    case 'Defender':
      return 2;
    case 'Goalkeeper':
      return 3;
    default:
      return 4;
  }
};

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────
  // GET /matches
  // ──────────────────────────────────────────────────────

  async findAll() {
    const matches = await this.prisma.match.findMany({
      include: {
        home_team: true,
        away_team: true,
        season: true,
      },
      orderBy: { match_date: 'desc' },
    });

    if (matches.length === 0) return [];

    // 모든 팀 ID와 시즌 ID 수집
    const teamSeasonPairs = matches
      .map((m) => ({ team_id: m.home_team_id!, season_id: m.season_id! }))
      .concat(
        matches.map((m) => ({
          team_id: m.away_team_id!,
          season_id: m.season_id!,
        })),
      );

    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: {
        OR: teamSeasonPairs.map((pair) => ({
          team_id: pair.team_id,
          season_id: pair.season_id,
        })),
      },
      select: { team_id: true, season_id: true, team_name: true },
    });

    const teamNameMap = new Map(
      (teamSeasonNames as TeamSeasonNameResult[]).map((t) => [
        `${t.team_id}-${t.season_id}`,
        t.team_name,
      ]),
    );

    return matches.map((match) => {
      return {
        ...match,
        highlight_url: match.highlight_url ?? null,
        full_video_url: match.full_video_url ?? null,
        home_team: match.home_team
          ? {
              ...match.home_team,
              team_name:
                teamNameMap.get(`${match.home_team_id}-${match.season_id}`) ||
                match.home_team.team_name,
            }
          : null,
        away_team: match.away_team
          ? {
              ...match.away_team,
              team_name:
                teamNameMap.get(`${match.away_team_id}-${match.season_id}`) ||
                match.away_team.team_name,
            }
          : null,
      };
    });
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/upcoming
  // ──────────────────────────────────────────────────────

  async findUpcoming(opts: {
    limit?: number;
    offset?: number;
    teamId?: number;
    seasonId?: number;
  }) {
    const limit = Math.max(1, Math.min(opts.limit ?? 6, 50));
    const offset = Math.max(0, opts.offset ?? 0);
    const now = new Date();

    const where: Prisma.MatchWhereInput = {
      status: 'scheduled',
      match_date: { gt: now },
    };

    if (opts.teamId && !Number.isNaN(opts.teamId)) {
      where.OR = [{ home_team_id: opts.teamId }, { away_team_id: opts.teamId }];
    }

    if (opts.seasonId && !Number.isNaN(opts.seasonId)) {
      where.season_id = opts.seasonId;
    }

    const totalCount = await this.prisma.match.count({ where });

    const rows = await this.prisma.match.findMany({
      where,
      include: { season: true, home_team: true, away_team: true },
      orderBy: [{ match_date: 'asc' }],
      take: limit,
      skip: offset,
    });

    const items = rows.map((m) => ({
      match_id: m.match_id,
      match_date: m.match_date,
      status: m.status,
      description: m.description ?? null,
      season: m.season
        ? { season_id: m.season.season_id, season_name: m.season.season_name }
        : null,
      home: m.home_team
        ? {
            team_id: m.home_team.team_id,
            team_name: m.home_team.team_name,
            logo: m.home_team.logo ?? null,
          }
        : null,
      away: m.away_team
        ? {
            team_id: m.away_team.team_id,
            team_name: m.away_team.team_name,
            logo: m.away_team.logo ?? null,
          }
        : null,
    }));

    const currentPage = Math.floor(offset / limit) + 1;
    const hasNextPage = offset + limit < totalCount;
    const nextPage = hasNextPage ? currentPage + 1 : null;

    return {
      total: totalCount,
      matches: items,
      totalCount,
      nextPage,
      hasNextPage,
      currentPage,
    };
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId
  // ──────────────────────────────────────────────────────

  async findOne(matchId: number) {
    const match = await this.prisma.match.findUnique({
      where: { match_id: matchId },
      include: {
        home_team: true,
        away_team: true,
        season: true,
        home_coach: true,
        away_coach: true,
      },
    });

    if (!match) throw new NotFoundException('Match not found');

    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: {
        OR: [
          { team_id: match.home_team_id!, season_id: match.season_id! },
          { team_id: match.away_team_id!, season_id: match.season_id! },
        ],
      },
      select: { team_id: true, team_name: true },
    });

    const homeTeamSeasonName = (teamSeasonNames as TeamSeasonNameResult[]).find(
      (t) => t.team_id === match.home_team_id,
    );
    const awayTeamSeasonName = (teamSeasonNames as TeamSeasonNameResult[]).find(
      (t) => t.team_id === match.away_team_id,
    );

    return {
      ...match,
      highlight_url: match.highlight_url ?? null,
      full_video_url: match.full_video_url ?? null,
      home_team: match.home_team
        ? {
            ...match.home_team,
            team_name: homeTeamSeasonName?.team_name || match.home_team.team_name,
          }
        : null,
      away_team: match.away_team
        ? {
            ...match.away_team,
            team_name: awayTeamSeasonName?.team_name || match.away_team.team_name,
          }
        : null,
    };
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId/goals
  // ──────────────────────────────────────────────────────

  async findGoals(matchId: number) {
    const goals = await this.prisma.goal.findMany({
      where: { match_id: matchId },
      include: {
        player: {
          select: { player_id: true, name: true, jersey_number: true },
        },
      },
      orderBy: { goal_time: 'asc' },
    });

    const goalsWithTeam = await Promise.all(
      goals.map(async (goal) => {
        const playerStats = await this.prisma.playerMatchStats.findFirst({
          where: { match_id: matchId, player_id: goal.player_id },
          include: {
            team: { select: { team_id: true, team_name: true } },
          },
        });
        return { ...goal, team: playerStats?.team || null };
      }),
    );

    return goalsWithTeam;
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId/assists
  // ──────────────────────────────────────────────────────

  async findAssists(matchId: number) {
    return this.prisma.assist.findMany({
      where: { match_id: matchId },
      include: {
        player: true,
        goal: { include: { player: true } },
      },
      orderBy: { assist_time: 'asc' },
    });
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId/lineups
  // ──────────────────────────────────────────────────────

  async findLineups(matchId: number) {
    const match = await this.prisma.match.findUnique({
      where: { match_id: matchId },
      select: { match_id: true, home_team_id: true, away_team_id: true },
    });

    if (!match) throw new NotFoundException('Match not found');

    const playerStats = (await this.prisma.playerMatchStats.findMany({
      where: { match_id: matchId },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
            profile_image_url: true,
          },
        },
        team: { select: { team_id: true, team_name: true } },
      },
    })) as unknown as PlayerMatchStatWithRelations[];

    const detailedStats = await this.prisma.playerMatchDetailedStats.findMany({
      where: { match_id: matchId },
      select: { player_id: true, yellow_cards: true, red_cards: true },
    });

    const detailedStatsMap = new Map<number, { yellow_cards: number; red_cards: number }>();
    detailedStats.forEach((ds) => {
      detailedStatsMap.set(ds.player_id, {
        yellow_cards: ds.yellow_cards ?? 0,
        red_cards: ds.red_cards ?? 0,
      });
    });

    const substitutions = (await this.prisma.substitution.findMany({
      where: { match_id: matchId },
      select: {
        substitution_id: true,
        match_id: true,
        player_in_id: true,
        player_out_id: true,
        team_id: true,
        substitution_time: true,
        substitution_reason: true,
      },
    })) as Substitution[];

    const substitutionsByMatch: Record<number, Substitution[]> = {};
    substitutions.forEach((sub) => {
      if (!substitutionsByMatch[sub.match_id]) substitutionsByMatch[sub.match_id] = [];
      substitutionsByMatch[sub.match_id].push(sub);
    });

    const lineupsByMatch: Record<string, LineupPlayer[]> = {};
    const homeTeamKey = `${match.match_id}_${match.home_team_id}`;
    const awayTeamKey = `${match.match_id}_${match.away_team_id}`;
    lineupsByMatch[homeTeamKey] = [];
    lineupsByMatch[awayTeamKey] = [];

    const processedPlayers = new Set<string>();

    playerStats.forEach((stat) => {
      const playerKey = `${stat.player_id}_${stat.team_id}`;
      if (processedPlayers.has(playerKey)) return;
      processedPlayers.add(playerKey);

      const teamKey = `${match.match_id}_${stat.team_id}`;
      const matchSubs = substitutionsByMatch[match.match_id] || [];
      const playerSubstitution = matchSubs.find(
        (sub) => sub.player_in_id === stat.player_id || sub.player_out_id === stat.player_id,
      );

      let participationStatus = 'bench';
      if (playerSubstitution) {
        if (playerSubstitution.player_in_id === stat.player_id) {
          participationStatus = 'substitute';
        } else if (playerSubstitution.player_out_id === stat.player_id) {
          participationStatus = 'starting';
        }
      } else if (stat.minutes_played && stat.minutes_played > 0) {
        participationStatus = 'starting';
      }

      const detailedCardData = detailedStatsMap.get(stat.player_id || 0);
      const yellowCards = detailedCardData?.yellow_cards || stat.yellow_cards || 0;
      const redCards = detailedCardData?.red_cards || stat.red_cards || 0;

      let cardType = stat.card_type || 'none';
      if (redCards > 0 && yellowCards >= 2) {
        cardType = 'red_accumulated';
      } else if (redCards > 0) {
        cardType = 'red_direct';
      } else if (yellowCards > 0) {
        cardType = 'yellow';
      }

      const playerData = {
        stat_id: stat.stat_id,
        match_id: match.match_id,
        player_id: stat.player_id || 0,
        team_id: stat.team_id || 0,
        goals: stat.goals || 0,
        assists: stat.assists || 0,
        yellow_cards: yellowCards,
        red_cards: redCards,
        minutes_played: stat.minutes_played || 0,
        saves: stat.saves || 0,
        position: stat.position || 'Unknown',
        player_name: stat.player?.name || 'Unknown',
        jersey_number: stat.player?.jersey_number ?? null,
        profile_image_url: stat.player?.profile_image_url ?? null,
        team_name: stat.team?.team_name || 'Unknown',
        participation_status: participationStatus,
        card_type: cardType,
      };

      if (lineupsByMatch[teamKey]) {
        lineupsByMatch[teamKey].push(playerData);
      }
    });

    // Sort lineups
    Object.keys(lineupsByMatch).forEach((key) => {
      lineupsByMatch[key].sort((a, b) => {
        const statusOrder = { starting: 0, substitute: 1, bench: 2 };
        const aOrder = statusOrder[a.participation_status as keyof typeof statusOrder] || 3;
        const bOrder = statusOrder[b.participation_status as keyof typeof statusOrder] || 3;

        if (aOrder !== bOrder) return aOrder - bOrder;

        const positionOrderA = getPositionOrder(a.position);
        const positionOrderB = getPositionOrder(b.position);
        if (positionOrderA !== positionOrderB) return positionOrderA - positionOrderB;

        return (a.player_name || '').localeCompare(b.player_name || '', 'ko');
      });
    });

    return lineupsByMatch;
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId/head-to-head
  // ──────────────────────────────────────────────────────

  async findHeadToHead(matchId: number) {
    const match = await this.prisma.match.findUnique({
      where: { match_id: matchId },
      include: { home_team: true, away_team: true, season: true },
    });

    if (!match || !match.home_team_id || !match.away_team_id) {
      throw new NotFoundException('Match not found');
    }

    // 시즌별 팀 이름 조회
    let homeTeamName = match.home_team?.team_name;
    let awayTeamName = match.away_team?.team_name;
    if (match.season_id) {
      const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
        where: {
          season_id: match.season_id,
          team_id: { in: [match.home_team_id, match.away_team_id] },
        },
        select: { team_id: true, team_name: true },
      });
      teamSeasonNames.forEach((tsn) => {
        if (tsn.team_id === match.home_team_id) homeTeamName = tsn.team_name;
        else if (tsn.team_id === match.away_team_id) awayTeamName = tsn.team_name;
      });
    }

    const small = Math.min(match.home_team_id, match.away_team_id);
    const large = Math.max(match.home_team_id, match.away_team_id);

    const stat = await this.prisma.h2hPairStats.findUnique({
      where: {
        team_small_id_team_large_id: {
          team_small_id: small,
          team_large_id: large,
        },
      },
      select: {
        total_matches: true,
        small_wins: true,
        large_wins: true,
        draws: true,
        small_goals: true,
        large_goals: true,
      },
    });

    const teamAId = match.home_team_id;
    const mapToAB = (
      s:
        | undefined
        | {
            total_matches: number;
            small_wins: number;
            large_wins: number;
            draws: number;
            small_goals: number;
            large_goals: number;
          },
    ) => {
      if (!s) {
        return {
          total: 0,
          teamA: {
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
          },
          teamB: {
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
          },
        };
      }
      const teamAIsSmall = teamAId === small;
      const teamAWins = teamAIsSmall ? s.small_wins : s.large_wins;
      const teamBWins = teamAIsSmall ? s.large_wins : s.small_wins;
      const teamAGoals = teamAIsSmall ? s.small_goals : s.large_goals;
      const teamBGoals = teamAIsSmall ? s.large_goals : s.small_goals;
      return {
        total: s.total_matches,
        teamA: {
          wins: teamAWins,
          draws: s.draws,
          losses: teamBWins,
          goals_for: teamAGoals,
          goals_against: teamBGoals,
        },
        teamB: {
          wins: teamBWins,
          draws: s.draws,
          losses: teamAWins,
          goals_for: teamBGoals,
          goals_against: teamAGoals,
        },
      };
    };

    const summary = mapToAB(stat ?? undefined);

    return {
      match_id: match.match_id,
      teamA: match.home_team
        ? {
            ...match.home_team,
            team_name: homeTeamName ?? match.home_team.team_name,
          }
        : null,
      teamB: match.away_team
        ? {
            ...match.away_team,
            team_name: awayTeamName ?? match.away_team.team_name,
          }
        : null,
      summary,
    };
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId/head-to-head/list
  // ──────────────────────────────────────────────────────

  async findHeadToHeadList(matchId: number, scope: 'prev' | 'next' = 'prev') {
    const match = await this.prisma.match.findUnique({
      where: { match_id: matchId },
      select: {
        match_id: true,
        home_team_id: true,
        away_team_id: true,
        match_date: true,
      },
    });

    if (!match || !match.home_team_id || !match.away_team_id) {
      throw new NotFoundException('Match not found');
    }

    const a = match.home_team_id;
    const b = match.away_team_id;
    const currentDate = match.match_date ? new Date(match.match_date) : null;

    const h2hMatches = await this.prisma.match.findMany({
      where: {
        match_id: { not: matchId },
        OR: [
          { home_team_id: a, away_team_id: b },
          { home_team_id: b, away_team_id: a },
        ],
        ...(currentDate
          ? scope === 'next'
            ? { match_date: { gt: currentDate.toISOString() } }
            : { match_date: { lt: currentDate.toISOString() } }
          : {}),
      },
      include: { home_team: true, away_team: true, season: true },
      orderBy: [{ match_date: 'desc' }],
    });

    // 시즌별 팀 이름 조회
    const seasonIds = Array.from(
      new Set(h2hMatches.map((m) => m.season_id).filter((id): id is number => id !== null)),
    );
    const teamIds = Array.from(
      new Set(
        h2hMatches
          .flatMap((m) => [m.home_team_id, m.away_team_id])
          .filter((id): id is number => id !== null),
      ),
    );

    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: { season_id: { in: seasonIds }, team_id: { in: teamIds } },
      select: { team_id: true, season_id: true, team_name: true },
    });

    const teamSeasonNameMap = new Map<string, string>();
    teamSeasonNames.forEach((tsn) => {
      teamSeasonNameMap.set(`${tsn.season_id}-${tsn.team_id}`, tsn.team_name);
    });

    const items = h2hMatches.map((m) => {
      const usePenalty = m.penalty_home_score !== null && m.penalty_away_score !== null;

      const homeTeamName =
        m.season_id && m.home_team_id
          ? (teamSeasonNameMap.get(`${m.season_id}-${m.home_team_id}`) ?? m.home_team?.team_name)
          : m.home_team?.team_name;
      const awayTeamName =
        m.season_id && m.away_team_id
          ? (teamSeasonNameMap.get(`${m.season_id}-${m.away_team_id}`) ?? m.away_team?.team_name)
          : m.away_team?.team_name;

      return {
        match_id: m.match_id,
        match_date: m.match_date,
        season: m.season
          ? {
              season_id: m.season.season_id,
              season_name: m.season.season_name,
              category: m.season.category,
            }
          : null,
        tournament_stage: m.tournament_stage,
        group_stage: m.group_stage,
        home: m.home_team
          ? {
              team_id: m.home_team.team_id,
              team_name: homeTeamName ?? m.home_team.team_name,
              logo: m.home_team.logo ?? null,
              primary_color: m.home_team.primary_color ?? null,
              secondary_color: m.home_team.secondary_color ?? null,
            }
          : null,
        away: m.away_team
          ? {
              team_id: m.away_team.team_id,
              team_name: awayTeamName ?? m.away_team.team_name,
              logo: m.away_team.logo ?? null,
              primary_color: m.away_team.primary_color ?? null,
              secondary_color: m.away_team.secondary_color ?? null,
            }
          : null,
        score: { home: m.home_score, away: m.away_score },
        penalty: usePenalty ? { home: m.penalty_home_score, away: m.penalty_away_score } : null,
      };
    });

    return { total: items.length, items };
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId/head-to-head/coaches/list
  // ──────────────────────────────────────────────────────

  async findHeadToHeadCoachesList(matchId: number, scope: 'prev' | 'next' = 'prev') {
    const match = await this.prisma.match.findUnique({
      where: { match_id: matchId },
      select: {
        match_id: true,
        match_date: true,
        home_team_id: true,
        away_team_id: true,
        home_coach_id: true,
        away_coach_id: true,
        home_coach: {
          select: { coach_id: true, name: true, profile_image_url: true },
        },
        away_coach: {
          select: { coach_id: true, name: true, profile_image_url: true },
        },
      },
    });

    let homeCoachId = match?.home_coach_id;
    let awayCoachId = match?.away_coach_id;
    let homeCoachName = match?.home_coach?.name;
    let awayCoachName = match?.away_coach?.name;
    let homeCoachImage = match?.home_coach?.profile_image_url;
    let awayCoachImage = match?.away_coach?.profile_image_url;

    if (!homeCoachId || !awayCoachId) {
      const matchCoaches = await this.prisma.matchCoach.findMany({
        where: { match_id: matchId, role: 'head' },
        include: { coach: true, team: true },
      });

      if (!match) {
        return {
          total: 0,
          items: [],
          current: {
            home_coach_id: null,
            away_coach_id: null,
            home_coach_name: null,
            away_coach_name: null,
          },
        };
      }

      const homeCoach = matchCoaches.find((mc) => mc.team_id === match.home_team_id);
      const awayCoach = matchCoaches.find((mc) => mc.team_id === match.away_team_id);

      if (homeCoach && awayCoach) {
        homeCoachId = homeCoach.coach_id;
        awayCoachId = awayCoach.coach_id;
        homeCoachName = homeCoach.coach.name;
        awayCoachName = awayCoach.coach.name;
        homeCoachImage = homeCoach.coach.profile_image_url;
        awayCoachImage = awayCoach.coach.profile_image_url;
      }
    }

    if (!homeCoachId || !awayCoachId) {
      return {
        total: 0,
        items: [],
        current: {
          home_coach_id: null,
          away_coach_id: null,
          home_coach_name: null,
          away_coach_name: null,
        },
      };
    }

    const a = homeCoachId;
    const b = awayCoachId;
    const currentDate = match?.match_date ? new Date(match.match_date) : null;

    const rows = await this.prisma.match.findMany({
      where: {
        match_id: { not: matchId },
        OR: [
          { home_coach_id: a, away_coach_id: b },
          { home_coach_id: b, away_coach_id: a },
        ],
        ...(currentDate
          ? scope === 'next'
            ? { match_date: { gt: currentDate.toISOString() } }
            : { match_date: { lt: currentDate.toISOString() } }
          : {}),
      },
      include: {
        season: true,
        home_team: true,
        away_team: true,
        home_coach: true,
        away_coach: true,
      },
      orderBy: [{ match_date: 'desc' }],
    });

    // 시즌별 팀 이름 조회
    const seasonIds = Array.from(
      new Set(rows.map((m) => m.season_id).filter((id): id is number => id !== null)),
    );
    const teamIds = Array.from(
      new Set(
        rows
          .flatMap((m) => [m.home_team_id, m.away_team_id])
          .filter((id): id is number => id !== null),
      ),
    );

    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: { season_id: { in: seasonIds }, team_id: { in: teamIds } },
      select: { team_id: true, season_id: true, team_name: true },
    });

    const teamSeasonNameMap = new Map<string, string>();
    teamSeasonNames.forEach((tsn) => {
      teamSeasonNameMap.set(`${tsn.season_id}-${tsn.team_id}`, tsn.team_name);
    });

    const items = rows.map((m) => {
      const usePenalty = m.penalty_home_score !== null && m.penalty_away_score !== null;

      const homeTeamName =
        m.season_id && m.home_team_id
          ? (teamSeasonNameMap.get(`${m.season_id}-${m.home_team_id}`) ?? m.home_team?.team_name)
          : m.home_team?.team_name;
      const awayTeamName =
        m.season_id && m.away_team_id
          ? (teamSeasonNameMap.get(`${m.season_id}-${m.away_team_id}`) ?? m.away_team?.team_name)
          : m.away_team?.team_name;

      return {
        match_id: m.match_id,
        match_date: m.match_date,
        season: m.season
          ? {
              season_id: m.season.season_id,
              season_name: m.season.season_name,
              category: m.season.category,
            }
          : null,
        home: {
          team_id: m.home_team?.team_id ?? null,
          team_name: homeTeamName ?? null,
          primary_color: m.home_team?.primary_color ?? null,
          secondary_color: m.home_team?.secondary_color ?? null,
          coach_id: m.home_coach?.coach_id ?? null,
          coach_name: m.home_coach?.name ?? null,
          coach_image: m.home_coach?.profile_image_url ?? null,
        },
        away: {
          team_id: m.away_team?.team_id ?? null,
          team_name: awayTeamName ?? null,
          primary_color: m.away_team?.primary_color ?? null,
          secondary_color: m.away_team?.secondary_color ?? null,
          coach_id: m.away_coach?.coach_id ?? null,
          coach_name: m.away_coach?.name ?? null,
          coach_image: m.away_coach?.profile_image_url ?? null,
        },
        score: { home: m.home_score, away: m.away_score },
        penalty: usePenalty ? { home: m.penalty_home_score, away: m.penalty_away_score } : null,
        group_stage: m.group_stage,
        tournament_stage: m.tournament_stage,
      };
    });

    return {
      total: items.length,
      items,
      current: {
        home_coach_id: homeCoachId,
        away_coach_id: awayCoachId,
        home_coach_name: homeCoachName,
        away_coach_name: awayCoachName,
        home_coach_image: homeCoachImage ?? null,
        away_coach_image: awayCoachImage ?? null,
      },
    };
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId/key-players
  // ──────────────────────────────────────────────────────

  async findKeyPlayers(matchId: number) {
    const match = await this.prisma.match.findUnique({
      where: { match_id: matchId },
      select: {
        match_id: true,
        match_date: true,
        home_team_id: true,
        away_team_id: true,
      },
    });

    if (!match) throw new NotFoundException('Match not found');

    const cutoff = match.match_date ? new Date(match.match_date) : new Date();
    const homeTeamId = match.home_team_id!;
    const awayTeamId = match.away_team_id!;

    const [homeRecentMatches, awayRecentMatches] = await Promise.all([
      this.prisma.match.findMany({
        where: {
          match_date: { lt: cutoff },
          OR: [{ home_team_id: homeTeamId }, { away_team_id: homeTeamId }],
        },
        orderBy: { match_date: 'desc' },
        take: 10,
        select: { match_id: true },
      }),
      this.prisma.match.findMany({
        where: {
          match_date: { lt: cutoff },
          OR: [{ home_team_id: awayTeamId }, { away_team_id: awayTeamId }],
        },
        orderBy: { match_date: 'desc' },
        take: 10,
        select: { match_id: true },
      }),
    ]);

    const homeMatchIds = homeRecentMatches.map((m) => m.match_id);
    const awayMatchIds = awayRecentMatches.map((m) => m.match_id);
    const allMatchIds = Array.from(new Set([...homeMatchIds, ...awayMatchIds]));

    const allStats =
      allMatchIds.length > 0
        ? await this.prisma.playerMatchStats.findMany({
            where: {
              team_id: { in: [homeTeamId, awayTeamId] },
              match_id: { in: allMatchIds },
            },
            include: {
              player: {
                select: {
                  player_id: true,
                  name: true,
                  jersey_number: true,
                  profile_image_url: true,
                },
              },
            },
          })
        : [];

    const buildAggFromStats = (teamId: number, validMatchIds: number[]): PlayerAgg[] => {
      const validSet = new Set(validMatchIds);
      const teamStats = allStats.filter(
        (s) => s.team_id === teamId && s.match_id != null && validSet.has(s.match_id),
      );

      const agg = new Map<number, PlayerAgg>();
      for (const s of teamStats) {
        const pid = s.player_id;
        if (!pid) continue;
        const minutes = s.minutes_played ?? 0;
        const goals = s.goals ?? 0;
        const assists = s.assists ?? 0;
        const position = s.position ?? null;
        const exists = agg.get(pid);
        if (exists) {
          exists.minutes += minutes;
          exists.goals += goals;
          exists.assists += assists;
        } else {
          agg.set(pid, {
            player_id: pid,
            team_id: (s.team_id as number) ?? teamId,
            player_name: (s.player?.name as string) ?? 'Unknown',
            jersey_number: (s.player?.jersey_number as number) ?? null,
            position,
            goals,
            assists,
            minutes,
            profile_image_url: (s.player?.profile_image_url as string) ?? null,
          });
        }
      }

      const arr = Array.from(agg.values()).sort((a, b) => {
        const as2 = a.goals * 2 + a.assists;
        const bs2 = b.goals * 2 + b.assists;
        if (bs2 !== as2) return bs2 - as2;
        return b.minutes - a.minutes;
      });
      return arr.slice(0, 3);
    };

    const home = buildAggFromStats(homeTeamId, homeMatchIds);
    const away = buildAggFromStats(awayTeamId, awayMatchIds);

    return { match_id: match.match_id, home, away };
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId/penalties
  // ──────────────────────────────────────────────────────

  async findPenalties(matchId: number) {
    return this.prisma.penaltyShootoutDetail.findMany({
      where: { match_id: matchId },
      include: {
        kicker: {
          select: { player_id: true, name: true, jersey_number: true },
        },
        goalkeeper: {
          select: { player_id: true, name: true, jersey_number: true },
        },
        team: { select: { team_id: true, team_name: true } },
      },
      orderBy: { kicker_order: 'asc' },
    });
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId/predicted-lineups
  // ──────────────────────────────────────────────────────

  async findPredictedLineups(matchId: number) {
    const match = await this.prisma.match.findUnique({
      where: { match_id: matchId },
      select: {
        match_id: true,
        match_date: true,
        season_id: true,
        home_team_id: true,
        away_team_id: true,
      },
    });

    if (!match) throw new NotFoundException('Match not found');

    const currentDate = match.match_date ? new Date(match.match_date) : new Date();

    const buildPredictedForTeam = async (teamId: number): Promise<AggregatedPlayer[]> => {
      const recentMatches = await this.prisma.match.findMany({
        where: {
          match_date: { lt: currentDate },
          OR: [{ home_team_id: teamId }, { away_team_id: teamId }],
        },
        orderBy: { match_date: 'desc' },
        take: 10,
        select: { match_id: true },
      });
      const recentIds = recentMatches.map((m) => m.match_id);
      if (recentIds.length === 0) return [];

      const stats = await this.prisma.playerMatchStats.findMany({
        where: { team_id: teamId, match_id: { in: recentIds } },
        include: {
          player: {
            select: { player_id: true, name: true, jersey_number: true },
          },
        },
      });

      const aggMap = new Map<number, AggregatedPlayer>();
      for (const s of stats) {
        const pid = s.player_id as number | null;
        if (!pid) continue;
        const existing = aggMap.get(pid);
        const minutes = s.minutes_played ?? 0;
        const normPos = normalizePosition(s.position ?? null);
        if (existing) {
          existing.total_minutes += minutes || 0;
          if (existing.position === 'UNK' && normPos !== 'UNK') existing.position = normPos;
        } else {
          aggMap.set(pid, {
            player_id: pid,
            team_id: s.team_id ?? teamId,
            player_name: s.player?.name ?? 'Unknown',
            jersey_number: s.player?.jersey_number ?? null,
            position: normPos,
            total_minutes: minutes || 0,
          });
        }
      }

      const players = Array.from(aggMap.values());

      const byPos = {
        GK: players
          .filter((p) => p.position === 'GK')
          .sort((a, b) => b.total_minutes - a.total_minutes),
        DF: players
          .filter((p) => p.position === 'DF')
          .sort((a, b) => b.total_minutes - a.total_minutes),
        MF: players
          .filter((p) => p.position === 'MF')
          .sort((a, b) => b.total_minutes - a.total_minutes),
        FW: players
          .filter((p) => p.position === 'FW')
          .sort((a, b) => b.total_minutes - a.total_minutes),
        UNK: players
          .filter((p) => p.position === 'UNK')
          .sort((a, b) => b.total_minutes - a.total_minutes),
      } as const;

      const pick: AggregatedPlayer[] = [];
      const pushSome = (arr: readonly AggregatedPlayer[], n: number) => {
        for (const p of arr) {
          if (pick.length >= 11) break;
          if (pick.find((x) => x.player_id === p.player_id)) continue;
          pick.push(p);
          if (pick.length >= 11) break;
          if (--n <= 0) break;
        }
      };

      pushSome(byPos.GK, 1);
      pushSome(byPos.DF, 4);
      pushSome(byPos.MF, 4);
      pushSome(byPos.FW, 2);

      if (pick.length < 11) {
        const remaining = players
          .filter((p) => !pick.find((x) => x.player_id === p.player_id))
          .sort((a, b) => b.total_minutes - a.total_minutes);
        for (const p of remaining) {
          if (pick.length >= 11) break;
          pick.push(p);
        }
      }

      return pick;
    };

    const homeTeamId = match.home_team_id!;
    const awayTeamId = match.away_team_id!;
    const [homePred, awayPred] = await Promise.all([
      buildPredictedForTeam(homeTeamId),
      buildPredictedForTeam(awayTeamId),
    ]);

    const toLineup = (p: AggregatedPlayer) => ({
      stat_id: -1,
      match_id: match.match_id,
      player_id: p.player_id,
      team_id: p.team_id,
      goals: 0,
      assists: 0,
      yellow_cards: 0,
      red_cards: 0,
      minutes_played: 0,
      saves: 0,
      position: p.position,
      player_name: p.player_name,
      jersey_number: p.jersey_number,
      team_name: '',
      participation_status: 'starting',
      card_type: 'none',
    });

    const homeKey = `${match.match_id}_${homeTeamId}`;
    const awayKey = `${match.match_id}_${awayTeamId}`;

    return {
      [homeKey]: homePred.map(toLineup),
      [awayKey]: awayPred.map(toLineup),
    };
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId/substitutions
  // ──────────────────────────────────────────────────────

  async findSubstitutions(matchId: number) {
    return this.prisma.substitution.findMany({
      where: { match_id: matchId },
      include: {
        player_in: {
          select: { player_id: true, name: true, jersey_number: true },
        },
        player_out: {
          select: { player_id: true, name: true, jersey_number: true },
        },
        team: { select: { team_id: true, team_name: true } },
      },
      orderBy: { substitution_time: 'asc' },
    });
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId/ratings
  // ──────────────────────────────────────────────────────

  async findRatings(matchId: number) {
    const cachedRatings = await this.prisma.playerMatchRating.findMany({
      where: { match_id: matchId },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
            profile_image_url: true,
          },
        },
        team: { select: { team_id: true, team_name: true } },
      },
      orderBy: { rating: 'desc' },
    });

    if (cachedRatings.length === 0) {
      return { match_id: matchId, ratings: [] };
    }

    const basicStats = await this.prisma.playerMatchStats.findMany({
      where: { match_id: matchId },
      select: {
        player_id: true,
        position: true,
        goals: true,
        assists: true,
        yellow_cards: true,
        red_cards: true,
      },
    });
    const basicStatsMap = new Map(
      basicStats.filter((bs) => bs.player_id != null).map((bs) => [bs.player_id!, bs]),
    );

    const ratings = cachedRatings.map((cr) => {
      const basic = basicStatsMap.get(cr.player_id);
      return {
        player_id: cr.player_id,
        team_id: cr.team_id,
        player_name: cr.player.name,
        jersey_number: cr.player.jersey_number,
        profile_image_url: cr.player.profile_image_url,
        team_name: cr.team.team_name,
        position: basic?.position ?? 'FW',
        goals: basic?.goals ?? 0,
        assists: basic?.assists ?? 0,
        yellow_cards: basic?.yellow_cards ?? 0,
        red_cards: basic?.red_cards ?? 0,
        rating: cr.rating,
        breakdown: cr.breakdown as Record<string, number>,
      };
    });

    return { match_id: matchId, ratings };
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId/xt-ratings
  // ──────────────────────────────────────────────────────

  async findXtRatings(matchId: number) {
    const ratings = await this.prisma.playerMatchXtRating.findMany({
      where: { match_id: matchId },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
            profile_image_url: true,
          },
        },
        team: { select: { team_id: true, team_name: true } },
      },
      orderBy: { xt_rating: 'desc' },
    });

    if (ratings.length === 0) {
      return { match_id: matchId, ratings: [] };
    }

    const basicStats = await this.prisma.playerMatchStats.findMany({
      where: { match_id: matchId },
      select: { player_id: true, position: true },
    });
    const posMap = new Map(
      basicStats.filter((bs) => bs.player_id != null).map((bs) => [bs.player_id!, bs.position]),
    );

    const enriched = ratings.map((r) => ({
      player_id: r.player_id,
      team_id: r.team_id,
      player_name: r.player.name,
      jersey_number: r.player.jersey_number,
      profile_image_url: r.player.profile_image_url,
      team_name: r.team.team_name,
      position: posMap.get(r.player_id) ?? 'FW',
      xt_rating: r.xt_rating,
      total_xt: r.total_xt,
      offensive_xt: r.offensive_xt,
      defensive_xt: r.defensive_xt,
      actions_count: r.actions_count,
      breakdown: r.breakdown,
    }));

    return { match_id: matchId, ratings: enriched };
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId/detailed-stats
  // ──────────────────────────────────────────────────────

  async findDetailedStats(matchId: number) {
    return this.prisma.playerMatchDetailedStats.findMany({
      where: { match_id: matchId },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
            profile_image_url: true,
          },
        },
        team: { select: { team_id: true, team_name: true } },
      },
      orderBy: [{ team_id: 'asc' }, { player_id: 'asc' }],
    });
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId/supports
  // ──────────────────────────────────────────────────────

  async findSupports(matchId: number) {
    const match = await this.prisma.match.findUnique({
      where: { match_id: matchId },
      include: {
        home_team: {
          select: {
            team_id: true,
            team_name: true,
            logo: true,
            primary_color: true,
            secondary_color: true,
          },
        },
        away_team: {
          select: {
            team_id: true,
            team_name: true,
            logo: true,
            primary_color: true,
            secondary_color: true,
          },
        },
      },
    });

    if (!match) throw new NotFoundException('Match not found');

    const supportStats = await this.prisma.matchSupport.groupBy({
      by: ['team_id'],
      where: { match_id: matchId },
      _count: { support_id: true },
    });

    const recentSupporters = await this.prisma.matchSupport.findMany({
      where: { match_id: matchId },
      include: {
        user: {
          select: { korean_nickname: true, profile_image_url: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    const homeTeamSupports =
      supportStats.find((stat) => stat.team_id === match.home_team?.team_id)?._count.support_id ||
      0;
    const awayTeamSupports =
      supportStats.find((stat) => stat.team_id === match.away_team?.team_id)?._count.support_id ||
      0;
    const totalSupports = homeTeamSupports + awayTeamSupports;

    const homeTeamSupporters = recentSupporters
      .filter((support) => support.team_id === match.home_team?.team_id)
      .slice(0, 5);
    const awayTeamSupporters = recentSupporters
      .filter((support) => support.team_id === match.away_team?.team_id)
      .slice(0, 5);

    return {
      match: {
        match_id: match.match_id,
        match_date: match.match_date,
        status: match.status,
        home_team: match.home_team,
        away_team: match.away_team,
      },
      statistics: {
        total_supports: totalSupports,
        home_team_supports: homeTeamSupports,
        away_team_supports: awayTeamSupports,
        home_team_percentage: totalSupports > 0 ? (homeTeamSupports / totalSupports) * 100 : 0,
        away_team_percentage: totalSupports > 0 ? (awayTeamSupports / totalSupports) * 100 : 0,
      },
      recent_supporters: {
        home_team: homeTeamSupporters.map((support) => ({
          user_nickname: support.user.korean_nickname,
          profile_image: support.user.profile_image_url,
          message: support.message,
          created_at: support.created_at,
        })),
        away_team: awayTeamSupporters.map((support) => ({
          user_nickname: support.user.korean_nickname,
          profile_image: support.user.profile_image_url,
          message: support.message,
          created_at: support.created_at,
        })),
      },
    };
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId/messages
  // ──────────────────────────────────────────────────────

  async findMessages(matchId: number, opts: { page?: number; limit?: number; teamId?: number }) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 10;

    const match = await this.prisma.match.findUnique({
      where: { match_id: matchId },
      select: { match_id: true, home_team_id: true, away_team_id: true },
    });

    if (!match) throw new NotFoundException('Match not found');

    const whereCondition: {
      match_id: number;
      message: { not: null };
      team_id?: number;
    } = {
      match_id: matchId,
      message: { not: null },
    };

    if (opts.teamId && !isNaN(opts.teamId)) {
      whereCondition.team_id = opts.teamId;
    }

    const totalCount = await this.prisma.matchSupport.count({
      where: whereCondition,
    });

    const supports = await this.prisma.matchSupport.findMany({
      where: whereCondition,
      include: {
        user: {
          select: { korean_nickname: true, profile_image_url: true },
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
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      messages: supports.map((support) => ({
        support_id: support.support_id,
        user_id: support.user_id,
        user_nickname: support.user.korean_nickname,
        profile_image: support.user.profile_image_url,
        message: support.message,
        team: {
          team_id: support.team.team_id,
          team_name: support.team.team_name,
          logo: support.team.logo,
          primary_color: support.team.primary_color,
          secondary_color: support.team.secondary_color,
        },
        created_at: support.created_at,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/:matchId/coaches
  // ──────────────────────────────────────────────────────

  async findCoaches(matchId: number) {
    const matchCoaches = await this.prisma.matchCoach.findMany({
      where: { match_id: matchId },
      include: {
        coach: { select: { coach_id: true, name: true } },
        team: { select: { team_id: true, team_name: true } },
      },
      orderBy: { role: 'asc' },
    });

    if (matchCoaches.length === 0) {
      return {
        match_id: matchId,
        coaches: [],
        message: 'No coach data available for this match',
      };
    }

    const match = await this.prisma.match.findUnique({
      where: { match_id: matchId },
      select: { home_team_id: true, away_team_id: true },
    });

    if (!match) throw new NotFoundException('Match not found');

    const homeTeamCoaches = matchCoaches.filter((mc) => mc.team_id === match.home_team_id);
    const awayTeamCoaches = matchCoaches.filter((mc) => mc.team_id === match.away_team_id);

    return {
      match_id: matchId,
      home_team_coaches: homeTeamCoaches,
      away_team_coaches: awayTeamCoaches,
    };
  }

  // ──────────────────────────────────────────────────────
  // GET /matches/season/:seasonId
  // ──────────────────────────────────────────────────────

  async findBySeasonId(
    seasonId: number,
    opts: {
      page?: number;
      limit?: number;
      tournamentStage?: string;
      groupStage?: string;
    },
  ) {
    const pageNum = opts.page;
    const limitNum = opts.limit;
    const isPaginated = pageNum && limitNum;

    const whereCondition: {
      season_id: number;
      tournament_stage?: string;
      group_stage?: string;
    } = { season_id: seasonId };

    if (opts.tournamentStage && opts.tournamentStage !== 'all') {
      whereCondition.tournament_stage = opts.tournamentStage;
    }
    if (opts.groupStage && opts.groupStage !== 'all') {
      whereCondition.group_stage = opts.groupStage;
    }

    const [matches, totalCount, tournamentStats, totalMatchesCount] = await Promise.all([
      this.prisma.match.findMany({
        where: whereCondition,
        include: { home_team: true, away_team: true, season: true },
        orderBy: { match_date: 'asc' },
        ...(isPaginated && {
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
      }),
      isPaginated ? this.prisma.match.count({ where: whereCondition }) : Promise.resolve(0),
      isPaginated
        ? this.prisma.match.groupBy({
            by: ['tournament_stage'],
            where: { season_id: seasonId },
            _count: true,
          })
        : Promise.resolve([]),
      isPaginated
        ? this.prisma.match.count({ where: { season_id: seasonId } })
        : Promise.resolve(0),
    ]);

    if (matches.length === 0) {
      return isPaginated
        ? {
            items: [],
            totalCount: 0,
            currentPage: pageNum,
            hasNextPage: false,
            nextPage: null,
            tournamentStats: {
              group_stage: 0,
              championship: 0,
              relegation: 0,
            },
            totalMatchesCount: 0,
          }
        : [];
    }

    // 모든 팀 ID 수집
    const teamIds = matches.flatMap((m) => [m.home_team_id!, m.away_team_id!]);

    const teamSeasonNames = await this.prisma.teamSeasonName.findMany({
      where: { team_id: { in: teamIds }, season_id: seasonId },
      select: { team_id: true, team_name: true },
    });

    const teamNameMap = new Map(
      (teamSeasonNames as TeamSeasonNameResult[]).map((t) => [t.team_id, t.team_name]),
    );

    const updatedMatches = matches.map((m) => {
      return {
        ...m,
        highlight_url: m.highlight_url ?? null,
        full_video_url: m.full_video_url ?? null,
        home_team: m.home_team
          ? {
              ...m.home_team,
              team_name: teamNameMap.get(m.home_team_id!) || m.home_team.team_name,
            }
          : null,
        away_team: m.away_team
          ? {
              ...m.away_team,
              team_name: teamNameMap.get(m.away_team_id!) || m.away_team.team_name,
            }
          : null,
      };
    });

    if (isPaginated) {
      const hasNextPage = pageNum * limitNum < totalCount;
      const nextPage = hasNextPage ? pageNum + 1 : null;

      const tournamentStatsObject = {
        group_stage: 0,
        championship: 0,
        relegation: 0,
      };

      (
        tournamentStats as {
          tournament_stage: string | null;
          _count: number;
        }[]
      ).forEach((stat) => {
        const stage = stat.tournament_stage as 'group_stage' | 'championship' | 'relegation' | null;
        if (stage && stage in tournamentStatsObject) {
          tournamentStatsObject[stage] = stat._count;
        }
      });

      return {
        items: updatedMatches,
        totalCount,
        currentPage: pageNum,
        hasNextPage,
        nextPage,
        tournamentStats: tournamentStatsObject,
        totalMatchesCount,
      };
    }

    return updatedMatches;
  }
}
