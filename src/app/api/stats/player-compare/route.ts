import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const player1Param = searchParams.get('player1_id');
    const player2Param = searchParams.get('player2_id');
    const seasonParam = searchParams.get('season_id');

    if (!player1Param || !player2Param) {
      return NextResponse.json(
        { error: 'player1_id and player2_id parameters are required' },
        { status: 400 }
      );
    }

    const player1Id = parseInt(player1Param, 10);
    const player2Id = parseInt(player2Param, 10);

    if (isNaN(player1Id) || isNaN(player2Id)) {
      return NextResponse.json(
        { error: 'Invalid player ID parameters' },
        { status: 400 }
      );
    }

    // Fetch both players' basic info with latest team
    const [player1, player2] = await Promise.all([
      prisma.player.findUnique({
        where: { player_id: player1Id },
        select: {
          player_id: true,
          name: true,
          profile_image_url: true,
          jersey_number: true,
          birth_date: true,
          height_cm: true,
          playerPosition: {
            select: { position: true },
            orderBy: { start_date: 'desc' },
            take: 1,
          },
          player_team_history: {
            select: {
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
            orderBy: { start_date: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.player.findUnique({
        where: { player_id: player2Id },
        select: {
          player_id: true,
          name: true,
          profile_image_url: true,
          jersey_number: true,
          birth_date: true,
          height_cm: true,
          playerPosition: {
            select: { position: true },
            orderBy: { start_date: 'desc' },
            take: 1,
          },
          player_team_history: {
            select: {
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
            orderBy: { start_date: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    if (!player1 || !player2) {
      return NextResponse.json(
        { error: 'One or both players not found' },
        { status: 404 }
      );
    }

    // Build season filters
    const seasonFilter =
      seasonParam && seasonParam !== 'all'
        ? { season_id: parseInt(seasonParam, 10) }
        : {};
    const matchFilter =
      seasonParam && seasonParam !== 'all'
        ? { match: { season_id: parseInt(seasonParam, 10) } }
        : {};

    // Fetch all independent data in parallel (stats, match stats, goals)
    const [stats1, stats2, p1MatchStats, p2MatchStats, goals1, goals2] =
      await Promise.all([
        prisma.playerSeasonStats.findMany({
          where: { player_id: player1Id, ...seasonFilter },
          select: {
            matches_played: true,
            goals: true,
            assists: true,
            yellow_cards: true,
            red_cards: true,
            saves: true,
            season: { select: { season_id: true, season_name: true } },
          },
        }),
        prisma.playerSeasonStats.findMany({
          where: { player_id: player2Id, ...seasonFilter },
          select: {
            matches_played: true,
            goals: true,
            assists: true,
            yellow_cards: true,
            red_cards: true,
            saves: true,
            season: { select: { season_id: true, season_name: true } },
          },
        }),
        prisma.playerMatchStats.findMany({
          where: {
            player_id: player1Id,
            minutes_played: { gt: 0 },
            ...matchFilter,
          },
          select: {
            match_id: true,
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
        }),
        prisma.playerMatchStats.findMany({
          where: {
            player_id: player2Id,
            minutes_played: { gt: 0 },
            ...matchFilter,
          },
          select: {
            match_id: true,
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
        }),
        prisma.goal.findMany({
          where: {
            player_id: player1Id,
            goal_time: { not: null },
            ...(seasonParam && seasonParam !== 'all'
              ? { match: { season_id: parseInt(seasonParam, 10) } }
              : {}),
          },
          select: { goal_time: true },
        }),
        prisma.goal.findMany({
          where: {
            player_id: player2Id,
            goal_time: { not: null },
            ...(seasonParam && seasonParam !== 'all'
              ? { match: { season_id: parseInt(seasonParam, 10) } }
              : {}),
          },
          select: { goal_time: true },
        }),
      ]);

    // Aggregate stats
    const aggregate = (
      stats: typeof stats1
    ): {
      matches: number;
      goals: number;
      assists: number;
      attack_points: number;
      yellow_cards: number;
      red_cards: number;
      saves: number;
      seasons_played: number;
    } => {
      const totals = stats.reduce(
        (acc, s) => ({
          matches: acc.matches + (s.matches_played || 0),
          goals: acc.goals + (s.goals || 0),
          assists: acc.assists + (s.assists || 0),
          yellow_cards: acc.yellow_cards + (s.yellow_cards || 0),
          red_cards: acc.red_cards + (s.red_cards || 0),
          saves: acc.saves + (s.saves || 0),
        }),
        {
          matches: 0,
          goals: 0,
          assists: 0,
          yellow_cards: 0,
          red_cards: 0,
          saves: 0,
        }
      );

      return {
        ...totals,
        attack_points: totals.goals + totals.assists,
        seasons_played: stats.length,
      };
    };

    const formatPlayer = (
      player: typeof player1,
      stats: ReturnType<typeof aggregate>
    ) => ({
      player_id: player!.player_id,
      name: player!.name,
      profile_image_url: player!.profile_image_url,
      jersey_number: player!.jersey_number,
      birth_date: player!.birth_date,
      height_cm: player!.height_cm,
      position: player!.playerPosition[0]?.position || null,
      team: player!.player_team_history[0]?.team || null,
      stats,
    });

    const aggregated1 = aggregate(stats1);
    const aggregated2 = aggregate(stats2);

    // ===== Head-to-head: matches where both players appeared =====
    const p2MatchMap = new Map(p2MatchStats.map((s) => [s.match_id, s]));

    // 같은 경기에 출전 + 다른 팀 소속인 경기만 맞대결로 카운트
    const rivalMatches = p1MatchStats.filter((p1s) => {
      const p2s = p2MatchMap.get(p1s.match_id);
      return p2s && p1s.team_id !== p2s.team_id;
    });

    let p1Wins = 0;
    let p2Wins = 0;

    for (const p1Stat of rivalMatches) {
      const m = p1Stat.match;
      if (!m || m.home_score === null || m.away_score === null) continue;
      const p1TeamId = p1Stat.team_id;
      const isP1Home = p1TeamId === m.home_team_id;
      let p1Score = isP1Home ? m.home_score : m.away_score;
      let p2Score = isP1Home ? m.away_score : m.home_score;

      // 동점이면 승부차기 결과 적용
      if (
        p1Score === p2Score &&
        m.penalty_home_score !== null &&
        m.penalty_away_score !== null
      ) {
        p1Score = isP1Home ? m.penalty_home_score : m.penalty_away_score;
        p2Score = isP1Home ? m.penalty_away_score : m.penalty_home_score;
      }

      if (p1Score > p2Score) p1Wins++;
      else if (p2Score > p1Score) p2Wins++;
    }

    const headToHead = {
      total_matches: rivalMatches.length,
      player1_wins: p1Wins,
      player2_wins: p2Wins,
    };

    // ===== Goal timing distribution =====
    const calcGoalTiming = (goals: { goal_time: number | null }[]) => {
      let firstHalf = 0;
      let secondHalf = 0;
      for (const g of goals) {
        if (g.goal_time === null) continue;
        if (g.goal_time <= 13) firstHalf++;
        else secondHalf++;
      }
      return {
        first_half: firstHalf,
        second_half: secondHalf,
        total: firstHalf + secondHalf,
      };
    };

    const goalTiming = {
      player1: calcGoalTiming(goals1),
      player2: calcGoalTiming(goals2),
    };

    // ===== Season-by-season breakdown =====
    const allSeasonIds = new Set<number>();
    const seasonNameMap = new Map<number, string>();

    for (const s of [...stats1, ...stats2]) {
      if (s.season?.season_id) {
        allSeasonIds.add(s.season.season_id);
        seasonNameMap.set(s.season.season_id, s.season.season_name);
      }
    }

    const p1SeasonMap = new Map(
      stats1.map((s) => [
        s.season?.season_id,
        {
          goals: s.goals || 0,
          assists: s.assists || 0,
          matches: s.matches_played || 0,
        },
      ])
    );
    const p2SeasonMap = new Map(
      stats2.map((s) => [
        s.season?.season_id,
        {
          goals: s.goals || 0,
          assists: s.assists || 0,
          matches: s.matches_played || 0,
        },
      ])
    );

    const seasonBreakdown = Array.from(allSeasonIds)
      .sort((a, b) => a - b)
      .map((sid) => ({
        season_id: sid,
        season_name: seasonNameMap.get(sid) || '',
        player1: p1SeasonMap.get(sid) || { goals: 0, assists: 0, matches: 0 },
        player2: p2SeasonMap.get(sid) || { goals: 0, assists: 0, matches: 0 },
      }));

    return NextResponse.json({
      player1: formatPlayer(player1, aggregated1),
      player2: formatPlayer(player2, aggregated2),
      head_to_head: headToHead,
      goal_timing: goalTiming,
      season_breakdown: seasonBreakdown,
    });
  } catch (error) {
    console.error('Error fetching player comparison:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player comparison' },
      { status: 500 }
    );
  }
}
