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
    const seasonIdParam = searchParams.get('season_id');

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

    // 선수가 참가한 모든 시즌 목록
    const playerSeasons = await prisma.playerSeasonStats.findMany({
      where: { player_id: playerId },
      select: {
        season_id: true,
        team: { select: { team_id: true, team_name: true, logo: true } },
        season: {
          select: { season_id: true, season_name: true, year: true },
        },
      },
      orderBy: { season: { season_id: 'desc' } },
    });

    if (playerSeasons.length === 0) {
      return NextResponse.json({ seasons: [], data: null });
    }

    // 시즌별 팀 이름 조회
    const seasonIds = playerSeasons
      .map((ps) => ps.season_id)
      .filter((id): id is number => id != null);
    const teamIds = playerSeasons
      .map((ps) => ps.team?.team_id)
      .filter((id): id is number => id != null);

    const teamSeasonNames = await prisma.teamSeasonName.findMany({
      where: {
        season_id: { in: seasonIds },
        team_id: { in: teamIds },
      },
      select: { team_id: true, season_id: true, team_name: true },
    });

    const teamSeasonNameMap = new Map<string, string>();
    teamSeasonNames.forEach((tsn) => {
      teamSeasonNameMap.set(`${tsn.season_id}-${tsn.team_id}`, tsn.team_name);
    });

    const seasonList = playerSeasons.map((ps) => {
      const teamName =
        teamSeasonNameMap.get(`${ps.season_id}-${ps.team?.team_id}`) ??
        ps.team?.team_name ??
        '-';
      return {
        season_id: ps.season?.season_id ?? 0,
        season_name: ps.season?.season_name ?? '-',
        team_id: ps.team?.team_id ?? 0,
        team_name: teamName,
        team_logo: ps.team?.logo ?? null,
      };
    });

    // 선택된 시즌 (기본: 최신)
    const targetSeasonId = seasonIdParam
      ? parseInt(seasonIdParam, 10)
      : seasonList[0].season_id;

    if (isNaN(targetSeasonId)) {
      return NextResponse.json({ error: 'Invalid season_id' }, { status: 400 });
    }

    // 시즌 통계, 경기별 스탯, 평점, PK 선방을 병렬 조회
    const [seasonStats, matchStats, ratings, xtRatings, pkDetails] =
      await Promise.all([
        prisma.playerSeasonStats.findFirst({
          where: { player_id: playerId, season_id: targetSeasonId },
          select: {
            matches_played: true,
            goals: true,
            assists: true,
            yellow_cards: true,
            red_cards: true,
            saves: true,
            team: { select: { team_id: true, team_name: true, logo: true } },
          },
        }),
        prisma.playerMatchStats.findMany({
          where: {
            player_id: playerId,
            match: { season_id: targetSeasonId },
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
            match: { season_id: targetSeasonId },
          },
          select: { rating: true },
        }),
        prisma.playerMatchXtRating.findMany({
          where: {
            player_id: playerId,
            match: { season_id: targetSeasonId },
          },
          select: { xt_rating: true },
        }),
        prisma.penaltyShootoutDetail.count({
          where: {
            goalkeeper_id: playerId,
            is_successful: false,
            match: { season_id: targetSeasonId },
          },
        }),
      ]);

    if (!seasonStats) {
      return NextResponse.json({ seasons: seasonList, data: null });
    }

    const starters = matchStats.filter(
      (m) => (m.minutes_played ?? 0) >= STARTER_MINUTES_THRESHOLD
    ).length;

    // 포지션 판단
    const mainPosition = getMainPosition(matchStats);
    const isGoalkeeper = mainPosition === 'GK';

    // 골키퍼 전용 스탯
    const { cleanSheets, goalsConceded } = isGoalkeeper
      ? calcGoalkeeperStats(matchStats)
      : { cleanSheets: 0, goalsConceded: 0 };

    const avgRating = calcAvgRating(ratings.map((r) => r.rating));
    const avgXtRating = calcAvgRating(xtRatings.map((r) => r.xt_rating));

    // 시즌별 팀 이름 적용
    const teamName =
      teamSeasonNameMap.get(`${targetSeasonId}-${seasonStats.team?.team_id}`) ??
      seasonStats.team?.team_name;

    return NextResponse.json({
      seasons: seasonList,
      data: {
        season_id: targetSeasonId,
        team: seasonStats.team
          ? { ...seasonStats.team, team_name: teamName }
          : null,
        is_goalkeeper: isGoalkeeper,
        matches: seasonStats.matches_played ?? 0,
        starters,
        goals: seasonStats.goals ?? 0,
        assists: seasonStats.assists ?? 0,
        yellow_cards: seasonStats.yellow_cards ?? 0,
        red_cards: seasonStats.red_cards ?? 0,
        clean_sheets: cleanSheets,
        goals_conceded: goalsConceded,
        pk_saves: pkDetails,
        avg_rating: avgRating,
        avg_xt_rating: avgXtRating,
      },
    });
  } catch (error) {
    console.error('Error fetching player season stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player season stats' },
      { status: 500 }
    );
  }
}
