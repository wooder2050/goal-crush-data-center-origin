import { NextRequest, NextResponse } from 'next/server';

import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/stats/validate - 통계 데이터 무결성 검증
export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();

    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('season_id');

    const seasonFilter = seasonId ? { season_id: parseInt(seasonId) } : {};
    const issues: string[] = [];

    console.log('데이터 검증 시작:', { seasonId });

    // 1. 순위표 vs 실제 경기 결과 검증
    const standings = await prisma.standing.findMany({
      where: seasonFilter,
      include: {
        team: { select: { team_name: true } },
        season: { select: { season_name: true } },
      },
    });

    for (const standing of standings) {
      // 해당 팀의 실제 경기 결과 계산
      const matches = await prisma.match.findMany({
        where: {
          season_id: standing.season_id,
          status: 'completed',
          OR: [
            { home_team_id: standing.team_id },
            { away_team_id: standing.team_id },
          ],
        },
      });

      const actualStats = {
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        points: 0,
      };

      matches.forEach((match) => {
        if (match.home_score === null || match.away_score === null) return;

        actualStats.matches_played++;

        const isHome = match.home_team_id === standing.team_id;
        const teamScore = isHome ? match.home_score : match.away_score;
        const opponentScore = isHome ? match.away_score : match.home_score;

        actualStats.goals_for += teamScore;
        actualStats.goals_against += opponentScore;

        if (teamScore > opponentScore) {
          actualStats.wins++;
          actualStats.points += 3;
        } else if (teamScore < opponentScore) {
          actualStats.losses++;
        } else {
          actualStats.draws++;
          actualStats.points += 1;
        }
      });

      // 비교 검증
      if (standing.matches_played !== actualStats.matches_played) {
        issues.push(
          `${standing.team?.team_name} (${standing.season?.season_name}): 경기수 불일치 (DB: ${standing.matches_played}, 실제: ${actualStats.matches_played})`
        );
      }
      if (standing.wins !== actualStats.wins) {
        issues.push(
          `${standing.team?.team_name} (${standing.season?.season_name}): 승수 불일치 (DB: ${standing.wins}, 실제: ${actualStats.wins})`
        );
      }
      if (standing.points !== actualStats.points) {
        issues.push(
          `${standing.team?.team_name} (${standing.season?.season_name}): 승점 불일치 (DB: ${standing.points}, 실제: ${actualStats.points})`
        );
      }
    }

    // 2. 선수 통계 vs player_match_stats 검증
    const playerSeasonStats = await prisma.playerSeasonStats.findMany({
      where: seasonFilter,
      include: {
        player: { select: { name: true } },
        season: { select: { season_name: true } },
      },
    });

    for (const playerStat of playerSeasonStats) {
      // player_match_stats에서 해당 선수의 통계 집계
      const actualStats = await prisma.playerMatchStats.aggregate({
        where: {
          player_id: playerStat.player_id,
          match: {
            season_id: playerStat.season_id,
          },
        },
        _sum: {
          goals: true,
          assists: true,
          minutes_played: true,
        },
        _count: {
          match_id: true,
        },
      });

      if (playerStat.goals !== (actualStats._sum?.goals || 0)) {
        issues.push(
          `${playerStat.player?.name} (${playerStat.season?.season_name}): 골 수 불일치 (DB: ${playerStat.goals}, 실제: ${actualStats._sum?.goals || 0})`
        );
      }
      if (playerStat.assists !== (actualStats._sum?.assists || 0)) {
        issues.push(
          `${playerStat.player?.name} (${playerStat.season?.season_name}): 어시스트 수 불일치 (DB: ${playerStat.assists}, 실제: ${actualStats._sum?.assists || 0})`
        );
      }
      if (playerStat.matches_played !== actualStats._count?.match_id) {
        issues.push(
          `${playerStat.player?.name} (${playerStat.season?.season_name}): 출장 수 불일치 (DB: ${playerStat.matches_played}, 실제: ${actualStats._count?.match_id || 0})`
        );
      }
    }

    // 3. team_season_stats vs standings 검증
    const teamSeasonStats = await prisma.teamSeasonStats.findMany({
      where: seasonFilter,
    });

    for (const teamStat of teamSeasonStats) {
      const correspondingStanding = standings.find(
        (s) =>
          s.team_id === teamStat.team_id && s.season_id === teamStat.season_id
      );

      if (!correspondingStanding) {
        issues.push(
          `팀 ID ${teamStat.team_id} (시즌 ${teamStat.season_id}): team_season_stats에 있지만 standings에 없음`
        );
        continue;
      }

      if (teamStat.points !== correspondingStanding.points) {
        issues.push(
          `팀 ID ${teamStat.team_id} (시즌 ${teamStat.season_id}): team_season_stats와 standings 간 승점 불일치`
        );
      }
    }

    // 4. h2h_pair_stats 검증 (샘플만)
    const h2hStats = await prisma.h2hPairStats.findMany({
      take: 10, // 성능상 샘플만 검증
    });

    for (const h2h of h2hStats) {
      // H2hPairStats는 season_id가 없으므로 모든 경기에서 검증
      const matches = await prisma.match.findMany({
        where: {
          status: 'completed',
          OR: [
            {
              home_team_id: h2h.team_small_id,
              away_team_id: h2h.team_large_id,
            },
            {
              home_team_id: h2h.team_large_id,
              away_team_id: h2h.team_small_id,
            },
          ],
        },
      });

      const actualH2H = {
        matches_played: 0,
        small_wins: 0,
        large_wins: 0,
        draws: 0,
        small_goals: 0,
        large_goals: 0,
      };

      matches.forEach((match) => {
        if (match.home_score === null || match.away_score === null) return;

        actualH2H.matches_played++;

        let smallScore, largeScore;
        if (match.home_team_id === h2h.team_small_id) {
          smallScore = match.home_score;
          largeScore = match.away_score;
        } else {
          smallScore = match.away_score;
          largeScore = match.home_score;
        }

        if (smallScore > largeScore) {
          actualH2H.small_wins++;
        } else if (smallScore < largeScore) {
          actualH2H.large_wins++;
        } else {
          actualH2H.draws++;
        }

        actualH2H.small_goals += smallScore;
        actualH2H.large_goals += largeScore;
      });

      if (h2h.total_matches !== actualH2H.matches_played) {
        issues.push(
          `H2H (${h2h.team_small_id} vs ${h2h.team_large_id}): 경기 수 불일치 (DB: ${h2h.total_matches}, 실제: ${actualH2H.matches_played})`
        );
      }
    }

    console.log('데이터 검증 완료:', { 총문제수: issues.length });

    return NextResponse.json({
      message:
        issues.length === 0
          ? '모든 통계 데이터가 정상입니다.'
          : `${issues.length}개의 데이터 불일치가 발견되었습니다.`,
      valid: issues.length === 0,
      issues,
      checked: {
        standings: standings.length,
        player_season_stats: playerSeasonStats.length,
        team_season_stats: teamSeasonStats.length,
        h2h_pair_stats: h2hStats.length,
      },
      season_id: seasonId ? parseInt(seasonId) : null,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === '인증이 필요합니다' ||
        error.message === '관리자 권한이 필요합니다')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '인증이 필요합니다' ? 401 : 403 }
      );
    }

    console.error('데이터 검증 실패:', error);
    return NextResponse.json(
      {
        error: '데이터 검증 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
