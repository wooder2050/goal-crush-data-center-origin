import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/community/stats/mvp-votes - 유저 MVP 투표 결과 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');

    if (!seasonId) {
      return NextResponse.json(
        {
          success: false,
          error: 'seasonId 파라미터가 필요합니다.',
        },
        { status: 400 }
      );
    }

    console.log('Querying MVP votes for seasonId:', seasonId);

    // 특정 시즌의 선수별 투표 결과 조회
    const voteResults = await prisma.mvpVote.groupBy({
      by: ['player_id'],
      where: {
        season_id: parseInt(seasonId),
        vote_type: 'season',
      },
      _count: {
        player_id: true,
      },
      orderBy: {
        _count: {
          player_id: 'desc',
        },
      },
    });

    console.log('Grouped vote results:', voteResults);

    if (voteResults.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: '해당 시즌에 대한 투표 결과가 없습니다.',
      });
    }

    // 선수 정보와 통계 정보 함께 가져오기
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

        // 선수의 해당 시즌 팀 정보 가져오기
        const currentTeam = await prisma.playerTeamHistory.findFirst({
          where: {
            player_id: vote.player_id,
            season_id: parseInt(seasonId),
          },
          include: {
            team: {
              select: {
                team_name: true,
              },
            },
          },
        });

        // 선수의 시즌 통계 가져오기
        const seasonStats = await prisma.playerSeasonStats.findFirst({
          where: {
            player_id: vote.player_id,
            season_id: parseInt(seasonId),
          },
          select: {
            goals: true,
            assists: true,
          },
        });

        // MVP 횟수 계산 (경기에서 골을 많이 넣은 횟수나 다른 로직으로 대체 가능)
        const mvpCount = 0;

        return {
          player_id: vote.player_id,
          player_name: player?.name || 'Unknown',
          team_name: currentTeam?.team?.team_name || null,
          jersey_number: player?.jersey_number || null,
          profile_image_url: player?.profile_image_url || null,
          votes_count: vote._count.player_id,
          goals: seasonStats?.goals || 0,
          assists: seasonStats?.assists || 0,
          mvp_count: mvpCount,
        };
      })
    );

    console.log('Final enriched results:', enrichedResults);

    return NextResponse.json({
      success: true,
      data: enrichedResults,
    });
  } catch (error) {
    console.error('MVP 투표 결과 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'MVP 투표 결과를 조회하는 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
