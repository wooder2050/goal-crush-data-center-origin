import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const seasonId = Number(url.searchParams.get('seasonId'));

    if (!seasonId || isNaN(seasonId)) {
      return NextResponse.json(
        { error: 'seasonId is required' },
        { status: 400 }
      );
    }

    // 인터리그 매치: group_stage가 null이고 description에 '인터리그' 포함
    const matches = await prisma.match.findMany({
      where: {
        season_id: seasonId,
        group_stage: null,
        description: { contains: '인터리그' },
      },
      include: {
        home_team: true,
        away_team: true,
        season: true,
        home_coach: true,
        away_coach: true,
      },
      orderBy: [
        { is_date_confirmed: 'desc' }, // 확정 매치 먼저
        { match_date: 'asc' },
      ],
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Failed to fetch interleague matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interleague matches' },
      { status: 500 }
    );
  }
}
