import { NextRequest, NextResponse } from 'next/server';

import {
  calcAvgRating,
  calcGoalkeeperStats,
  getMainPosition,
  STARTER_MINUTES_THRESHOLD,
} from '@/lib/player-stats-utils';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerIdParam = searchParams.get('player_id');

    if (!playerIdParam) {
      return NextResponse.json(
        { error: 'player_id is required' },
        { status: 400 }
      );
    }

    const playerId = parseInt(playerIdParam, 10);
    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player_id' }, { status: 400 });
    }

    // 최신 시즌 조회
    const latestSeason = await prisma.season.findFirst({
      orderBy: { season_id: 'desc' },
      select: { season_id: true, season_name: true },
    });

    if (!latestSeason) {
      return NextResponse.json({ data: null });
    }

    // 시즌 스탯, 경기별 스탯, 평점, xT 평점, PK 선방을 병렬 조회
    const [seasonStats, matchStats, ratings, xtRatings, pkDetails] =
      await Promise.all([
        prisma.playerSeasonStats.findFirst({
          where: {
            player_id: playerId,
            season_id: latestSeason.season_id,
          },
          select: {
            matches_played: true,
            goals: true,
            assists: true,
            yellow_cards: true,
            red_cards: true,
            saves: true,
            team: {
              select: { team_id: true, team_name: true, logo: true },
            },
          },
        }),
        prisma.playerMatchStats.findMany({
          where: {
            player_id: playerId,
            match: { season_id: latestSeason.season_id },
          },
          select: {
            minutes_played: true,
            position: true,
            goals_conceded: true,
          },
        }),
        prisma.playerMatchRating.findMany({
          where: {
            player_id: playerId,
            match: { season_id: latestSeason.season_id },
          },
          select: { rating: true },
        }),
        prisma.playerMatchXtRating.findMany({
          where: {
            player_id: playerId,
            match: { season_id: latestSeason.season_id },
          },
          select: { xt_rating: true },
        }),
        prisma.penaltyShootoutDetail.count({
          where: {
            goalkeeper_id: playerId,
            is_successful: false,
            match: { season_id: latestSeason.season_id },
          },
        }),
      ]);

    if (!seasonStats) {
      return NextResponse.json({ data: null });
    }

    const starters = matchStats.filter(
      (m) => (m.minutes_played ?? 0) >= STARTER_MINUTES_THRESHOLD
    ).length;

    // 포지션 판단 (가장 많이 뛴 포지션)
    const mainPosition = getMainPosition(matchStats);
    const isGoalkeeper = mainPosition === 'GK';

    // 골키퍼 전용 스탯
    const { cleanSheets, goalsConceded } = isGoalkeeper
      ? calcGoalkeeperStats(matchStats)
      : { cleanSheets: 0, goalsConceded: 0 };

    const avgRating = calcAvgRating(ratings.map((r) => r.rating));
    const avgXtRating = calcAvgRating(xtRatings.map((r) => r.xt_rating));

    return NextResponse.json({
      data: {
        season_id: latestSeason.season_id,
        season_name: latestSeason.season_name,
        team: seasonStats.team,
        is_goalkeeper: isGoalkeeper,
        matches: seasonStats.matches_played ?? 0,
        starters,
        goals: seasonStats.goals ?? 0,
        assists: seasonStats.assists ?? 0,
        yellow_cards: seasonStats.yellow_cards ?? 0,
        red_cards: seasonStats.red_cards ?? 0,
        // 골키퍼 전용
        clean_sheets: cleanSheets,
        goals_conceded: goalsConceded,
        pk_saves: pkDetails,
        // 평점
        avg_rating: avgRating,
        avg_xt_rating: avgXtRating,
      },
    });
  } catch (error) {
    console.error('Error fetching current season stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current season stats' },
      { status: 500 }
    );
  }
}
