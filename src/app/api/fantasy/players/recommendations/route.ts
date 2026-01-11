import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const recommendationQuerySchema = z.object({
  fantasy_season_id: z.string().transform((val) => parseInt(val)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
});

// GET - AI 판타지 선수 추천 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const { fantasy_season_id, limit } =
      recommendationQuerySchema.parse(queryParams);

    // 판타지 시즌 확인
    const fantasySeason = await prisma.fantasySeason.findUnique({
      where: { fantasy_season_id },
      select: {
        fantasy_season_id: true,
        year: true,
        month: true,
        is_active: true,
        season_id: true,
      },
    });

    if (!fantasySeason) {
      return NextResponse.json(
        { error: '판타지 시즌을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 기존 추천 데이터 확인
    let recommendations = await prisma.fantasyAIRecommendation.findMany({
      where: { fantasy_season_id },
      include: {
        player: {
          select: {
            player_id: true,
            name: true,
            profile_image_url: true,
            jersey_number: true,
            player_team_history: {
              where: { is_active: true },
              include: {
                team: {
                  select: {
                    team_id: true,
                    team_name: true,
                    logo: true,
                    primary_color: true,
                    secondary_color: true,
                  },
                },
              },
              take: 1,
            },
            player_season_stats: {
              where: { season_id: fantasySeason.season_id },
              take: 1,
            },
          },
        },
      },
      orderBy: { recommendation_score: 'desc' },
      take: limit,
    });

    // 추천 데이터가 없거나 오래된 경우 새로 생성
    if (
      recommendations.length === 0 ||
      isRecommendationOutdated(recommendations[0]?.created_at)
    ) {
      await generateAIRecommendations(
        fantasy_season_id,
        fantasySeason.season_id
      );

      // 새로 생성된 추천 데이터 조회
      recommendations = await prisma.fantasyAIRecommendation.findMany({
        where: { fantasy_season_id },
        include: {
          player: {
            select: {
              player_id: true,
              name: true,
              profile_image_url: true,
              jersey_number: true,
              player_team_history: {
                where: { is_active: true },
                include: {
                  team: {
                    select: {
                      team_id: true,
                      team_name: true,
                      logo: true,
                      primary_color: true,
                      secondary_color: true,
                    },
                  },
                },
                take: 1,
              },
              player_season_stats: {
                where: { season_id: fantasySeason.season_id },
                take: 1,
              },
            },
          },
        },
        orderBy: { recommendation_score: 'desc' },
        take: limit,
      });
    }

    return NextResponse.json({
      fantasy_season_id,
      recommendations: recommendations.map((rec) => ({
        ...rec,
        player: {
          ...rec.player,
          current_team: rec.player.player_team_history[0]?.team || null,
          season_stats: rec.player.player_season_stats[0] || null,
        },
      })),
      generated_at: recommendations[0]?.created_at || new Date(),
    });
  } catch (error) {
    console.error('AI 추천 조회 중 오류:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '잘못된 쿼리 파라미터입니다.', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'AI 추천을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST - AI 추천 데이터 새로 생성 (관리자용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fantasy_season_id } = body;

    if (!fantasy_season_id) {
      return NextResponse.json(
        { error: 'fantasy_season_id가 필요합니다.' },
        { status: 400 }
      );
    }

    // 판타지 시즌 확인
    const fantasySeason = await prisma.fantasySeason.findUnique({
      where: { fantasy_season_id: parseInt(fantasy_season_id) },
    });

    if (!fantasySeason) {
      return NextResponse.json(
        { error: '판타지 시즌을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 새로운 AI 추천 생성
    const result = await generateAIRecommendations(
      parseInt(fantasy_season_id),
      fantasySeason.season_id
    );

    return NextResponse.json({
      message: 'AI 추천이 새로 생성되었습니다.',
      fantasy_season_id: parseInt(fantasy_season_id),
      recommendations_count: result.length,
    });
  } catch (error) {
    console.error('AI 추천 생성 중 오류:', error);
    return NextResponse.json(
      { error: 'AI 추천 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * AI 추천이 오래되었는지 확인 (24시간)
 */
function isRecommendationOutdated(createdAt: Date | undefined): boolean {
  if (!createdAt) return true;

  const now = new Date();
  const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  return diffHours > 24;
}

/**
 * AI 추천 데이터 생성 (간단한 규칙 기반)
 */
async function generateAIRecommendations(
  fantasySeasonId: number,
  seasonId: number
) {
  // 기존 추천 삭제
  await prisma.fantasyAIRecommendation.deleteMany({
    where: { fantasy_season_id: fantasySeasonId },
  });

  // 현재 시즌 선수 성과 데이터 조회
  const playerStats = await prisma.playerSeasonStats.findMany({
    where: { season_id: seasonId },
    include: {
      player: {
        select: {
          player_id: true,
          name: true,
        },
      },
    },
  });

  // 간단한 추천 스코어 계산 (실제로는 더 복잡한 알고리즘 사용)
  const recommendations = playerStats
    .map((stat) => {
      const goals = stat.goals || 0;
      const assists = stat.assists || 0;
      const matchesPlayed = stat.matches_played || 1;
      const yellowCards = stat.yellow_cards || 0;
      const redCards = stat.red_cards || 0;

      // 기본 점수 계산
      let formScore = (goals * 4 + assists * 2) / matchesPlayed;
      formScore = Math.max(0, formScore - yellowCards * 0.5 - redCards * 2);

      // 출전률 고려
      const appearanceRate = matchesPlayed / 10; // 가정: 시즌 총 10경기
      const appearanceBonus = Math.min(1, appearanceRate) * 2;

      // 최종 추천 스코어
      const recommendationScore = formScore * 0.7 + appearanceBonus * 0.3;

      // 추천 이유 생성
      let reason = '';
      if (goals > 5) reason += '득점력 우수, ';
      if (assists > 3) reason += '어시스트 능력 우수, ';
      if (matchesPlayed >= 8) reason += '높은 출전률, ';
      if (yellowCards + redCards === 0) reason += '깨끗한 경기 운영, ';

      reason = reason.replace(/, $/, '') || '안정적인 성과';

      return {
        fantasy_season_id: fantasySeasonId,
        player_id: stat.player_id!,
        recommendation_score: Math.round(recommendationScore * 100) / 100,
        reason,
        form_score: Math.round(formScore * 100) / 100,
        fixture_difficulty: 5.0, // 기본값
        price_value: Math.round(recommendationScore * 10) / 10,
      };
    })
    .filter((rec) => rec.recommendation_score > 0)
    .sort((a, b) => b.recommendation_score - a.recommendation_score)
    .slice(0, 50); // 상위 50명만

  // 추천 데이터 저장
  if (recommendations.length > 0) {
    await prisma.fantasyAIRecommendation.createMany({
      data: recommendations,
    });
  }

  return recommendations;
}
