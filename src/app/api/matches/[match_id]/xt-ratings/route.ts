import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// GET /api/matches/[match_id]/xt-ratings - 공개 xT 평점 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    if (!/^\d+$/.test(params.match_id)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }
    const matchId = Number(params.match_id);

    const ratings = await prisma.playerMatchXtRating.findMany({
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
        team: {
          select: { team_id: true, team_name: true },
        },
      },
      orderBy: { xt_rating: 'desc' },
    });

    if (ratings.length === 0) {
      return NextResponse.json({ match_id: matchId, ratings: [] });
    }

    // 포지션 정보 추가
    const basicStats = await prisma.playerMatchStats.findMany({
      where: { match_id: matchId },
      select: { player_id: true, position: true },
    });
    const posMap = new Map(
      basicStats
        .filter((bs) => bs.player_id != null)
        .map((bs) => [bs.player_id!, bs.position])
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

    return NextResponse.json({ match_id: matchId, ratings: enriched });
  } catch (error) {
    console.error('Failed to fetch xT ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch xT ratings' },
      { status: 500 }
    );
  }
}
