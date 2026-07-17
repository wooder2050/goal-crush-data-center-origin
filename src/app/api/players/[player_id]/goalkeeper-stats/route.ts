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
  { params }: { params: Promise<{ player_id: string }> }
) {
  try {
    const { player_id } = await params;
    const playerId = parseInt(player_id);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }

    const url = new URL(request.url);
    const seasonIdParam = url.searchParams.get('season_id');
    const filterSeasonId = seasonIdParam ? Number(seasonIdParam) : undefined;

    // 선수의 모든 경기 통계 (골키퍼 출전 여부 판단을 위해)
    const playerMatchStats = await prisma.playerMatchStats.findMany({
      where: {
        player_id: playerId,
        // 출전 기준: minutes_played > 0 (벤치 제외) — player_season_stats와 동일 규칙
        minutes_played: { gt: 0 },
        ...(filterSeasonId && { match: { season_id: filterSeasonId } }),
      },
      include: {
        match: {
          select: {
            match_id: true,
            match_date: true,
            season_id: true,
            home_team_id: true,
            away_team_id: true,
            home_score: true,
            away_score: true,
            season: {
              select: {
                season_id: true,
                season_name: true,
                year: true,
              },
            },
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
      orderBy: [{ match: { match_date: 'desc' } }],
    });

    // 골키퍼로 출전한 경기만 필터링
    const goalkeeperMatches = playerMatchStats.filter((stat) =>
      isGoalkeeperAppearance(stat.position, stat.goals_conceded)
    );

    // 시즌별 팀 이름 조회
    const seasonIds = Array.from(
      new Set(
        goalkeeperMatches
          .map((m) => m.match?.season_id)
          .filter((id): id is number => id != null)
      )
    );
    const teamIds = Array.from(
      new Set(
        goalkeeperMatches
          .flatMap((m) => [
            m.team?.team_id,
            m.match?.home_team?.team_id,
            m.match?.away_team?.team_id,
          ])
          .filter((id): id is number => id != null)
      )
    );

    const teamSeasonNames = await prisma.teamSeasonName.findMany({
      where: {
        season_id: { in: seasonIds },
        team_id: { in: teamIds },
      },
      select: {
        team_id: true,
        season_id: true,
        team_name: true,
      },
    });

    // Map: "seasonId-teamId" -> team_name
    const teamSeasonNameMap = new Map<string, string>();
    teamSeasonNames.forEach((tsn) => {
      teamSeasonNameMap.set(`${tsn.season_id}-${tsn.team_id}`, tsn.team_name);
    });

    // 팀 이름 조회 헬퍼 함수
    const getSeasonTeamName = (
      seasonId: number | null | undefined,
      teamId: number | null | undefined,
      fallbackName: string | null | undefined
    ) => {
      if (seasonId && teamId) {
        return teamSeasonNameMap.get(`${seasonId}-${teamId}`) ?? fallbackName;
      }
      return fallbackName;
    };

    // 시즌별 통계 집계
    const seasonStatsMap = new Map();

    goalkeeperMatches.forEach((stat) => {
      const seasonId = stat.match?.season_id;
      if (!seasonId) return;

      if (!seasonStatsMap.has(seasonId)) {
        seasonStatsMap.set(seasonId, {
          season_id: seasonId,
          season_name: stat.match?.season?.season_name || null,
          year: stat.match?.season?.year || null,
          matches_played: 0,
          goals_conceded: 0,
          clean_sheets: 0,
          matches: [],
        });
      }

      const seasonStats = seasonStatsMap.get(seasonId);
      seasonStats.matches_played += 1;
      seasonStats.goals_conceded += stat.goals_conceded || 0;

      // 클린시트 (무실점) 계산
      if ((stat.goals_conceded || 0) === 0) {
        seasonStats.clean_sheets += 1;
      }

      // 경기 상세 정보 추가
      const isHome = stat.team?.team_id === stat.match?.home_team_id;
      const opponent = isHome ? stat.match?.away_team : stat.match?.home_team;

      // 시즌별 팀 이름 적용
      const teamWithSeasonName = stat.team
        ? {
            ...stat.team,
            team_name: getSeasonTeamName(
              seasonId,
              stat.team.team_id,
              stat.team.team_name
            ),
          }
        : stat.team;

      const opponentWithSeasonName = opponent
        ? {
            ...opponent,
            team_name: getSeasonTeamName(
              seasonId,
              opponent.team_id,
              opponent.team_name
            ),
          }
        : opponent;

      seasonStats.matches.push({
        match_id: stat.match?.match_id,
        match_date: stat.match?.match_date?.toISOString() || null,
        goals_conceded: stat.goals_conceded || 0,
        position: stat.position,
        team: teamWithSeasonName,
        opponent: opponentWithSeasonName,
        home_score: stat.match?.home_score,
        away_score: stat.match?.away_score,
        is_home: isHome,
        is_clean_sheet: (stat.goals_conceded || 0) === 0,
      });
    });

    // 시즌별 통계를 배열로 변환하고 정렬
    const seasonStats = Array.from(seasonStatsMap.values())
      .map((stats) => ({
        ...stats,
        goals_conceded_per_match:
          stats.matches_played > 0
            ? (stats.goals_conceded / stats.matches_played).toFixed(2)
            : '0.00',
        clean_sheet_percentage:
          stats.matches_played > 0
            ? ((stats.clean_sheets / stats.matches_played) * 100).toFixed(1)
            : '0.0',
      }))
      .sort((a, b) => b.year - a.year);

    // 전체 커리어 통계
    const careerTotals = seasonStats.reduce(
      (totals, season) => {
        totals.matches_played += season.matches_played;
        totals.goals_conceded += season.goals_conceded;
        totals.clean_sheets += season.clean_sheets;
        return totals;
      },
      {
        matches_played: 0,
        goals_conceded: 0,
        clean_sheets: 0,
      }
    );

    // 커리어 평균 계산
    const careerAverages = {
      goals_conceded_per_match:
        careerTotals.matches_played > 0
          ? (careerTotals.goals_conceded / careerTotals.matches_played).toFixed(
              2
            )
          : '0.00',
      clean_sheet_percentage:
        careerTotals.matches_played > 0
          ? (
              (careerTotals.clean_sheets / careerTotals.matches_played) *
              100
            ).toFixed(1)
          : '0.0',
    };

    // 최근 경기들 (최대 10경기)
    const recentMatches = goalkeeperMatches.slice(0, 10).map((stat) => {
      const isHome = stat.team?.team_id === stat.match?.home_team_id;
      const opponent = isHome ? stat.match?.away_team : stat.match?.home_team;
      const seasonId = stat.match?.season_id;

      // 시즌별 팀 이름 적용
      const opponentName = getSeasonTeamName(
        seasonId,
        opponent?.team_id,
        opponent?.team_name
      );

      return {
        match_id: stat.match?.match_id,
        match_date: stat.match?.match_date?.toISOString() || null,
        season_name: stat.match?.season?.season_name,
        opponent_name: opponentName || null,
        opponent_logo: opponent?.logo || null,
        goals_conceded: stat.goals_conceded || 0,
        is_clean_sheet: (stat.goals_conceded || 0) === 0,
        is_home: isHome,
        home_score: stat.match?.home_score,
        away_score: stat.match?.away_score,
      };
    });

    return NextResponse.json({
      player_id: playerId,
      is_goalkeeper: goalkeeperMatches.length > 0,
      career_totals: careerTotals,
      career_averages: careerAverages,
      season_stats: seasonStats,
      recent_matches: recentMatches,
      total_goalkeeper_appearances: goalkeeperMatches.length,
    });
  } catch (error) {
    console.error('Error fetching goalkeeper stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goalkeeper stats' },
      { status: 500 }
    );
  }
}
