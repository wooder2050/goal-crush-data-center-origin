import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ player_id: string }> }
) {
  try {
    const { player_id } = await params;
    const playerId = parseInt(player_id, 10);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }

    // 선수의 팀 이력 조회
    const teamHistory = await prisma.playerTeamHistory.findMany({
      where: { player_id: playerId },
      select: {
        team_id: true,
        season_id: true,
      },
    });

    if (teamHistory.length === 0) {
      return NextResponse.json({ player_id: playerId, trophies: [] });
    }

    // 선수가 속했던 (season_id, team_id) 조합
    const seasonTeamPairs = teamHistory
      .filter((h) => h.season_id != null && h.team_id != null)
      .map((h) => ({
        season_id: h.season_id!,
        team_id: h.team_id!,
      }));

    if (seasonTeamPairs.length === 0) {
      return NextResponse.json({ player_id: playerId, trophies: [] });
    }

    type ChampionshipRow = {
      standing_id: number;
      season_id: number;
      team_id: number;
      season_name: string | null;
      year: number | null;
      category: string | null;
      team_name: string | null;
      logo: string | null;
    };

    // Raw SQL로 (season_id, team_id) IN (...) — Prisma.sql로 안전하게 구성
    const pairConditions = seasonTeamPairs.map(
      (p) => Prisma.sql`(${p.season_id}, ${p.team_id})`
    );

    const championships = await prisma.$queryRaw<ChampionshipRow[]>`
      SELECT
        st.standing_id,
        st.season_id,
        st.team_id,
        s.season_name,
        s.year,
        s.category,
        COALESCE(tsn.team_name, t.team_name) as team_name,
        t.logo
      FROM standings st
      JOIN seasons s ON st.season_id = s.season_id
      JOIN teams t ON st.team_id = t.team_id
      LEFT JOIN team_season_names tsn ON tsn.season_id = st.season_id AND tsn.team_id = st.team_id
      WHERE st.position = 1
        AND (st.season_id, st.team_id) IN (${Prisma.join(pairConditions)})
    `;

    // 필터링: 조별리그, 플레이오프, 챌린지리그 제외
    const filtered = championships.filter((c) => {
      const seasonName = c.season_name ?? '';
      const category = c.category ?? null;
      if (seasonName.includes('조별')) return false;
      if (category === 'PLAYOFF' || category === 'CHALLENGE_LEAGUE')
        return false;
      return true;
    });

    // 팀별로 그룹핑 (FotMob 스타일)
    const teamMap = new Map<
      number,
      {
        team_id: number;
        team_name: string;
        logo: string | null;
        trophies: Array<{
          season_id: number;
          season_name: string;
          year: number | null;
          category: string | null;
        }>;
      }
    >();

    for (const c of filtered) {
      const tid = c.team_id;

      if (!teamMap.has(tid)) {
        teamMap.set(tid, {
          team_id: tid,
          team_name: c.team_name ?? '-',
          logo: c.logo ?? null,
          trophies: [],
        });
      }

      teamMap.get(tid)!.trophies.push({
        season_id: c.season_id,
        season_name: c.season_name ?? '-',
        year: c.year ?? null,
        category: c.category ?? null,
      });
    }

    // 트로피 수 내림차순 정렬
    const trophies = Array.from(teamMap.values()).sort(
      (a, b) => b.trophies.length - a.trophies.length
    );

    return NextResponse.json({
      player_id: playerId,
      total: filtered.length,
      trophies,
    });
  } catch (error) {
    console.error('Error fetching player trophies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player trophies' },
      { status: 500 }
    );
  }
}
