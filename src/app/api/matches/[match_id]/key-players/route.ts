import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

type PlayerAgg = {
  player_id: number;
  team_id: number;
  player_name: string;
  jersey_number: number | null;
  position: string | null;
  goals: number;
  assists: number;
  minutes: number;
  profile_image_url: string | null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = Number(params.match_id);
    if (!Number.isFinite(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
      select: {
        match_id: true,
        match_date: true,
        home_team_id: true,
        away_team_id: true,
      },
    });
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const cutoff = match.match_date ? new Date(match.match_date) : new Date();
    const homeTeamId = match.home_team_id!;
    const awayTeamId = match.away_team_id!;

    // 배치 쿼리 1: 두 팀의 최근 10경기를 각각 조회 (병렬)
    const [homeRecentMatches, awayRecentMatches] = await Promise.all([
      prisma.match.findMany({
        where: {
          match_date: { lt: cutoff },
          OR: [{ home_team_id: homeTeamId }, { away_team_id: homeTeamId }],
        },
        orderBy: { match_date: 'desc' },
        take: 10,
        select: { match_id: true },
      }),
      prisma.match.findMany({
        where: {
          match_date: { lt: cutoff },
          OR: [{ home_team_id: awayTeamId }, { away_team_id: awayTeamId }],
        },
        orderBy: { match_date: 'desc' },
        take: 10,
        select: { match_id: true },
      }),
    ]);

    const homeMatchIds = homeRecentMatches.map((m) => m.match_id);
    const awayMatchIds = awayRecentMatches.map((m) => m.match_id);
    const allMatchIds = Array.from(new Set([...homeMatchIds, ...awayMatchIds]));

    // 배치 쿼리 2: 두 팀의 모든 stats를 한 번에 조회
    const allStats =
      allMatchIds.length > 0
        ? await prisma.playerMatchStats.findMany({
            where: {
              team_id: { in: [homeTeamId, awayTeamId] },
              match_id: { in: allMatchIds },
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
          })
        : [];

    // 메모리에서 팀별, 유효 경기별로 필터링하여 집계
    const buildAggFromStats = (
      teamId: number,
      validMatchIds: number[]
    ): PlayerAgg[] => {
      const validSet = new Set(validMatchIds);
      const teamStats = allStats.filter(
        (s) =>
          s.team_id === teamId && s.match_id != null && validSet.has(s.match_id)
      );

      const agg = new Map<number, PlayerAgg>();
      for (const s of teamStats) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pid = (s as any).player_id as number | null;
        if (!pid) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const minutes = ((s as any).minutes_played ?? 0) as number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const goals = ((s as any).goals ?? 0) as number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const assists = ((s as any).assists ?? 0) as number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const position = ((s as any).position ?? null) as string | null;
        const exists = agg.get(pid);
        if (exists) {
          exists.minutes += minutes;
          exists.goals += goals;
          exists.assists += assists;
        } else {
          agg.set(pid, {
            player_id: pid,
            team_id: (s.team_id as number) ?? teamId,
            player_name: (s.player?.name as string) ?? 'Unknown',
            jersey_number: (s.player?.jersey_number as number) ?? null,
            position,
            goals,
            assists,
            minutes,
            profile_image_url: (s.player?.profile_image_url as string) ?? null,
          });
        }
      }

      // 정렬: (goals*2 + assists) desc, minutes desc
      const arr = Array.from(agg.values()).sort((a, b) => {
        const as = a.goals * 2 + a.assists;
        const bs = b.goals * 2 + b.assists;
        if (bs !== as) return bs - as;
        return b.minutes - a.minutes;
      });
      return arr.slice(0, 3);
    };

    const home = buildAggFromStats(homeTeamId, homeMatchIds);
    const away = buildAggFromStats(awayTeamId, awayMatchIds);

    return NextResponse.json({
      match_id: match.match_id,
      home,
      away,
    });
  } catch (error) {
    console.error('Failed to fetch key players', error);
    return NextResponse.json(
      { error: 'Failed to fetch key players' },
      { status: 500 }
    );
  }
}
