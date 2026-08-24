import { NextRequest, NextResponse } from 'next/server';

import { GATED_NO_STORE_HEADERS, getMemberAuthStatus } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/matches/[match_id]/ratings - DB에 저장된 평점 조회
// 평점 원본은 로그인 회원 전용.
// 비로그인: ratings는 빈 배열, 대신 팀별 베스트 선수 이름(featured_players)과
// has_extended_data만 공개 (요약 탭 주목 선수·잠금 UI용)
// 잘못된 Bearer: 401
export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    if (!/^\d+$/.test(params.match_id)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }
    const matchId = Number(params.match_id);

    const auth = await getMemberAuthStatus();
    if (auth === 'invalid') {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401, headers: GATED_NO_STORE_HEADERS }
      );
    }

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
      return NextResponse.json(
        { match_id: matchId, ratings: [], has_extended_data: false },
        { headers: GATED_NO_STORE_HEADERS }
      );
    }

    if (auth === 'anonymous') {
      // 팀별 최고 평점 선수 1명 (이름만 공개, 평점 숫자는 비공개)
      const featuredByTeam = new Map<
        number,
        {
          player_id: number;
          name: string;
          team_id: number;
          profile_image_url: string | null;
        }
      >();
      for (const cr of cachedRatings) {
        // cachedRatings는 rating desc 정렬 — 팀별 첫 등장이 최고 평점
        if (!featuredByTeam.has(cr.team_id)) {
          featuredByTeam.set(cr.team_id, {
            player_id: cr.player_id,
            name: cr.player.name,
            team_id: cr.team_id,
            profile_image_url: cr.player.profile_image_url,
          });
        }
      }
      return NextResponse.json(
        {
          match_id: matchId,
          ratings: [],
          has_extended_data: true,
          featured_players: Array.from(featuredByTeam.values()),
        },
        { headers: GATED_NO_STORE_HEADERS }
      );
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

    return NextResponse.json(
      { match_id: matchId, ratings, has_extended_data: true },
      { headers: GATED_NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error('Failed to fetch match ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match ratings' },
      { status: 500 }
    );
  }
}
