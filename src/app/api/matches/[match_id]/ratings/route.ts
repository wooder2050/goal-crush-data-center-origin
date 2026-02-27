import { NextRequest, NextResponse } from 'next/server';

import {
  calculateMatchRating,
  type PlayerMatchRatingInput,
} from '@/features/matches/lib/calculateMatchRating';
import { prisma } from '@/lib/prisma';

// GET /api/matches/[match_id]/ratings - 경기별 선수 자동 계산 평점
export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    if (!/^\d+$/.test(params.match_id)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }
    const matchId = Number(params.match_id);

    // 경기 정보 (무실점 판정용)
    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
      select: {
        match_id: true,
        home_team_id: true,
        away_team_id: true,
        home_score: true,
        away_score: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // 상세 스탯 + 기본 스탯 병렬 조회
    const [detailedStats, basicStats] = await Promise.all([
      prisma.playerMatchDetailedStats.findMany({
        where: { match_id: matchId },
        include: {
          player: {
            select: {
              player_id: true,
              name: true,
              jersey_number: true,
              profile_image_url: true,
            },
          },
          team: {
            select: {
              team_id: true,
              team_name: true,
            },
          },
        },
      }),
      prisma.playerMatchStats.findMany({
        where: { match_id: matchId },
        select: {
          player_id: true,
          team_id: true,
          position: true,
          minutes_played: true,
          yellow_cards: true,
          red_cards: true,
        },
      }),
    ]);

    if (detailedStats.length === 0) {
      return NextResponse.json({ match_id: matchId, ratings: [] });
    }

    // 기본 스탯에서 position, minutes_played 매핑
    const basicStatsMap = new Map<
      number,
      {
        position: string;
        minutes_played: number | null;
        yellow_cards: number;
        red_cards: number;
      }
    >();
    for (const bs of basicStats) {
      if (bs.player_id != null) {
        basicStatsMap.set(bs.player_id, {
          position: bs.position ?? 'FW',
          minutes_played: bs.minutes_played ?? null,
          yellow_cards: bs.yellow_cards ?? 0,
          red_cards: bs.red_cards ?? 0,
        });
      }
    }

    const ratings = detailedStats
      .map((ds) => {
        const basic = basicStatsMap.get(ds.player_id) ?? {
          position: 'FW',
          minutes_played: null, // null = unknown, still rate if detailed stats exist
          yellow_cards: 0,
          red_cards: 0,
        };

        // 무실점 판정: 해당 선수 팀이 실점하지 않았는지
        const isHomeTeam = ds.team_id === match.home_team_id;
        const teamConceded = isHomeTeam
          ? (match.away_score ?? 0)
          : (match.home_score ?? 0);
        const isCleanSheet = teamConceded === 0;

        const input: PlayerMatchRatingInput = {
          position: basic.position,
          goals: ds.goals ?? 0,
          assists: ds.assists ?? 0,
          yellow_cards: ds.yellow_cards ?? basic.yellow_cards,
          red_cards: ds.red_cards ?? basic.red_cards,
          minutes_played: basic.minutes_played,
          passes: ds.passes ?? 0,
          passes_completed: ds.passes_completed ?? 0,
          pass_accuracy: ds.pass_accuracy,
          key_passes: ds.key_passes ?? 0,
          shots: ds.shots ?? 0,
          shots_on_target: ds.shots_on_target ?? 0,
          shot_accuracy: ds.shot_accuracy,
          saves: ds.saves ?? 0,
          goals_conceded: ds.goals_conceded ?? 0,
          gk_throws: ds.gk_throws ?? 0,
          gk_throws_completed: ds.gk_throws_completed ?? 0,
          interceptions: ds.interceptions ?? 0,
          clearances: ds.clearances ?? 0,
          dribbles: ds.dribbles ?? 0,
          fouls: ds.fouls ?? 0,
          isCleanSheet,
        };

        const result = calculateMatchRating(input);

        return {
          player_id: ds.player_id,
          team_id: ds.team_id,
          player_name: ds.player.name,
          jersey_number: ds.player.jersey_number,
          profile_image_url: ds.player.profile_image_url,
          team_name: ds.team.team_name,
          position: basic.position,
          goals: ds.goals ?? 0,
          assists: ds.assists ?? 0,
          yellow_cards: ds.yellow_cards ?? basic.yellow_cards,
          red_cards: ds.red_cards ?? basic.red_cards,
          rating: result.rating,
          breakdown: result.breakdown,
        };
      })
      .filter((r) => r.rating > 0); // 미출전 선수 제외

    // 평점 내림차순 정렬
    ratings.sort((a, b) => b.rating - a.rating);

    return NextResponse.json({
      match_id: matchId,
      ratings,
    });
  } catch (error) {
    console.error('Failed to fetch match ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match ratings' },
      { status: 500 }
    );
  }
}
