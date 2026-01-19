import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// POST /api/admin/matches/[match_id]/update-stats - 경기 완료 후 통계 업데이트
export async function POST(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    // 경기 정보 조회
    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (!match.season_id) {
      return NextResponse.json(
        { error: 'Match has no season_id' },
        { status: 400 }
      );
    }

    const seasonId = match.season_id;

    // 1. 순위표 업데이트 (해당 시즌만)
    await updateStandings(seasonId);

    // 2. 팀 시즌 통계 업데이트
    await updateTeamSeasonStats(seasonId);

    // 3. 팀-시즌 관계 업데이트
    await updateTeamSeasons(seasonId);

    // 4. 상대전적 업데이트 (전체)
    await updateH2HStats();

    return NextResponse.json({
      message: '통계가 성공적으로 업데이트되었습니다.',
      match_id: matchId,
      season_id: seasonId,
    });
  } catch (error) {
    console.error('Failed to update stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to update stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// 순위표 업데이트
async function updateStandings(seasonId: number) {
  // 기존 순위표 삭제
  await prisma.standing.deleteMany({ where: { season_id: seasonId } });

  // 완료된 경기들 조회
  const matches = await prisma.match.findMany({
    where: {
      season_id: seasonId,
      status: 'completed',
      home_score: { not: null },
      away_score: { not: null },
    },
  });

  // 팀별 통계 계산
  const teamStats = new Map<
    number,
    {
      matches_played: number;
      wins: number;
      draws: number;
      losses: number;
      goals_for: number;
      goals_against: number;
      points: number;
    }
  >();

  for (const match of matches) {
    if (!match.home_team_id || !match.away_team_id) continue;

    // 홈팀 초기화
    if (!teamStats.has(match.home_team_id)) {
      teamStats.set(match.home_team_id, {
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        points: 0,
      });
    }

    // 원정팀 초기화
    if (!teamStats.has(match.away_team_id)) {
      teamStats.set(match.away_team_id, {
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        points: 0,
      });
    }

    const homeStats = teamStats.get(match.home_team_id)!;
    const awayStats = teamStats.get(match.away_team_id)!;

    homeStats.matches_played++;
    awayStats.matches_played++;

    homeStats.goals_for += match.home_score || 0;
    homeStats.goals_against += match.away_score || 0;
    awayStats.goals_for += match.away_score || 0;
    awayStats.goals_against += match.home_score || 0;

    // 승부 판정
    const homeScore = match.home_score || 0;
    const awayScore = match.away_score || 0;

    if (homeScore > awayScore) {
      homeStats.wins++;
      homeStats.points += 3;
      awayStats.losses++;
    } else if (homeScore < awayScore) {
      awayStats.wins++;
      awayStats.points += 3;
      homeStats.losses++;
    } else {
      // 무승부 - 승부차기 확인
      if (
        match.penalty_home_score !== null &&
        match.penalty_away_score !== null
      ) {
        if ((match.penalty_home_score || 0) > (match.penalty_away_score || 0)) {
          homeStats.wins++;
          homeStats.points += 3;
          awayStats.losses++;
        } else {
          awayStats.wins++;
          awayStats.points += 3;
          homeStats.losses++;
        }
      } else {
        homeStats.draws++;
        awayStats.draws++;
        homeStats.points += 1;
        awayStats.points += 1;
      }
    }
  }

  // 순위표 저장
  const standingsData = Array.from(teamStats.entries()).map(
    ([teamId, stats]) => ({
      season_id: seasonId,
      team_id: teamId,
      position: 1, // 임시값
      matches_played: stats.matches_played,
      wins: stats.wins,
      draws: stats.draws,
      losses: stats.losses,
      goals_for: stats.goals_for,
      goals_against: stats.goals_against,
      goal_difference: stats.goals_for - stats.goals_against,
      points: stats.points,
    })
  );

  // 순위 정렬
  standingsData.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_difference !== a.goal_difference)
      return b.goal_difference - a.goal_difference;
    return b.goals_for - a.goals_for;
  });

  // 순위 할당 및 저장
  for (let i = 0; i < standingsData.length; i++) {
    standingsData[i].position = i + 1;
    await prisma.standing.create({ data: standingsData[i] });
  }
}

