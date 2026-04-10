import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// GET /api/teams/[teamId]/formation
// 팀의 최근 시즌 선발 포지션별 선수 수 집계
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId: raw } = await params;
    const teamId = parseInt(raw);

    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
    }

    // 팀이 참여한 가장 최근 시즌 찾기
    const latestMatch = await prisma.match.findFirst({
      where: {
        OR: [{ home_team_id: teamId }, { away_team_id: teamId }],
        season_id: { not: null },
      },
      orderBy: { match_date: 'desc' },
      select: { season_id: true },
    });

    if (!latestMatch?.season_id) {
      return NextResponse.json({ positions: [], season_name: null });
    }

    const seasonId = latestMatch.season_id;

    // 시즌 이름
    const season = await prisma.season.findUnique({
      where: { season_id: seasonId },
      select: { season_name: true },
    });

    // 해당 시즌 경기에서 이 팀 소속 선수들의 포지션별 출전 수 집계
    const matchIds = await prisma.match.findMany({
      where: {
        season_id: seasonId,
        OR: [{ home_team_id: teamId }, { away_team_id: teamId }],
      },
      select: { match_id: true },
    });

    const stats = await prisma.playerMatchStats.findMany({
      where: {
        match_id: { in: matchIds.map((m) => m.match_id) },
        team_id: teamId,
        position: { not: null },
        minutes_played: { gt: 0 },
      },
      select: {
        player_id: true,
        position: true,
        player: {
          select: {
            name: true,
            jersey_number: true,
            profile_image_url: true,
          },
        },
      },
    });

    // 포지션별 선수 집계 (출전 횟수 기준)
    const positionMap = new Map<
      string,
      Map<
        number,
        {
          name: string;
          count: number;
          jersey_number: number | null;
          profile_image_url: string | null;
        }
      >
    >();

    for (const s of stats) {
      if (!s.position || !s.player_id) continue;
      const pos = s.position;
      if (!positionMap.has(pos)) positionMap.set(pos, new Map());
      const players = positionMap.get(pos)!;
      const existing = players.get(s.player_id);
      if (existing) {
        existing.count += 1;
      } else {
        players.set(s.player_id, {
          name: s.player?.name ?? '-',
          count: 1,
          jersey_number: s.player?.jersey_number ?? null,
          profile_image_url: s.player?.profile_image_url ?? null,
        });
      }
    }

    // 5인제(골때녀): GK 1명 + 필드 4명
    // 각 포지션(GK, DF, MF, FW)에서 최다 출전 선수 1명씩 선택
    const positionOrder = ['GK', 'DF', 'MF', 'FW'];
    const usedPlayerIds = new Set<number>();
    const positions: Array<{
      position: string;
      player_id: number;
      name: string;
      count: number;
      jersey_number: number | null;
      profile_image_url: string | null;
      total_players: number;
    }> = [];

    // 1차: 각 포지션에서 최다 출전 선수 1명씩
    for (const pos of positionOrder) {
      const players = positionMap.get(pos);
      if (!players) continue;
      const sorted = Array.from(players.entries())
        .filter(([pid]) => !usedPlayerIds.has(pid))
        .sort((a, b) => b[1].count - a[1].count);
      if (sorted.length === 0) continue;
      const top = sorted[0];
      positions.push({
        position: pos,
        player_id: top[0],
        name: top[1].name,
        count: top[1].count,
        jersey_number: top[1].jersey_number,
        profile_image_url: top[1].profile_image_url,
        total_players: sorted.length,
      });
      usedPlayerIds.add(top[0]);
    }

    // 2차: 5명이 안 되면 남은 포지션에서 추가 (필드 포지션 우선)
    if (positions.length < 5) {
      const fieldPositions = ['MF', 'DF', 'FW'];
      for (const pos of fieldPositions) {
        if (positions.length >= 5) break;
        const players = positionMap.get(pos);
        if (!players) continue;
        const sorted = Array.from(players.entries())
          .filter(([pid]) => !usedPlayerIds.has(pid))
          .sort((a, b) => b[1].count - a[1].count);
        for (const [pid, data] of sorted) {
          if (positions.length >= 5) break;
          positions.push({
            position: pos,
            player_id: pid,
            name: data.name,
            count: data.count,
            jersey_number: data.jersey_number,
            profile_image_url: data.profile_image_url,
            total_players: positionMap.get(pos)?.size ?? 0,
          });
          usedPlayerIds.add(pid);
        }
      }
    }

    // 정렬: GK → DF → MF → FW
    positions.sort((a, b) => {
      const order: Record<string, number> = { GK: 0, DF: 1, MF: 2, FW: 3 };
      return (order[a.position] ?? 99) - (order[b.position] ?? 99);
    });

    return NextResponse.json({
      positions,
      season_name: season?.season_name ?? null,
    });
  } catch (error) {
    console.error('Error fetching team formation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team formation' },
      { status: 500 }
    );
  }
}
