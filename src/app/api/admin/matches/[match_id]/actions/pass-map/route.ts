import { NextRequest, NextResponse } from 'next/server';

import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 피치 크기 (골때녀 풋살 규격)
const PITCH_WIDTH = 40;
const PITCH_HEIGHT = 20;

// 후반(2, 4) 피리어드 좌표 반전 함수
// isSidesSwapped가 true인 경우, 전후반 반전 로직도 반대로 적용
function normalizeCoordinates(
  x: number,
  y: number,
  periodId: number,
  isSidesSwapped: boolean = false
): { x: number; y: number } {
  // is_sides_swapped가 true면 전반/후반 로직이 반대
  // 일반: 후반(2, 4)에서 반전
  // 반전: 전반(1, 3)에서 반전
  const isSecondHalf = periodId === 2 || periodId === 4;
  const shouldInvert = isSidesSwapped ? !isSecondHalf : isSecondHalf;

  if (shouldInvert) {
    return {
      x: PITCH_WIDTH - x,
      y: PITCH_HEIGHT - y,
    };
  }
  return { x, y };
}

interface PlayerPosition {
  player_id: number;
  player_name: string;
  jersey_number: number;
  profile_image_url: string | null;
  avg_x: number;
  avg_y: number;
  total_passes: number;
  success_passes: number;
}

interface PassConnection {
  from_jersey: number;
  to_jersey: number;
  count: number;
}

interface TeamPassNetworkData {
  team_id: number;
  team_name: string;
  primary_color: string;
  secondary_color: string;
  players: PlayerPosition[];
  connections: PassConnection[];
  total_passes: number;
  success_passes: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ match_id: string }> }
) {
  try {
    await requireAdminAuth();

    const { match_id } = await params;
    const matchId = parseInt(match_id, 10);

    if (isNaN(matchId)) {
      return NextResponse.json(
        { error: '유효하지 않은 경기 ID입니다.' },
        { status: 400 }
      );
    }

    // 경기 정보 가져오기 (is_sides_swapped 확인)
    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
      select: { is_sides_swapped: true },
    });

    const isSidesSwapped = match?.is_sides_swapped ?? false;

    // 모든 액션 가져오기 (패스 연결 분석을 위해)
    const actions = await prisma.matchAction.findMany({
      where: {
        match_id: matchId,
      },
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
            primary_color: true,
            secondary_color: true,
          },
        },
      },
      orderBy: [{ period_id: 'asc' }, { action_index: 'asc' }],
    });

    // 팀별로 그룹화
    const teamMap = new Map<
      number,
      {
        team_id: number;
        team_name: string;
        primary_color: string;
        secondary_color: string;
        actions: typeof actions;
      }
    >();

    actions.forEach((action) => {
      const teamId = action.team_id;
      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, {
          team_id: teamId,
          team_name: action.team?.team_name || '알 수 없음',
          primary_color: action.team?.primary_color || '#3b82f6',
          secondary_color: action.team?.secondary_color || '#FFFFFF',
          actions: [],
        });
      }
      teamMap.get(teamId)!.actions.push(action);
    });

    const result: TeamPassNetworkData[] = [];

    teamMap.forEach((teamData) => {
      const playerMap = new Map<
        number,
        {
          player_id: number;
          player_name: string;
          jersey_number: number;
          profile_image_url: string | null;
          positions: { x: number; y: number }[];
          total_passes: number;
          success_passes: number;
        }
      >();

      const connectionMap = new Map<string, number>(); // "from-to" -> count

      // 성공한 패스만 분석
      const teamActions = teamData.actions;

      teamActions.forEach((action, index) => {
        // 선수 위치 데이터 수집 (모든 액션에서)
        const jerseyNumber = action.player?.jersey_number ?? 0;
        if (!playerMap.has(jerseyNumber)) {
          playerMap.set(jerseyNumber, {
            player_id: action.player?.player_id ?? 0,
            player_name: action.player?.name || '알 수 없음',
            jersey_number: jerseyNumber,
            profile_image_url: action.player?.profile_image_url ?? null,
            positions: [],
            total_passes: 0,
            success_passes: 0,
          });
        }

        // 후반 진영 반전 적용 (is_sides_swapped 고려)
        const normalizedPos = normalizeCoordinates(
          action.start_x,
          action.start_y,
          action.period_id,
          isSidesSwapped
        );
        playerMap.get(jerseyNumber)!.positions.push({
          x: normalizedPos.x,
          y: normalizedPos.y,
        });

        // 패스 분석 (PASS, KEEPER_THROW 모두 패스로 취급)
        if (
          action.action_type === 'PASS' ||
          action.action_type === 'KEEPER_THROW'
        ) {
          const playerData = playerMap.get(jerseyNumber)!;
          playerData.total_passes++;

          if (action.result === 'SUCCESS') {
            playerData.success_passes++;

            // 다음 액션이 RECEIVE인지 확인 (같은 period)
            const nextAction = teamActions[index + 1];
            if (
              nextAction &&
              nextAction.action_type === 'RECEIVE' &&
              nextAction.period_id === action.period_id &&
              nextAction.player_id !== action.player_id
            ) {
              const receiverJersey = nextAction.player?.jersey_number ?? 0;
              const connectionKey = `${jerseyNumber}-${receiverJersey}`;
              connectionMap.set(
                connectionKey,
                (connectionMap.get(connectionKey) || 0) + 1
              );
            }
          }
        }
      });

      // 선수별 평균 위치 계산
      const players: PlayerPosition[] = [];
      playerMap.forEach((data) => {
        if (data.positions.length > 0) {
          const avgX =
            data.positions.reduce((sum, p) => sum + p.x, 0) /
            data.positions.length;
          const avgY =
            data.positions.reduce((sum, p) => sum + p.y, 0) /
            data.positions.length;
          players.push({
            player_id: data.player_id,
            player_name: data.player_name,
            jersey_number: data.jersey_number,
            profile_image_url: data.profile_image_url,
            avg_x: avgX,
            avg_y: avgY,
            total_passes: data.total_passes,
            success_passes: data.success_passes,
          });
        }
      });

      // 연결 데이터 변환
      const connections: PassConnection[] = [];
      connectionMap.forEach((count, key) => {
        const [from, to] = key.split('-').map(Number);
        connections.push({
          from_jersey: from,
          to_jersey: to,
          count,
        });
      });

      // 팀 전체 통계
      const totalPasses = players.reduce((sum, p) => sum + p.total_passes, 0);
      const successPasses = players.reduce(
        (sum, p) => sum + p.success_passes,
        0
      );

      result.push({
        team_id: teamData.team_id,
        team_name: teamData.team_name,
        primary_color: teamData.primary_color,
        secondary_color: teamData.secondary_color,
        players,
        connections,
        total_passes: totalPasses,
        success_passes: successPasses,
      });
    });

    return NextResponse.json(result);
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

    console.error('패스맵 데이터 조회 오류:', error);
    return NextResponse.json(
      { error: '패스맵 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
