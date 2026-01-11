import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 골키퍼로 출전했는지 판단하는 함수
function isGoalkeeperAppearance(
  position: string | null,
  goals_conceded: number | null
): boolean {
  // 포지션이 GK이거나, 필드 선수였지만 실점이 있는 경우 (골키퍼로 교체됨)
  return position === 'GK' || (position !== 'GK' && (goals_conceded || 0) > 0);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ match_id: string }> }
) {
  try {
    const { match_id } = await params;
    const matchId = parseInt(match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    // 경기 정보 가져오기
    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
      include: {
        home_team: {
          select: {
            team_id: true,
            team_name: true,
            logo: true,
          },
        },
        away_team: {
          select: {
            team_id: true,
            team_name: true,
            logo: true,
          },
        },
        season: {
          select: {
            season_id: true,
            season_name: true,
            year: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // 해당 경기의 모든 선수 통계 가져오기
    const playerMatchStats = await prisma.playerMatchStats.findMany({
      where: { match_id: matchId },
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

    // 골키퍼로 출전한 선수들만 필터링
    const goalkeeperStats = playerMatchStats
      .filter((stat) =>
        isGoalkeeperAppearance(stat.position, stat.goals_conceded)
      )
      .map((stat) => {
        const isHome = stat.team?.team_id === match.home_team_id;

        return {
          player_id: stat.player?.player_id,
          player_name: stat.player?.name,
          player_image: stat.player?.profile_image_url,
          team_id: stat.team?.team_id,
          team_name: stat.team?.team_name,
          team_logo: stat.team?.logo,
          is_home: isHome,
          position: stat.position,
          goals_conceded: stat.goals_conceded || 0,
          // 교체 여부 판단 (필드 포지션으로 시작했지만 실점이 있는 경우)
          was_substituted_in:
            stat.position !== 'GK' && (stat.goals_conceded || 0) > 0,
        };
      })
      .sort((a, b) => {
        // 홈팀 먼저, 그 다음 원정팀
        if (a.is_home && !b.is_home) return -1;
        if (!a.is_home && b.is_home) return 1;
        return 0;
      });

    // 팀별로 그룹화
    const homeGoalkeepers = goalkeeperStats.filter((gk) => gk.is_home);
    const awayGoalkeepers = goalkeeperStats.filter((gk) => !gk.is_home);

    // 경기 요약 통계
    const matchSummary = {
      total_goals_conceded: goalkeeperStats.reduce(
        (sum, gk) => sum + gk.goals_conceded,
        0
      ),
      home_team_goals_conceded: homeGoalkeepers.reduce(
        (sum, gk) => sum + gk.goals_conceded,
        0
      ),
      away_team_goals_conceded: awayGoalkeepers.reduce(
        (sum, gk) => sum + gk.goals_conceded,
        0
      ),
    };

    return NextResponse.json({
      match_id: matchId,
      match_info: {
        match_date: match.match_date?.toISOString() || null,
        home_team: match.home_team,
        away_team: match.away_team,
        season: match.season,
        home_score: match.home_score,
        away_score: match.away_score,
      },
      goalkeeper_stats: goalkeeperStats,
      home_goalkeepers: homeGoalkeepers,
      away_goalkeepers: awayGoalkeepers,
      match_summary: matchSummary,
    });
  } catch (error) {
    console.error('Error fetching match goalkeeper stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match goalkeeper stats' },
      { status: 500 }
    );
  }
}
