import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthUser } from '@/lib/auth';
import { checkAndAwardBadges } from '@/lib/badges';
import { addMvpVotePoints } from '@/lib/points';
import { prisma } from '@/lib/prisma';

// MVP 투표 생성 스키마
const createVoteSchema = z.object({
  season_id: z.number(),
  player_id: z.number(),
  vote_type: z.enum(['season', 'match', 'monthly']).default('season'),
  match_id: z.number().optional(),
});

// MVP 투표 조회 스키마
const getVotesSchema = z.object({
  season_id: z.string().transform(Number).optional(),
  vote_type: z.enum(['season', 'match', 'monthly']).default('season'),
  match_id: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).default('10'),
});

export const dynamic = 'force-dynamic';

// GET /api/community/mvp-votes - mvp_votes 테이블의 투표 결과 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const { season_id, vote_type, limit } = getVotesSchema.parse(queryParams);

    // 최신 시즌 ID (season_id가 없으면 가장 최근 시즌 사용)
    let targetSeasonId = season_id;
    if (!targetSeasonId) {
      const latestSeason = await prisma.season.findFirst({
        orderBy: { year: 'desc' },
        select: { season_id: true, season_name: true },
      });
      targetSeasonId = latestSeason?.season_id;
    }

    if (!targetSeasonId) {
      return NextResponse.json(
        { error: '시즌을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 해당 시즌의 MVP 투표 결과를 선수별로 집계
    const voteResults = await prisma.mvpVote.groupBy({
      by: ['player_id'],
      where: {
        season_id: targetSeasonId,
        vote_type: vote_type,
      },
      _count: {
        player_id: true,
      },
      orderBy: {
        _count: {
          player_id: 'desc',
        },
      },
      take: limit,
    });

    console.log('Vote results for season', targetSeasonId, ':', voteResults);

    if (voteResults.length === 0) {
      return NextResponse.json({
        results: [],
        totalVotes: 0,
        seasonId: targetSeasonId,
        message: '해당 시즌에 대한 투표 결과가 없습니다.',
      });
    }

    // 선수 정보와 시즌 통계를 포함한 상세 정보 추가
    const enrichedResults = await Promise.all(
      voteResults.map(async (vote) => {
        const player = await prisma.player.findUnique({
          where: { player_id: vote.player_id },
          select: {
            player_id: true,
            name: true,
            profile_image_url: true,
            jersey_number: true,
          },
        });

        // 선수의 해당 시즌 팀 정보
        const playerTeam = await prisma.playerTeamHistory.findFirst({
          where: {
            player_id: vote.player_id,
            season_id: targetSeasonId,
          },
          include: {
            team: {
              select: {
                team_name: true,
                logo: true,
              },
            },
          },
        });

        // 선수의 시즌 통계
        const seasonStats = await prisma.playerSeasonStats.findFirst({
          where: {
            player_id: vote.player_id,
            season_id: targetSeasonId,
          },
          select: {
            goals: true,
            assists: true,
          },
        });

        return {
          player_id: vote.player_id,
          player_name: player?.name || 'Unknown',
          profile_image_url: player?.profile_image_url,
          jersey_number: player?.jersey_number,
          team_name: playerTeam?.team?.team_name || null,
          team_logo: playerTeam?.team?.logo || null,
          votes_count: vote._count.player_id,
          goals: seasonStats?.goals || 0,
          assists: seasonStats?.assists || 0,
        };
      })
    );

    const totalVotes = voteResults.reduce(
      (sum, vote) => sum + vote._count.player_id,
      0
    );

    return NextResponse.json({
      results: enrichedResults,
      totalVotes: totalVotes,
      seasonId: targetSeasonId,
      voteType: vote_type,
      message: 'MVP 투표 결과를 성공적으로 조회했습니다.',
    });
  } catch (error) {
    console.error('MVP 투표 결과 조회 오류:', error);
    return NextResponse.json(
      { error: 'MVP 투표 결과를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/community/mvp-votes - MVP 투표
export async function POST(request: NextRequest) {
  try {
    const {
      data: { user },
      error: authError,
    } = await getAuthUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createVoteSchema.parse(body);

    // 시즌 존재 확인
    const season = await prisma.season.findUnique({
      where: { season_id: validatedData.season_id },
    });

    if (!season) {
      return NextResponse.json(
        { error: '시즌을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 선수 존재 확인
    const player = await prisma.player.findUnique({
      where: { player_id: validatedData.player_id },
    });

    if (!player) {
      return NextResponse.json(
        { error: '선수를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 경기 MVP인 경우 경기 확인
    if (validatedData.vote_type === 'match' && validatedData.match_id) {
      const match = await prisma.match.findUnique({
        where: { match_id: validatedData.match_id },
      });

      if (!match) {
        return NextResponse.json(
          { error: '경기를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    }

    // 기존 투표 확인 (중복 투표 방지)
    const existingVote = await prisma.mvpVote.findFirst({
      where: {
        season_id: validatedData.season_id,
        user_id: user.id,
        vote_type: validatedData.vote_type,
        match_id: validatedData.match_id || null,
      },
    });

    if (existingVote) {
      // 기존 투표 업데이트
      const updatedVote = await prisma.mvpVote.update({
        where: { vote_id: existingVote.vote_id },
        data: {
          player_id: validatedData.player_id,
        },
        include: {
          player: {
            select: {
              player_id: true,
              name: true,
              profile_image_url: true,
              jersey_number: true,
            },
          },
          season: {
            select: {
              season_id: true,
              season_name: true,
            },
          },
        },
      });

      return NextResponse.json({
        vote: updatedVote,
        message: 'MVP 투표가 변경되었습니다.',
      });
    } else {
      // 새 투표 생성
      const newVote = await prisma.mvpVote.create({
        data: {
          season_id: validatedData.season_id,
          user_id: user.id,
          player_id: validatedData.player_id,
          vote_type: validatedData.vote_type,
          match_id: validatedData.match_id,
        },
        include: {
          player: {
            select: {
              player_id: true,
              name: true,
              profile_image_url: true,
              jersey_number: true,
            },
          },
          season: {
            select: {
              season_id: true,
              season_name: true,
            },
          },
        },
      });

      // 포인트 지급 (MVP 투표 참여)
      await addMvpVotePoints(user.id, newVote.vote_id);

      // 배지 확인 및 부여
      await checkAndAwardBadges(user.id);

      return NextResponse.json(
        {
          vote: newVote,
          message: 'MVP 투표가 완료되었습니다.',
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('MVP 투표 오류:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'MVP 투표에 실패했습니다.' },
      { status: 500 }
    );
  }
}
