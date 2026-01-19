import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// GET /api/teams/[teamId]/players?scope=current|all&order=stats|default - 팀의 선수들 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId: raw } = await params;
    const teamId = parseInt(raw);

    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
    }

    const url = new URL(request.url);
    const scope = (url.searchParams.get('scope') ?? 'all') as 'current' | 'all';
    const order = (url.searchParams.get('order') ?? 'default') as
      | 'default'
      | 'stats';

    // players 테이블 기준 where 절
    // current: 해당 팀에서 is_active = true인 선수들 (현재 소속)
    // all: 해당 팀과 관련된 모든 선수 (히스토리 기반 또는 is_active = true)
    const whereClause =
      scope === 'current'
        ? {
            player_team_history: {
              some: {
                team_id: teamId,
                is_active: true,
              },
            },
          }
        : {
            player_team_history: {
              some: {
                team_id: teamId,
              },
            },
          };

    const players = await prisma.player.findMany({
      where: whereClause,
      select: {
        player_id: true,
        name: true,
        jersey_number: true,
      },
      orderBy:
        order === 'default'
          ? [{ jersey_number: 'asc' }, { name: 'asc' }]
          : undefined,
    });

    if (order === 'stats') {
      // DB 사이드 정렬: 해당 팀에서의 출전/골/도움 집계 기반
      const grouped = await prisma.playerMatchStats.groupBy({
        by: ['player_id'],
        where: { team_id: teamId },
        _count: { match_id: true },
        _sum: { goals: true, assists: true },
      });
      const orderMap = new Map<
        number,
        { apps: number; goals: number; assists: number }
      >();
      for (const g of grouped) {
        orderMap.set(g.player_id ?? 0, {
          apps: g._count?.match_id ?? 0,
          goals: g._sum?.goals ?? 0,
          assists: g._sum?.assists ?? 0,
        });
      }
      // 서버에서 소팅하여 반환 (클라 소팅 금지)
      players.sort((a, b) => {
        const sa = orderMap.get(a.player_id) ?? {
          apps: 0,
          goals: 0,
          assists: 0,
        };
        const sb = orderMap.get(b.player_id) ?? {
          apps: 0,
          goals: 0,
          assists: 0,
        };
        if (sb.apps !== sa.apps) return sb.apps - sa.apps;
        if (sb.goals !== sa.goals) return sb.goals - sa.goals;
        if (sb.assists !== sa.assists) return sb.assists - sa.assists;
        return (a.name ?? '').localeCompare(b.name ?? '');
      });
    }

    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching team players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team players' },
      { status: 500 }
    );
  }
}
