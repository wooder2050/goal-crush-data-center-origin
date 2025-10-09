import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = parseInt(params.teamId);
    const { searchParams } = new URL(request.url);
    const beforeDate = searchParams.get('before');

    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
    }

    if (!beforeDate) {
      return NextResponse.json(
        { error: 'before date is required' },
        { status: 400 }
      );
    }

    // 해당 날짜 이전의 가장 최근 경기 찾기
    const lastMatch = await prisma.match.findFirst({
      where: {
        OR: [{ home_team_id: teamId }, { away_team_id: teamId }],
        match_date: { lt: beforeDate },
        home_score: { not: null },
        away_score: { not: null },
      },
      orderBy: { match_date: 'desc' },
      select: { match_id: true },
    });

    if (!lastMatch) {
      return NextResponse.json([]);
    }

    // 최근 경기의 라인업 조회
    const lineups = await prisma.playerMatchStats.findMany({
      where: {
        match_id: lastMatch.match_id,
        team_id: teamId,
      },
      select: {
        player: {
          select: {
            player_id: true,
            name: true,
            jersey_number: true,
          },
        },
        position: true,
        minutes_played: true,
        goals: true,
        assists: true,
      },
    });

    // 포맷팅 - minutes_played를 기반으로 participation_status 결정
    const formattedLineups = lineups.map((p) => {
      let participation_status: 'starting' | 'substitute' | 'bench';

      if (p.minutes_played && p.minutes_played > 0) {
        // 90분 이상이면 선발, 그렇지 않으면 교체 출전
        participation_status =
          p.minutes_played >= 10 ? 'starting' : 'substitute';
      } else {
        // 출전하지 않았으면 벤치
        participation_status = 'bench';
      }

      return {
        player_id: p.player?.player_id || 0,
        player_name: p.player?.name || 'Unknown',
        jersey_number: p.player?.jersey_number,
        position: p.position || 'Unknown',
        participation_status,
      };
    });

    return NextResponse.json(formattedLineups);
  } catch (error) {
    console.error('Failed to fetch last match lineups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch last match lineups' },
      { status: 500 }
    );
  }
}
