import { NextRequest, NextResponse } from 'next/server';

import type { HeadToHeadMatch, HeadToHeadStats } from '@/app/api/types';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let team1Id: number | undefined;
  let team2Id: number | undefined;

  try {
    const url = new URL(request.url);
    const team1Param = url.searchParams.get('team1_id');
    const team2Param = url.searchParams.get('team2_id');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!team1Param || !team2Param) {
      return NextResponse.json(
        { error: 'team1_id and team2_id are required' },
        { status: 400 }
      );
    }

    team1Id = Number(team1Param);
    team2Id = Number(team2Param);

    if (team1Id === team2Id) {
      return NextResponse.json(
        { error: 'team1_id and team2_id must be different' },
        { status: 400 }
      );
    }

    // 두 팀 정보 가져오기
    const [team1, team2] = await Promise.all([
      prisma.team.findUnique({
        where: { team_id: team1Id },
        select: {
          team_id: true,
          team_name: true,
          logo: true,
          primary_color: true,
          secondary_color: true,
        },
      }),
      prisma.team.findUnique({
        where: { team_id: team2Id },
        select: {
          team_id: true,
          team_name: true,
          logo: true,
          primary_color: true,
          secondary_color: true,
        },
      }),
    ]);

    if (!team1 || !team2) {
      return NextResponse.json(
        { error: 'One or both teams not found' },
        { status: 404 }
      );
    }

    // 두 팀 간의 모든 경기 가져오기 (완료된 경기만)
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { home_team_id: team1Id, away_team_id: team2Id },
          { home_team_id: team2Id, away_team_id: team1Id },
        ],
        AND: [{ home_score: { not: null } }, { away_score: { not: null } }],
      },
      include: {
        home_team: {
          select: { team_name: true },
        },
        away_team: {
          select: { team_name: true },
        },
        season: {
          select: { season_name: true },
        },
      },
      orderBy: {
        match_date: 'desc',
      },
    });

    if (matches.length === 0) {
      const emptyStats = {
        team1_id: team1Id,
        team2_id: team2Id,
        team1_name: team1.team_name,
        team2_name: team2.team_name,
        team1_logo: team1.logo || undefined,
        team2_logo: team2.logo || undefined,
        team1_primary_color: team1.primary_color || undefined,
        team1_secondary_color: team1.secondary_color || undefined,
        team2_primary_color: team2.primary_color || undefined,
        team2_secondary_color: team2.secondary_color || undefined,
        total_matches: 0,
        team1_wins: 0,
        team2_wins: 0,
        draws: 0,
        team1_goals: 0,
        team2_goals: 0,
        recent_matches: [],
        biggest_win_team1: null,
        biggest_win_team2: null,
      } satisfies HeadToHeadStats;

      return NextResponse.json(emptyStats);
    }

    // 통계 계산
    let team1Wins = 0;
    let team2Wins = 0;
    let draws = 0;
    let team1Goals = 0;
    let team2Goals = 0;
    let biggestWinTeam1: {
      match_date: string;
      score: string;
      season: string;
      margin: number;
    } | null = null;
    let biggestWinTeam2: {
      match_date: string;
      score: string;
      season: string;
      margin: number;
    } | null = null;
    let maxMarginTeam1 = -1;
    let maxMarginTeam2 = -1;

    // 모든 매치에 대해 통계 계산
    matches.forEach((match) => {
      const homeScore = match.home_score || 0;
      const awayScore = match.away_score || 0;

      // 팀1 관점에서 골 수와 승부 계산
      let team1Score: number;
      let team2Score: number;

      if (match.home_team_id === team1Id) {
        team1Score = homeScore;
        team2Score = awayScore;
      } else {
        team1Score = awayScore;
        team2Score = homeScore;
      }

      team1Goals += team1Score;
      team2Goals += team2Score;

      if (team1Score > team2Score) {
        team1Wins++;
        const margin = team1Score - team2Score;
        if (margin > maxMarginTeam1) {
          maxMarginTeam1 = margin;
          biggestWinTeam1 = {
            match_date: match.match_date.toISOString().split('T')[0],
            score: `${team1Score}-${team2Score}`,
            season: match.season?.season_name || 'Unknown',
            margin,
          };
        }
      } else if (team2Score > team1Score) {
        team2Wins++;
        const margin = team2Score - team1Score;
        if (margin > maxMarginTeam2) {
          maxMarginTeam2 = margin;
          biggestWinTeam2 = {
            match_date: match.match_date.toISOString().split('T')[0],
            score: `${team2Score}-${team1Score}`,
            season: match.season?.season_name || 'Unknown',
            margin,
          };
        }
      } else {
        // 동점 → 승부차기(PK) 결과로 승패 결정
        const pkHome = match.penalty_home_score ?? 0;
        const pkAway = match.penalty_away_score ?? 0;
        if (pkHome !== 0 || pkAway !== 0) {
          let pkTeam1: number;
          let pkTeam2: number;
          if (match.home_team_id === team1Id) {
            pkTeam1 = pkHome;
            pkTeam2 = pkAway;
          } else {
            pkTeam1 = pkAway;
            pkTeam2 = pkHome;
          }
          if (pkTeam1 > pkTeam2) {
            team1Wins++;
          } else if (pkTeam2 > pkTeam1) {
            team2Wins++;
          } else {
            draws++;
          }
        } else {
          draws++;
        }
      }
    });

    // 최근 경기 목록 (limit 적용)
    const recentMatches: HeadToHeadMatch[] = matches
      .slice(0, limit)
      .map((match) => {
        const homeScore = match.home_score || 0;
        const awayScore = match.away_score || 0;

        return {
          match_id: match.match_id,
          match_date: match.match_date.toISOString().split('T')[0],
          home_team_name: match.home_team?.team_name || '',
          away_team_name: match.away_team?.team_name || '',
          home_score: homeScore,
          away_score: awayScore,
          season_name: match.season?.season_name || 'Unknown',
          location: match.location || undefined,
          penalty_home_score: match.penalty_home_score ?? undefined,
          penalty_away_score: match.penalty_away_score ?? undefined,
        };
      });

    const stats = {
      team1_id: team1Id,
      team2_id: team2Id,
      team1_name: team1.team_name,
      team2_name: team2.team_name,
      team1_logo: team1.logo || undefined,
      team2_logo: team2.logo || undefined,
      team1_primary_color: team1.primary_color || undefined,
      team1_secondary_color: team1.secondary_color || undefined,
      team2_primary_color: team2.primary_color || undefined,
      team2_secondary_color: team2.secondary_color || undefined,
      total_matches: matches.length,
      team1_wins: team1Wins,
      team2_wins: team2Wins,
      draws: draws,
      team1_goals: team1Goals,
      team2_goals: team2Goals,
      recent_matches: recentMatches,
      biggest_win_team1: biggestWinTeam1,
      biggest_win_team2: biggestWinTeam2,
    } satisfies HeadToHeadStats;

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching head-to-head stats:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      team1Id,
      team2Id,
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch head-to-head statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
