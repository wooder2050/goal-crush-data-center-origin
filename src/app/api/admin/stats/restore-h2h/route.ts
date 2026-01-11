import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/admin/stats/restore-h2h - H2H 통계 복구
export async function POST() {
  try {
    console.log('H2H 상대전적 통계 복구 시작...');

    // 기존 h2hPairStats 삭제
    await prisma.h2hPairStats.deleteMany();
    console.log('기존 H2H 데이터 삭제 완료');

    // 완료된 모든 경기들로부터 상대전적 계산
    const matches = await prisma.match.findMany({
      where: {
        status: 'completed',
        home_score: { not: null },
        away_score: { not: null },
        home_team_id: { not: null },
        away_team_id: { not: null },
      },
      select: {
        match_id: true,
        home_team_id: true,
        away_team_id: true,
        home_score: true,
        away_score: true,
      },
    });

    console.log(`총 ${matches.length}개 경기 데이터로부터 H2H 통계 계산 중...`);

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
        total_matches: number;
      }
    >();

    let processedMatches = 0;
    let skippedMatches = 0;

    matches.forEach((match) => {
      // home_team_id, away_team_id가 null인 경우 건너뛰기
      if (!match.home_team_id || !match.away_team_id) {
        console.log(`Skipping match ${match.match_id} - missing team data`);
        skippedMatches++;
        return;
      }

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
          total_matches: 0,
        });
      }

      const stats = h2hStats.get(key);
      if (!stats) return;

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
      stats.total_matches++;

      if (team1Score > team2Score) {
        stats.team1_wins++;
      } else if (team1Score < team2Score) {
        stats.team2_wins++;
      } else {
        stats.draws++;
      }

      processedMatches++;
    });

    console.log(
      `처리된 경기: ${processedMatches}개, 건너뛴 경기: ${skippedMatches}개`
    );
    console.log(`생성될 H2H 페어: ${h2hStats.size}개`);

    // H2H 통계를 데이터베이스에 저장
    let createdCount = 0;
    for (const [key, stats] of Array.from(h2hStats.entries())) {
      try {
        await prisma.h2hPairStats.create({
          data: {
            team_small_id: stats.team1_id,
            team_large_id: stats.team2_id,
            total_matches: stats.total_matches,
            small_wins: stats.team1_wins,
            large_wins: stats.team2_wins,
            draws: stats.draws,
            small_goals: stats.team1_goals,
            large_goals: stats.team2_goals,
          },
        });
        createdCount++;
      } catch (error) {
        console.error(`H2H 페어 ${key} 생성 실패:`, error);
      }
    }

    console.log(`H2H 통계 복구 완료: ${createdCount}개 페어 생성`);

    return NextResponse.json({
      message: 'H2H 상대전적 통계가 성공적으로 복구되었습니다.',
      results: {
        total_matches_processed: processedMatches,
        skipped_matches: skippedMatches,
        h2h_pairs_created: createdCount,
        expected_pairs: h2hStats.size,
      },
    });
  } catch (error) {
    console.error('H2H 통계 복구 실패:', error);
    return NextResponse.json(
      {
        error: 'H2H 통계 복구 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
