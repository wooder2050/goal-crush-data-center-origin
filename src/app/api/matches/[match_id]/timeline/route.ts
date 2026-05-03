import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    // 경기 정보 (팀 로고, 색상)
    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
      include: {
        home_team: {
          select: {
            team_id: true,
            team_name: true,
            logo: true,
            primary_color: true,
            secondary_color: true,
          },
        },
        away_team: {
          select: {
            team_id: true,
            team_name: true,
            logo: true,
            primary_color: true,
            secondary_color: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // 골, 어시스트, 카드 이벤트를 병렬 조회
    const [goals, assists, cardActions] = await Promise.all([
      prisma.goal.findMany({
        where: { match_id: matchId },
        include: {
          player: {
            select: {
              player_id: true,
              name: true,
              jersey_number: true,
              profile_image_url: true,
            },
          },
        },
        orderBy: { goal_time: 'asc' },
      }),
      prisma.assist.findMany({
        where: { match_id: matchId },
        include: {
          player: {
            select: {
              player_id: true,
              name: true,
              jersey_number: true,
              profile_image_url: true,
            },
          },
        },
      }),
      prisma.matchAction.findMany({
        where: {
          match_id: matchId,
          action_type: 'CARD',
        },
        include: {
          player: {
            select: {
              player_id: true,
              name: true,
              jersey_number: true,
              profile_image_url: true,
            },
          },
        },
        orderBy: [{ period_id: 'asc' }, { action_index: 'asc' }],
      }),
    ]);

    // 골 선수의 팀 매핑
    const goalPlayerIds = goals.map((g) => g.player_id);
    const assistPlayerIds = assists.map((a) => a.player_id);
    const allPlayerIds = Array.from(new Set([...goalPlayerIds, ...assistPlayerIds]));

    const playerTeams = await prisma.playerMatchStats.findMany({
      where: {
        match_id: matchId,
        player_id: { in: allPlayerIds },
      },
      select: {
        player_id: true,
        team_id: true,
      },
    });
    const playerTeamMap = new Map(
      playerTeams.map((pt) => [pt.player_id, pt.team_id])
    );

    // 어시스트를 goal_id로 그루핑
    const assistsByGoal = new Map<
      number,
      {
        player_id: number;
        player_name: string;
        profile_image_url: string | null;
      }[]
    >();
    for (const assist of assists) {
      const list = assistsByGoal.get(assist.goal_id) || [];
      list.push({
        player_id: assist.player.player_id,
        player_name: assist.player.name,
        profile_image_url: assist.player.profile_image_url,
      });
      assistsByGoal.set(assist.goal_id, list);
    }

    const timeline = {
      home_team: match.home_team,
      away_team: match.away_team,
      goals: goals.map((g) => ({
        goal_id: g.goal_id,
        player_id: g.player_id,
        player_name: g.player.name,
        profile_image_url: g.player.profile_image_url,
        team_id: playerTeamMap.get(g.player_id) ?? null,
        goal_time: g.goal_time,
        goal_type: g.goal_type,
        assists: assistsByGoal.get(g.goal_id) || [],
      })),
      cards: cardActions.map((a) => ({
        player_id: a.player_id,
        player_name: a.player.name,
        profile_image_url: a.player.profile_image_url,
        team_id: a.team_id,
        card_type: a.result === 'RED_CARD' ? 'red' : 'yellow',
        period_id: a.period_id,
        action_index: a.action_index,
      })),
    };

    return NextResponse.json(timeline);
  } catch (error) {
    console.error('Failed to fetch match timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match timeline' },
      { status: 500 }
    );
  }
}
