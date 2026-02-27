import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// GET /api/matches/[match_id]/ratings - DB에 저장된 평점 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    if (!/^\d+$/.test(params.match_id)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }
    const matchId = Number(params.match_id);

    const cachedRatings = await prisma.playerMatchRating.findMany({
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
          select: {
            team_id: true,
            team_name: true,
          },
        },
      },
      orderBy: { rating: 'desc' },
    });

    if (cachedRatings.length === 0) {
      return NextResponse.json({ match_id: matchId, ratings: [] });
    }

    // 포지션, 골, 어시스트, 카드 정보는 player_match_stats에서 조회
    const basicStats = await prisma.playerMatchStats.findMany({
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
      basicStats
        .filter((bs) => bs.player_id != null)
        .map((bs) => [bs.player_id!, bs])
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

    return NextResponse.json({ match_id: matchId, ratings });
  } catch (error) {
    console.error('Failed to fetch match ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match ratings' },
      { status: 500 }
    );
  }
}
