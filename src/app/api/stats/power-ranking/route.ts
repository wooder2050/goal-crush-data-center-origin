import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

/**
 * GET /api/stats/power-ranking?limit=20
 * 현재 시즌 파워랭킹 (포지션별 가중치 기반 복합 지수)
 * 공식 상세: docs/power-ranking-formula.md
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') ?? '20'),
      100
    );

    // 현재 시즌
    const currentSeason = await prisma.season.findFirst({
      orderBy: { season_id: 'desc' },
      select: { season_id: true, season_name: true },
    });

    if (!currentSeason) {
      return NextResponse.json({ rankings: [], season: null });
    }

    const seasonId = currentSeason.season_id;

    // 평점 데이터가 있는 경기의 선수 통계
    const ratedMatches = await prisma.playerMatchRating.findMany({
      where: { match: { season_id: seasonId } },
      select: { match_id: true, player_id: true },
    });

    const ratedMatchPlayerSet = new Set(
      ratedMatches.map((r) => `${r.match_id}-${r.player_id}`)
    );

    // 해당 시즌 모든 선수 경기 통계
    const allPms = await prisma.playerMatchStats.findMany({
      where: {
        match: { season_id: seasonId },
        minutes_played: { gt: 0 },
        player_id: { not: null },
      },
      select: {
        player_id: true,
        match_id: true,
        team_id: true,
        goals: true,
        assists: true,
        goals_conceded: true,
        minutes_played: true,
        position: true,
        match: {
          select: {
            home_team_id: true,
            away_team_id: true,
            home_score: true,
            away_score: true,
            penalty_home_score: true,
            penalty_away_score: true,
          },
        },
      },
    });

    // 평점 데이터가 있는 경기만 필터
    const filteredPms = allPms.filter((pms) =>
      ratedMatchPlayerSet.has(`${pms.match_id}-${pms.player_id}`)
    );

    // 평점 데이터
    const ratings = await prisma.playerMatchRating.findMany({
      where: { match: { season_id: seasonId } },
      select: { player_id: true, match_id: true, rating: true },
    });
    const ratingsMap = new Map<string, number>();
    for (const r of ratings) {
      ratingsMap.set(`${r.match_id}-${r.player_id}`, r.rating);
    }

    // xT 평점
    const xtRatings = await prisma.playerMatchXtRating.findMany({
      where: { match: { season_id: seasonId } },
      select: { player_id: true, match_id: true, xt_rating: true },
    });
    const xtMap = new Map<string, number>();
    for (const r of xtRatings) {
      xtMap.set(`${r.match_id}-${r.player_id}`, r.xt_rating);
    }

    // 경기별 액션 점수 (player_id + match_id 별)
    const actionByMatch = await prisma.$queryRawUnsafe<
      Array<{ player_id: number; match_id: number; action_score: number }>
    >(`
      SELECT ma.player_id, ma.match_id,
        SUM(CASE
          WHEN ma.action_type = 'SHOT' AND ma.result = 'GOAL' THEN 10
          WHEN ma.action_type = 'SHOT' AND ma.result = 'SUCCESS' THEN 3
          WHEN ma.action_type = 'SHOT' AND ma.result = 'FAIL' THEN -0.5
          WHEN ma.action_type = 'PASS' AND ma.result = 'SUCCESS' THEN 1
          WHEN ma.action_type = 'PASS' AND ma.result = 'FAIL' THEN -1
          WHEN ma.action_type = 'DRIBBLE' AND ma.result = 'SUCCESS' THEN 3
          WHEN ma.action_type = 'DRIBBLE' AND ma.result = 'FAIL' THEN -1
          WHEN ma.action_type IN ('CORNER_KICK','FREE_KICK','KICK_IN') AND ma.result = 'SUCCESS' THEN 1
          WHEN ma.action_type IN ('CORNER_KICK','FREE_KICK','KICK_IN') AND ma.result = 'FAIL' THEN -0.5
          WHEN ma.action_type = 'INTERCEPTION' THEN 3
          WHEN ma.action_type = 'CLEARANCE' AND ma.result = 'SUCCESS' THEN 2
          WHEN ma.action_type = 'CLEARANCE' AND ma.result = 'FAIL' THEN -1
          WHEN ma.action_type = 'CLEARANCE' AND ma.result = 'OWN_GOAL' THEN -10
          WHEN ma.action_type = 'TACKLE' AND ma.result = 'SUCCESS' THEN 3
          WHEN ma.action_type = 'TACKLE' AND ma.result = 'FAIL' THEN -1
          WHEN ma.action_type = 'KEEPER_SAVE' AND ma.result = 'SUCCESS' THEN 4
          WHEN ma.action_type = 'KEEPER_SAVE' AND ma.result = 'FAIL' THEN -1
          WHEN ma.action_type = 'KEEPER_THROW' AND ma.result = 'SUCCESS' THEN 1
          WHEN ma.action_type = 'KEEPER_THROW' AND ma.result = 'FAIL' THEN -1
          WHEN ma.action_type = 'FOUL' THEN -2
          WHEN ma.action_type = 'BAD_TOUCH' THEN -1
          ELSE 0
        END)::float as action_score
      FROM match_actions ma
      JOIN matches m ON ma.match_id = m.match_id
      WHERE m.season_id = ${seasonId}
      GROUP BY ma.player_id, ma.match_id
    `);
    const actionMatchMap = new Map<string, number>();
    for (const a of actionByMatch) {
      actionMatchMap.set(`${a.match_id}-${a.player_id}`, a.action_score);
    }

    // 경기별 세이브 (player_id + match_id 별)
    const savesByMatch = await prisma.$queryRawUnsafe<
      Array<{
        player_id: number;
        match_id: number;
        total: number;
        success: number;
      }>
    >(`
      SELECT ma.player_id, ma.match_id,
        COUNT(*)::int as total,
        SUM(CASE WHEN ma.result = 'SUCCESS' THEN 1 ELSE 0 END)::int as success
      FROM match_actions ma
      JOIN matches m ON ma.match_id = m.match_id
      WHERE m.season_id = ${seasonId} AND ma.action_type = 'KEEPER_SAVE'
      GROUP BY ma.player_id, ma.match_id
    `);
    const saveMatchMap = new Map<string, { total: number; success: number }>();
    for (const s of savesByMatch) {
      saveMatchMap.set(`${s.match_id}-${s.player_id}`, {
        total: s.total,
        success: s.success,
      });
    }

    // ── 경기 단위 PI 계산 후 선수별 평균 ──

    type PIBreakdownItem = {
      normalized: number;
      weight: number;
      contribution: number;
    };
    type PIBreakdown = Record<string, PIBreakdownItem>;
    type PIResult = { pi: number; breakdown: PIBreakdown };

    // 경기별 PI를 계산하는 함수
    const calcMatchPI = (
      pos: string,
      atkPts: number,
      actionScore: number,
      win: boolean,
      statsRating: number | null,
      xtRating: number | null,
      cleanSheet: boolean,
      goalsConceded: number | null,
      savePct: number | null,
      isFullTimeGK: boolean
    ): PIResult => {
      const nAtk = Math.min(atkPts / 4.0, 1.0);
      const nAction = Math.min(actionScore / 80.0, 1.0);
      const nWin = win ? 1.0 : 0.0;
      const nStats = (statsRating ?? 6) / 10.0;
      const nXt = (xtRating ?? 6) / 10.0;
      const nCs = cleanSheet ? 1.0 : 0.0;
      const nConcInv = goalsConceded != null ? 1.0 / (1.0 + goalsConceded) : 0;
      const nSave = savePct ?? 0;

      const build = (
        items: [string, number, number][]
      ): PIResult => {
        const breakdown: PIBreakdown = {};
        let pi = 0;
        for (const [key, norm, weight] of items) {
          const contribution = norm * weight;
          breakdown[key] = { normalized: norm, weight, contribution };
          pi += contribution;
        }
        return { pi, breakdown };
      };

      if (pos === 'FW') {
        return build([
          ['atk', nAtk, 30],
          ['action', nAction, 10],
          ['win', nWin, 15],
          ['stats', nStats, 20],
          ['xt', nXt, 25],
        ]);
      } else if (pos === 'MF') {
        return build([
          ['atk', nAtk, 25],
          ['action', nAction, 10],
          ['win', nWin, 15],
          ['stats', nStats, 25],
          ['xt', nXt, 25],
        ]);
      } else if (pos === 'DF') {
        return build([
          ['atk', nAtk, 25],
          ['action', nAction, 10],
          ['win', nWin, 15],
          ['stats', nStats, 25],
          ['xt', nXt, 20],
          ['cs', nCs, 5],
        ]);
      } else if (pos === 'GK') {
        const gkBoost = isFullTimeGK ? 1.0 : 0.5;
        return build([
          ['atk', nAtk, 5],
          ['action', nAction, 10],
          ['win', nWin, 15],
          ['stats', nStats, 10],
          ['xt', nXt, 10],
          ['cs', nCs, 20 * gkBoost],
          ['conc', nConcInv, 15 * gkBoost],
          ['save', nSave, 15 * gkBoost],
        ]);
      }
      return { pi: 0, breakdown: {} };
    };

    // 선수별 경기 PI 합산
    type PlayerResult = {
      player_id: number;
      team_id: number;
      piScores: number[];
      piBreakdowns: PIBreakdown[];
      positionCounts: Map<string, number>;
      totalGoals: number;
      totalAssists: number;
      totalWins: number;
      totalCleanSheets: number;
      statsRatings: number[];
      xtRatings: number[];
      actionScores: number[];
      totalSaves: number;
      successfulSaves: number;
    };
    const playerResults = new Map<number, PlayerResult>();

    for (const pms of filteredPms) {
      const pid = pms.player_id!;
      const tid = pms.team_id!;
      const pos = pms.position ?? 'FW';
      const mid = pms.match_id;

      if (!playerResults.has(pid)) {
        playerResults.set(pid, {
          player_id: pid,
          team_id: tid,
          piScores: [],
          piBreakdowns: [],
          positionCounts: new Map(),
          totalGoals: 0,
          totalAssists: 0,
          totalWins: 0,
          totalCleanSheets: 0,
          statsRatings: [],
          xtRatings: [],
          actionScores: [],
          totalSaves: 0,
          successfulSaves: 0,
        });
      }
      const pr = playerResults.get(pid)!;
      pr.positionCounts.set(pos, (pr.positionCounts.get(pos) ?? 0) + 1);

      const goals = pms.goals ?? 0;
      const assists = pms.assists ?? 0;
      pr.totalGoals += goals;
      pr.totalAssists += assists;

      // 승리 판정
      const m = pms.match;
      let win = false;
      let cleanSheet = false;
      if (m && m.home_score != null && m.away_score != null) {
        const isHome = m.home_team_id === tid;
        const teamScore = isHome ? m.home_score : m.away_score;
        const oppScore = isHome ? m.away_score : m.home_score;
        if (teamScore > oppScore) {
          win = true;
        } else if (teamScore === oppScore) {
          const pkTeam = isHome ? m.penalty_home_score : m.penalty_away_score;
          const pkOpp = isHome ? m.penalty_away_score : m.penalty_home_score;
          if (pkTeam != null && pkOpp != null && pkTeam > pkOpp) win = true;
        }
        if (oppScore === 0) cleanSheet = true;
      }
      if (win) pr.totalWins += 1;
      if (cleanSheet) pr.totalCleanSheets += 1;

      const sr = ratingsMap.get(`${mid}-${pid}`) ?? null;
      const xr = xtMap.get(`${mid}-${pid}`) ?? null;
      if (sr != null) pr.statsRatings.push(sr);
      if (xr != null) pr.xtRatings.push(xr);

      const actionScore = actionMatchMap.get(`${mid}-${pid}`) ?? 0;
      pr.actionScores.push(actionScore);

      const saves = saveMatchMap.get(`${mid}-${pid}`);
      const matchSavePct =
        saves && saves.total > 0 ? saves.success / saves.total : null;
      if (saves) {
        pr.totalSaves += saves.total;
        pr.successfulSaves += saves.success;
      }

      const minutes = (pms.minutes_played ?? 0) as number;
      const isFullTimeGK = pos === 'GK' && minutes >= 20;

      // 이 경기의 PI 계산 (해당 경기 포지션 공식 적용)
      const matchResult = calcMatchPI(
        pos,
        goals + assists,
        actionScore,
        win,
        sr,
        xr,
        cleanSheet,
        pos === 'GK' ? (pms.goals_conceded ?? 0) : null,
        pos === 'GK' ? matchSavePct : null,
        isFullTimeGK
      );
      pr.piScores.push(matchResult.pi);
      pr.piBreakdowns.push(matchResult.breakdown);
    }

    // 선수 정보 (현재 소속 팀 포함)
    const playerIds = Array.from(playerResults.keys());
    const players = await prisma.player.findMany({
      where: { player_id: { in: playerIds } },
      select: {
        player_id: true,
        name: true,
        profile_image_url: true,
        jersey_number: true,
        player_team_history: {
          select: { team_id: true },
          orderBy: { start_date: 'desc' },
          take: 1,
        },
      },
    });
    const playerInfoMap = new Map(players.map((p) => [p.player_id, p]));

    // 현재 소속 팀 결정 (player_team_history 최신 기록)
    for (const p of players) {
      const currentTeamId = p.player_team_history?.[0]?.team_id;
      if (currentTeamId) {
        const pr = playerResults.get(p.player_id);
        if (pr) pr.team_id = currentTeamId;
      }
    }

    // 팀 정보
    const teamIds = Array.from(
      new Set(Array.from(playerResults.values()).map((a) => a.team_id))
    );
    const teams = await prisma.team.findMany({
      where: { team_id: { in: teamIds } },
      select: {
        team_id: true,
        team_name: true,
        logo: true,
        primary_color: true,
      },
    });
    const teamMap = new Map(teams.map((t) => [t.team_id, t]));

    // 결과 생성
    type BreakdownEntry = {
      label: string;
      normalized: number;
      weight: number;
      contribution: number;
      raw_value: string;
    };
    type RankingRow = {
      rank: number;
      player_id: number;
      name: string;
      profile_image_url: string | null;
      jersey_number: number | null;
      team_name: string;
      team_logo: string | null;
      team_color: string | null;
      position: string;
      power_index: number;
      matches: number;
      goals: number;
      assists: number;
      win_rate: number;
      avg_stats_rating: number | null;
      avg_xt_rating: number | null;
      action_per_match: number;
      clean_sheets: number;
      save_pct: number | null;
      breakdown: BreakdownEntry[];
    };

    const rankings: RankingRow[] = [];

    for (const pr of Array.from(playerResults.values())) {
      if (pr.piScores.length < 1) continue;

      const matches = pr.piScores.length;
      const avgPI = pr.piScores.reduce((a, b) => a + b, 0) / matches;

      // 포지션 (출전 횟수 순 정렬)
      const sortedPositions = Array.from(pr.positionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([p]) => p);
      const positionLabel = sortedPositions.join('/') || 'FW';

      const winRate = matches > 0 ? pr.totalWins / matches : 0;
      const avgStats =
        pr.statsRatings.length > 0
          ? pr.statsRatings.reduce((a, b) => a + b, 0) / pr.statsRatings.length
          : null;
      const avgXt =
        pr.xtRatings.length > 0
          ? pr.xtRatings.reduce((a, b) => a + b, 0) / pr.xtRatings.length
          : null;
      const avgAction =
        pr.actionScores.length > 0
          ? pr.actionScores.reduce((a, b) => a + b, 0) / pr.actionScores.length
          : 0;
      const savePct =
        pr.totalSaves > 0 ? pr.successfulSaves / pr.totalSaves : null;

      // breakdown 평균 계산
      const allKeys = new Set<string>();
      for (const bd of pr.piBreakdowns) {
        for (const k of Object.keys(bd)) allKeys.add(k);
      }
      const LABELS: Record<string, string> = {
        atk: '공격포인트',
        action: '액션 점수',
        win: '승리',
        stats: 'stats 평점',
        xt: 'xT 평점',
        cs: '클린시트',
        conc: '실점 역수',
        save: '세이브 성공률',
      };
      const RAW_VALUES: Record<string, string> = {
        atk: `${pr.totalGoals}골 ${pr.totalAssists}도움`,
        action: `${Math.round(avgAction * 10) / 10}/경기`,
        win: `${Math.round(winRate * 100)}%`,
        stats: avgStats ? (Math.round(avgStats * 100) / 100).toFixed(2) : '-',
        xt: avgXt ? (Math.round(avgXt * 100) / 100).toFixed(2) : '-',
        cs: `${pr.totalCleanSheets}회`,
        conc: '-',
        save: savePct ? `${Math.round(savePct * 1000) / 10}%` : '-',
      };
      const breakdown: BreakdownEntry[] = [];
      for (const key of Array.from(allKeys)) {
        // 해당 지표가 없는 경기는 0으로 처리 (복수 포지션 선수의 합계 정합성)
        const avgNorm =
          pr.piBreakdowns.reduce(
            (s, bd) => s + (bd[key]?.normalized ?? 0),
            0
          ) / matches;
        const avgWeight =
          pr.piBreakdowns.reduce(
            (s, bd) => s + (bd[key]?.weight ?? 0),
            0
          ) / matches;
        const avgContrib =
          pr.piBreakdowns.reduce(
            (s, bd) => s + (bd[key]?.contribution ?? 0),
            0
          ) / matches;
        breakdown.push({
          label: LABELS[key] ?? key,
          normalized: Math.round(avgNorm * 1000) / 1000,
          weight: Math.round(avgWeight * 10) / 10,
          contribution: Math.round(avgContrib * 10) / 10,
          raw_value: RAW_VALUES[key] ?? '-',
        });
      }
      // 기여도 높은 순 정렬
      breakdown.sort((a, b) => b.contribution - a.contribution);

      const info = playerInfoMap.get(pr.player_id);
      const team = teamMap.get(pr.team_id);

      rankings.push({
        rank: 0,
        player_id: pr.player_id,
        name: info?.name ?? '-',
        profile_image_url: info?.profile_image_url ?? null,
        jersey_number: info?.jersey_number ?? null,
        team_name: team?.team_name ?? '-',
        team_logo: team?.logo ?? null,
        team_color: team?.primary_color ?? null,
        position: positionLabel,
        power_index: Math.round(avgPI * 10) / 10,
        matches,
        goals: pr.totalGoals,
        assists: pr.totalAssists,
        win_rate: Math.round(winRate * 100),
        avg_stats_rating: avgStats ? Math.round(avgStats * 100) / 100 : null,
        avg_xt_rating: avgXt ? Math.round(avgXt * 100) / 100 : null,
        action_per_match: Math.round(avgAction * 10) / 10,
        clean_sheets: pr.totalCleanSheets,
        save_pct: savePct ? Math.round(savePct * 1000) / 10 : null,
        breakdown,
      });
    }

    // 정렬 + 순위 부여
    rankings.sort((a, b) => b.power_index - a.power_index);
    rankings.forEach((r, i) => (r.rank = i + 1));

    return NextResponse.json({
      rankings: rankings.slice(0, limit),
      season: currentSeason,
    });
  } catch (error) {
    console.error('Error calculating power ranking:', error);
    return NextResponse.json(
      { error: 'Failed to calculate power ranking' },
      { status: 500 }
    );
  }
}
