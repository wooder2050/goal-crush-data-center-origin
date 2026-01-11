import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  calculateMatchFantasyScores,
  recalculateSeasonFantasyScores,
} from '@/lib/fantasy-scoring';

export const dynamic = 'force-dynamic';

const matchScoringSchema = z.object({
  match_id: z.number(),
});

const seasonScoringSchema = z.object({
  season_id: z.number(),
});

// POST - 판타지 점수 계산
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === 'match') {
      // 특정 경기의 점수 계산
      const { match_id } = matchScoringSchema.parse(body);

      const result = await calculateMatchFantasyScores(match_id);

      return NextResponse.json({
        message: '경기 판타지 점수 계산이 완료되었습니다.',
        result,
      });
    } else if (type === 'season') {
      // 시즌 전체 점수 재계산
      const { season_id } = seasonScoringSchema.parse(body);

      const result = await recalculateSeasonFantasyScores(season_id);

      return NextResponse.json({
        message: '시즌 판타지 점수 재계산이 완료되었습니다.',
        result,
      });
    } else {
      return NextResponse.json(
        { error: '잘못된 타입입니다. "match" 또는 "season"을 지정해주세요.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('판타지 점수 계산 중 오류:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '점수 계산 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
