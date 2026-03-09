import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// 피치 크기 (골때녀 풋살 규격)
const PITCH_WIDTH = 40;
const PITCH_HEIGHT = 20;

// 골때리는 그녀들 경기 시간 (전반 13분 + 후반 13분 = 26분)
const MATCH_DURATION_MINUTES = 26;

// 후반(2, 4) 피리어드 좌표 반전 함수
function normalizeCoordinates(
  x: number,
  y: number,
  periodId: number,
  isSidesSwapped = false,
): { x: number; y: number } {
  const isSecondHalf = periodId === 2 || periodId === 4;
  const shouldInvert = isSidesSwapped ? !isSecondHalf : isSecondHalf;

  if (shouldInvert) {
    return { x: PITCH_WIDTH - x, y: PITCH_HEIGHT - y };
  }
  return { x, y };
}

export interface PlayerPosition {
  player_id: number;
  player_name: string;
  jersey_number: number;
  profile_image_url: string | null;
  avg_x: number;
  avg_y: number;
  total_passes: number;
  success_passes: number;
}

export interface PassConnection {
  from_jersey: number;
  to_jersey: number;
  count: number;
}

export interface TeamPassNetworkData {
  team_id: number;
  team_name: string;
  primary_color: string;
  secondary_color: string;
  players: PlayerPosition[];
  connections: PassConnection[];
  total_passes: number;
  success_passes: number;
}

interface DetailedStatData {
  player_id: number;
  team_id: number;
  passes?: number;
  passes_completed?: number;
  pass_accuracy?: number;
  key_passes?: number;
  shots?: number;
  shots_on_target?: number;
  shot_accuracy?: number;
  saves?: number;
  goals_conceded?: number;
  gk_throws?: number;
  gk_throws_completed?: number;
  tackles?: number;
  tackles_won?: number;
  interceptions?: number;
  clearances?: number;
  dribbles?: number;
  free_kicks?: number;
  free_kick_goals?: number;
  throw_ins?: number;
  corner_kicks?: number;
  penalty_goals?: number;
  own_goals?: number;
  goals?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
  fouls?: number;
  possession_time?: number;
}

interface PossessionData {
  player_id: number;
  team_id: number;
  possession_time: number;
}

@Injectable()
export class AdminMatchesService {
  private readonly logger = new Logger(AdminMatchesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── GET /admin/matches ──
  async findAll(query: {
    status?: string;
    season_id?: string;
    team_id?: string;
    limit?: string;
  }) {
    const where: Prisma.MatchWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.season_id && !isNaN(parseInt(query.season_id))) {
      where.season_id = parseInt(query.season_id);
    }
    if (query.team_id && !isNaN(parseInt(query.team_id))) {
      const id = parseInt(query.team_id);
      where.OR = [{ home_team_id: id }, { away_team_id: id }];
    }

    const queryOptions: Prisma.MatchFindManyArgs = {
      where,
      include: {
        home_team: { select: { team_id: true, team_name: true, logo: true } },
        away_team: { select: { team_id: true, team_name: true, logo: true } },
        season: { select: { season_id: true, season_name: true } },
      },
      orderBy: { match_date: 'desc' },
    };

    if (query.limit && !isNaN(parseInt(query.limit))) {
      queryOptions.take = parseInt(query.limit);
    }

    return this.prisma.match.findMany(queryOptions);
  }

  // ── POST /admin/matches ──
  async create(data: Record<string, any>) {
    const requiredFields = ['season_id', 'home_team_id', 'away_team_id', 'match_date'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new BadRequestException(`Missing required field: ${field}`);
      }
    }

    if (data.home_team_id === data.away_team_id) {
      throw new BadRequestException('Home team and away team cannot be the same');
    }

