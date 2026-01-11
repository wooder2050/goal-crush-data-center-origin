import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: { player_id: string } }
) {
  try {
    const playerId = Number(context.params.player_id);
    if (!playerId || Number.isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player id' }, { status: 400 });
    }

    const url = new URL(request.url);
    const teamIdParam = url.searchParams.get('team_id');
    const filterTeamId = teamIdParam ? Number(teamIdParam) : undefined;

    // Prefer season totals from player_season_stats
    const seasonStats = await prisma.playerSeasonStats.findMany({
      where: { player_id: playerId },
      select: {
        season_id: true,
        goals: true,
        assists: true,
        matches_played: true,
        season: { select: { season_id: true, season_name: true, year: true } },
        team: { select: { team_id: true, team_name: true, logo: true } },
      },
      orderBy: [{ season_id: 'asc' }],
    });

    // Team history (latest first; end_date null first if current)
    const teamHistoryRows = await prisma.playerTeamHistory.findMany({
      where: { player_id: playerId },
      include: {
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
      orderBy: [{ end_date: 'desc' }, { created_at: 'desc' }],
    });

    // Backfill map from player_match_stats if needed
    const pmsRows = await prisma.playerMatchStats.findMany({
      where: { player_id: playerId },
      select: {
        goals: true,
        assists: true,
        match_id: true,
        team_id: true,
        match: { select: { season_id: true } },
        position: true,
        minutes_played: true,
        goals_conceded: true,
      },
    });

    type SeasonAgg = {
      goals: number;
      assists: number;
      appearances: number;
      goals_conceded: number;
      teamCounts: Map<number, number>;
    };

    const pmsAggBySeason = new Map<number, SeasonAgg>();
    for (let i = 0; i < pmsRows.length; i++) {
      const r = pmsRows[i];
      const seasonId = r.match?.season_id ?? undefined;
      if (!seasonId) continue;
      if (!pmsAggBySeason.has(seasonId)) {
        pmsAggBySeason.set(seasonId, {
          goals: 0,
          assists: 0,
          appearances: 0,
          goals_conceded: 0,
          teamCounts: new Map<number, number>(),
        });
      }
      const agg = pmsAggBySeason.get(seasonId)!;
      agg.goals += (r.goals ?? 0) as number;
      agg.assists += (r.assists ?? 0) as number;

      // Helper function to check if appearance is goalkeeper
      const isGoalkeeperAppearance = (
        position: string | null,
        goals_conceded: number | null
      ): boolean => {
        return (
          position === 'GK' || (position !== 'GK' && (goals_conceded || 0) > 0)
        );
      };

      // Add goals conceded only for goalkeeper appearances
      if (isGoalkeeperAppearance(r.position, r.goals_conceded)) {
        agg.goals_conceded += (r.goals_conceded ?? 0) as number;
      }

      // Count appearance only if minutes_played > 0 (bench only is not an appearance)
      const playedMinutes = (r.minutes_played ?? 0) as number;
      if (playedMinutes > 0) {
        agg.appearances += 1;
      }
      const teamId = r.team_id as number | null;
      if (teamId) {
        // Team count also reflects actual appearances only
        const increment = playedMinutes > 0 ? 1 : 0;
        if (increment > 0) {
          agg.teamCounts.set(
            teamId,
            (agg.teamCounts.get(teamId) ?? 0) + increment
          );
        }
      }
    }

    // Build a map from season_id to DB seasonStat row for easy merge
    const dbSeasonMap = new Map<number, (typeof seasonStats)[number]>();
    for (let i = 0; i < seasonStats.length; i++) {
      const s = seasonStats[i];
      if (s.season_id) dbSeasonMap.set(s.season_id, s);
    }

    // Merge: prefer DB season stat, but if missing season exists in PMS, synthesize
    const seasonIds = new Set<number>();
    dbSeasonMap.forEach((_v, k) => seasonIds.add(k));
    pmsAggBySeason.forEach((_v, k) => seasonIds.add(k));

    // Fetch season meta for all involved season ids
    const seasonIdList = Array.from(seasonIds);
    const seasonsMeta = seasonIdList.length
      ? await prisma.season.findMany({
          where: { season_id: { in: seasonIdList } },
          select: { season_id: true, season_name: true, year: true },
        })
      : [];
    const seasonMetaMap = new Map<number, (typeof seasonsMeta)[number]>();
    for (let i = 0; i < seasonsMeta.length; i++) {
      seasonMetaMap.set(seasonsMeta[i].season_id, seasonsMeta[i]);
    }

    // Penalty goals aggregated by season
    const penaltyGoalsBySeason = new Map<number, number>();
    if (seasonIdList.length > 0) {
      const penaltyRows = await prisma.goal.findMany({
        where: {
          player_id: playerId,
          goal_type: 'penalty',
          match: { season_id: { in: seasonIdList } },
        },
        select: { match: { select: { season_id: true } } },
      });
      for (let i = 0; i < penaltyRows.length; i++) {
        const sid = penaltyRows[i].match?.season_id;
        if (!sid) continue;
        penaltyGoalsBySeason.set(sid, (penaltyGoalsBySeason.get(sid) ?? 0) + 1);
      }
    }

    const seasons = Array.from(seasonIds)
      .sort((a, b) => a - b)
      .map((sid) => {
        const db = dbSeasonMap.get(sid);
        const agg = pmsAggBySeason.get(sid);

        // Choose team by max appearances in PMS if DB not available
        let team_id: number | null = db?.team?.team_id ?? null;
        const team_name: string | null = db?.team?.team_name ?? null;
        const team_logo: string | null = db?.team?.logo ?? null;
        if (!team_id && agg && agg.teamCounts.size > 0) {
          let bestTeamId: number | null = null;
          let bestCount = -1;
          agg.teamCounts.forEach((count, tId) => {
            if (count > bestCount) {
              bestCount = count;
              bestTeamId = tId;
            }
          });
          team_id = bestTeamId;
        }

        return {
          season_id: sid,
          season_name:
            seasonMetaMap.get(sid)?.season_name ??
            db?.season?.season_name ??
            null,
          year: seasonMetaMap.get(sid)?.year ?? db?.season?.year ?? null,
          team_id,
          team_name,
          team_logo,
          goals: (agg?.goals ?? db?.goals ?? 0) as number,
          assists: (agg?.assists ?? db?.assists ?? 0) as number,
          appearances: (agg?.appearances ?? db?.matches_played ?? 0) as number,
          goals_conceded: (agg?.goals_conceded ?? 0) as number,
          penalty_goals: penaltyGoalsBySeason.get(sid) ?? 0,
          positions: [] as string[], // filled below
        };
      });

    // Enrich seasons with team info (names and logos) for those missing but with team_id
    const idsNeedingTeamInfo = Array.from(
      new Set(
        seasons
          .filter((s) => s.team_id && (!s.team_name || !s.team_logo))
          .map((s) => s.team_id as number)
      )
    );
    if (idsNeedingTeamInfo.length > 0) {
      const teams = await prisma.team.findMany({
        where: { team_id: { in: idsNeedingTeamInfo } },
        select: { team_id: true, team_name: true, logo: true },
      });
      const teamMap = new Map<
        number,
        { team_name: string; logo: string | null }
      >();
      teams.forEach((t) =>
        teamMap.set(t.team_id, { team_name: t.team_name, logo: t.logo ?? null })
      );
      for (let i = 0; i < seasons.length; i++) {
        const tid = seasons[i].team_id as number | null;
        if (tid) {
          const teamInfo = teamMap.get(tid);
          if (teamInfo) {
            if (!seasons[i].team_name) {
              seasons[i].team_name = teamInfo.team_name;
            }
            if (!seasons[i].team_logo) {
              seasons[i].team_logo = teamInfo.logo;
            }
          }
        }
      }
    }

    // Primary position from PlayerMatchStats frequency, fallback to player_positions latest
    const matchPositions = pmsRows
      .filter((r) => r.position)
      .map((r) => r.position as string);

    let primaryPosition: string | null = null;
    const positionFrequency = new Map<string, number>();
    if (matchPositions.length > 0) {
      for (let i = 0; i < matchPositions.length; i++) {
        const pos = matchPositions[i];
        positionFrequency.set(pos, (positionFrequency.get(pos) ?? 0) + 1);
      }
      let maxCount = -1;
      positionFrequency.forEach((count, pos) => {
        if (count > maxCount) {
          maxCount = count;
          primaryPosition = pos;
        }
      });
    } else {
      const posPeriods = await prisma.playerPosition.findMany({
        where: { player_id: playerId },
        orderBy: [{ end_date: 'desc' }, { start_date: 'desc' }],
        take: 1,
      });
      primaryPosition = (posPeriods[0]?.position as string) ?? null;
    }

    // Positions by season
    const positionsBySeasonFromPeriods = await prisma.playerPosition.findMany({
      where: { player_id: playerId },
      select: { season_id: true, position: true },
    });
    const positionsBySeasonMap = new Map<number, Set<string>>();
    for (let i = 0; i < positionsBySeasonFromPeriods.length; i++) {
      const p = positionsBySeasonFromPeriods[i];
      if (!p.season_id) continue;
      if (!positionsBySeasonMap.has(p.season_id))
        positionsBySeasonMap.set(p.season_id, new Set());
      positionsBySeasonMap.get(p.season_id)!.add(p.position as string);
    }
    if (positionsBySeasonMap.size === 0 && pmsRows.length > 0) {
      for (let i = 0; i < pmsRows.length; i++) {
        const row = pmsRows[i];
        const sid = row.match?.season_id ?? undefined;
        const pos = row.position ?? undefined;
        if (!sid || !pos) continue;
        if (!positionsBySeasonMap.has(sid))
          positionsBySeasonMap.set(sid, new Set());
        positionsBySeasonMap.get(sid)!.add(pos);
      }
    }

    for (let i = 0; i < seasons.length; i++) {
      const sid = seasons[i].season_id;
      if (sid && positionsBySeasonMap.has(sid)) {
        seasons[i].positions = Array.from(positionsBySeasonMap.get(sid)!);
      }
    }

    // Totals derived from final seasons list
    const totals = seasons.reduce(
      (acc, s) => {
        acc.goals += s.goals ?? 0;
        acc.assists += s.assists ?? 0;
        acc.appearances += s.appearances ?? 0;
        acc.goals_conceded += s.goals_conceded ?? 0;
        return acc;
      },
      { goals: 0, assists: 0, appearances: 0, goals_conceded: 0 }
    );

    // Per-team totals from PMS
    const perTeamMap = new Map<
      number,
      {
        goals: number;
        assists: number;
        appearances: number;
        goals_conceded: number;
      }
    >();
    for (let i = 0; i < pmsRows.length; i++) {
      const r = pmsRows[i];
      const tid = r.team_id as number | null;
      if (!tid) continue;
      if (!perTeamMap.has(tid))
        perTeamMap.set(tid, {
          goals: 0,
          assists: 0,
          appearances: 0,
          goals_conceded: 0,
        });
      const bucket = perTeamMap.get(tid)!;
      bucket.goals += r.goals ?? 0;
      bucket.assists += r.assists ?? 0;

      // Helper function to check if appearance is goalkeeper
      const isGoalkeeperAppearance = (
        position: string | null,
        goals_conceded: number | null
      ): boolean => {
        return (
          position === 'GK' || (position !== 'GK' && (goals_conceded || 0) > 0)
        );
      };

      // Add goals conceded only for goalkeeper appearances
      if (isGoalkeeperAppearance(r.position, r.goals_conceded)) {
        bucket.goals_conceded += r.goals_conceded ?? 0;
      }

      // Only count appearances when minutes_played > 0
      const playedMinutes = (r.minutes_played ?? 0) as number;
      if (playedMinutes > 0) {
        bucket.appearances += 1;
      }
    }
    const teamIds = Array.from(perTeamMap.keys());
    const teamsMeta = teamIds.length
      ? await prisma.team.findMany({
          where: { team_id: { in: teamIds } },
          select: { team_id: true, team_name: true },
        })
      : [];
    const teamNameMap = new Map<number, string>();
    for (let i = 0; i < teamsMeta.length; i++)
      teamNameMap.set(teamsMeta[i].team_id, teamsMeta[i].team_name);
    const per_team_totals = teamIds.map((tid) => ({
      team_id: tid,
      team_name: teamNameMap.get(tid) ?? null,
      goals: perTeamMap.get(tid)!.goals,
      assists: perTeamMap.get(tid)!.assists,
      appearances: perTeamMap.get(tid)!.appearances,
      goals_conceded: perTeamMap.get(tid)!.goals_conceded,
    }));

    // Totals for selected team (if requested)
    let totals_for_team:
      | {
          goals: number;
          assists: number;
          appearances: number;
          goals_conceded: number;
        }
      | undefined = undefined;
    if (filterTeamId) {
      const b = perTeamMap.get(filterTeamId);
      totals_for_team = {
        goals: b?.goals ?? 0,
        assists: b?.assists ?? 0,
        appearances: b?.appearances ?? 0,
        goals_conceded: b?.goals_conceded ?? 0,
      };
    }

    // Positions frequency list (descending)
    const positions_frequency = Array.from(positionFrequency.entries())
      .map(([position, matches]) => ({ position, matches }))
      .sort((a, b) => b.matches - a.matches);

    // Map team history for response
    type THRow = (typeof teamHistoryRows)[number];
    const team_history = teamHistoryRows.map((r: THRow) => ({
      team_id: r.team?.team_id ?? null,
      team_name: r.team?.team_name ?? null,
      logo: r.team?.logo ?? null,
      primary_color: r.team?.primary_color ?? null,
      secondary_color: r.team?.secondary_color ?? null,
      start_date: r.start_date,
      end_date: r.end_date,
      is_active: r.is_active,
    }));

    // Goal matches (matches where the player scored)
    const goalPmsRows = pmsRows.filter((r) => (r.goals ?? 0) > 0);
    let goal_matches: Array<{
      match_id: number;
      match_date: string | null;
      season_id: number | null;
      season_name: string | null;
      team_id: number | null;
      team_name: string | null;
      team_logo: string | null;
      opponent_id: number | null;
      opponent_name: string | null;
      opponent_logo: string | null;
      player_goals: number;
      penalty_goals: number;
      home_score: number | null;
      away_score: number | null;
      is_home: boolean;
      tournament_stage: string | null;
    }> = [];
    if (goalPmsRows.length > 0) {
      const matchIds = Array.from(
        new Set(goalPmsRows.map((g) => g.match_id!).filter(Boolean))
      ) as number[];
      const matches = await prisma.match.findMany({
        where: { match_id: { in: matchIds } },
        select: {
          match_id: true,
          match_date: true,
          season: { select: { season_id: true, season_name: true } },
          home_team_id: true,
          away_team_id: true,
          home_team: { select: { team_id: true, team_name: true, logo: true } },
          away_team: { select: { team_id: true, team_name: true, logo: true } },
          home_score: true,
          away_score: true,
          tournament_stage: true,
        },
      });
      // penalty goals per match for this player
      const goalsRows = await prisma.goal.findMany({
        where: { player_id: playerId, match_id: { in: matchIds } },
        select: { match_id: true, goal_type: true },
      });
      const penaltyCountByMatch = new Map<number, number>();
      for (let i = 0; i < goalsRows.length; i++) {
        const gr = goalsRows[i];
        const isPenalty = (gr.goal_type ?? '').toLowerCase() === 'penalty';
        if (!isPenalty) continue;
        const mid = gr.match_id;
        penaltyCountByMatch.set(mid, (penaltyCountByMatch.get(mid) ?? 0) + 1);
      }
      const matchMap = new Map<number, (typeof matches)[number]>();
      matches.forEach((m) => matchMap.set(m.match_id, m));
      goal_matches = goalPmsRows
        .map((g) => {
          const m = matchMap.get(g.match_id!);
          if (!m) return null;
          const playerTeamId = (g.team_id as number | null) ?? null;
          const isHome =
            playerTeamId != null && playerTeamId === m.home_team_id;
          const teamMeta = isHome ? m.home_team : m.away_team;
          const opponentMeta = isHome ? m.away_team : m.home_team;
          return {
            match_id: m.match_id,
            match_date: m.match_date?.toISOString() ?? null,
            season_id: m.season?.season_id ?? null,
            season_name: m.season?.season_name ?? null,
            team_id: teamMeta?.team_id ?? null,
            team_name: teamMeta?.team_name ?? null,
            team_logo: teamMeta?.logo ?? null,
            opponent_id: opponentMeta?.team_id ?? null,
            opponent_name: opponentMeta?.team_name ?? null,
            opponent_logo: opponentMeta?.logo ?? null,
            player_goals: g.goals ?? 0,
            penalty_goals: penaltyCountByMatch.get(m.match_id) ?? 0,
            home_score: m.home_score ?? null,
            away_score: m.away_score ?? null,
            is_home: isHome,
            tournament_stage: m.tournament_stage ?? null,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null)
        .sort((a, b) => (b.match_date ?? '').localeCompare(a.match_date ?? ''));
    }

    return NextResponse.json({
      player_id: playerId,
      seasons,
      totals,
      totals_for_team,
      per_team_totals,
      primary_position: primaryPosition,
      positions_frequency,
      team_history,
      goal_matches,
    });
  } catch (error) {
    console.error('Error fetching player summary:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch player summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