// 팀 시즌 통계 업데이트
async function updateTeamSeasonStats(seasonId: number) {
  // 기존 팀 시즌 통계 삭제
  await prisma.teamSeasonStats.deleteMany({ where: { season_id: seasonId } });

  // 순위표에서 데이터 가져오기
  const standings = await prisma.standing.findMany({
    where: { season_id: seasonId },
  });

  // 팀 시즌 통계 저장
  for (const standing of standings) {
    await prisma.teamSeasonStats.create({
      data: {
        season_id: standing.season_id,
        team_id: standing.team_id,
        matches_played: standing.matches_played,
        wins: standing.wins,
        draws: standing.draws,
        losses: standing.losses,
        goals_for: standing.goals_for,
        goals_against: standing.goals_against,
        points: standing.points,
      },
    });
  }
}

// 팀-시즌 관계 업데이트
async function updateTeamSeasons(seasonId: number) {
  // 기존 팀-시즌 관계 삭제
  await prisma.teamSeason.deleteMany({ where: { season_id: seasonId } });

  // 해당 시즌 경기에 참여한 팀 조회
  const matches = await prisma.match.findMany({
    where: {
      season_id: seasonId,
      home_team_id: { not: null },
      away_team_id: { not: null },
    },
    select: {
      home_team_id: true,
      away_team_id: true,
    },
  });

  const teamIds = new Set<number>();
  for (const match of matches) {
    if (match.home_team_id) teamIds.add(match.home_team_id);
    if (match.away_team_id) teamIds.add(match.away_team_id);
  }

  // 팀-시즌 관계 저장
  for (const teamId of Array.from(teamIds)) {
    await prisma.teamSeason.create({
      data: {
        season_id: seasonId,
        team_id: teamId,
      },
    });
  }
}

// 상대전적 업데이트 (전체 시즌 기반)
async function updateH2HStats() {
  // 기존 상대전적 삭제
  await prisma.h2hPairStats.deleteMany();

  // 완료된 경기 조회
  const matches = await prisma.match.findMany({
    where: {
      status: 'completed',
      home_score: { not: null },
      away_score: { not: null },
    },
  });

  const h2hStats = new Map<
    string,
    {
      team1_id: number;
      team2_id: number;
      team1_wins: number;
      team2_wins: number;
      draws: number;
      team1_goals: number;
      team2_goals: number;
    }
  >();

  for (const match of matches) {
    if (!match.home_team_id || !match.away_team_id) continue;

    const team1 = Math.min(match.home_team_id, match.away_team_id);
    const team2 = Math.max(match.home_team_id, match.away_team_id);
    const key = `${team1}-${team2}`;

    if (!h2hStats.has(key)) {
      h2hStats.set(key, {
        team1_id: team1,
        team2_id: team2,
        team1_wins: 0,
        team2_wins: 0,
        draws: 0,
        team1_goals: 0,
        team2_goals: 0,
      });
    }

    const stats = h2hStats.get(key)!;

    let team1Score, team2Score;
    if (match.home_team_id === team1) {
      team1Score = match.home_score || 0;
      team2Score = match.away_score || 0;
    } else {
      team1Score = match.away_score || 0;
      team2Score = match.home_score || 0;
    }

    stats.team1_goals += team1Score;
    stats.team2_goals += team2Score;

    if (team1Score > team2Score) {
      stats.team1_wins++;
    } else if (team1Score < team2Score) {
      stats.team2_wins++;
    } else {
      // 무승부 - 승부차기 확인
      if (
        match.penalty_home_score !== null &&
        match.penalty_away_score !== null
      ) {
        let team1PenaltyScore, team2PenaltyScore;
        if (match.home_team_id === team1) {
          team1PenaltyScore = match.penalty_home_score || 0;
          team2PenaltyScore = match.penalty_away_score || 0;
        } else {
          team1PenaltyScore = match.penalty_away_score || 0;
          team2PenaltyScore = match.penalty_home_score || 0;
        }

        if (team1PenaltyScore > team2PenaltyScore) {
          stats.team1_wins++;
        } else {
          stats.team2_wins++;
        }
      } else {
        stats.draws++;
      }
    }
  }

  // 상대전적 저장
  for (const [, stats] of Array.from(h2hStats)) {
    await prisma.h2hPairStats.create({
      data: {
        team_small_id: stats.team1_id,
        team_large_id: stats.team2_id,
        total_matches: stats.team1_wins + stats.team2_wins + stats.draws,
        small_wins: stats.team1_wins,
        large_wins: stats.team2_wins,
        draws: stats.draws,
        small_goals: stats.team1_goals,
        large_goals: stats.team2_goals,
      },
    });
  }
}
