import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/stats/player-season/top-scorers - 득점왕 조회 (시즌별 또는 커리어 누적)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('season_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    // season_id가 제공된 경우 시즌별 득점왕, 없으면 커리어 누적 득점왕
    if (seasonId && !isNaN(parseInt(seasonId))) {
      const parsedSeasonId = parseInt(seasonId);

      // 시즌별 팀 이름 조회
      const teamSeasonNames = await prisma.teamSeasonName.findMany({
        where: { season_id: parsedSeasonId },
        select: { team_id: true, team_name: true },
      });
      const teamSeasonNamesMap = new Map<number, string>();
      teamSeasonNames.forEach((tsn) => {
        teamSeasonNamesMap.set(tsn.team_id, tsn.team_name);
      });

      // 시즌별 득점왕 조회
      const stats = await prisma.playerSeasonStats.findMany({
        where: {
          season_id: parsedSeasonId,
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
        },
        orderBy: { goals: 'desc' },
        take: limit,
      });

      // 시즌별 데이터를 클라이언트 형식으로 변환
      const topScorers = stats.map((stat) => {
        // 시즌별 팀 이름 우선 사용, 없으면 기본 팀 이름 사용
        const seasonTeamName =
          stat.team_id != null
            ? (teamSeasonNamesMap.get(stat.team_id) ?? stat.team?.team_name)
            : stat.team?.team_name;

        return {
          stat_id: stat.stat_id,
          player_id: stat.player?.player_id || null,
          season_id: stat.season_id,
          team_id: stat.team_id,
          matches_played: stat.matches_played,
          goals: stat.goals,
          assists: stat.assists,
          yellow_cards: stat.yellow_cards,
          red_cards: stat.red_cards,
          minutes_played: stat.minutes_played,
          saves: stat.saves,
          created_at: stat.created_at,
          updated_at: stat.updated_at,
          player_name: stat.player?.name || null,
          player_image: stat.player?.profile_image_url || null,
          team_name: seasonTeamName || null,
          team_logo: stat.team?.logo || null,
        };
      });

      return NextResponse.json(topScorers);
    } else {
      // 커리어 누적 득점왕 조회
      const stats = await prisma.playerSeasonStats.findMany({
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
          season: {
            select: {
              season_id: true,
              season_name: true,
            },
          },
        },
      });

      // 선수별로 커리어 통계 집계
      const playerCareerStats = new Map();

      stats.forEach((stat) => {
        const playerId = stat.player?.player_id;
        if (!playerId) return;

        if (!playerCareerStats.has(playerId)) {
          playerCareerStats.set(playerId, {
            player_id: playerId,
            player_name: stat.player?.name || '',
            player_image: stat.player?.profile_image_url || '',
            total_goals: 0,
            total_assists: 0,
            total_matches_played: 0,
            teams: new Set(),
            team_logos: new Set(),
            seasons: new Set(),
            latest_team_name: '',
            latest_team_logo: '',
          });
        }

        const playerStats = playerCareerStats.get(playerId);
        playerStats.total_goals += stat.goals || 0;
        playerStats.total_assists += stat.assists || 0;
        playerStats.total_matches_played += stat.matches_played || 0;

        // Update player_image if not set
        if (!playerStats.player_image && stat.player?.profile_image_url) {
          playerStats.player_image = stat.player.profile_image_url;
        }

        if (stat.team?.team_name) {
          playerStats.teams.add(stat.team.team_name);
          playerStats.latest_team_name = stat.team.team_name; // 마지막 팀을 대표 팀으로
        }

        if (stat.team?.logo) {
          playerStats.team_logos.add(stat.team.logo);
          playerStats.latest_team_logo = stat.team.logo;
        }

        if (stat.season?.season_name) {
          playerStats.seasons.add(stat.season.season_name);
        }
      });

      // 득점 순으로 정렬하고 상위 N명만 선택
      const topScorers = Array.from(playerCareerStats.values())
        .sort((a, b) => b.total_goals - a.total_goals)
        .slice(0, limit)
        .map((player) => ({
          player_id: player.player_id,
          player_name: player.player_name,
          player_image: player.player_image || '',
          team_name: player.latest_team_name,
          team_logo: player.latest_team_logo || '',
          goals: player.total_goals,
          assists: player.total_assists,
          matches_played: player.total_matches_played,
          total_teams: Array.from(player.teams).length,
          total_seasons: Array.from(player.seasons).length,
        }));

      return NextResponse.json(topScorers);
    }
  } catch (error) {
    console.error('Error fetching top scorers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top scorers' },
      { status: 500 }
    );
  }
}
