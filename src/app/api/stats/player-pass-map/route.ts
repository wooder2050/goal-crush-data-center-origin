import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerIdParam = searchParams.get('player_id');
    const matchIdParam = searchParams.get('match_id');

    if (!playerIdParam) {
      return NextResponse.json(
        { error: 'player_id is required' },
        { status: 400 }
      );
    }

    const playerId = parseInt(playerIdParam, 10);
    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player_id' }, { status: 400 });
    }

    // 액션 데이터가 있는 경기 목록 (최신순)
    const matchList = await prisma.$queryRaw<
      Array<{
        match_id: number;
        match_date: string;
        season_name: string;
        home_team_name: string;
        home_team_logo: string | null;
        away_team_name: string;
        away_team_logo: string | null;
        home_score: number | null;
        away_score: number | null;
        is_home: boolean;
        total_passes: number;
        successful_passes: number;
      }>
    >`
      SELECT
        m.match_id,
        m.match_date::text as match_date,
        s.season_name,
        ht.team_name as home_team_name,
        ht.logo as home_team_logo,
        at.team_name as away_team_name,
        at.logo as away_team_logo,
        m.home_score,
        m.away_score,
        (pms.team_id = m.home_team_id) as is_home,
        COUNT(*) FILTER (WHERE a.action_type = 'PASS')::int as total_passes,
        COUNT(*) FILTER (WHERE a.action_type = 'PASS' AND a.result = 'SUCCESS')::int as successful_passes
      FROM match_actions a
      JOIN matches m ON a.match_id = m.match_id
      JOIN seasons s ON m.season_id = s.season_id
      JOIN teams ht ON m.home_team_id = ht.team_id
      JOIN teams at ON m.away_team_id = at.team_id
      JOIN player_match_stats pms ON pms.match_id = m.match_id AND pms.player_id = ${playerId}
      WHERE a.player_id = ${playerId}
      GROUP BY m.match_id, m.match_date, s.season_name,
               pms.team_id, m.home_team_id,
               ht.team_name, at.team_name, ht.logo, at.logo,
               m.home_score, m.away_score
      HAVING COUNT(*) FILTER (WHERE a.action_type = 'PASS') > 0
      ORDER BY m.match_date DESC
    `;

    if (matchList.length === 0) {
      return NextResponse.json({ matches: [], passes: [] });
    }

    const targetMatchId = matchIdParam
      ? parseInt(matchIdParam, 10)
      : matchList[0].match_id;

    if (isNaN(targetMatchId)) {
      return NextResponse.json({ error: 'Invalid match_id' }, { status: 400 });
    }

    // 해당 경기의 패스 데이터 (period_id 포함)
    const passes = await prisma.$queryRaw<
      Array<{
        action_id: number;
        period_id: number | null;
        start_x: number;
        start_y: number;
        end_x: number;
        end_y: number;
        result: string;
        time_seconds: number;
      }>
    >`
      SELECT
        action_id, period_id,
        start_x, start_y, end_x, end_y,
        result::text as result,
        time_seconds
      FROM match_actions
      WHERE player_id = ${playerId}
        AND match_id = ${targetMatchId}
        AND action_type = 'PASS'
      ORDER BY time_seconds
    `;

    // 전반 자기진영 방향 판단: 전반 평균 x가 피치 절반 미만이면 왼쪽이 자기진영
    const firstHalfPasses = passes.filter((p) => p.period_id === 1);
    const avgFirstHalfX =
      firstHalfPasses.length > 0
        ? firstHalfPasses.reduce((s, p) => s + p.start_x, 0) /
          firstHalfPasses.length
        : 0;
    // 전반에 왼쪽(x < 20)에서 주로 플레이 → 왼쪽이 자기진영, 뒤집기 불필요
    // 전반에 오른쪽(x >= 20)에서 주로 플레이 → 전반을 뒤집어야 함
    const flipFirstHalf = avgFirstHalfX >= 20;

    return NextResponse.json({
      matches: matchList,
      match_id: targetMatchId,
      flip_first_half: flipFirstHalf,
      passes,
    });
  } catch (error) {
    console.error('Error fetching player pass map:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pass map' },
      { status: 500 }
    );
  }
}
