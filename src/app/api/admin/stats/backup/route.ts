import { NextRequest, NextResponse } from 'next/server';

import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/admin/stats/backup - 통계 데이터 백업 생성
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await requireAdminAuth();

    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('season_id');

    const seasonFilter = seasonId ? { season_id: parseInt(seasonId) } : {};
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // 백업할 데이터 수집
    const backupData = {
      timestamp,
      season_id: seasonId ? parseInt(seasonId) : null,
      data: {
        standings: await prisma.standing.findMany({ where: seasonFilter }),
        playerSeasonStats: await prisma.playerSeasonStats.findMany({
          where: seasonFilter,
        }),
        teamSeasonStats: await prisma.teamSeasonStats.findMany({
          where: seasonFilter,
        }),
        teamSeason: await prisma.teamSeason.findMany({ where: seasonFilter }),
        h2hPairStats: await prisma.h2hPairStats.findMany(),
      },
    };

    // 백업 데이터를 JSON 파일로 저장 (실제 환경에서는 S3나 다른 스토리지 사용)
    const backupFileName = `stats-backup-${timestamp}${seasonId ? `-season-${seasonId}` : '-all'}.json`;

    return NextResponse.json(
      {
        message: '통계 데이터 백업이 생성되었습니다.',
        backup_file: backupFileName,
        data: backupData,
        stats: {
          standings: backupData.data.standings.length,
          playerSeasonStats: backupData.data.playerSeasonStats.length,
          teamSeasonStats: backupData.data.teamSeasonStats.length,
          teamSeason: backupData.data.teamSeason.length,
          h2hPairStats: backupData.data.h2hPairStats.length,
        },
      },
      {
        headers: {
          'Content-Disposition': `attachment; filename="${backupFileName}"`,
        },
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === '인증이 필요합니다' ||
        error.message === '관리자 권한이 필요합니다')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '인증이 필요합니다' ? 401 : 403 }
      );
    }

    console.error('백업 생성 실패:', error);
    return NextResponse.json(
      {
        error: '백업 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/stats/backup - 백업 데이터 복원
export async function PUT(request: NextRequest) {
  try {
    // 관리자 권한 확인
    await requireAdminAuth();

    const body = await request.json();
    const { data: backupData, season_id } = body;

    if (!backupData) {
      return NextResponse.json(
        { error: '백업 데이터가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    const seasonFilter = season_id ? { season_id: parseInt(season_id) } : {};

    // 기존 데이터 삭제
    await Promise.all([
      prisma.standing.deleteMany({ where: seasonFilter }),
      prisma.playerSeasonStats.deleteMany({ where: seasonFilter }),
      prisma.teamSeasonStats.deleteMany({ where: seasonFilter }),
      prisma.teamSeason.deleteMany({ where: seasonFilter }),
      prisma.h2hPairStats.deleteMany(),
    ]);

    // 백업 데이터 복원
    const results = {
      standings: 0,
      playerSeasonStats: 0,
      teamSeasonStats: 0,
      teamSeason: 0,
      h2hPairStats: 0,
    };

    if (backupData.standings?.length > 0) {
      await prisma.standing.createMany({ data: backupData.standings });
      results.standings = backupData.standings.length;
    }

    if (backupData.playerSeasonStats?.length > 0) {
      await prisma.playerSeasonStats.createMany({
        data: backupData.playerSeasonStats,
      });
      results.playerSeasonStats = backupData.playerSeasonStats.length;
    }

    if (backupData.teamSeasonStats?.length > 0) {
      await prisma.teamSeasonStats.createMany({
        data: backupData.teamSeasonStats,
      });
      results.teamSeasonStats = backupData.teamSeasonStats.length;
    }

    if (backupData.teamSeason?.length > 0) {
      await prisma.teamSeason.createMany({ data: backupData.teamSeason });
      results.teamSeason = backupData.teamSeason.length;
    }

    if (backupData.h2hPairStats?.length > 0) {
      await prisma.h2hPairStats.createMany({ data: backupData.h2hPairStats });
      results.h2hPairStats = backupData.h2hPairStats.length;
    }

    return NextResponse.json({
      message: '백업 데이터가 성공적으로 복원되었습니다.',
      restored: results,
      season_id: season_id || null,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === '인증이 필요합니다' ||
        error.message === '관리자 권한이 필요합니다')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '인증이 필요합니다' ? 401 : 403 }
      );
    }

    console.error('백업 복원 실패:', error);
    return NextResponse.json(
      {
        error: '백업 복원 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
