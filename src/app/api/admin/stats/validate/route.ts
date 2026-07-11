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
      // 출장 수는 재생성 로직과 동일하게 minutes_played > 0만 카운트 (벤치 제외)
      const [actualStats, appearances] = await Promise.all([
        prisma.playerMatchStats.aggregate({
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
        }),
        prisma.playerMatchStats.count({
          where: {
            player_id: playerStat.player_id,
            minutes_played: { gt: 0 },
            match: {
              season_id: playerStat.season_id,
            },
          },
        }),
      ]);

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
      if (playerStat.matches_played !== appearances) {
        issues.push(
          `${playerStat.player?.name} (${playerStat.season?.season_name}): 출장 수 불일치 (DB: ${playerStat.matches_played}, 실제: ${appearances})`
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

    // 5. 경기 단위 정합성 검증 (완료 경기)
    //    실제 입력 실수 사례 기반: 스코어≠골 합, 어시스트 미연결(assists 테이블),
    //    GK 실점≠상대 득점, 라인업/감독/시청률 누락
    const completedMatches = await prisma.match.findMany({
      where: {
        ...(seasonId ? { season_id: parseInt(seasonId) } : {}),
        status: 'completed',
      },
      select: {
        match_id: true,
        home_team_id: true,
        away_team_id: true,
        home_score: true,
        away_score: true,
        rating_nationwide: true,
        home_team: { select: { team_name: true } },
        away_team: { select: { team_name: true } },
        goals: {
          select: {
            goal_id: true,
            player_id: true,
            goal_type: true,
            assist_id: true,
          },
        },
        assists: { select: { goal_id: true, player_id: true } },
        match_coaches: { select: { id: true } },
        player_match_stats: {
          select: {
            player_id: true,
            team_id: true,
            goals: true,
            assists: true,
            goals_conceded: true,
          },
        },
      },
    });

    for (const m of completedMatches) {
      const label = `${m.home_team?.team_name} vs ${m.away_team?.team_name} (경기 ${m.match_id})`;
      const pms = m.player_match_stats;

      // 기록 누락
      if (pms.length === 0) {
        issues.push(`${label}: 라인업(player_match_stats) 미입력`);
        continue; // 라인업 없이는 이하 검증 불가
      }
      if (m.match_coaches.length === 0) {
        issues.push(`${label}: 경기 감독(match_coaches) 미입력`);
      }
      if (m.rating_nationwide === null) {
        issues.push(`${label}: 시청률 미입력`);
      }

      const playerTeam = new Map<number, number | null>();
      pms.forEach((p) => {
        if (p.player_id != null) playerTeam.set(p.player_id, p.team_id);
      });

      // 스코어 vs 골 기록 (자책골은 상대 팀 득점으로 귀속)
      let homeGoals = 0;
      let awayGoals = 0;
      for (const g of m.goals) {
        const scorerTeam = playerTeam.get(g.player_id);
        if (scorerTeam == null) {
          issues.push(
            `${label}: 골 기록의 선수(id ${g.player_id})가 라인업에 없음`
          );
          continue;
        }
        const isOwnGoal = g.goal_type === 'own_goal';
        const creditedToHome =
          (scorerTeam === m.home_team_id) !== isOwnGoal ? true : false;
        if (creditedToHome) homeGoals++;
        else awayGoals++;
      }
      if (
        homeGoals !== (m.home_score ?? 0) ||
        awayGoals !== (m.away_score ?? 0)
      ) {
        issues.push(
          `${label}: 스코어 불일치 (matches: ${m.home_score}:${m.away_score}, goals 집계: ${homeGoals}:${awayGoals})`
        );
      }

      // GK 실점 합 vs 상대 득점
      const homeConceded = pms
        .filter((p) => p.team_id === m.home_team_id)
        .reduce((a, p) => a + (p.goals_conceded ?? 0), 0);
      const awayConceded = pms
        .filter((p) => p.team_id === m.away_team_id)
        .reduce((a, p) => a + (p.goals_conceded ?? 0), 0);
      if (homeConceded !== (m.away_score ?? 0)) {
        issues.push(
          `${label}: 홈 GK 실점 합(${homeConceded}) ≠ 원정 득점(${m.away_score})`
        );
      }
      if (awayConceded !== (m.home_score ?? 0)) {
        issues.push(
          `${label}: 원정 GK 실점 합(${awayConceded}) ≠ 홈 득점(${m.home_score})`
        );
      }

      // 어시스트 연결: goals.assist_id ↔ assists 테이블 (화면은 assists 테이블 기준)
      const assistRows = new Set(m.assists.map((a) => a.goal_id));
      for (const g of m.goals) {
        if (g.assist_id != null && !assistRows.has(g.goal_id)) {
          issues.push(
            `${label}: 골 ${g.goal_id}의 어시스트가 assists 테이블에 없음 (화면 미표시)`
          );
        }
      }

      // 개인 골/어시스트 스탯 vs 골 기록
      const goalsByPlayer = new Map<number, number>();
      const assistsByPlayer = new Map<number, number>();
      for (const g of m.goals) {
        if (g.goal_type !== 'own_goal') {
          goalsByPlayer.set(
            g.player_id,
            (goalsByPlayer.get(g.player_id) ?? 0) + 1
          );
        }
        if (g.assist_id != null) {
          assistsByPlayer.set(
            g.assist_id,
            (assistsByPlayer.get(g.assist_id) ?? 0) + 1
          );
        }
      }
      for (const p of pms) {
        if (p.player_id == null) continue;
        const expectedGoals = goalsByPlayer.get(p.player_id) ?? 0;
        const expectedAssists = assistsByPlayer.get(p.player_id) ?? 0;
        if ((p.goals ?? 0) !== expectedGoals) {
          issues.push(
            `${label}: 선수 ${p.player_id} 개인 득점(${p.goals}) ≠ 골 기록(${expectedGoals})`
          );
        }
        if ((p.assists ?? 0) !== expectedAssists) {
          issues.push(
            `${label}: 선수 ${p.player_id} 개인 도움(${p.assists}) ≠ 골 기록(${expectedAssists})`
          );
        }
      }
    }

    // 6. 감독 현재 팀 테이블 드리프트 (수동 관리 테이블 ↔ is_current 원본)
    const [currentHeadCoaches, currentHistory] = await Promise.all([
      prisma.team_current_head_coach.findMany({
        select: {
          coach_id: true,
          team_id: true,
          coaches: { select: { name: true } },
        },
      }),
      prisma.teamCoachHistory.findMany({
        where: { is_current: true, role: 'head' },
        select: { coach_id: true, team_id: true },
      }),
    ]);
    const historyPairs = new Set(
      currentHistory.map((h) => `${h.coach_id}-${h.team_id}`)
    );
    for (const c of currentHeadCoaches) {
      if (!historyPairs.has(`${c.coach_id}-${c.team_id}`)) {
        issues.push(
          `감독 테이블 드리프트: ${c.coaches?.name}(coach ${c.coach_id})의 team_current_head_coach(팀 ${c.team_id})가 team_coach_history의 is_current와 불일치`
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
        matches: completedMatches.length,
        current_head_coaches: currentHeadCoaches.length,
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
