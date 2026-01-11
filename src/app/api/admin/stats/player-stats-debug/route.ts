import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/stats/player-stats-debug - 선수 통계 디버깅 정보
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('season_id');
    const playerId = searchParams.get('player_id');

    console.log('선수 통계 디버깅 정보 조회:', { seasonId, playerId });

    // 시즌 필터
    const seasonFilter = seasonId ? { season_id: parseInt(seasonId) } : {};
    const playerFilter = playerId ? { player_id: parseInt(playerId) } : {};

    // 현재 player_season_stats 테이블 상태
    const existingStats = await prisma.playerSeasonStats.findMany({
      where: {
        ...seasonFilter,
        ...playerFilter,
      },
      include: {
        player: { select: { name: true } },
        season: { select: { season_name: true } },
        team: { select: { team_name: true } },
      },
      orderBy: [{ season_id: 'desc' }, { goals: 'desc' }],
    });

    // player_match_stats에서 실제 경기별 통계
    const matchStats = await prisma.playerMatchStats.findMany({
      where: {
        match: seasonFilter.season_id
          ? { season_id: seasonFilter.season_id }
          : {},
        ...playerFilter,
      },
      include: {
        match: {
          select: {
            match_id: true,
            season_id: true,
            status: true,
            match_date: true,
            home_team: { select: { team_name: true } },
            away_team: { select: { team_name: true } },
          },
        },
        player: { select: { name: true } },
        team: { select: { team_name: true } },
      },
      orderBy: {
        match: { match_date: 'desc' },
      },
      take: 20, // 최신 20경기만
    });

    // 완료된 경기만 필터링하여 실제 계산해야 할 통계
    const completedMatchStats = matchStats.filter(
      (stat) => stat.match?.status === 'completed'
    );

    // 시즌별 통계 계산
    const calculatedStats = new Map<
      string,
      {
        season_id: number;
        season_name: string;
        player_id: number;
        player_name: string;
        team_id: number;
        team_name: string;
        matches_played: number;
        goals: number;
        assists: number;
        yellow_cards: number;
        red_cards: number;
        minutes_played: number;
        saves: number;
      }
    >();

    completedMatchStats.forEach((stat) => {
      if (!stat.player_id || !stat.team_id || !stat.match?.season_id) return;

      const key = `${stat.match.season_id}-${stat.player_id}-${stat.team_id}`;

      if (!calculatedStats.has(key)) {
        calculatedStats.set(key, {
          season_id: stat.match.season_id,
          season_name: stat.match ? 'Unknown' : 'Unknown', // Will be filled below
          player_id: stat.player_id,
          player_name: stat.player?.name || 'Unknown',
          team_id: stat.team_id,
          team_name: stat.team?.team_name || 'Unknown',
          matches_played: 0,
          goals: 0,
          assists: 0,
          yellow_cards: 0,
          red_cards: 0,
          minutes_played: 0,
          saves: 0,
        });
      }

      const calculated = calculatedStats.get(key)!;

      // 경기 출장 카운트 (출장 시간이 0보다 큰 경우)
      if ((stat.minutes_played || 0) > 0) {
        calculated.matches_played++;
      }

      calculated.goals += stat.goals || 0;
      calculated.assists += stat.assists || 0;
      calculated.yellow_cards += stat.yellow_cards || 0;
      calculated.red_cards += stat.red_cards || 0;
      calculated.minutes_played += stat.minutes_played || 0;
      calculated.saves += stat.saves || 0;
    });

    return NextResponse.json({
      debug_info: {
        season_filter: seasonFilter,
        player_filter: playerFilter,
        total_match_stats: matchStats.length,
        completed_match_stats: completedMatchStats.length,
      },
      existing_player_season_stats: {
        count: existingStats.length,
        data: existingStats,
      },
      recent_match_stats: {
        count: matchStats.length,
        data: matchStats.map((stat) => ({
          match_id: stat.match?.match_id,
          match_date: stat.match?.match_date,
          season_id: stat.match?.season_id,
          status: stat.match?.status,
          player_name: stat.player?.name,
          team_name: stat.team?.team_name,
          opponent: stat.match
            ? `${stat.match.home_team?.team_name} vs ${stat.match.away_team?.team_name}`
            : 'Unknown',
          goals: stat.goals,
          assists: stat.assists,
          minutes_played: stat.minutes_played,
          yellow_cards: stat.yellow_cards,
          red_cards: stat.red_cards,
          saves: stat.saves,
        })),
      },
      calculated_season_stats: {
        count: calculatedStats.size,
        data: Array.from(calculatedStats.values()),
      },
    });
  } catch (error) {
    console.error('선수 통계 디버깅 정보 조회 실패:', error);
    return NextResponse.json(
      {
        error: '선수 통계 디버깅 정보 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
