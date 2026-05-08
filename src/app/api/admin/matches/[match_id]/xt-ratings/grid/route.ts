import { NextResponse } from 'next/server';

import { XT_GRID_COLS, XT_GRID_ROWS } from '@/features/matches/lib/xT/types';
import { buildXtGrid } from '@/features/matches/lib/xT/xtGrid';
import { requireAdminAuth } from '@/lib/auth';

// GET /api/admin/matches/[match_id]/xt-ratings/grid - xT 격자값 조회
export async function GET() {
  try {
    await requireAdminAuth();

    const grid = await buildXtGrid();

    const zones = [];
    for (let r = 0; r < XT_GRID_ROWS; r++) {
      for (let c = 0; c < XT_GRID_COLS; c++) {
        zones.push({
          row: r,
          col: c,
          xt_value: Math.round(grid[r][c] * 10000) / 10000,
          center_x: c * 5 + 2.5,
          center_y: r * 5 + 2.5,
        });
      }
    }

    return NextResponse.json({
      grid,
      zones,
      dimensions: { rows: XT_GRID_ROWS, cols: XT_GRID_COLS },
      pitch: { width: 40, height: 20 },
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

    console.error('Failed to build xT grid:', error);
    return NextResponse.json(
      { error: 'Failed to build xT grid' },
      { status: 500 }
    );
  }
}
