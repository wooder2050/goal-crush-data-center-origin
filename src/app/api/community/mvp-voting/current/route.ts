import { NextResponse } from 'next/server';

import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/community/mvp-voting/current - 최신 리그 경기에서 이긴 팀의 MVP 선수들 조회
export async function GET() {
  try {
    const {
      data: { user },
    } = await getAuthUser();

    // 가장 최근 시즌 찾기
    const currentSeason = await prisma.season.findFirst({
      orderBy: {
        year: 'desc',
      },
      select: {
        season_id: true,
        season_name: true,
      },
    });

    if (!currentSeason) {
      return NextResponse.json({
        success: true,
        data: null,
        message: '진행 중인 시즌이 없습니다.',
      });
    }

    // 해당 시즌의 완료된 경기들 조회
    const completedMatches = await prisma.match.findMany({
      where: {
        season_id: currentSeason.season_id,
        status: 'completed',
      },
      select: {
        match_id: true,
        home_team_id: true,
        away_team_id: true,
        home_score: true,
        away_score: true,
        match_date: true,
      },
      orderBy: { match_date: 'desc' },
    });

    // 각 경기별 MVP 선수 계산
    const matchMVPs = await Promise.all(
      completedMatches.map(async (match) => {
        // 승리 팀 ID 결정
        let winningTeamId: number;
        const homeScore = match.home_score || 0;
        const awayScore = match.away_score || 0;

        if (homeScore > awayScore) {
          winningTeamId = match.home_team_id || 0;
        } else if (awayScore > homeScore) {
          winningTeamId = match.away_team_id || 0;
        } else {
          // 무승부인 경우 MVP 없음
          return null;
        }

        if (!winningTeamId) {
          return null;
        }

        // 승리 팀 선수들의 경기 통계 조회
        const playerStats = await prisma.playerMatchStats.findMany({
          where: {
            match_id: match.match_id,
            team_id: winningTeamId,
          },
          select: {
            player_id: true,
            goals: true,
            assists: true,
            player: {
              select: {
                player_id: true,
                name: true,
                profile_image_url: true,
                jersey_number: true,
              },
            },
          },
        });

        // 각 선수의 시즌 전체 통계 조회
        const playersWithSeasonStats = await Promise.all(
          playerStats.map(async (playerStat) => {
            const seasonStats = await prisma.playerSeasonStats.findFirst({
              where: {
                player_id: playerStat.player_id,
                season_id: currentSeason.season_id,
              },
              select: {
                goals: true,
                assists: true,
              },
            });

            // 디버깅 로그
            console.log(`Player ${playerStat.player_id} season stats:`, {
              player_id: playerStat.player_id,
              season_id: currentSeason.season_id,
              season_goals: seasonStats?.goals,
              season_assists: seasonStats?.assists,
            });

            return {
              ...playerStat,
              season_goals: seasonStats?.goals || 0,
              season_assists: seasonStats?.assists || 0,
            };
          })
        );

        if (playerStats.length === 0) {
          return null;
        }

        // 시즌 전체에서 골이나 어시스트가 있는 선수들만 필터링
        const playersWithStats = playersWithSeasonStats.filter(
          (player) =>
            (player.season_goals || 0) > 0 || (player.season_assists || 0) > 0
        );

        if (playersWithStats.length === 0) {
          return null; // 시즌 전체에서 골이나 어시스트가 있는 선수가 없으면 MVP 없음
        }

        // MVP 선수 결정 (시즌 전체 골 수 > 어시스트 수 순으로 정렬)
        const sortedPlayers = playersWithStats.sort((a, b) => {
          const aSeasonGoals = a.season_goals || 0;
          const bSeasonGoals = b.season_goals || 0;
          const aSeasonAssists = a.season_assists || 0;
          const bSeasonAssists = b.season_assists || 0;

          if (aSeasonGoals !== bSeasonGoals) {
            return bSeasonGoals - aSeasonGoals; // 시즌 전체 골 수 내림차순
          }
          return bSeasonAssists - aSeasonAssists; // 시즌 전체 어시스트 수 내림차순
        });

        const mvpPlayer = sortedPlayers[0];

        if (!mvpPlayer || !mvpPlayer.player) {
          return null;
        }

        // 디버깅 로그 - MVP 선수 정보
        console.log(`Match ${match.match_id} MVP:`, {
          player_id: mvpPlayer.player_id,
          player_name: mvpPlayer.player.name,
          season_goals: mvpPlayer.season_goals,
          season_assists: mvpPlayer.season_assists,
        });

        // 팀 정보 조회
        const team = await prisma.team.findUnique({
          where: { team_id: winningTeamId },
          select: { team_name: true, logo: true },
        });

        return {
          match_id: match.match_id,
          match_date: match.match_date,
          winning_team: {
            team_id: winningTeamId,
            team_name: team?.team_name,
            logo: team?.logo,
          },
          score: {
            home: homeScore,
            away: awayScore,
          },
          mvp: {
            player_id: mvpPlayer.player_id,
            name: mvpPlayer.player.name,
            profile_image_url: mvpPlayer.player.profile_image_url,
            jersey_number: mvpPlayer.player.jersey_number,
            goals: mvpPlayer.season_goals || 0,
            assists: mvpPlayer.season_assists || 0,
          },
        };
      })
    );

    // null 값 제거하고 최신 경기 순으로 정렬
    const validMatchMVPs = matchMVPs.filter((mvp) => mvp !== null);

    // 사용자의 투표 여부 확인 (기존 로직 유지)
    let userVotedPlayerId = null;
    if (user) {
      const userVote = await prisma.mvpVote.findFirst({
        where: {
          user_id: user.id,
          season_id: currentSeason.season_id,
          vote_type: 'season',
        },
        select: {
          player_id: true,
        },
      });
      userVotedPlayerId = userVote?.player_id || null;
    }

    return NextResponse.json({
      success: true,
      data: {
        season_id: currentSeason.season_id,
        season_name: currentSeason.season_name,
        match_mvps: validMatchMVPs,
        total_matches: validMatchMVPs.length,
        user_voted_player_id: userVotedPlayerId,
        message: '최신 리그 경기 MVP 선수들을 성공적으로 조회했습니다.',
      },
    });
  } catch (error) {
    console.error('MVP 선수 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'MVP 선수 목록을 조회하는 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
