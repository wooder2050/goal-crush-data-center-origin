import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const revalidate = 600;

export async function GET(
  _request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const teamId = parseInt(params.teamId, 10);
    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid teamId' }, { status: 400 });
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ home_team_id: teamId }, { away_team_id: teamId }],
        home_score: { not: null },
        away_score: { not: null },
        season_id: { not: null },
      },
      select: {
        home_team_id: true,
        away_team_id: true,
        home_coach_id: true,
        away_coach_id: true,
        home_score: true,
        away_score: true,
        penalty_home_score: true,
        penalty_away_score: true,
        season: { select: { season_id: true, season_name: true } },
      },
      orderBy: { match_date: 'asc' },
    });

    const aggKey = (seasonId: number, coachId: number) =>
      `${seasonId}-${coachId}`;
    const aggMap = new Map<
      string,
      {
        seasonId: number;
        seasonName: string;
        coachId: number;
        matches: number;
        wins: number;
        losses: number;
      }
    >();

    for (const m of matches) {
      const isHome = m.home_team_id === teamId;
      const coachId = isHome ? m.home_coach_id : m.away_coach_id;
      const seasonId = m.season?.season_id;
      if (!coachId || !seasonId) continue;

      const k = aggKey(seasonId, coachId);
      if (!aggMap.has(k)) {
        aggMap.set(k, {
          seasonId,
          seasonName: m.season!.season_name,
          coachId,
          matches: 0,
          wins: 0,
          losses: 0,
        });
      }
      const agg = aggMap.get(k)!;
      agg.matches += 1;

      const teamScore = isHome ? m.home_score! : m.away_score!;
      const oppScore = isHome ? m.away_score! : m.home_score!;

      if (teamScore > oppScore) {
        agg.wins += 1;
      } else if (teamScore < oppScore) {
        agg.losses += 1;
      } else {
        const pkTeam = isHome ? m.penalty_home_score : m.penalty_away_score;
        const pkOpp = isHome ? m.penalty_away_score : m.penalty_home_score;
        if (pkTeam != null && pkOpp != null && pkTeam > pkOpp) {
          agg.wins += 1;
        } else {
          agg.losses += 1;
        }
      }
    }

    const coachIds = Array.from(
      new Set(Array.from(aggMap.values()).map((a) => a.coachId))
    );
    const coaches =
      coachIds.length > 0
        ? await prisma.coach.findMany({
            where: { coach_id: { in: coachIds } },
            select: { coach_id: true, name: true, profile_image_url: true },
          })
        : [];
    const coachInfoMap = new Map(coaches.map((c) => [c.coach_id, c]));

    const records = Array.from(aggMap.values())
      .sort((a, b) => a.seasonId - b.seasonId)
      .map((agg) => {
        const info = coachInfoMap.get(agg.coachId);
        const winRate =
          agg.matches > 0 ? Math.round((agg.wins / agg.matches) * 100) : 0;
        const ppg =
          agg.matches > 0
            ? Math.round(((agg.wins * 3) / agg.matches) * 10) / 10
            : 0;
        return {
          season_name: agg.seasonName,
          coach_id: agg.coachId,
          coach_name: info?.name ?? '-',
          profile_image_url: info?.profile_image_url ?? null,
          matches: agg.matches,
          wins: agg.wins,
          losses: agg.losses,
          win_rate: winRate,
          ppg,
        };
      });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching coach records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coach records' },
      { status: 500 }
    );
  }
}
