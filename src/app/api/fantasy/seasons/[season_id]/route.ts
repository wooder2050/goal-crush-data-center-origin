import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    season_id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const fantasySeasonId = parseInt(params.season_id);

    if (isNaN(fantasySeasonId)) {
      return NextResponse.json({ error: 'Invalid season_id' }, { status: 400 });
    }

    // 판타지 시즌 조회
    const fantasySeason = await prisma.fantasySeason.findUnique({
      where: { fantasy_season_id: fantasySeasonId },
      include: {
        season: {
          select: {
            season_id: true,
            season_name: true,
            category: true,
          },
        },
      },
    });

    if (!fantasySeason) {
      return NextResponse.json(
        { error: 'Fantasy season not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(fantasySeason);
  } catch (error) {
    console.error('Error fetching fantasy season:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
