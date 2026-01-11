import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let filterSeasonId: number | undefined;
  let sortBy: string = 'win_rate';

  try {
    const url = new URL(request.url);
    const seasonIdParam = url.searchParams.get('season_id');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    sortBy = url.searchParams.get('sort_by') || 'win_rate'; // win_rate, goal_difference, goals_for, goals_against, matches_played

    filterSeasonId = seasonIdParam ? Number(seasonIdParam) : undefined;

    console.log('Team rankings API called with:', {
      filterSeasonId,
      page,
      limit,
      sortBy,
    });

    // 먼저 매치 수를 확인
    const matchCount = await prisma.match.count({
      where: {
        ...(filterSeasonId && { season_id: filterSeasonId }),
        AND: [{ home_score: { not: null } }, { away_score: { not: null } }],
      },
    });

    console.log('Found matches with scores:', matchCount);

    if (matchCount === 0) {
      return NextResponse.json({
        season_filter: filterSeasonId || 'all',
        sort_by: sortBy,
        total_teams: 0,
        total_pages: 0,
        current_page: page,
        per_page: limit,
        rankings: [],
      });
    }

    // 모든 경기 결과 가져오기 (스코어가 있는 경기만)
    const matches = await prisma.match.findMany({
      where: {
        ...(filterSeasonId && { season_id: filterSeasonId }),
        // 스코어가 있는 경기만 (완료된 경기)
        AND: [{ home_score: { not: null } }, { away_score: { not: null } }],
      },
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

    // 팀별 통계 집계
    const teamStatsMap = new Map();

    matches.forEach((match) => {
      const homeTeamId = match.home_team?.team_id;
      const awayTeamId = match.away_team?.team_id;
      const homeScore = match.home_score || 0;
      const awayScore = match.away_score || 0;

      if (!homeTeamId || !awayTeamId) return;

      // 홈팀 통계 처리
      if (!teamStatsMap.has(homeTeamId)) {
        teamStatsMap.set(homeTeamId, {
          team_id: homeTeamId,
          team_name: match.home_team?.team_name,
          team_logo: match.home_team?.logo,
          matches_played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          win_rate: 0,
          seasons: new Set(),
        });
      }

      const homeStats = teamStatsMap.get(homeTeamId);
      homeStats.matches_played += 1;
      homeStats.goals_for += homeScore;
      homeStats.goals_against += awayScore;

      if (homeScore > awayScore) {
        homeStats.wins += 1;
      } else if (homeScore === awayScore) {
        homeStats.draws += 1;
      } else {
        homeStats.losses += 1;
      }

      if (match.season?.season_name) {
        homeStats.seasons.add(match.season.season_name);
      }

      // 원정팀 통계 처리
      if (!teamStatsMap.has(awayTeamId)) {
        teamStatsMap.set(awayTeamId, {
          team_id: awayTeamId,
          team_name: match.away_team?.team_name,
          team_logo: match.away_team?.logo,
          matches_played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          win_rate: 0,
          seasons: new Set(),
        });
      }

      const awayStats = teamStatsMap.get(awayTeamId);
      awayStats.matches_played += 1;
      awayStats.goals_for += awayScore;
      awayStats.goals_against += homeScore;

      if (awayScore > homeScore) {
        awayStats.wins += 1;
      } else if (awayScore === homeScore) {
        awayStats.draws += 1;
      } else {
        awayStats.losses += 1;
      }

      if (match.season?.season_name) {
        awayStats.seasons.add(match.season.season_name);
      }
    });

    // 통계를 배열로 변환하고 계산된 값들 추가
    const rankings = Array.from(teamStatsMap.values())
      .filter((stats) => stats.matches_played > 0) // 경기를 한 팀만
      .map((stats) => {
        stats.goal_difference = stats.goals_for - stats.goals_against;
        stats.win_rate =
          stats.matches_played > 0
            ? ((stats.wins / stats.matches_played) * 100).toFixed(1)
            : '0.0';

        return {
          ...stats,
          seasons: Array.from(stats.seasons).join(', '),
          goals_for_per_match:
            stats.matches_played > 0
              ? (stats.goals_for / stats.matches_played).toFixed(1)
              : '0.0',
          goals_against_per_match:
            stats.matches_played > 0
              ? (stats.goals_against / stats.matches_played).toFixed(1)
              : '0.0',
        };
      });

    // 정렬
    rankings.sort((a, b) => {
      switch (sortBy) {
        case 'goal_difference':
          return b.goal_difference - a.goal_difference;
        case 'goals_for':
          return b.goals_for - a.goals_for;
        case 'goals_against':
          return a.goals_against - b.goals_against; // 적을수록 좋음
        case 'goals_for_per_match':
          return (
            parseFloat(b.goals_for_per_match) -
            parseFloat(a.goals_for_per_match)
          );
        case 'goals_against_per_match':
          return (
            parseFloat(a.goals_against_per_match) -
            parseFloat(b.goals_against_per_match)
          ); // 적을수록 좋음
        case 'matches_played':
          return b.matches_played - a.matches_played;
        case 'win_rate':
        default: {
          // 승률 -> 승점 -> 득실차 순으로 정렬
          const aWinRate = parseFloat(a.win_rate);
          const bWinRate = parseFloat(b.win_rate);
          if (aWinRate !== bWinRate) return bWinRate - aWinRate;

          const aPoints = a.wins * 3 + a.draws;
          const bPoints = b.wins * 3 + b.draws;
          if (aPoints !== bPoints) return bPoints - aPoints;

          return b.goal_difference - a.goal_difference;
        }
      }
    });

    // 페이지네이션 적용
    const totalCount = rankings.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginatedRankings = rankings.slice(offset, offset + limit);

    // 순위 추가 (전체 순위 기준)
    const rankedResults = paginatedRankings.map((team, index) => ({
      ...team,
      rank: offset + index + 1,
      points: team.wins * 3 + team.draws, // 승점 추가
    }));

    return NextResponse.json({
      season_filter: filterSeasonId || 'all',
      sort_by: sortBy,
      total_teams: totalCount,
      total_pages: totalPages,
      current_page: page,
      per_page: limit,
      rankings: rankedResults,
    });
  } catch (error) {
    console.error('Error fetching team rankings:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      filterSeasonId,
      sortBy,
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch team rankings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
