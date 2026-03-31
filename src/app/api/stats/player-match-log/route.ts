import { NextRequest, NextResponse } from 'next/server';

import { determineMatchResult } from '@/lib/player-stats-utils';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerIdParam = searchParams.get('player_id');
    const limitParam = searchParams.get('limit');
    const cursorParam = searchParams.get('cursor'); // "ISO날짜|match_id" 형태

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

    const parsedLimit = limitParam ? parseInt(limitParam, 10) : NaN;
    const limit = isNaN(parsedLimit)
      ? 10
      : Math.min(50, Math.max(1, parsedLimit));

    // 커서 조건 구성
    let cursorWhere = {};
    if (cursorParam) {
      const [dateStr, idStr] = cursorParam.split('|');
      const cursorDate = new Date(dateStr);
      const cursorId = parseInt(idStr, 10);
      if (isNaN(cursorId) || isNaN(cursorDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid cursor format' },
          { status: 400 }
        );
      }
      // match_date DESC, match_id DESC 기준 커서
      cursorWhere = {
        OR: [
          { match: { match_date: { lt: cursorDate } } },
          {
            match: { match_date: cursorDate },
            match_id: { lt: cursorId },
          },
        ],
      };
    }

    const baseWhere = {
      player_id: playerId,
      minutes_played: { gt: 0 },
      ...cursorWhere,
    };

    // 총 경기 수 + 경기 로그를 병렬 조회
    const [totalCount, matchStats] = await Promise.all([
      prisma.playerMatchStats.count({
        where: { player_id: playerId, minutes_played: { gt: 0 } },
      }),
      prisma.playerMatchStats.findMany({
        where: baseWhere,
        select: {
          match_id: true,
          team_id: true,
          goals: true,
          assists: true,
          minutes_played: true,
          position: true,
          card_type: true,
          match: {
            select: {
              match_date: true,
              home_team_id: true,
              away_team_id: true,
              home_score: true,
              away_score: true,
              penalty_home_score: true,
              penalty_away_score: true,
              season: { select: { season_name: true } },
              home_team: {
                select: { team_id: true, team_name: true, logo: true },
              },
              away_team: {
                select: { team_id: true, team_name: true, logo: true },
              },
            },
          },
        },
        orderBy: [{ match: { match_date: 'desc' } }, { match_id: 'desc' }],
        take: limit + 1, // +1로 다음 페이지 존재 여부 확인
      }),
    ]);

    const hasNext = matchStats.length > limit;
    const pageItems = hasNext ? matchStats.slice(0, limit) : matchStats;

    // 평점 조회 (해당 경기들)
    const matchIds = pageItems
      .map((m) => m.match_id)
      .filter((id): id is number => id != null);
    const [ratings, xtRatings] = await Promise.all([
      prisma.playerMatchRating.findMany({
        where: { player_id: playerId, match_id: { in: matchIds } },
        select: { match_id: true, rating: true },
      }),
      prisma.playerMatchXtRating.findMany({
        where: { player_id: playerId, match_id: { in: matchIds } },
        select: { match_id: true, xt_rating: true },
      }),
    ]);

    const ratingMap = new Map<number, number>();
    for (const r of ratings) {
      if (r.rating != null) ratingMap.set(r.match_id, r.rating);
    }
    const xtRatingMap = new Map<number, number>();
    for (const r of xtRatings) {
      if (r.xt_rating != null) xtRatingMap.set(r.match_id, r.xt_rating);
    }

    const items = pageItems.map((ms) => {
      const m = ms.match!;
      const isHome = ms.team_id === m.home_team_id;
      const opponent = isHome ? m.away_team : m.home_team;

      const result = determineMatchResult({
        isHome,
        homeScore: m.home_score,
        awayScore: m.away_score,
        penaltyHomeScore: m.penalty_home_score,
        penaltyAwayScore: m.penalty_away_score,
      });

      return {
        match_id: ms.match_id,
        date: m.match_date,
        season: m.season?.season_name ?? null,
        opponent_name: opponent?.team_name ?? '-',
        opponent_logo: opponent?.logo ?? null,
        result,
        home_score: m.home_score,
        away_score: m.away_score,
        penalty_home_score: m.penalty_home_score,
        penalty_away_score: m.penalty_away_score,
        goals: ms.goals ?? 0,
        assists: ms.assists ?? 0,
        yellow_card: ms.card_type === 'yellow' ? 1 : 0,
        red_card: ms.card_type === 'red' ? 1 : 0,
        rating:
          ms.match_id != null && ratingMap.has(ms.match_id)
            ? ratingMap.get(ms.match_id)!
            : null,
        xt_rating:
          ms.match_id != null && xtRatingMap.has(ms.match_id)
            ? xtRatingMap.get(ms.match_id)!
            : null,
      };
    });

    // 다음 페이지 커서
    const lastItem = pageItems[pageItems.length - 1];
    const nextCursor =
      hasNext && lastItem?.match?.match_date && lastItem.match_id
        ? `${new Date(lastItem.match.match_date).toISOString()}|${lastItem.match_id}`
        : null;

    return NextResponse.json({
      items,
      limit,
      total: totalCount,
      nextCursor,
      hasNext,
    });
  } catch (error) {
    console.error('Error fetching player match log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match log' },
      { status: 500 }
    );
  }
}
