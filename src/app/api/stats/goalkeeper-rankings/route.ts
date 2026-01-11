import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// 골키퍼로 출전했는지 판단하는 함수
function isGoalkeeperAppearance(
  position: string | null,
  goals_conceded: number | null
): boolean {
  return position === 'GK' || (position !== 'GK' && (goals_conceded || 0) > 0);
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const seasonIdParam = url.searchParams.get('season_id');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const sortBy =
      url.searchParams.get('sort_by') || 'goals_conceded_per_match'; // goals_conceded_per_match, save_percentage, clean_sheets
    const minMatches = parseInt(url.searchParams.get('min_matches') || '3'); // 최소 출전 경기 수

    const filterSeasonId = seasonIdParam ? Number(seasonIdParam) : undefined;

    // 모든 골키퍼 출전 기록 가져오기
    const playerMatchStats = await prisma.playerMatchStats.findMany({
      where: {
        ...(filterSeasonId && { match: { season_id: filterSeasonId } }),
      },
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
        match: {
          select: {
            season_id: true,
            season: {
              select: {
                season_id: true,
                season_name: true,
                year: true,
              },
            },
          },
        },
      },
    });

    // 골키퍼로 출전한 기록만 필터링
    const goalkeeperStats = playerMatchStats.filter((stat) =>
      isGoalkeeperAppearance(stat.position, stat.goals_conceded)
    );

    // 경기별 팀 실점 계산 (클린시트 판단용)
    const matchTeamGoalsMap = new Map<string, number>();

    // 모든 경기의 팀별 총 실점 계산
    for (const stat of playerMatchStats) {
      if (!stat.match_id || !stat.team_id) continue;

      const matchTeamKey = `${stat.match_id}-${stat.team_id}`;
      const currentGoals = matchTeamGoalsMap.get(matchTeamKey) || 0;
      matchTeamGoalsMap.set(
        matchTeamKey,
        currentGoals + (stat.goals_conceded || 0)
      );
    }

    // 선수별로 통계 집계
    const playerStatsMap = new Map();

    goalkeeperStats.forEach((stat) => {
      const playerId = stat.player?.player_id;
      if (!playerId) return;

      const key = filterSeasonId
        ? `${playerId}` // 특정 시즌만 필터링
        : `${playerId}`; // 전체 커리어

      if (!playerStatsMap.has(key)) {
        playerStatsMap.set(key, {
          player_id: playerId,
          player_name: stat.player?.name,
          player_image: stat.player?.profile_image_url,
          matches_played: 0,
          goals_conceded: 0,
          clean_sheets: 0,
          teams: new Set(),
          team_logos: new Set(),
          team_ids: new Set(),
          seasons: new Set(),
          first_team_id: null,
          first_team_name: null,
        });
      }

      const playerStats = playerStatsMap.get(key);
      playerStats.matches_played += 1;
      playerStats.goals_conceded += stat.goals_conceded || 0;

      // 클린시트 판단: GK 포지션이고 해당 경기에서 팀 전체 실점이 0인 경우
      if (stat.position === 'GK' && stat.match_id && stat.team_id) {
        const matchTeamKey = `${stat.match_id}-${stat.team_id}`;
        const teamGoalsConceded = matchTeamGoalsMap.get(matchTeamKey) || 0;

        if (teamGoalsConceded === 0) {
          playerStats.clean_sheets += 1;
        }
      }

      if (stat.team?.team_name) {
        playerStats.teams.add(stat.team.team_name);
        // 첫 번째 팀 정보 저장
        if (!playerStats.first_team_id && stat.team.team_id) {
          playerStats.first_team_id = stat.team.team_id;
          playerStats.first_team_name = stat.team.team_name;
        }
      }

      if (stat.team?.logo) {
        playerStats.team_logos.add(stat.team.logo);
      }

      if (stat.team?.team_id) {
        playerStats.team_ids.add(stat.team.team_id);
      }

      if (stat.match?.season?.season_name) {
        playerStats.seasons.add(stat.match.season.season_name);
      }
    });

    // 통계를 배열로 변환하고 계산된 값들 추가
    const rankings = Array.from(playerStatsMap.values())
      .filter((stats) => stats.matches_played >= minMatches) // 최소 출전 경기 수 필터
      .map((stats) => {
        return {
          ...stats,
          teams: Array.from(stats.teams).join(', '),
          team_logos: Array.from(stats.team_logos),
          team_ids: Array.from(stats.team_ids),
          seasons: Array.from(stats.seasons).join(', '),
          goals_conceded_per_match:
            stats.matches_played > 0
              ? (stats.goals_conceded / stats.matches_played).toFixed(2)
              : '0.00',
          clean_sheet_percentage:
            stats.matches_played > 0
              ? ((stats.clean_sheets / stats.matches_played) * 100).toFixed(1)
              : '0.0',
        };
      });

    // 정렬
    rankings.sort((a, b) => {
      switch (sortBy) {
        case 'clean_sheets':
          return b.clean_sheets - a.clean_sheets;
        case 'clean_sheet_percentage':
          return (
            parseFloat(b.clean_sheet_percentage) -
            parseFloat(a.clean_sheet_percentage)
          );
        case 'matches_played':
          return b.matches_played - a.matches_played;
        case 'goals_conceded_per_match':
        default:
          return (
            parseFloat(a.goals_conceded_per_match) -
            parseFloat(b.goals_conceded_per_match)
          );
      }
    });

    // 페이지네이션 적용
    const totalCount = rankings.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginatedRankings = rankings.slice(offset, offset + limit);

    // 순위 추가 (전체 순위 기준)
    const rankedResults = paginatedRankings.map((player, index) => ({
      ...player,
      rank: offset + index + 1,
    }));

    return NextResponse.json({
      season_filter: filterSeasonId || 'all',
      sort_by: sortBy,
      min_matches: minMatches,
      total_goalkeepers: totalCount,
      total_pages: totalPages,
      current_page: page,
      per_page: limit,
      rankings: rankedResults,
    });
  } catch (error) {
    console.error('Error fetching goalkeeper rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goalkeeper rankings' },
      { status: 500 }
    );
  }
}
