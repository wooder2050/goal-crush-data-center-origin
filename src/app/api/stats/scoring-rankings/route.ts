import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const seasonIdParam = url.searchParams.get('season_id');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const sortBy = url.searchParams.get('sort_by') || 'attack_points'; // goals, assists, attack_points, matches_played
    const minMatches = parseInt(url.searchParams.get('min_matches') || '3');

    const filterSeasonId = seasonIdParam ? Number(seasonIdParam) : undefined;

    // 모든 선수 경기 통계 가져오기
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

    // 현재 소속팀 정보 가져오기 (is_active = true)
    const activeTeamHistories = await prisma.playerTeamHistory.findMany({
      where: {
        is_active: true,
      },
      include: {
        team: {
          select: {
            team_id: true,
            team_name: true,
            logo: true,
          },
        },
      },
    });

    // player_id -> 현재 소속팀 매핑
    const playerCurrentTeamMap = new Map<
      number,
      { team_id: number; team_name: string; logo: string | null }
    >();
    activeTeamHistories.forEach((history) => {
      if (history.player_id && history.team) {
        // 이미 등록된 경우 덮어쓰지 않음 (첫 번째 active 팀 유지)
        if (!playerCurrentTeamMap.has(history.player_id)) {
          playerCurrentTeamMap.set(history.player_id, {
            team_id: history.team.team_id,
            team_name: history.team.team_name,
            logo: history.team.logo,
          });
        }
      }
    });

    // 선수별로 통계 집계
    const playerStatsMap = new Map();

    playerMatchStats.forEach((stat) => {
      const playerId = stat.player?.player_id;
      if (!playerId) return;

      const key = filterSeasonId
        ? `${playerId}` // 특정 시즌만 필터링
        : `${playerId}`; // 전체 커리어

      if (!playerStatsMap.has(key)) {
        // 현재 소속팀 정보 가져오기
        const currentTeam = playerCurrentTeamMap.get(playerId);

        playerStatsMap.set(key, {
          player_id: playerId,
          player_name: stat.player?.name,
          player_image: stat.player?.profile_image_url,
          matches_played: 0,
          goals: 0,
          assists: 0,
          attack_points: 0,
          teams: new Set(),
          team_logos: new Set(),
          team_ids: new Set(),
          seasons: new Set(),
          // 현재 소속팀 정보 (player_team_history 기준)
          current_team_id: currentTeam?.team_id || null,
          current_team_name: currentTeam?.team_name || null,
          current_team_logo: currentTeam?.logo || null,
        });
      }

      const playerStats = playerStatsMap.get(key);
      playerStats.matches_played += 1;
      playerStats.goals += stat.goals || 0;
      playerStats.assists += stat.assists || 0;
      playerStats.attack_points = playerStats.goals + playerStats.assists;

      if (stat.team?.team_name) {
        playerStats.teams.add(stat.team.team_name);
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
        // 현재 소속팀 로고를 team_logos 배열 맨 앞에 추가
        const teamLogosArray = Array.from(stats.team_logos) as string[];
        if (stats.current_team_logo) {
          // 현재 팀 로고가 이미 있으면 제거하고 맨 앞에 추가
          const filteredLogos = teamLogosArray.filter(
            (logo) => logo !== stats.current_team_logo
          );
          filteredLogos.unshift(stats.current_team_logo);
          teamLogosArray.length = 0;
          teamLogosArray.push(...filteredLogos);
        }

        return {
          ...stats,
          teams: Array.from(stats.teams).join(', '),
          team_logos: teamLogosArray,
          team_ids: Array.from(stats.team_ids),
          seasons: Array.from(stats.seasons).join(', '),
          // 프론트엔드 호환성을 위해 first_team_* 필드에 현재 소속팀 정보 매핑
          first_team_id: stats.current_team_id,
          first_team_name: stats.current_team_name,
          goals_per_match:
            stats.matches_played > 0
              ? (stats.goals / stats.matches_played).toFixed(2)
              : '0.00',
          assists_per_match:
            stats.matches_played > 0
              ? (stats.assists / stats.matches_played).toFixed(2)
              : '0.00',
          attack_points_per_match:
            stats.matches_played > 0
              ? (stats.attack_points / stats.matches_played).toFixed(2)
              : '0.00',
        };
      });

    // 정렬
    rankings.sort((a, b) => {
      switch (sortBy) {
        case 'goals':
          return b.goals - a.goals;
        case 'assists':
          return b.assists - a.assists;
        case 'matches_played':
          return b.matches_played - a.matches_played;
        case 'goals_per_match':
          return parseFloat(b.goals_per_match) - parseFloat(a.goals_per_match);
        case 'assists_per_match':
          return (
            parseFloat(b.assists_per_match) - parseFloat(a.assists_per_match)
          );
        case 'attack_points_per_match':
          return (
            parseFloat(b.attack_points_per_match) -
            parseFloat(a.attack_points_per_match)
          );
        case 'attack_points':
        default:
          return b.attack_points - a.attack_points;
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
      total_players: totalCount,
      total_pages: totalPages,
      current_page: page,
      per_page: limit,
      rankings: rankedResults,
    });
  } catch (error) {
    console.error('Error fetching scoring rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scoring rankings' },
      { status: 500 }
    );
  }
}
