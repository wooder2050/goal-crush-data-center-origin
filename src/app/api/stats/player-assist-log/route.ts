import { NextRequest, NextResponse } from 'next/server';

import { determineMatchResult } from '@/lib/player-stats-utils';
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

    const assists = await prisma.assist.findMany({
      where: { player_id: playerId },
      select: {
        assist_id: true,
        assist_time: true,
        match: {
          select: {
            match_id: true,
            match_date: true,
            home_score: true,
            away_score: true,
            penalty_home_score: true,
            penalty_away_score: true,
            home_team_id: true,
            away_team_id: true,
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
      orderBy: { match: { match_date: 'desc' } },
    });

    // 선수의 팀 정보 (경기별)
    const matchStats = await prisma.playerMatchStats.findMany({
      where: { player_id: playerId },
      select: { match_id: true, team_id: true },
    });
    const teamByMatch = new Map(
      matchStats
        .filter((ms) => ms.match_id != null)
        .map((ms) => [ms.match_id!, ms.team_id])
    );

    // 경기별 어시스트 수 집계
    const matchAssistMap = new Map<
      number,
      { count: number; assist: (typeof assists)[0] }
    >();
    for (const a of assists) {
      if (!a.match) continue;
      const mid = a.match.match_id;
      const existing = matchAssistMap.get(mid);
      if (existing) {
        existing.count++;
      } else {
        matchAssistMap.set(mid, { count: 1, assist: a });
      }
    }

    const items = Array.from(matchAssistMap.values()).map(
      ({ count, assist: a }) => {
        const m = a.match!;
        const playerTeamId = teamByMatch.get(m.match_id) ?? null;
        const isHome = playerTeamId === m.home_team_id;
        const opponent = isHome ? m.away_team : m.home_team;

        const result = determineMatchResult({
          isHome,
          homeScore: m.home_score,
          awayScore: m.away_score,
          penaltyHomeScore: m.penalty_home_score,
          penaltyAwayScore: m.penalty_away_score,
        });

        return {
          match_id: m.match_id,
          date: m.match_date,
          season: m.season?.season_name ?? null,
          opponent_name: opponent?.team_name ?? '-',
          opponent_logo: opponent?.logo ?? null,
          result,
          home_score: m.home_score,
          away_score: m.away_score,
          penalty_home_score: m.penalty_home_score,
          penalty_away_score: m.penalty_away_score,
          player_assists: count,
        };
      }
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching assist log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assist log' },
      { status: 500 }
    );
  }
}