    return this.prisma.match.create({
      data: {
        season_id: data.season_id,
        home_team_id: data.home_team_id,
        away_team_id: data.away_team_id,
        match_date: new Date(data.match_date),
        location: data.location || null,
        status: data.status || 'scheduled',
        description: data.description || null,
        tournament_stage: data.tournament_stage || null,
        group_stage: data.group_stage || null,
      },
      include: { home_team: true, away_team: true, season: true },
    });
  }

  // ── GET /admin/matches/:matchId ──
  async findOne(matchId: number) {
    const match = await this.prisma.match.findUnique({
      where: { match_id: matchId },
      include: {
        home_team: true,
        away_team: true,
        season: true,
        home_coach: true,
        away_coach: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }
    return match;
  }

  // ── PUT/PATCH /admin/matches/:matchId ──
  async update(matchId: number, data: Record<string, any>) {
    const existingMatch = await this.prisma.match.findUnique({
      where: { match_id: matchId },
    });

    if (!existingMatch) {
      throw new NotFoundException('Match not found');
    }

    return this.prisma.match.update({
      where: { match_id: matchId },
      data: {
        home_score: data.home_score !== undefined ? data.home_score : undefined,
        away_score: data.away_score !== undefined ? data.away_score : undefined,
        penalty_home_score: data.penalty_home_score !== undefined ? data.penalty_home_score : undefined,
        penalty_away_score: data.penalty_away_score !== undefined ? data.penalty_away_score : undefined,
        status: (data.status as string) || undefined,
        match_date: data.match_date ? new Date(data.match_date as string) : undefined,
        location: data.location !== undefined ? data.location : undefined,
        description: data.description !== undefined ? data.description : undefined,
        tournament_stage: data.tournament_stage !== undefined ? data.tournament_stage : undefined,
        group_stage: data.group_stage !== undefined ? data.group_stage : undefined,
        highlight_url: data.highlight_url !== undefined ? data.highlight_url : undefined,
        full_video_url: data.full_video_url !== undefined ? data.full_video_url : undefined,
        is_sides_swapped: data.is_sides_swapped !== undefined ? data.is_sides_swapped : undefined,
      },
      include: { home_team: true, away_team: true, season: true },
    });
  }

  // ── DELETE /admin/matches/:matchId ──
  async remove(matchId: number) {
    const existingMatch = await this.prisma.match.findUnique({
      where: { match_id: matchId },
    });

    if (!existingMatch) {
      throw new NotFoundException('Match not found');
    }

    await this.prisma.$transaction([
      this.prisma.goal.deleteMany({ where: { match_id: matchId } }),
      this.prisma.assist.deleteMany({ where: { match_id: matchId } }),
      this.prisma.substitution.deleteMany({ where: { match_id: matchId } }),
      this.prisma.playerMatchStats.deleteMany({ where: { match_id: matchId } }),
      this.prisma.penaltyShootoutDetail.deleteMany({ where: { match_id: matchId } }),
      this.prisma.matchCoach.deleteMany({ where: { match_id: matchId } }),
      this.prisma.match.delete({ where: { match_id: matchId } }),
    ]);

    return { message: 'Match deleted successfully' };
  }

  // ── GET /admin/matches/:matchId/actions ──
  async getActions(matchId: number) {
    return this.prisma.matchAction.findMany({
      where: { match_id: matchId },
      include: {
        player: {
          select: { player_id: true, name: true, jersey_number: true, profile_image_url: true },
        },
        team: {
          select: { team_id: true, team_name: true },
        },
      },
      orderBy: [{ period_id: 'asc' }, { time_seconds: 'asc' }, { action_index: 'asc' }],
    });
  }

  // ── POST /admin/matches/:matchId/actions ──
  async createAction(matchId: number, body: Record<string, any>) {
    const requiredFields = [
      'period_id', 'time_seconds', 'player_id', 'team_id',
      'action_type', 'result', 'start_x', 'start_y',
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        throw new BadRequestException(`Missing required field: ${field}`);
      }
    }

    const match = await this.prisma.match.findUnique({ where: { match_id: matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const maxIndex = await this.prisma.matchAction.aggregate({
      where: { match_id: matchId, period_id: body.period_id },
      _max: { action_index: true },
    });

    const newIndex = (maxIndex._max.action_index ?? 0) + 1;

    return this.prisma.matchAction.create({
      data: {
        match_id: matchId,
        period_id: body.period_id,
        action_index: newIndex,
        time_seconds: body.time_seconds,
        player_id: body.player_id,
        team_id: body.team_id,
        action_type: body.action_type,
        result: body.result,
        body_part: body.body_part ?? null,
        start_x: body.start_x,
        start_y: body.start_y,
        end_x: body.end_x ?? null,
        end_y: body.end_y ?? null,
        description: body.description ?? null,
        is_set_piece: body.is_set_piece ?? false,
      },
      include: {
        player: {
          select: { player_id: true, name: true, jersey_number: true, profile_image_url: true },
        },
        team: { select: { team_id: true, team_name: true } },
      },
    });
  }

  // ── DELETE /admin/matches/:matchId/actions (undo last) ──
  async deleteLastAction(matchId: number, periodId?: string) {
    const lastAction = await this.prisma.matchAction.findFirst({
      where: {
        match_id: matchId,
        ...(periodId ? { period_id: parseInt(periodId) } : {}),
      },
      orderBy: [{ period_id: 'desc' }, { time_seconds: 'desc' }, { action_index: 'desc' }],
    });

    if (!lastAction) {
      throw new NotFoundException('No action found to delete');
    }

    await this.prisma.matchAction.delete({ where: { action_id: lastAction.action_id } });
    return { success: true, deleted: lastAction };
  }

  // ── GET /admin/matches/:matchId/actions/:actionId ──
  async getAction(matchId: number, actionId: number) {
    const action = await this.prisma.matchAction.findFirst({
      where: { action_id: actionId, match_id: matchId },
      include: {
        player: {
          select: { player_id: true, name: true, jersey_number: true, profile_image_url: true },
        },
        team: { select: { team_id: true, team_name: true } },
      },
    });

    if (!action) {
      throw new NotFoundException('Action not found');
    }
    return action;
  }

  // ── PATCH /admin/matches/:matchId/actions/:actionId ──
  async updateAction(matchId: number, actionId: number, body: Record<string, any>) {
    const existingAction = await this.prisma.matchAction.findFirst({
      where: { action_id: actionId, match_id: matchId },
    });

    if (!existingAction) {
      throw new NotFoundException('Action not found');
    }

    return this.prisma.matchAction.update({
      where: { action_id: actionId },
      data: {
        ...(body.period_id !== undefined && { period_id: body.period_id }),
        ...(body.time_seconds !== undefined && { time_seconds: body.time_seconds }),
        ...(body.player_id !== undefined && { player_id: body.player_id }),
        ...(body.team_id !== undefined && { team_id: body.team_id }),
        ...(body.action_type !== undefined && { action_type: body.action_type }),
        ...(body.result !== undefined && { result: body.result }),
        ...(body.body_part !== undefined && { body_part: body.body_part }),
        ...(body.start_x !== undefined && { start_x: body.start_x }),
        ...(body.start_y !== undefined && { start_y: body.start_y }),
        ...(body.end_x !== undefined && { end_x: body.end_x }),
        ...(body.end_y !== undefined && { end_y: body.end_y }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.is_set_piece !== undefined && { is_set_piece: body.is_set_piece }),
      },
      include: {
        player: {
          select: { player_id: true, name: true, jersey_number: true, profile_image_url: true },
        },
        team: { select: { team_id: true, team_name: true } },
      },
    });
  }

  // ── DELETE /admin/matches/:matchId/actions/:actionId ──
  async deleteAction(matchId: number, actionId: number) {
    const existingAction = await this.prisma.matchAction.findFirst({
      where: { action_id: actionId, match_id: matchId },
    });

    if (!existingAction) {
      throw new NotFoundException('Action not found');
    }

    await this.prisma.matchAction.delete({ where: { action_id: actionId } });
    return { success: true };
  }

  // ── GET /admin/matches/:matchId/actions/pass-map ──
  async getPassMap(matchId: number): Promise<TeamPassNetworkData[]> {
    const match = await this.prisma.match.findUnique({
      where: { match_id: matchId },
      select: { is_sides_swapped: true },
    });
    const isSidesSwapped = match?.is_sides_swapped ?? false;

    const actions = await this.prisma.matchAction.findMany({
      where: { match_id: matchId },
      include: {
        player: {
          select: { player_id: true, name: true, jersey_number: true, profile_image_url: true },
        },
        team: {
          select: { team_id: true, team_name: true, primary_color: true, secondary_color: true },
        },
      },
      orderBy: [{ period_id: 'asc' }, { action_index: 'asc' }],
    });

    const teamMap = new Map<number, {
      team_id: number;
      team_name: string;
      primary_color: string;
      secondary_color: string;
      actions: typeof actions;
    }>();

    actions.forEach((action) => {
      const teamId = action.team_id;
      if (!teamMap.has(teamId)) {
        teamMap.set(teamId, {
          team_id: teamId,
          team_name: action.team?.team_name || 'Unknown',
          primary_color: action.team?.primary_color || '#3b82f6',
          secondary_color: action.team?.secondary_color || '#FFFFFF',
          actions: [],
        });
      }
      teamMap.get(teamId)!.actions.push(action);
    });

    const result: TeamPassNetworkData[] = [];

    teamMap.forEach((teamData) => {
      const playerMap = new Map<number, {
        player_id: number;
        player_name: string;
        jersey_number: number;
        profile_image_url: string | null;
        positions: { x: number; y: number }[];
        total_passes: number;
        success_passes: number;
      }>();

      const connectionMap = new Map<string, number>();
      const teamActions = teamData.actions;

      teamActions.forEach((action, index) => {
        const jerseyNumber = action.player?.jersey_number ?? 0;
        if (!playerMap.has(jerseyNumber)) {
          playerMap.set(jerseyNumber, {
            player_id: action.player?.player_id ?? 0,
            player_name: action.player?.name || 'Unknown',
            jersey_number: jerseyNumber,
            profile_image_url: action.player?.profile_image_url ?? null,
            positions: [],
            total_passes: 0,
            success_passes: 0,
          });
        }

        const normalizedPos = normalizeCoordinates(
          action.start_x, action.start_y, action.period_id, isSidesSwapped,
        );
        playerMap.get(jerseyNumber)!.positions.push({ x: normalizedPos.x, y: normalizedPos.y });

        if (action.action_type === 'PASS' || action.action_type === 'KEEPER_THROW') {
          const playerData = playerMap.get(jerseyNumber)!;
          playerData.total_passes++;

          if (action.result === 'SUCCESS') {
            playerData.success_passes++;

            const nextAction = teamActions[index + 1];
            if (
              nextAction &&
              nextAction.action_type === 'RECEIVE' &&
              nextAction.period_id === action.period_id &&
              nextAction.player_id !== action.player_id
            ) {
              const receiverJersey = nextAction.player?.jersey_number ?? 0;
              const connectionKey = `${jerseyNumber}-${receiverJersey}`;
              connectionMap.set(connectionKey, (connectionMap.get(connectionKey) || 0) + 1);
            }
          }
        }
      });

      const players: PlayerPosition[] = [];
      playerMap.forEach((data) => {
        if (data.positions.length > 0) {
          const avgX = data.positions.reduce((sum, p) => sum + p.x, 0) / data.positions.length;
          const avgY = data.positions.reduce((sum, p) => sum + p.y, 0) / data.positions.length;
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

      const connections: PassConnection[] = [];
      connectionMap.forEach((count, key) => {
        const [from, to] = key.split('-').map(Number);
        connections.push({ from_jersey: from, to_jersey: to, count });
      });

      const totalPasses = players.reduce((sum, p) => sum + p.total_passes, 0);
      const successPasses = players.reduce((sum, p) => sum + p.success_passes, 0);

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

    return result;
  }

  // ── GET /admin/matches/:matchId/assists ──
  async getAssists(matchId: number) {
    return this.prisma.assist.findMany({
      where: { goal: { match_id: matchId } },
      include: {
        player: { select: { player_id: true, name: true, jersey_number: true } },
        goal: {
          select: {
            goal_id: true,
            goal_time: true,
            goal_type: true,
            player: { select: { player_id: true, name: true, jersey_number: true } },
          },
        },
      },
      orderBy: { goal: { goal_time: 'asc' } },
    });
  }

  // ── POST /admin/matches/:matchId/assists ──
  async createAssist(matchId: number, data: { player_id: number; goal_id: number; description?: string }) {
    if (!data.player_id || !data.goal_id) {
      throw new BadRequestException('player_id and goal_id are required');
    }

    const player = await this.prisma.player.findUnique({ where: { player_id: data.player_id } });
    if (!player) throw new NotFoundException('Player not found');

    const goal = await this.prisma.goal.findFirst({
      where: { goal_id: data.goal_id, match_id: matchId },
    });
    if (!goal) throw new NotFoundException('Goal not found in this match');

    const playerMatchStats = await this.prisma.playerMatchStats.findFirst({
      where: { match_id: matchId, player_id: data.player_id },
    });
    if (!playerMatchStats) {
      throw new BadRequestException(
        'Player must be registered in lineup before recording assists. Please add the player to lineup first.',
      );
    }

    const assist = await this.prisma.assist.create({
      data: {
        match_id: matchId,
        player_id: data.player_id,
        goal_id: data.goal_id,
        description: data.description || null,
      },
      include: {
        player: { select: { player_id: true, name: true, jersey_number: true } },
        goal: {
          select: {
            goal_id: true, goal_time: true, goal_type: true,
            player: { select: { player_id: true, name: true, jersey_number: true } },
          },
        },
      },
    });

    await this.prisma.playerMatchStats.update({
      where: { stat_id: playerMatchStats.stat_id },
      data: { assists: (playerMatchStats.assists || 0) + 1, updated_at: new Date() },
    });

    const match = await this.prisma.match.findUnique({ where: { match_id: matchId } });
    if (match && match.season_id) {
      const seasonStats = await this.prisma.playerSeasonStats.findFirst({
        where: { player_id: data.player_id, season_id: match.season_id },
      });
      if (seasonStats) {
        await this.prisma.playerSeasonStats.update({
          where: { stat_id: seasonStats.stat_id },
          data: { assists: (seasonStats.assists || 0) + 1 },
        });
      }
    }

    return assist;
  }

  // ── GET /admin/matches/:matchId/coaches ──
  async getMatchCoaches(matchId: number) {
    const matchCoaches = await this.prisma.matchCoach.findMany({
      where: { match_id: matchId },
      include: {
        coach: { select: { coach_id: true, name: true } },
        team: { select: { team_id: true, team_name: true } },
      },
      orderBy: [{ role: 'asc' }, { team_id: 'asc' }],
    });

    return matchCoaches.map((mc) => ({
      id: mc.id.toString(),
      team_id: mc.team_id,
      coach_id: mc.coach_id,
      role: mc.role,
      description: null,
      coach_name: mc.coach?.name || 'Unknown Coach',
      team_name: mc.team?.team_name || 'Unknown Team',
    }));
  }

  // ── POST /admin/matches/:matchId/coaches ──
  async addMatchCoach(matchId: number, body: { team_id: number; coach_id: number; role: string }) {
    if (!body.team_id || !body.coach_id || !body.role) {
      throw new BadRequestException('team_id, coach_id, and role are required');
    }

    const match = await this.prisma.match.findUnique({ where: { match_id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    const team = await this.prisma.team.findUnique({ where: { team_id: body.team_id } });
    if (!team) throw new NotFoundException('Team not found');

    const coach = await this.prisma.coach.findUnique({ where: { coach_id: body.coach_id } });
    if (!coach) throw new NotFoundException('Coach not found');

    const existingCoach = await this.prisma.matchCoach.findFirst({
      where: { match_id: matchId, team_id: body.team_id, role: body.role },
    });
    if (existingCoach) {
      throw new BadRequestException('Coach with same role already exists for this team');
    }

    const newMatchCoach = await this.prisma.matchCoach.create({
      data: { match_id: matchId, team_id: body.team_id, coach_id: body.coach_id, role: body.role },
      include: {
        coach: { select: { coach_id: true, name: true } },
        team: { select: { team_id: true, team_name: true } },
      },
    });

    return {
      id: newMatchCoach.id.toString(),
      team_id: newMatchCoach.team_id,
      coach_id: newMatchCoach.coach_id,
      role: newMatchCoach.role,
      description: null,
      coach_name: newMatchCoach.coach?.name || 'Unknown Coach',
      team_name: newMatchCoach.team?.team_name || 'Unknown Team',
    };
  }

  // ── DELETE /admin/matches/:matchId/coaches/:coachId ──
  async removeMatchCoach(matchId: number, coachId: number) {
    const existingCoach = await this.prisma.matchCoach.findFirst({
      where: { match_id: matchId, id: coachId },
    });

    if (!existingCoach) {
      throw new NotFoundException('Match coach not found');
    }

    await this.prisma.matchCoach.delete({ where: { id: coachId } });

    return {
      message: 'Match coach deleted',
      deletedCoach: {
        id: coachId,
        match_id: matchId,
        team_id: existingCoach.team_id,
        role: existingCoach.role,
      },
    };
  }

  // ── GET /admin/matches/:matchId/detailed-stats ──
  async getDetailedStats(matchId: number) {
    return this.prisma.playerMatchDetailedStats.findMany({
      where: { match_id: matchId },
      include: {
        player: { select: { player_id: true, name: true, jersey_number: true } },
        team: { select: { team_id: true, team_name: true } },
      },
      orderBy: [{ team_id: 'asc' }, { player_id: 'asc' }],
    });
  }

  // ── POST /admin/matches/:matchId/detailed-stats ──
  async createOrUpdateDetailedStats(matchId: number, data: Record<string, any>) {
    const { player_id, team_id } = data;
    if (!player_id || !team_id) {
      throw new BadRequestException('player_id and team_id are required');
    }

    const player = await this.prisma.player.findUnique({ where: { player_id } });
    if (!player) throw new NotFoundException('Player not found');

    const team = await this.prisma.team.findUnique({ where: { team_id } });
    if (!team) throw new NotFoundException('Team not found');

    const match = await this.prisma.match.findUnique({ where: { match_id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    const existingStats = await this.prisma.playerMatchDetailedStats.findFirst({
      where: { match_id: matchId, player_id },
    });

    const rawPassAccuracy = data.pass_accuracy ??
      (data.passes > 0 ? (data.passes_completed / data.passes) * 100 : 0);
    const rawShotAccuracy = data.shot_accuracy ??
      (data.shots > 0 ? (data.shots_on_target / data.shots) * 100 : 0);

    const statsData = {
      passes: data.passes ?? 0,
      passes_completed: data.passes_completed ?? 0,
      pass_accuracy: Math.round(rawPassAccuracy * 10) / 10,
      key_passes: data.key_passes ?? 0,
      shots: data.shots ?? 0,
      shots_on_target: data.shots_on_target ?? 0,
      shot_accuracy: Math.round(rawShotAccuracy * 10) / 10,
      saves: data.saves ?? 0,
      gk_throws: data.gk_throws ?? 0,
      gk_throws_completed: data.gk_throws_completed ?? 0,
      tackles: data.tackles ?? 0,
      tackles_won: data.tackles_won ?? 0,
      interceptions: data.interceptions ?? 0,
      clearances: data.clearances ?? 0,
      dribbles: data.dribbles ?? 0,
      free_kicks: data.free_kicks ?? 0,
      free_kick_goals: data.free_kick_goals ?? 0,
      throw_ins: data.throw_ins ?? 0,
      corner_kicks: data.corner_kicks ?? 0,
      penalty_goals: data.penalty_goals ?? 0,
      own_goals: data.own_goals ?? 0,
    };

    const includeOpts = {
      player: { select: { player_id: true, name: true, jersey_number: true } },
      team: { select: { team_id: true, team_name: true } },
    };

    if (existingStats) {
      return this.prisma.playerMatchDetailedStats.update({
        where: { detailed_stat_id: existingStats.detailed_stat_id },
        data: { ...statsData, updated_at: new Date() },
        include: includeOpts,
      });
    }

    return this.prisma.playerMatchDetailedStats.create({
      data: { match_id: matchId, player_id, team_id, ...statsData },
      include: includeOpts,
    });
  }

  // ── DELETE /admin/matches/:matchId/detailed-stats?player_id= ──
  async deleteDetailedStats(matchId: number, playerId: number) {
    await this.prisma.playerMatchDetailedStats.deleteMany({
      where: { match_id: matchId, player_id: playerId },
    });
    return { success: true };
  }

  // ── POST /admin/matches/:matchId/detailed-stats/bulk ──
  async bulkSaveDetailedStats(matchId: number, stats: DetailedStatData[]) {
    if (!Array.isArray(stats) || stats.length === 0) {
      throw new BadRequestException('stats array is required');
    }

    const match = await this.prisma.match.findUnique({ where: { match_id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    const results = await this.prisma.$transaction(
      stats.map((stat) => {
        const rawPassAccuracy = stat.pass_accuracy ??
          (stat.passes && stat.passes > 0 ? ((stat.passes_completed ?? 0) / stat.passes) * 100 : 0);
        const rawShotAccuracy = stat.shot_accuracy ??
          (stat.shots && stat.shots > 0 ? ((stat.shots_on_target ?? 0) / stat.shots) * 100 : 0);

        const baseStatsData = {
          passes: stat.passes ?? 0,
          passes_completed: stat.passes_completed ?? 0,
          pass_accuracy: Math.round(rawPassAccuracy * 10) / 10,
          key_passes: stat.key_passes ?? 0,
          shots: stat.shots ?? 0,
          shots_on_target: stat.shots_on_target ?? 0,
          shot_accuracy: Math.round(rawShotAccuracy * 10) / 10,
          saves: stat.saves ?? 0,
          goals_conceded: stat.goals_conceded ?? 0,
          gk_throws: stat.gk_throws ?? 0,
          gk_throws_completed: stat.gk_throws_completed ?? 0,
          tackles: stat.tackles ?? 0,
          tackles_won: stat.tackles_won ?? 0,
          interceptions: stat.interceptions ?? 0,
          clearances: stat.clearances ?? 0,
          dribbles: stat.dribbles ?? 0,
          free_kicks: stat.free_kicks ?? 0,
          free_kick_goals: stat.free_kick_goals ?? 0,
          throw_ins: stat.throw_ins ?? 0,
          corner_kicks: stat.corner_kicks ?? 0,
          penalty_goals: stat.penalty_goals ?? 0,
          own_goals: stat.own_goals ?? 0,
          goals: stat.goals ?? 0,
          assists: stat.assists ?? 0,
          yellow_cards: stat.yellow_cards ?? 0,
          red_cards: stat.red_cards ?? 0,
          fouls: stat.fouls ?? 0,
          updated_at: new Date(),
        };

        const updateData = stat.possession_time !== undefined
          ? { ...baseStatsData, possession_time: stat.possession_time }
          : baseStatsData;

        const createData = {
          ...baseStatsData,
          possession_time: stat.possession_time ?? 0,
        };

        return this.prisma.playerMatchDetailedStats.upsert({
          where: { match_id_player_id: { match_id: matchId, player_id: stat.player_id } },
          update: updateData,
          create: { match_id: matchId, player_id: stat.player_id, team_id: stat.team_id, ...createData },
        });
      }),
    );

    return { success: true, count: results.length };
  }

  // ── GET /admin/matches/:matchId/goals ──
  async getGoals(matchId: number) {
    const goals = await this.prisma.goal.findMany({
      where: { match_id: matchId },
      include: {
        player: { select: { player_id: true, name: true, jersey_number: true } },
      },
      orderBy: { goal_time: 'asc' },
    });

    const goalsWithTeam = await Promise.all(
      goals.map(async (goal) => {
        const playerStats = await this.prisma.playerMatchStats.findFirst({
          where: { match_id: matchId, player_id: goal.player_id },
          include: { team: { select: { team_id: true, team_name: true } } },
        });
        return { ...goal, team: playerStats?.team || null };
      }),
    );

    return goalsWithTeam;
  }

  // ── POST /admin/matches/:matchId/goals ──
  async createGoal(matchId: number, data: { player_id: number; goal_time: number; goal_type?: string; description?: string }) {
    if (!data.player_id || data.goal_time === undefined) {
      throw new BadRequestException('player_id and goal_time are required');
    }

    const player = await this.prisma.player.findUnique({ where: { player_id: data.player_id } });
    if (!player) throw new NotFoundException('Player not found');

    const match = await this.prisma.match.findUnique({ where: { match_id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    const playerMatchStats = await this.prisma.playerMatchStats.findFirst({
      where: { match_id: matchId, player_id: data.player_id },
    });
    if (!playerMatchStats) {
      throw new BadRequestException(
        'Player must be registered in lineup before scoring goals. Please add the player to lineup first.',
      );
    }

    const goal = await this.prisma.goal.create({
      data: {
        match_id: matchId,
        player_id: data.player_id,
        goal_time: data.goal_time,
        goal_type: data.goal_type || 'regular',
        description: data.description || null,
      },
      include: {
        player: { select: { player_id: true, name: true, jersey_number: true } },
      },
    });

    await this.prisma.playerMatchStats.update({
      where: { stat_id: playerMatchStats.stat_id },
      data: { goals: (playerMatchStats.goals || 0) + 1, updated_at: new Date() },
    });

    if (match.season_id) {
      const seasonStats = await this.prisma.playerSeasonStats.findFirst({
        where: { player_id: data.player_id, season_id: match.season_id },
      });
      if (seasonStats) {
        await this.prisma.playerSeasonStats.update({
          where: { stat_id: seasonStats.stat_id },
          data: { goals: (seasonStats.goals || 0) + 1 },
        });
      }
    }

    return goal;
  }

  // ── GET /admin/matches/:matchId/lineups ──
  async getLineups(matchId: number) {
    return this.prisma.playerMatchStats.findMany({
      where: { match_id: matchId },
      include: {
        player: { select: { player_id: true, name: true, jersey_number: true } },
        team: { select: { team_id: true, team_name: true } },
      },
      orderBy: [{ team_id: 'asc' }, { position: 'asc' }],
    });
  }

  // ── POST /admin/matches/:matchId/lineups ──
  async createLineup(matchId: number, data: Record<string, any>) {
    const { player_id, team_id, position, secondary_position, position_change_minute, minutes_played, goals_conceded } = data;

    if (!player_id || !team_id || !position) {
      throw new BadRequestException('player_id, team_id, and position are required');
    }

    const VALID_POSITIONS = ['GK', 'DF', 'MF', 'FW'];
    const sanitizedSecondaryPosition =
      secondary_position && VALID_POSITIONS.includes(secondary_position) ? secondary_position : null;

    const player = await this.prisma.player.findUnique({ where: { player_id } });
    if (!player) throw new NotFoundException('Player not found');

    const team = await this.prisma.team.findUnique({ where: { team_id } });
    if (!team) throw new NotFoundException('Team not found');

    const match = await this.prisma.match.findUnique({ where: { match_id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    const existingLineup = await this.prisma.playerMatchStats.findFirst({
      where: { match_id: matchId, player_id },
    });

    const includeOpts = {
      player: { select: { player_id: true, name: true, jersey_number: true } },
      team: { select: { team_id: true, team_name: true } },
    };

    let lineup;
    if (existingLineup) {
      lineup = await this.prisma.playerMatchStats.update({
        where: { stat_id: existingLineup.stat_id },
        data: {
          team_id,
          position,
          secondary_position: secondary_position !== undefined ? sanitizedSecondaryPosition : existingLineup.secondary_position,
          position_change_minute: position_change_minute !== undefined ? position_change_minute : existingLineup.position_change_minute,
          minutes_played: minutes_played ?? existingLineup.minutes_played ?? 0,
          goals_conceded: goals_conceded !== undefined ? goals_conceded : existingLineup.goals_conceded,
          updated_at: new Date(),
        },
        include: includeOpts,
      });
    } else {
      lineup = await this.prisma.playerMatchStats.create({
        data: {
          match_id: matchId,
          player_id,
          team_id,
          position,
          secondary_position: sanitizedSecondaryPosition,
          position_change_minute: position_change_minute ?? null,
          minutes_played: minutes_played ?? 0,
          goals_conceded: goals_conceded ?? null,
        },
        include: includeOpts,
      });
    }

    if (match.season_id) {
      await this.prisma.playerSeasonStats.upsert({
        where: {
          player_id_season_id_team_id: { player_id, season_id: match.season_id, team_id },
        },
        update: { updated_at: new Date() },
        create: {
          player_id,
          season_id: match.season_id,
          team_id,
          matches_played: 0,
          goals: 0,
          assists: 0,
          yellow_cards: 0,
          red_cards: 0,
          minutes_played: 0,
          saves: 0,
        },
      });
    }

    return lineup;
  }

  // ── GET /admin/matches/:matchId/penalties ──
  async getPenalties(matchId: number) {
    return this.prisma.penaltyShootoutDetail.findMany({
      where: { match_id: matchId },
      include: {
        kicker: { select: { player_id: true, name: true, jersey_number: true } },
        goalkeeper: { select: { player_id: true, name: true, jersey_number: true } },
        team: { select: { team_id: true, team_name: true } },
      },
      orderBy: { kicker_order: 'asc' },
    });
  }

  // ── POST /admin/matches/:matchId/penalties ──
  async createPenalty(matchId: number, data: {
    team_id: number;
    player_id: number;
    goalkeeper_id: number;
    is_scored: boolean;
    order: number;
  }) {
    if (!data.team_id || !data.player_id || !data.goalkeeper_id || data.is_scored === undefined || !data.order) {
      throw new BadRequestException('team_id, player_id, goalkeeper_id, is_scored, and order are required');
    }

    const player = await this.prisma.player.findUnique({ where: { player_id: data.player_id } });
    if (!player) throw new NotFoundException('Player not found');

    const goalkeeper = await this.prisma.player.findUnique({ where: { player_id: data.goalkeeper_id } });
    if (!goalkeeper) throw new NotFoundException('Goalkeeper not found');

    const team = await this.prisma.team.findUnique({ where: { team_id: data.team_id } });
    if (!team) throw new NotFoundException('Team not found');

    const match = await this.prisma.match.findUnique({ where: { match_id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    const existingPenalty = await this.prisma.penaltyShootoutDetail.findFirst({
      where: { match_id: matchId, team_id: data.team_id, kicker_order: data.order },
    });
    if (existingPenalty) {
      throw new ConflictException('Penalty with this order already exists for this team');
    }

    const penalty = await this.prisma.penaltyShootoutDetail.create({
      data: {
        match_id: matchId,
        team_id: data.team_id,
        kicker_id: data.player_id,
        goalkeeper_id: data.goalkeeper_id,
        is_successful: data.is_scored,
        kicker_order: data.order,
      },
      include: {
        kicker: { select: { player_id: true, name: true, jersey_number: true } },
        goalkeeper: { select: { player_id: true, name: true, jersey_number: true } },
        team: { select: { team_id: true, team_name: true } },
      },
    });

    const currentHomeScore = match.penalty_home_score ?? 0;
    const currentAwayScore = match.penalty_away_score ?? 0;
    const isHomeTeam = data.team_id === match.home_team_id;

    const newHomeScore = isHomeTeam && data.is_scored ? currentHomeScore + 1 : currentHomeScore;
    const newAwayScore = !isHomeTeam && data.is_scored ? currentAwayScore + 1 : currentAwayScore;

    await this.prisma.match.update({
      where: { match_id: matchId },
      data: { penalty_home_score: newHomeScore, penalty_away_score: newAwayScore },
    });

    return penalty;
  }

  // ── GET /admin/matches/:matchId/possession ──
  async getPossession(matchId: number) {
    return this.prisma.playerMatchDetailedStats.findMany({
      where: { match_id: matchId },
      select: {
        player_id: true,
        team_id: true,
        possession_time: true,
        player: { select: { name: true, jersey_number: true } },
        team: { select: { team_name: true } },
      },
    });
  }

  // ── POST /admin/matches/:matchId/possession ──
  async savePossession(matchId: number, possessions: PossessionData[]) {
    if (!Array.isArray(possessions) || possessions.length === 0) {
      throw new BadRequestException('possessions array is required');
    }

    const match = await this.prisma.match.findUnique({ where: { match_id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    const results = await this.prisma.$transaction(
      possessions.map((possession) =>
        this.prisma.playerMatchDetailedStats.upsert({
          where: { match_id_player_id: { match_id: matchId, player_id: possession.player_id } },
          update: { possession_time: possession.possession_time, updated_at: new Date() },
          create: {
            match_id: matchId,
            player_id: possession.player_id,
            team_id: possession.team_id,
            possession_time: possession.possession_time,
          },
        }),
      ),
    );

    return { success: true, count: results.length };
  }

  // ── POST /admin/matches/:matchId/ratings ──
  async generateRatings(matchId: number) {
    const match = await this.prisma.match.findUnique({
      where: { match_id: matchId },
      select: {
        match_id: true,
        home_team_id: true,
        away_team_id: true,
        home_score: true,
        away_score: true,
      },
    });

    if (!match) throw new NotFoundException('Match not found');

    const [detailedStats, basicStats] = await Promise.all([
      this.prisma.playerMatchDetailedStats.findMany({
        where: { match_id: matchId },
        include: {
          player: {
            select: { player_id: true, name: true, jersey_number: true, profile_image_url: true },
          },
          team: { select: { team_id: true, team_name: true } },
        },
      }),
      this.prisma.playerMatchStats.findMany({
        where: { match_id: matchId },
        select: {
          player_id: true,
          team_id: true,
          position: true,
          secondary_position: true,
          position_change_minute: true,
          minutes_played: true,
          yellow_cards: true,
          red_cards: true,
        },
      }),
    ]);

    if (detailedStats.length === 0) {
      await this.prisma.playerMatchRating.deleteMany({ where: { match_id: matchId } });
      return { match_id: matchId, ratings: [], message: 'No detailed stats data available.' };
    }

    const basicStatsMap = new Map<number, {
      position: string;
      secondary_position: string | null;
      position_change_minute: number | null;
      minutes_played: number | null;
      yellow_cards: number;
      red_cards: number;
    }>();

    for (const bs of basicStats) {
      if (bs.player_id != null) {
        basicStatsMap.set(bs.player_id, {
          position: bs.position ?? 'FW',
          secondary_position: bs.secondary_position ?? null,
          position_change_minute: bs.position_change_minute ?? null,
          minutes_played: bs.minutes_played ?? null,
          yellow_cards: bs.yellow_cards ?? 0,
          red_cards: bs.red_cards ?? 0,
        });
      }
    }

    // Note: calculateMatchRating is a Next.js lib function.
    // In the NestJS backend, we store the rating data that was computed from the frontend.
    // For now, the ratings endpoint stores pre-computed data or relies on the frontend to call this.
    // We'll build the rating entries from detailedStats + basicStats and save them.
    const ratings = detailedStats.map((ds) => {
      const basic = basicStatsMap.get(ds.player_id) ?? {
        position: 'FW',
        secondary_position: null,
        position_change_minute: null,
        minutes_played: null,
        yellow_cards: 0,
        red_cards: 0,
      };

      const isHomeTeam = ds.team_id === match.home_team_id;
      const teamConceded = isHomeTeam ? (match.away_score ?? 0) : (match.home_score ?? 0);
      const isCleanSheet = teamConceded === 0;

      let matchResult: 'win' | 'draw' | 'loss' | null = null;
      if (match.home_score != null && match.away_score != null) {
        if (match.home_score === match.away_score) {
          matchResult = 'draw';
        } else {
          const teamWon = isHomeTeam
            ? match.home_score > match.away_score
            : match.away_score > match.home_score;
          matchResult = teamWon ? 'win' : 'loss';
        }
      }

      // Simple rating calculation placeholder (base 6.0 + contributions)
      // The actual calculation uses the imported function from the frontend; for the backend
      // we simply store a base rating. The frontend's calculateMatchRating would be called separately.
      let rating = 6.0;
      const goals = ds.goals ?? 0;
      const assists = ds.assists ?? 0;
      const yellowCards = ds.yellow_cards ?? basic.yellow_cards;
      const redCards = ds.red_cards ?? basic.red_cards;
      const position = basic.position;

      // Goal contribution
      rating += goals * (position === 'GK' || position === 'DF' ? 1.2 : position === 'MF' ? 1.0 : 0.8);
      rating += assists * 0.5;
      // Clean sheet bonus for GK/DF
      if (isCleanSheet && (position === 'GK' || position === 'DF')) rating += 0.5;
      // Card deductions
      rating -= (yellowCards ?? 0) * 0.3;
      rating -= (redCards ?? 0) * 1.0;
      // Win bonus
      if (matchResult === 'win') rating += 0.3;
      else if (matchResult === 'loss') rating -= 0.2;
      // Clamp
      rating = Math.max(1.0, Math.min(10.0, Math.round(rating * 10) / 10));

      // Skip players with 0 minutes
      if ((basic.minutes_played ?? 0) === 0) rating = 0;

      return {
        player_id: ds.player_id,
        team_id: ds.team_id,
        player_name: ds.player.name,
        jersey_number: ds.player.jersey_number,
        profile_image_url: ds.player.profile_image_url,
        team_name: ds.team.team_name,
        position: basic.position,
        goals,
        assists,
        yellow_cards: yellowCards,
        red_cards: redCards,
        rating,
        breakdown: {} as Record<string, any>,
      };
    }).filter((r) => r.rating > 0);

    ratings.sort((a, b) => b.rating - a.rating);

    await this.prisma.$transaction([
      this.prisma.playerMatchRating.deleteMany({ where: { match_id: matchId } }),
      ...ratings.map((r) =>
        this.prisma.playerMatchRating.create({
          data: {
            match_id: matchId,
            player_id: r.player_id,
            team_id: r.team_id,
            rating: r.rating,
            breakdown: r.breakdown,
          },
        }),
      ),
    ]);

    return { match_id: matchId, ratings };
  }

  // ── DELETE /admin/matches/:matchId/ratings ──
  async deleteRatings(matchId: number) {
    const deleted = await this.prisma.playerMatchRating.deleteMany({
      where: { match_id: matchId },
    });
    return { success: true, deleted_count: deleted.count };
  }

  // ── GET /admin/matches/:matchId/substitutions ──
  async getSubstitutions(matchId: number) {
    return this.prisma.substitution.findMany({
      where: { match_id: matchId },
      include: {
        player_in: { select: { player_id: true, name: true, jersey_number: true } },
        player_out: { select: { player_id: true, name: true, jersey_number: true } },
        team: { select: { team_id: true, team_name: true } },
      },
      orderBy: { substitution_time: 'asc' },
    });
  }

  // ── POST /admin/matches/:matchId/substitutions ──
  async createSubstitution(matchId: number, data: {
    team_id: number;
    player_in_id: number;
    player_out_id: number;
    substitution_time: number;
    description?: string;
  }) {
    if (!data.team_id || !data.player_in_id || !data.player_out_id || data.substitution_time === undefined) {
      throw new BadRequestException(
        'team_id, player_in_id, player_out_id, and substitution_time are required',
      );
    }

    const playerIn = await this.prisma.player.findUnique({ where: { player_id: data.player_in_id } });
    if (!playerIn) throw new NotFoundException('Player in not found');

    const playerOut = await this.prisma.player.findUnique({ where: { player_id: data.player_out_id } });
    if (!playerOut) throw new NotFoundException('Player out not found');

    const team = await this.prisma.team.findUnique({ where: { team_id: data.team_id } });
    if (!team) throw new NotFoundException('Team not found');

    const match = await this.prisma.match.findUnique({ where: { match_id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    const substitution = await this.prisma.substitution.create({
      data: {
        match_id: matchId,
        team_id: data.team_id,
        player_in_id: data.player_in_id,
        player_out_id: data.player_out_id,
        substitution_time: data.substitution_time,
        substitution_reason: data.description || null,
      },
      include: {
        player_in: { select: { player_id: true, name: true, jersey_number: true } },
        player_out: { select: { player_id: true, name: true, jersey_number: true } },
        team: { select: { team_id: true, team_name: true } },
      },
    });

    // Update player_in stats
    const playerInStats = await this.prisma.playerMatchStats.findFirst({
      where: { match_id: matchId, player_id: data.player_in_id },
    });

    if (!playerInStats) {
      const remainingMinutes = Math.max(0, MATCH_DURATION_MINUTES - data.substitution_time);
      await this.prisma.playerMatchStats.create({
        data: {
          match_id: matchId,
          player_id: data.player_in_id,
          team_id: data.team_id,
          goals: 0,
          assists: 0,
          minutes_played: remainingMinutes,
        },
      });
    } else {
      const remainingMinutes = Math.max(0, MATCH_DURATION_MINUTES - data.substitution_time);
      await this.prisma.playerMatchStats.update({
        where: { stat_id: playerInStats.stat_id },
        data: { minutes_played: (playerInStats.minutes_played || 0) + remainingMinutes },
      });
    }

    // Update player_out stats
    const playerOutStats = await this.prisma.playerMatchStats.findFirst({
      where: { match_id: matchId, player_id: data.player_out_id },
    });

    if (playerOutStats) {
      await this.prisma.playerMatchStats.update({
        where: { stat_id: playerOutStats.stat_id },
        data: { minutes_played: data.substitution_time },
      });
    }

    return substitution;
  }

  // ── DELETE /admin/matches/:matchId/substitutions/:substitutionId ──
  async deleteSubstitution(matchId: number, substitutionId: number) {
    const substitution = await this.prisma.substitution.findFirst({
      where: { substitution_id: substitutionId, match_id: matchId },
    });

    if (!substitution) {
      throw new NotFoundException('Substitution not found');
    }

    await this.prisma.substitution.delete({ where: { substitution_id: substitutionId } });
    return { success: true };
  }

  // ── POST /admin/matches/:matchId/update-stats ──
  async updateMatchStats(matchId: number) {
    const match = await this.prisma.match.findUnique({ where: { match_id: matchId } });
    if (!match) throw new NotFoundException('Match not found');
    if (!match.season_id) throw new BadRequestException('Match has no season_id');

    const seasonId = match.season_id;

    await this.updateStandings(seasonId);
    await this.updateTeamSeasonStats(seasonId);
    await this.updateTeamSeasons(seasonId);
    await this.updateH2HStats();
    await this.updateGroupLeagueStandings(seasonId);

    return {
      message: 'Stats updated successfully',
      match_id: matchId,
      season_id: seasonId,
    };
  }

  // ── POST /admin/matches/:matchId/xt-ratings ──
  async generateXtRatings(matchId: number) {
    const actionCount = await this.prisma.matchAction.count({ where: { match_id: matchId } });
    if (actionCount === 0) {
      return { match_id: matchId, ratings: [], message: 'No event action data.' };
    }

    // Note: calculateMatchXtRatings is from the frontend xT lib.
    // In the NestJS backend, we return existing ratings or note that the
    // xT calculation should be triggered from the frontend.
    // For now, return existing stored ratings.
    const saved = await this.prisma.playerMatchXtRating.findMany({
      where: { match_id: matchId },
      include: {
        player: {
          select: { player_id: true, name: true, jersey_number: true, profile_image_url: true },
        },
        team: { select: { team_id: true, team_name: true } },
      },
      orderBy: { xt_rating: 'desc' },
    });

    return { match_id: matchId, ratings: saved };
  }

  // ── GET /admin/matches/:matchId/xt-ratings ──
  async getXtRatings(matchId: number) {
    const ratings = await this.prisma.playerMatchXtRating.findMany({
      where: { match_id: matchId },
      include: {
        player: {
          select: { player_id: true, name: true, jersey_number: true, profile_image_url: true },
        },
        team: { select: { team_id: true, team_name: true } },
      },
      orderBy: { xt_rating: 'desc' },
    });

    return { match_id: matchId, ratings };
  }

  // ── DELETE /admin/matches/:matchId/xt-ratings ──
  async deleteXtRatings(matchId: number) {
    const deleted = await this.prisma.playerMatchXtRating.deleteMany({
      where: { match_id: matchId },
    });
    return { success: true, deleted_count: deleted.count };
  }

  // ── POST /admin/matches/migrate-coordinates ──
  async migrateCoordinates(matchIds: number[]) {
    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      throw new BadRequestException('matchIds array is required');
    }

    const results: { matchId: number; updated: number; message?: string }[] = [];

    for (const matchId of matchIds) {
      const actions = await this.prisma.matchAction.findMany({ where: { match_id: matchId } });

      if (actions.length === 0) {
        results.push({ matchId, updated: 0, message: 'No actions' });
        continue;
      }

      let updatedCount = 0;
      for (const action of actions) {
        await this.prisma.matchAction.update({
          where: { action_id: action.action_id },
          data: {
            start_x: PITCH_WIDTH - action.start_x,
            start_y: PITCH_HEIGHT - action.start_y,
            end_x: action.end_x !== null ? PITCH_WIDTH - action.end_x : null,
            end_y: action.end_y !== null ? PITCH_HEIGHT - action.end_y : null,
          },
        });
        updatedCount++;
      }

      results.push({ matchId, updated: updatedCount });
    }

    return {
      success: true,
      message: `Coordinates inverted for ${matchIds.length} matches.`,
      results,
    };
  }

  // ── Helper: updateStandings ──
  private async updateStandings(seasonId: number) {
    await this.prisma.standing.deleteMany({ where: { season_id: seasonId } });

    const allMatches = await this.prisma.match.findMany({
      where: { season_id: seasonId, home_team_id: { not: null }, away_team_id: { not: null } },
    });

    const completedMatches = allMatches.filter(
      (m) => m.status === 'completed' && m.home_score !== null && m.away_score !== null,
    );

    const teamStats = new Map<number, {
      matches_played: number; wins: number; draws: number; losses: number;
      goals_for: number; goals_against: number; points: number;
    }>();

    for (const match of allMatches) {
      if (!match.home_team_id || !match.away_team_id) continue;
      for (const teamId of [match.home_team_id, match.away_team_id]) {
        if (!teamStats.has(teamId)) {
          teamStats.set(teamId, {
            matches_played: 0, wins: 0, draws: 0, losses: 0,
            goals_for: 0, goals_against: 0, points: 0,
          });
        }
      }
    }

    const groupStandings = await this.prisma.groupLeagueStanding.findMany({
      where: { season_id: seasonId },
      select: { team_id: true },
    });
    for (const gs of groupStandings) {
      if (gs.team_id && !teamStats.has(gs.team_id)) {
        teamStats.set(gs.team_id, {
          matches_played: 0, wins: 0, draws: 0, losses: 0,
          goals_for: 0, goals_against: 0, points: 0,
        });
      }
    }

    for (const match of completedMatches) {
      if (!match.home_team_id || !match.away_team_id) continue;
      const homeStats = teamStats.get(match.home_team_id)!;
      const awayStats = teamStats.get(match.away_team_id)!;

      homeStats.matches_played++;
      awayStats.matches_played++;
      homeStats.goals_for += match.home_score || 0;
      homeStats.goals_against += match.away_score || 0;
      awayStats.goals_for += match.away_score || 0;
      awayStats.goals_against += match.home_score || 0;

      const homeScore = match.home_score || 0;
      const awayScore = match.away_score || 0;

      if (homeScore > awayScore) {
        homeStats.wins++;
        homeStats.points += 3;
        awayStats.losses++;
      } else if (homeScore < awayScore) {
        awayStats.wins++;
        awayStats.points += 3;
        homeStats.losses++;
      } else {
        if (match.penalty_home_score !== null && match.penalty_away_score !== null) {
          if ((match.penalty_home_score || 0) > (match.penalty_away_score || 0)) {
            homeStats.wins++;
            homeStats.points += 3;
            awayStats.losses++;
          } else {
            awayStats.wins++;
            awayStats.points += 3;
            homeStats.losses++;
          }
        } else {
          homeStats.draws++;
          awayStats.draws++;
          homeStats.points += 1;
          awayStats.points += 1;
        }
      }
    }

    const standingsData = Array.from(teamStats.entries()).map(([teamId, stats]) => ({
      season_id: seasonId,
      team_id: teamId,
      position: 1,
      matches_played: stats.matches_played,
      wins: stats.wins,
      draws: stats.draws,
      losses: stats.losses,
      goals_for: stats.goals_for,
      goals_against: stats.goals_against,
      goal_difference: stats.goals_for - stats.goals_against,
      points: stats.points,
    }));

    standingsData.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      return b.goals_for - a.goals_for;
    });

    for (let i = 0; i < standingsData.length; i++) {
      standingsData[i].position = i + 1;
      await this.prisma.standing.create({ data: standingsData[i] });
    }
  }

  // ── Helper: updateTeamSeasonStats ──
  private async updateTeamSeasonStats(seasonId: number) {
    await this.prisma.teamSeasonStats.deleteMany({ where: { season_id: seasonId } });

    const standings = await this.prisma.standing.findMany({ where: { season_id: seasonId } });

    for (const standing of standings) {
      await this.prisma.teamSeasonStats.create({
        data: {
          season_id: standing.season_id,
          team_id: standing.team_id,
          matches_played: standing.matches_played,
          wins: standing.wins,
          draws: standing.draws,
          losses: standing.losses,
          goals_for: standing.goals_for,
          goals_against: standing.goals_against,
          points: standing.points,
        },
      });
    }
  }

  // ── Helper: updateTeamSeasons ──
  private async updateTeamSeasons(seasonId: number) {
    await this.prisma.teamSeason.deleteMany({ where: { season_id: seasonId } });

    const matches = await this.prisma.match.findMany({
      where: { season_id: seasonId, home_team_id: { not: null }, away_team_id: { not: null } },
      select: { home_team_id: true, away_team_id: true },
    });

    const teamIds = new Set<number>();
    for (const match of matches) {
      if (match.home_team_id) teamIds.add(match.home_team_id);
      if (match.away_team_id) teamIds.add(match.away_team_id);
    }

    for (const teamId of Array.from(teamIds)) {
      await this.prisma.teamSeason.create({ data: { season_id: seasonId, team_id: teamId } });
    }
  }

  // ── Helper: updateH2HStats ──
  private async updateH2HStats() {
    await this.prisma.h2hPairStats.deleteMany();

    const matches = await this.prisma.match.findMany({
      where: { status: 'completed', home_score: { not: null }, away_score: { not: null } },
    });

    const h2hStats = new Map<string, {
      team1_id: number; team2_id: number;
      team1_wins: number; team2_wins: number; draws: number;
      team1_goals: number; team2_goals: number;
    }>();

    for (const match of matches) {
      if (!match.home_team_id || !match.away_team_id) continue;

      const team1 = Math.min(match.home_team_id, match.away_team_id);
      const team2 = Math.max(match.home_team_id, match.away_team_id);
      const key = `${team1}-${team2}`;

      if (!h2hStats.has(key)) {
        h2hStats.set(key, {
          team1_id: team1, team2_id: team2,
          team1_wins: 0, team2_wins: 0, draws: 0,
          team1_goals: 0, team2_goals: 0,
        });
      }

      const stats = h2hStats.get(key)!;
      let team1Score: number, team2Score: number;
      if (match.home_team_id === team1) {
        team1Score = match.home_score || 0;
        team2Score = match.away_score || 0;
      } else {
        team1Score = match.away_score || 0;
        team2Score = match.home_score || 0;
      }

      stats.team1_goals += team1Score;
      stats.team2_goals += team2Score;

      if (team1Score > team2Score) {
        stats.team1_wins++;
      } else if (team1Score < team2Score) {
        stats.team2_wins++;
      } else {
        if (match.penalty_home_score !== null && match.penalty_away_score !== null) {
          let team1PenaltyScore: number, team2PenaltyScore: number;
          if (match.home_team_id === team1) {
            team1PenaltyScore = match.penalty_home_score || 0;
            team2PenaltyScore = match.penalty_away_score || 0;
          } else {
            team1PenaltyScore = match.penalty_away_score || 0;
            team2PenaltyScore = match.penalty_home_score || 0;
          }
          if (team1PenaltyScore > team2PenaltyScore) {
            stats.team1_wins++;
          } else {
            stats.team2_wins++;
          }
        } else {
          stats.draws++;
        }
      }
    }

    for (const [, stats] of Array.from(h2hStats)) {
      await this.prisma.h2hPairStats.create({
        data: {
          team_small_id: stats.team1_id,
          team_large_id: stats.team2_id,
          total_matches: stats.team1_wins + stats.team2_wins + stats.draws,
          small_wins: stats.team1_wins,
          large_wins: stats.team2_wins,
          draws: stats.draws,
          small_goals: stats.team1_goals,
          large_goals: stats.team2_goals,
        },
      });
    }
  }

  // ── Helper: updateGroupLeagueStandings ──
  private async updateGroupLeagueStandings(seasonId: number) {
    const matches = await this.prisma.match.findMany({
      where: {
        season_id: seasonId,
        status: 'completed',
        home_score: { not: null },
        away_score: { not: null },
        tournament_stage: 'group_stage',
        group_stage: { not: null },
      },
    });

    if (matches.length === 0) return;

    const groupStats = new Map<string, {
      group_stage: string; team_id: number;
      matches_played: number; wins: number; draws: number; losses: number;
      goals_for: number; goals_against: number; points: number;
    }>();

    for (const match of matches) {
      if (!match.home_team_id || !match.away_team_id || !match.group_stage) continue;

      const homeKey = `${match.group_stage}-${match.home_team_id}`;
      const awayKey = `${match.group_stage}-${match.away_team_id}`;

      if (!groupStats.has(homeKey)) {
        groupStats.set(homeKey, {
          group_stage: match.group_stage, team_id: match.home_team_id,
          matches_played: 0, wins: 0, draws: 0, losses: 0,
          goals_for: 0, goals_against: 0, points: 0,
        });
      }
      if (!groupStats.has(awayKey)) {
        groupStats.set(awayKey, {
          group_stage: match.group_stage, team_id: match.away_team_id,
          matches_played: 0, wins: 0, draws: 0, losses: 0,
          goals_for: 0, goals_against: 0, points: 0,
        });
      }

      const homeStats = groupStats.get(homeKey)!;
      const awayStats = groupStats.get(awayKey)!;

      homeStats.matches_played++;
      awayStats.matches_played++;
      homeStats.goals_for += match.home_score || 0;
      homeStats.goals_against += match.away_score || 0;
      awayStats.goals_for += match.away_score || 0;
      awayStats.goals_against += match.home_score || 0;

      const homeScore = match.home_score || 0;
      const awayScore = match.away_score || 0;

      if (homeScore > awayScore) {
        homeStats.wins++;
        homeStats.points += 3;
        awayStats.losses++;
      } else if (homeScore < awayScore) {
        awayStats.wins++;
        awayStats.points += 3;
        homeStats.losses++;
      } else {
        if (match.penalty_home_score !== null && match.penalty_away_score !== null) {
          if ((match.penalty_home_score || 0) > (match.penalty_away_score || 0)) {
            homeStats.wins++;
            homeStats.points += 3;
            awayStats.losses++;
          } else {
            awayStats.wins++;
            awayStats.points += 3;
            homeStats.losses++;
          }
        } else {
          homeStats.draws++;
          awayStats.draws++;
          homeStats.points += 1;
          awayStats.points += 1;
        }
      }
    }

    for (const [, stats] of Array.from(groupStats)) {
      await this.prisma.groupLeagueStanding.updateMany({
        where: { season_id: seasonId, team_id: stats.team_id, group_stage: stats.group_stage },
        data: {
          matches_played: stats.matches_played,
          wins: stats.wins,
          draws: stats.draws,
          losses: stats.losses,
          goals_for: stats.goals_for,
          goals_against: stats.goals_against,
          goal_difference: stats.goals_for - stats.goals_against,
          points: stats.points,
        },
      });
    }

    const groupSet = new Set(Array.from(groupStats.values()).map((s) => s.group_stage));

    for (const group of Array.from(groupSet)) {
      const standings = await this.prisma.groupLeagueStanding.findMany({
        where: { season_id: seasonId, group_stage: group },
        orderBy: [{ points: 'desc' }, { goal_difference: 'desc' }, { goals_for: 'desc' }],
      });

      for (let i = 0; i < standings.length; i++) {
        await this.prisma.groupLeagueStanding.update({
          where: { group_standing_id: standings[i].group_standing_id },
          data: { position: i + 1 },
        });
      }
    }
  }
}
