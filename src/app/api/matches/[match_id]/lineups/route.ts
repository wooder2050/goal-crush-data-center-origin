import { NextRequest, NextResponse } from 'next/server';

import type { PlayerMatchStatWithRelations } from '@/app/api/types';
import { prisma } from '@/lib/prisma';

type Substitution = {
  substitution_id: number;
  match_id: number;
  player_in_id: number;
  player_out_id: number | null;
  team_id: number;
  substitution_time: number | null;
  substitution_reason: string | null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { match_id: string } }
) {
  try {
    const matchId = parseInt(params.match_id);

    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    // Get match details first to know which teams are playing
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

    // 미완료 경기(선공개 라인업 선등록): 통계 왜곡 방지를 위해 minutes_played=0으로
    // 등록하므로, 교체 기록이 없는 선수는 분 수와 무관하게 선발로 분류한다
    const isCompleted = match.home_score !== null && match.away_score !== null;

    // Get player match stats for this match (실제 출전한 선수들)
    const playerStats = (await prisma.playerMatchStats.findMany({
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
    })) as unknown as PlayerMatchStatWithRelations[];

    // Get detailed stats for card information (yellow_cards, red_cards)
    const detailedStats = await prisma.playerMatchDetailedStats.findMany({
      where: { match_id: matchId },
      select: {
        player_id: true,
        yellow_cards: true,
        red_cards: true,
      },
    });

    // Create lookup map for detailed stats
    const detailedStatsMap = new Map<
      number,
      { yellow_cards: number; red_cards: number }
    >();
    detailedStats.forEach((ds) => {
      detailedStatsMap.set(ds.player_id, {
        yellow_cards: ds.yellow_cards ?? 0,
        red_cards: ds.red_cards ?? 0,
      });
    });

    // Get substitutions for this match
    const substitutions = (await prisma.substitution.findMany({
      where: { match_id: matchId },
      select: {
        substitution_id: true,
        match_id: true,
        player_in_id: true,
        player_out_id: true,
        team_id: true,
        substitution_time: true,
        substitution_reason: true,
      },
    })) as Substitution[];

    // Create substitution lookup
    const substitutionsByMatch: Record<number, Substitution[]> = {};
    substitutions.forEach((sub: Substitution) => {
      if (!substitutionsByMatch[sub.match_id]) {
        substitutionsByMatch[sub.match_id] = [];
      }
      substitutionsByMatch[sub.match_id].push(sub);
    });

    // Group by match and team
    const lineupsByMatch: Record<
      string,
      Array<{
        stat_id: number;
        match_id: number;
        player_id: number;
        team_id: number;
        goals: number;
        assists: number;
        yellow_cards: number;
        red_cards: number;
        minutes_played: number;
        saves: number;
        position: string;
        player_name: string;
        jersey_number: number | null;
        profile_image_url: string | null;
        team_name: string;
        participation_status: string;
        card_type: string;
      }>
    > = {};
    const homeTeamKey = `${match.match_id}_${match.home_team_id}`;
    const awayTeamKey = `${match.match_id}_${match.away_team_id}`;

    lineupsByMatch[homeTeamKey] = [];
    lineupsByMatch[awayTeamKey] = [];

    // Process player match stats (실제 출전한 선수들만 처리)
    const processedPlayers = new Set<string>(); // 중복 방지를 위한 Set

    playerStats.forEach((stat: PlayerMatchStatWithRelations) => {
      const playerKey = `${stat.player_id}_${stat.team_id}`;

      // 이미 처리된 선수는 스킵
      if (processedPlayers.has(playerKey)) {
        return;
      }
      processedPlayers.add(playerKey);

      const teamKey = `${match.match_id}_${stat.team_id}`;

      // Check if this player was substituted
      const matchSubs = substitutionsByMatch[match.match_id] || [];
      const playerSubstitution = matchSubs.find(
        (sub: Substitution) =>
          sub.player_in_id === stat.player_id ||
          sub.player_out_id === stat.player_id
      );

      // Determine participation status
      let participationStatus = 'bench'; // Default to bench

      if (playerSubstitution) {
        if (playerSubstitution.player_in_id === stat.player_id) {
          participationStatus = 'substitute';
        } else if (playerSubstitution.player_out_id === stat.player_id) {
          // 교체로 나간 선수는 선발로 간주
          participationStatus = 'starting';
        }
      } else if (stat.minutes_played && stat.minutes_played > 0) {
        participationStatus = 'starting';
      } else if (!isCompleted) {
        // 미완료 경기의 선등록 라인업(0분)은 선발로 분류
        participationStatus = 'starting';
      } else {
        // 출전하지 않은 선수는 벤치로 분류
        participationStatus = 'bench';
      }

      // Merge card data from detailed stats if available
      const detailedCardData = detailedStatsMap.get(stat.player_id || 0);
      const yellowCards =
        detailedCardData?.yellow_cards || stat.yellow_cards || 0;
      const redCards = detailedCardData?.red_cards || stat.red_cards || 0;

      // Determine card_type based on cards
      let cardType = stat.card_type || 'none';
      if (redCards > 0 && yellowCards >= 2) {
        cardType = 'red_accumulated';
      } else if (redCards > 0) {
        cardType = 'red_direct';
      } else if (yellowCards > 0) {
        cardType = 'yellow';
      }

      const playerData = {
        stat_id: stat.stat_id,
        match_id: match.match_id,
        player_id: stat.player_id || 0,
        team_id: stat.team_id || 0,
        goals: stat.goals || 0,
        assists: stat.assists || 0,
        yellow_cards: yellowCards,
        red_cards: redCards,
        minutes_played: stat.minutes_played || 0,
        saves: stat.saves || 0,
        position: stat.position || 'Unknown',
        player_name: stat.player?.name || 'Unknown',
        jersey_number: stat.player?.jersey_number ?? null,
        profile_image_url: stat.player?.profile_image_url ?? null,
        team_name: stat.team?.team_name || 'Unknown',
        participation_status: participationStatus,
        card_type: cardType,
      };

      if (lineupsByMatch[teamKey]) {
        lineupsByMatch[teamKey].push(playerData);
      }
    });

    const getPositionOrder = (position: string): number => {
      switch (position) {
        case 'Forward':
          return 0;
        case 'Midfielder':
          return 1;
        case 'Defender':
          return 2;
        case 'Goalkeeper':
          return 3;
        default:
          return 4;
      }
    };

    // Sort lineups: starting players first, then substitutes, then bench
    Object.keys(lineupsByMatch).forEach((key: string) => {
      lineupsByMatch[key].sort((a, b) => {
        const statusOrder = { starting: 0, substitute: 1, bench: 2 };
        const aOrder =
          statusOrder[a.participation_status as keyof typeof statusOrder] || 3;
        const bOrder =
          statusOrder[b.participation_status as keyof typeof statusOrder] || 3;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        // Within same status, sort by position
        const positionOrderA = getPositionOrder(a.position);
        const positionOrderB = getPositionOrder(b.position);
        if (positionOrderA !== positionOrderB) {
          return positionOrderA - positionOrderB;
        }

        // Within same position, sort by player name
        return (a.player_name || '').localeCompare(b.player_name || '', 'ko');
      });
    });

    return NextResponse.json(lineupsByMatch);
  } catch (error) {
    console.error('Error fetching match lineups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match lineups' },
      { status: 500 }
    );
  }
}
