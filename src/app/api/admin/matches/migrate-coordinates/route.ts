import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// 피치 크기
const PITCH_WIDTH = 40;
const PITCH_HEIGHT = 20;

// POST /api/admin/matches/migrate-coordinates - 특정 경기들의 좌표 반전
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchIds } = body;

    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      return NextResponse.json(
        { error: 'matchIds 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    // 각 경기의 액션들 좌표 반전
    const results = [];

    for (const matchId of matchIds) {
      // 해당 경기의 모든 액션 조회
      const actions = await prisma.matchAction.findMany({
        where: { match_id: matchId },
      });

      if (actions.length === 0) {
        results.push({ matchId, updated: 0, message: '액션 없음' });
        continue;
      }

      // 각 액션의 좌표 반전
      let updatedCount = 0;
      for (const action of actions) {
        await prisma.matchAction.update({
          where: { action_id: action.action_id },
          data: {
            start_x: PITCH_WIDTH - action.start_x,
            start_y: PITCH_HEIGHT - action.start_y,
            end_x: action.end_x !== null ? PITCH_WIDTH - action.end_x : null,
            end_y: action.end_y !== null ? PITCH_HEIGHT - action.end_y : null,
          },
        });
        updatedCount++;
      }

      results.push({ matchId, updated: updatedCount });
    }

    return NextResponse.json({
      success: true,
      message: `${matchIds.length}개 경기의 좌표가 반전되었습니다.`,
      results,
    });
  } catch (error) {
    console.error('좌표 마이그레이션 오류:', error);
    return NextResponse.json(
      { error: '좌표 마이그레이션 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
