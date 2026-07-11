import { NextRequest, NextResponse } from 'next/server';

import { readPlayerSummary } from '@/features/players/summary-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: { player_id: string } }
) {
  try {
    const playerId = Number(context.params.player_id);
    if (!playerId || Number.isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player id' }, { status: 400 });
    }

    const url = new URL(request.url);
    const teamIdParam = url.searchParams.get('team_id');
    const filterTeamId = teamIdParam ? Number(teamIdParam) : undefined;

    const summary = await readPlayerSummary(playerId, filterTeamId);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching player summary:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch player summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
