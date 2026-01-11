import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerIdParam = searchParams.get('player_id');
    const seasonParam = searchParams.get('season_id');

    // Validate player_id
    if (!playerIdParam) {
      return NextResponse.json(
        { error: 'player_id parameter is required' },
        { status: 400 }
      );
    }

    const playerId = parseInt(playerIdParam, 10);
    if (isNaN(playerId)) {
      return NextResponse.json(
        { error: 'Invalid player_id parameter' },
        { status: 400 }
      );
    }

    // Check if player exists
    const player = await prisma.player.findUnique({
      where: { player_id: playerId },
      select: {
        player_id: true,
        name: true,
        profile_image_url: true,
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Build where clause for season filter
    let seasonWhere = {};
    if (seasonParam && seasonParam !== 'all') {
      const seasonId = parseInt(seasonParam, 10);
      if (!isNaN(seasonId)) {
        seasonWhere = {
          match: {
            season_id: seasonId,
          },
        };
      }
    }

    // Get player's match stats against different opponent teams
    const playerMatchStats = await prisma.playerMatchStats.findMany({
      where: {
        player_id: playerId,
        minutes_played: { gt: 0 }, // Only count actual appearances
        ...seasonWhere,
      },
      select: {
        match_id: true,
        team_id: true,
        goals: true,
        assists: true,
        minutes_played: true,
        match: {
          select: {
            home_team_id: true,
            away_team_id: true,
            season_id: true,
          },
        },
      },
    });

    // Group stats by opponent team
    const opponentStatsMap = new Map<
      number,
      {
        matches_played: number;
        goals: number;
        assists: number;
        attack_points: number;
      }
    >();

    for (const stat of playerMatchStats) {
      const playerTeamId = stat.team_id;
      const match = stat.match;
      if (!match) continue;

      // Determine opponent team ID
      let opponentTeamId: number;
      if (match.home_team_id === playerTeamId && match.away_team_id !== null) {
        opponentTeamId = match.away_team_id;
      } else if (
        match.away_team_id === playerTeamId &&
        match.home_team_id !== null
      ) {
        opponentTeamId = match.home_team_id;
      } else {
        continue; // Skip if team ID doesn't match home or away or opponent team ID is null
      }

      if (!opponentStatsMap.has(opponentTeamId)) {
        opponentStatsMap.set(opponentTeamId, {
          matches_played: 0,
          goals: 0,
          assists: 0,
          attack_points: 0,
        });
      }

      const opponentStats = opponentStatsMap.get(opponentTeamId)!;
      opponentStats.matches_played += 1;
      opponentStats.goals += stat.goals || 0;
      opponentStats.assists += stat.assists || 0;
      opponentStats.attack_points += (stat.goals || 0) + (stat.assists || 0);
    }

    // Get opponent team details
    const opponentTeamIds = Array.from(opponentStatsMap.keys());
    const opponentTeams = await prisma.team.findMany({
      where: { team_id: { in: opponentTeamIds } },
      select: {
        team_id: true,
        team_name: true,
        logo: true,
      },
    });

    const opponentTeamMap = new Map(
      opponentTeams.map((team) => [team.team_id, team])
    );

    // Build response data
    const teamRecords = Array.from(opponentStatsMap.entries())
      .map(([opponentTeamId, stats]) => {
        const team = opponentTeamMap.get(opponentTeamId);
        if (!team) return null;

        return {
          opponent_team_id: opponentTeamId,
          opponent_team_name: team.team_name,
          opponent_team_logo: team.logo,
          matches_played: stats.matches_played,
          goals: stats.goals,
          assists: stats.assists,
          attack_points: stats.attack_points,
          goals_per_match:
            stats.matches_played > 0
              ? (stats.goals / stats.matches_played).toFixed(2)
              : '0.00',
          assists_per_match:
            stats.matches_played > 0
              ? (stats.assists / stats.matches_played).toFixed(2)
              : '0.00',
          attack_points_per_match:
            stats.matches_played > 0
              ? (stats.attack_points / stats.matches_played).toFixed(2)
              : '0.00',
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.attack_points - a!.attack_points); // Sort by attack points descending

    const response = {
      player_id: player.player_id,
      player_name: player.name,
      player_image: player.profile_image_url,
      team_records: teamRecords,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching player vs team stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player vs team stats' },
      { status: 500 }
    );
  }
}
