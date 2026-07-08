import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/stats/player-season/top-attack-points - 공격포인트(골+도움) 순위 조회 (시즌별)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('season_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!seasonId || isNaN(parseInt(seasonId))) {
      return NextResponse.json(
        { error: 'season_id is required' },
        { status: 400 }
      );
    }

    const parsedSeasonId = parseInt(seasonId);

    // 시즌별 팀 이름 조회
    const teamSeasonNames = await prisma.teamSeasonName.findMany({
      where: { season_id: parsedSeasonId },
      select: { team_id: true, team_name: true },
    });
    const teamSeasonNamesMap = new Map<number, string>();
    teamSeasonNames.forEach((tsn) => {
      teamSeasonNamesMap.set(tsn.team_id, tsn.team_name);
    });

    // 골+도움 합산은 DB 정렬이 불가하므로 시즌 전체를 조회 후 정렬
    const stats = await prisma.playerSeasonStats.findMany({
      where: {
        season_id: parsedSeasonId,
      },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            profile_image_url: true,
          },
        },
        team: {
          select: {
            team_id: true,
            team_name: true,
            logo: true,
          },
        },
      },
    });

    const topAttackPoints = stats
      .map((stat) => {
        const seasonTeamName =
          stat.team_id != null
            ? (teamSeasonNamesMap.get(stat.team_id) ?? stat.team?.team_name)
            : stat.team?.team_name;

        return {
          stat_id: stat.stat_id,
          player_id: stat.player?.player_id || null,
          season_id: stat.season_id,
          team_id: stat.team_id,
          matches_played: stat.matches_played,
          goals: stat.goals,
          assists: stat.assists,
          attack_points: (stat.goals ?? 0) + (stat.assists ?? 0),
          yellow_cards: stat.yellow_cards,
          red_cards: stat.red_cards,
          minutes_played: stat.minutes_played,
          saves: stat.saves,
          created_at: stat.created_at,
          updated_at: stat.updated_at,
          player_name: stat.player?.name || null,
          player_image: stat.player?.profile_image_url || null,
          team_name: seasonTeamName || null,
          team_logo: stat.team?.logo || null,
        };
      })
      .filter((row) => row.attack_points > 0)
      .sort(
        (a, b) =>
          b.attack_points - a.attack_points ||
          (b.goals ?? 0) - (a.goals ?? 0) ||
          (a.matches_played ?? 0) - (b.matches_played ?? 0)
      )
      .slice(0, limit);

    return NextResponse.json(topAttackPoints);
  } catch (error) {
    console.error('Error fetching top attack points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top attack points' },
      { status: 500 }
    );
  }
}
