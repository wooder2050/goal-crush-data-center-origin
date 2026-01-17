import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type AppearanceType = 'starter' | 'substitute' | 'all';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const seasonIdParam = url.searchParams.get('season_id');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const sortBy = url.searchParams.get('sort_by') || 'win_rate_desc'; // win_rate_desc, win_rate_asc, matches_played
    const minMatches = parseInt(url.searchParams.get('min_matches') || '5');
    const appearanceType = (url.searchParams.get('appearance_type') ||
      'starter') as AppearanceType; // starter, substitute, all

    const filterSeasonId = seasonIdParam ? Number(seasonIdParam) : undefined;

    // 모든 player_match_stats 가져오기
    const playerMatchStats = await prisma.playerMatchStats.findMany({
      where: {
        ...(filterSeasonId && { match: { season_id: filterSeasonId } }),
      },
      select: {
        player_id: true,
        match_id: true,
        team_id: true,
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
            match_id: true,
            home_team_id: true,
            away_team_id: true,
            home_score: true,
            away_score: true,
            penalty_home_score: true,
            penalty_away_score: true,
            season_id: true,
            season: {
              select: {
                season_id: true,
                season_name: true,
              },
            },
          },
        },
      },
    });

    // 교체 투입 선수 목록 가져오기
    const substitutions = await prisma.substitution.findMany({
      where: {
        ...(filterSeasonId && { match: { season_id: filterSeasonId } }),
      },
      select: {
        match_id: true,
        player_in_id: true,
      },
    });

    // 교체 투입 선수를 Set으로 변환 (빠른 조회용)
    const subInSet = new Set(
      substitutions.map((s) => `${s.match_id}-${s.player_in_id}`)
    );

    // 출전 유형에 따라 필터링
    let filteredStats = playerMatchStats;

    if (appearanceType === 'starter') {
      // 선발 출전: 교체 투입되지 않은 선수
      filteredStats = playerMatchStats.filter(
        (stat) => !subInSet.has(`${stat.match_id}-${stat.player_id}`)
      );
    } else if (appearanceType === 'substitute') {
      // 교체 출전: 교체 투입된 선수
      filteredStats = playerMatchStats.filter((stat) =>
        subInSet.has(`${stat.match_id}-${stat.player_id}`)
      );
    }
    // 'all'인 경우 모든 출전 기록 사용

    // 선수별 통계 집계
    const playerStatsMap = new Map<
      number,
      {
        player_id: number;
        player_name: string | null;
        player_image: string | null;
        matches_played: number;
        wins: number;
        losses: number;
        teams: Set<string>;
        team_logos: Set<string>;
        team_ids: Set<number>;
        seasons: Set<string>;
        first_team_id: number | null;
        first_team_name: string | null;
        first_team_logo: string | null;
      }
    >();

    filteredStats.forEach((stat) => {
      const playerId = stat.player?.player_id;
      if (!playerId) return;

      const match = stat.match;
      if (
        !match ||
        match.home_score === null ||
        match.away_score === null ||
        !stat.team_id
      )
        return;

      // 승패 판정 (승부차기 포함)
      let isWin = false;

      if (stat.team_id === match.home_team_id) {
        // 홈팀인 경우
        if (match.home_score > match.away_score) {
          isWin = true;
        } else if (
          match.home_score === match.away_score &&
          match.penalty_home_score !== null &&
          match.penalty_away_score !== null
        ) {
          isWin = match.penalty_home_score > match.penalty_away_score;
        }
      } else if (stat.team_id === match.away_team_id) {
        // 원정팀인 경우
        if (match.away_score > match.home_score) {
          isWin = true;
        } else if (
          match.home_score === match.away_score &&
          match.penalty_home_score !== null &&
          match.penalty_away_score !== null
        ) {
          isWin = match.penalty_away_score > match.penalty_home_score;
        }
      }

      if (!playerStatsMap.has(playerId)) {
        playerStatsMap.set(playerId, {
          player_id: playerId,
          player_name: stat.player?.name || null,
          player_image: stat.player?.profile_image_url || null,
          matches_played: 0,
          wins: 0,
          losses: 0,
          teams: new Set(),
          team_logos: new Set(),
          team_ids: new Set(),
          seasons: new Set(),
          first_team_id: null,
          first_team_name: null,
          first_team_logo: null,
        });
      }

      const playerStats = playerStatsMap.get(playerId)!;
      playerStats.matches_played += 1;

      if (isWin) {
        playerStats.wins += 1;
      } else {
        playerStats.losses += 1;
      }

      if (stat.team?.team_name) {
        playerStats.teams.add(stat.team.team_name);
        if (!playerStats.first_team_id && stat.team.team_id) {
          playerStats.first_team_id = stat.team.team_id;
          playerStats.first_team_name = stat.team.team_name;
          playerStats.first_team_logo = stat.team.logo || null;
        }
      }

      if (stat.team?.logo) {
        playerStats.team_logos.add(stat.team.logo);
      }

      if (stat.team?.team_id) {
        playerStats.team_ids.add(stat.team.team_id);
      }

      if (match.season?.season_name) {
        playerStats.seasons.add(match.season.season_name);
      }
    });

    // 통계를 배열로 변환하고 계산된 값들 추가
    const rankings = Array.from(playerStatsMap.values())
      .filter((stats) => stats.matches_played >= minMatches)
      .map((stats) => {
        const winRate =
          stats.matches_played > 0
            ? (stats.wins / stats.matches_played) * 100
            : 0;

        return {
          player_id: stats.player_id,
          player_name: stats.player_name,
          player_image: stats.player_image,
          matches_played: stats.matches_played,
          wins: stats.wins,
          losses: stats.losses,
          win_rate: winRate.toFixed(2),
          teams: Array.from(stats.teams).join(', '),
          team_logos: Array.from(stats.team_logos),
          team_ids: Array.from(stats.team_ids),
          seasons: Array.from(stats.seasons).join(', '),
          first_team_id: stats.first_team_id,
          first_team_name: stats.first_team_name,
          first_team_logo: stats.first_team_logo,
        };
      });

    // 정렬
    rankings.sort((a, b) => {
      switch (sortBy) {
        case 'win_rate_asc':
          if (parseFloat(a.win_rate) !== parseFloat(b.win_rate)) {
            return parseFloat(a.win_rate) - parseFloat(b.win_rate);
          }
          return b.losses - a.losses;
        case 'matches_played':
          return b.matches_played - a.matches_played;
        case 'win_rate_desc':
        default:
          if (parseFloat(a.win_rate) !== parseFloat(b.win_rate)) {
            return parseFloat(b.win_rate) - parseFloat(a.win_rate);
          }
          return b.wins - a.wins;
      }
    });

    // 페이지네이션 적용
    const totalCount = rankings.length;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;
    const paginatedRankings = rankings.slice(offset, offset + limit);

    // 순위 추가
    const rankedResults = paginatedRankings.map((player, index) => ({
      ...player,
      rank: offset + index + 1,
    }));

    return NextResponse.json({
      season_filter: filterSeasonId || 'all',
      appearance_type: appearanceType,
      sort_by: sortBy,
      min_matches: minMatches,
      total_players: totalCount,
      total_pages: totalPages,
      current_page: page,
      per_page: limit,
      rankings: rankedResults,
    });
  } catch (error) {
    console.error('Error fetching win rate rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch win rate rankings' },
      { status: 500 }
    );
  }
}
