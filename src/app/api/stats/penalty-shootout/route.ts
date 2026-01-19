import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/stats/penalty-shootout - 승부차기 통계 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'kicker'; // 'kicker' or 'goalkeeper'
    const sortBy = searchParams.get('sort_by') || 'total'; // 정렬 기준
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const minAttempts = parseInt(searchParams.get('min_attempts') || '1');
    const seasonId = searchParams.get('season_id');

    const offset = (page - 1) * limit;

    // 시즌 필터 조건
    const seasonFilter = seasonId
      ? `AND m.season_id = ${parseInt(seasonId)}`
      : '';

    if (type === 'kicker') {
      // 정렬 조건
      let orderBy = '';
      switch (sortBy) {
        case 'total':
          orderBy = 'total_kicks DESC, success_rate DESC';
          break;
        case 'success_rate_high':
          orderBy = 'success_rate DESC, total_kicks DESC';
          break;
        case 'success_rate_low':
          orderBy = 'success_rate ASC, total_kicks DESC';
          break;
        default:
          orderBy = 'total_kicks DESC, success_rate DESC';
      }

      const kickerStats = await prisma.$queryRawUnsafe<
        {
          player_id: number;
          player_name: string;
          player_image: string | null;
          total_kicks: bigint;
          successful_kicks: bigint;
          failed_kicks: bigint;
          success_rate: number;
          teams: string;
          team_logos: string;
          first_team_id: number | null;
          first_team_name: string | null;
        }[]
      >(`
        WITH kicker_stats AS (
          SELECT
            p.kicker_id as player_id,
            COUNT(*) as total_kicks,
            COUNT(*) FILTER (WHERE p.is_successful = true) as successful_kicks,
            COUNT(*) FILTER (WHERE p.is_successful = false) as failed_kicks,
            ROUND(100.0 * COUNT(*) FILTER (WHERE p.is_successful = true) / NULLIF(COUNT(*), 0), 1) as success_rate
          FROM penalty_shootout_details p
          JOIN matches m ON p.match_id = m.match_id
          WHERE 1=1 ${seasonFilter}
          GROUP BY p.kicker_id
          HAVING COUNT(*) >= ${minAttempts}
        ),
        player_teams AS (
          SELECT
            sub.player_id,
            STRING_AGG(sub.team_name, ', ' ORDER BY sub.team_name) as teams,
            STRING_AGG(sub.logo, ',' ORDER BY sub.team_name) FILTER (WHERE sub.logo IS NOT NULL) as team_logos,
            MIN(sub.team_id) as first_team_id,
            MIN(sub.team_name) as first_team_name
          FROM (
            SELECT DISTINCT pth.player_id, t.team_id, t.team_name, t.logo
            FROM player_team_history pth
            JOIN teams t ON pth.team_id = t.team_id
            WHERE pth.is_active = true
          ) AS sub
          GROUP BY sub.player_id
        )
        SELECT
          ks.player_id,
          pl.name as player_name,
          pl.profile_image_url as player_image,
          ks.total_kicks,
          ks.successful_kicks,
          ks.failed_kicks,
          ks.success_rate,
          COALESCE(pt.teams, '') as teams,
          COALESCE(pt.team_logos, '') as team_logos,
          pt.first_team_id,
          pt.first_team_name
        FROM kicker_stats ks
        JOIN players pl ON ks.player_id = pl.player_id
        LEFT JOIN player_teams pt ON ks.player_id = pt.player_id
        ORDER BY ${orderBy}
        LIMIT ${limit} OFFSET ${offset}
      `);

      // 랭크 계산 및 BigInt 변환
      const rankings = kickerStats.map((stat, index) => ({
        rank: offset + index + 1,
        player_id: stat.player_id,
        player_name: stat.player_name,
        player_image: stat.player_image,
        total_kicks: Number(stat.total_kicks),
        successful_kicks: Number(stat.successful_kicks),
        failed_kicks: Number(stat.failed_kicks),
        success_rate: Number(stat.success_rate),
        teams: stat.teams,
        team_logos: stat.team_logos
          ? stat.team_logos.split(',').filter(Boolean)
          : [],
        first_team_id: stat.first_team_id,
        first_team_name: stat.first_team_name,
      }));

      // 전체 키커 수 계산
      const totalKickersResult = await prisma.$queryRawUnsafe<
        { count: bigint }[]
      >(`
        SELECT COUNT(*) as count FROM (
          SELECT p.kicker_id
          FROM penalty_shootout_details p
          JOIN matches m ON p.match_id = m.match_id
          WHERE 1=1 ${seasonFilter}
          GROUP BY p.kicker_id
          HAVING COUNT(*) >= ${minAttempts}
        ) sub
      `);
      const totalKickers = Number(totalKickersResult[0]?.count || 0);

      return NextResponse.json({
        type: 'kicker',
        rankings,
        total_players: totalKickers,
        current_page: page,
        total_pages: Math.ceil(totalKickers / limit),
        per_page: limit,
      });
    } else {
      // 골키퍼 통계
      let orderBy = '';
      switch (sortBy) {
        case 'total':
          orderBy = 'total_faced DESC, save_rate DESC';
          break;
        case 'save_rate_high':
          orderBy = 'save_rate DESC, total_faced DESC';
          break;
        case 'save_rate_low':
          orderBy = 'save_rate ASC, total_faced DESC';
          break;
        default:
          orderBy = 'total_faced DESC, save_rate DESC';
      }

      const goalkeeperStats = await prisma.$queryRawUnsafe<
        {
          player_id: number;
          player_name: string;
          player_image: string | null;
          total_faced: bigint;
          saves: bigint;
          conceded: bigint;
          save_rate: number;
          teams: string;
          team_logos: string;
          first_team_id: number | null;
          first_team_name: string | null;
        }[]
      >(`
        WITH goalkeeper_stats AS (
          SELECT
            p.goalkeeper_id as player_id,
            COUNT(*) as total_faced,
            COUNT(*) FILTER (WHERE p.is_successful = false) as saves,
            COUNT(*) FILTER (WHERE p.is_successful = true) as conceded,
            ROUND(100.0 * COUNT(*) FILTER (WHERE p.is_successful = false) / NULLIF(COUNT(*), 0), 1) as save_rate
          FROM penalty_shootout_details p
          JOIN matches m ON p.match_id = m.match_id
          WHERE 1=1 ${seasonFilter}
          GROUP BY p.goalkeeper_id
          HAVING COUNT(*) >= ${minAttempts}
        ),
        player_teams AS (
          SELECT
            sub.player_id,
            STRING_AGG(sub.team_name, ', ' ORDER BY sub.team_name) as teams,
            STRING_AGG(sub.logo, ',' ORDER BY sub.team_name) FILTER (WHERE sub.logo IS NOT NULL) as team_logos,
            MIN(sub.team_id) as first_team_id,
            MIN(sub.team_name) as first_team_name
          FROM (
            SELECT DISTINCT pth.player_id, t.team_id, t.team_name, t.logo
            FROM player_team_history pth
            JOIN teams t ON pth.team_id = t.team_id
            WHERE pth.is_active = true
          ) AS sub
          GROUP BY sub.player_id
        )
        SELECT
          gs.player_id,
          pl.name as player_name,
          pl.profile_image_url as player_image,
          gs.total_faced,
          gs.saves,
          gs.conceded,
          gs.save_rate,
          COALESCE(pt.teams, '') as teams,
          COALESCE(pt.team_logos, '') as team_logos,
          pt.first_team_id,
          pt.first_team_name
        FROM goalkeeper_stats gs
        JOIN players pl ON gs.player_id = pl.player_id
        LEFT JOIN player_teams pt ON gs.player_id = pt.player_id
        ORDER BY ${orderBy}
        LIMIT ${limit} OFFSET ${offset}
      `);

      // 랭크 계산 및 BigInt 변환
      const rankings = goalkeeperStats.map((stat, index) => ({
        rank: offset + index + 1,
        player_id: stat.player_id,
        player_name: stat.player_name,
        player_image: stat.player_image,
        total_faced: Number(stat.total_faced),
        saves: Number(stat.saves),
        conceded: Number(stat.conceded),
        save_rate: Number(stat.save_rate),
        teams: stat.teams,
        team_logos: stat.team_logos
          ? stat.team_logos.split(',').filter(Boolean)
          : [],
        first_team_id: stat.first_team_id,
        first_team_name: stat.first_team_name,
      }));

      // 전체 골키퍼 수 계산
      const totalGoalkeepersResult = await prisma.$queryRawUnsafe<
        { count: bigint }[]
      >(`
        SELECT COUNT(*) as count FROM (
          SELECT p.goalkeeper_id
          FROM penalty_shootout_details p
          JOIN matches m ON p.match_id = m.match_id
          WHERE 1=1 ${seasonFilter}
          GROUP BY p.goalkeeper_id
          HAVING COUNT(*) >= ${minAttempts}
        ) sub
      `);
      const totalGoalkeepers = Number(totalGoalkeepersResult[0]?.count || 0);

      return NextResponse.json({
        type: 'goalkeeper',
        rankings,
        total_players: totalGoalkeepers,
        current_page: page,
        total_pages: Math.ceil(totalGoalkeepers / limit),
        per_page: limit,
      });
    }
  } catch (error) {
    console.error('Failed to fetch penalty shootout stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch penalty shootout stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
