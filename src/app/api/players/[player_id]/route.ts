import { NextRequest, NextResponse } from 'next/server';

import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET /api/players/[player_id] - 특정 선수 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ player_id: string }> }
) {
  try {
    const { player_id } = await params;
    const playerId = parseInt(player_id);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }

    const player = await prisma.player.findUnique({
      where: {
        player_id: playerId,
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}

// PUT /api/players/[player_id] - Update a specific player
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ player_id: string }> }
) {
  try {
    await requireAdminAuth();

    const { player_id } = await params;
    const playerId = parseInt(player_id);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }

    // Check if player exists
    const existingPlayer = await prisma.player.findUnique({
      where: { player_id: playerId },
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { error: '선수를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      birth_date,
      nationality,
      height_cm,
      profile_image_url,
      jersey_number,
    } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: '선수명을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: '선수명은 100자를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // Check for duplicate name (excluding current player)
    const duplicatePlayer = await prisma.player.findUnique({
      where: { name: name.trim() },
    });

    if (duplicatePlayer && duplicatePlayer.player_id !== playerId) {
      return NextResponse.json(
        { error: '이미 존재하는 선수명입니다.' },
        { status: 400 }
      );
    }

    // Optional field validations
    if (
      nationality &&
      typeof nationality === 'string' &&
      nationality.length > 50
    ) {
      return NextResponse.json(
        { error: '국적은 50자를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    if (
      height_cm &&
      (typeof height_cm !== 'number' || height_cm < 100 || height_cm > 250)
    ) {
      return NextResponse.json(
        { error: '신장은 100cm~250cm 범위 내에서 입력해주세요.' },
        { status: 400 }
      );
    }

    if (
      jersey_number &&
      (typeof jersey_number !== 'number' ||
        jersey_number < 1 ||
        jersey_number > 99)
    ) {
      return NextResponse.json(
        { error: '등번호는 1~99 범위 내에서 입력해주세요.' },
        { status: 400 }
      );
    }

    // Update player
    const updatedPlayer = await prisma.player.update({
      where: { player_id: playerId },
      data: {
        name: name.trim(),
        birth_date: birth_date ? new Date(birth_date) : null,
        nationality: nationality?.trim() || null,
        height_cm: height_cm || null,
        profile_image_url: profile_image_url?.trim() || null,
        jersey_number: jersey_number || null,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      message: '선수 정보가 성공적으로 수정되었습니다.',
      player: updatedPlayer,
    });
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

    console.error('Error updating player:', error);
    return NextResponse.json(
      {
        error: '선수 정보 수정 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/players/[player_id] - Delete a specific player
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ player_id: string }> }
) {
  try {
    await requireAdminAuth();

    const { player_id } = await params;
    const playerId = parseInt(player_id);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }

    // Check if player exists
    const existingPlayer = await prisma.player.findUnique({
      where: { player_id: playerId },
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { error: '선수를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Check if player has any related data that would prevent deletion
    const [
      goalCount,
      assistCount,
      playerMatchStatsCount,
      playerTeamHistoryCount,
      substitutionCount,
      penaltyCount,
    ] = await Promise.all([
      prisma.goal.count({ where: { player_id: playerId } }),
      prisma.assist.count({ where: { player_id: playerId } }),
      prisma.playerMatchStats.count({ where: { player_id: playerId } }),
      prisma.playerTeamHistory.count({ where: { player_id: playerId } }),
      prisma.substitution.count({
        where: {
          OR: [{ player_in_id: playerId }, { player_out_id: playerId }],
        },
      }),
      prisma.penaltyShootoutDetail.count({
        where: {
          OR: [{ kicker_id: playerId }, { goalkeeper_id: playerId }],
        },
      }),
    ]);

    const totalRelatedRecords =
      goalCount +
      assistCount +
      playerMatchStatsCount +
      playerTeamHistoryCount +
      substitutionCount +
      penaltyCount;

    if (totalRelatedRecords > 0) {
      return NextResponse.json(
        {
          error: '이 선수는 경기 기록이 있어 삭제할 수 없습니다.',
          details: {
            goals: goalCount,
            assists: assistCount,
            matchStats: playerMatchStatsCount,
            teamHistory: playerTeamHistoryCount,
            substitutions: substitutionCount,
            penalties: penaltyCount,
          },
        },
        { status: 400 }
      );
    }

    // Delete player (only if no related records)
    await prisma.player.delete({
      where: { player_id: playerId },
    });

    return NextResponse.json({
      message: '선수가 성공적으로 삭제되었습니다.',
    });
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

    console.error('Error deleting player:', error);
    return NextResponse.json(
      {
        error: '선수 삭제 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
