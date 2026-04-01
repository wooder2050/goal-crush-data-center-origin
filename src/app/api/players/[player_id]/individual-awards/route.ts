import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface AwardRow {
  player_id: number;
  season_id: number;
  season_name: string;
  category: string | null;
  stat_value: number;
  is_shared: boolean;
}

interface IndividualAward {
  award_type: 'top_scorer' | 'top_assists' | 'top_attack_points';
  award_label: string;
  season_id: number;
  season_name: string;
  category: string | null;
  stat_value: number;
  is_shared: boolean;
}

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

    // 시즌별 득점왕 (선수별 시즌 합산 후 랭킹)
    const topScorers = await prisma.$queryRaw<AwardRow[]>`
      WITH aggregated AS (
        SELECT
          pss.player_id,
          pss.season_id,
          s.season_name,
          s.category,
          SUM(pss.goals) as stat_value
        FROM player_season_stats pss
        JOIN seasons s ON pss.season_id = s.season_id
        WHERE pss.goals > 0
          AND s.category NOT IN ('PLAYOFF', 'CHAMPION_MATCH', 'CHALLENGE_LEAGUE')
          AND s.season_name NOT LIKE '%조별%'
          AND s.end_date IS NOT NULL
        GROUP BY pss.player_id, pss.season_id, s.season_name, s.category
      ),
      ranked AS (
        SELECT
          a.*,
          RANK() OVER (PARTITION BY a.season_id ORDER BY a.stat_value DESC) as rank,
          COUNT(*) FILTER (WHERE a.stat_value = (
            SELECT MAX(a2.stat_value) FROM aggregated a2 WHERE a2.season_id = a.season_id
          )) OVER (PARTITION BY a.season_id) as winners_count
        FROM aggregated a
      )
      SELECT player_id, season_id, season_name, category, stat_value,
             (winners_count > 1) as is_shared
      FROM ranked
      WHERE rank = 1 AND player_id = ${playerId}
      ORDER BY season_id
    `;

    // 시즌별 도움왕
    const topAssists = await prisma.$queryRaw<AwardRow[]>`
      WITH aggregated AS (
        SELECT
          pss.player_id,
          pss.season_id,
          s.season_name,
          s.category,
          SUM(pss.assists) as stat_value
        FROM player_season_stats pss
        JOIN seasons s ON pss.season_id = s.season_id
        WHERE pss.assists > 0
          AND s.category NOT IN ('PLAYOFF', 'CHAMPION_MATCH', 'CHALLENGE_LEAGUE')
          AND s.season_name NOT LIKE '%조별%'
          AND s.end_date IS NOT NULL
        GROUP BY pss.player_id, pss.season_id, s.season_name, s.category
      ),
      ranked AS (
        SELECT
          a.*,
          RANK() OVER (PARTITION BY a.season_id ORDER BY a.stat_value DESC) as rank,
          COUNT(*) FILTER (WHERE a.stat_value = (
            SELECT MAX(a2.stat_value) FROM aggregated a2 WHERE a2.season_id = a.season_id
          )) OVER (PARTITION BY a.season_id) as winners_count
        FROM aggregated a
      )
      SELECT player_id, season_id, season_name, category, stat_value,
             (winners_count > 1) as is_shared
      FROM ranked
      WHERE rank = 1 AND player_id = ${playerId}
      ORDER BY season_id
    `;

    // 시즌별 공격포인트왕
    const topAttackPoints = await prisma.$queryRaw<AwardRow[]>`
      WITH aggregated AS (
        SELECT
          pss.player_id,
          pss.season_id,
          s.season_name,
          s.category,
          SUM(pss.goals + pss.assists) as stat_value
        FROM player_season_stats pss
        JOIN seasons s ON pss.season_id = s.season_id
        WHERE (pss.goals + pss.assists) > 0
          AND s.category NOT IN ('PLAYOFF', 'CHAMPION_MATCH', 'CHALLENGE_LEAGUE')
          AND s.season_name NOT LIKE '%조별%'
          AND s.end_date IS NOT NULL
        GROUP BY pss.player_id, pss.season_id, s.season_name, s.category
      ),
      ranked AS (
        SELECT
          a.*,
          RANK() OVER (PARTITION BY a.season_id ORDER BY a.stat_value DESC) as rank,
          COUNT(*) FILTER (WHERE a.stat_value = (
            SELECT MAX(a2.stat_value) FROM aggregated a2 WHERE a2.season_id = a.season_id
          )) OVER (PARTITION BY a.season_id) as winners_count
        FROM aggregated a
      )
      SELECT player_id, season_id, season_name, category, stat_value,
             (winners_count > 1) as is_shared
      FROM ranked
      WHERE rank = 1 AND player_id = ${playerId}
      ORDER BY season_id
    `;

    const awards: IndividualAward[] = [
      ...topScorers.map((r) => ({
        award_type: 'top_scorer' as const,
        award_label: '득점왕',
        season_id: r.season_id,
        season_name: r.season_name,
        category: r.category,
        stat_value: Number(r.stat_value),
        is_shared: Boolean(r.is_shared),
      })),
      ...topAssists.map((r) => ({
        award_type: 'top_assists' as const,
        award_label: '도움왕',
        season_id: r.season_id,
        season_name: r.season_name,
        category: r.category,
        stat_value: Number(r.stat_value),
        is_shared: Boolean(r.is_shared),
      })),
      ...topAttackPoints.map((r) => ({
        award_type: 'top_attack_points' as const,
        award_label: '공격포인트왕',
        season_id: r.season_id,
        season_name: r.season_name,
        category: r.category,
        stat_value: Number(r.stat_value),
        is_shared: Boolean(r.is_shared),
      })),
    ];

    // 시즌 ID 기준 정렬 (최신순)
    awards.sort((a, b) => b.season_id - a.season_id);

    return NextResponse.json({
      player_id: playerId,
      total: awards.length,
      awards,
    });
  } catch (error) {
    console.error('Error fetching individual awards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch individual awards' },
      { status: 500 }
    );
  }
}
