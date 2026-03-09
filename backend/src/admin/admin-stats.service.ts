import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface BackupData {
  standings?: Prisma.StandingCreateManyInput[];
  playerSeasonStats?: Prisma.PlayerSeasonStatsCreateManyInput[];
  teamSeasonStats?: Prisma.TeamSeasonStatsCreateManyInput[];
  teamSeason?: Prisma.TeamSeasonCreateManyInput[];
  h2hPairStats?: Prisma.H2hPairStatsCreateManyInput[];
}

@Injectable()
export class AdminStatsService {
  private readonly logger = new Logger(AdminStatsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── POST /admin/stats/regenerate ──
  async regenerate(query: { season_id?: string; type?: string }) {
    const seasonId = query.season_id;
    const statsType = query.type; // 'all', 'standings', 'player_stats', 'team_stats', 'h2h'

    this.logger.log(`Stats regeneration started: seasonId=${seasonId}, type=${statsType}`);

    const seasonFilter = seasonId ? { season_id: parseInt(seasonId) } : {};

    const results = {
      standings: 0,
      player_season_stats: 0,
      team_season_stats: 0,
      team_seasons: 0,
      h2h_pair_stats: 0,
    };

    // 1. 순위표 (standings) 재생성
    if (statsType === 'all' || statsType === 'standings') {
      this.logger.log('Regenerating standings...');

      await this.prisma.standing.deleteMany({ where: seasonFilter });

      const matches = await this.prisma.match.findMany({
        where: {
          ...seasonFilter,
          status: 'completed',
          home_score: { not: null },
          away_score: { not: null },
        },
        select: {
          match_id: true,
          season_id: true,
          home_team_id: true,
          away_team_id: true,
          home_score: true,
          away_score: true,
          penalty_home_score: true,
          penalty_away_score: true,
          home_team: { select: { team_id: true, team_name: true } },
          away_team: { select: { team_id: true, team_name: true } },
          season: { select: { season_id: true, season_name: true } },
        },
      });

      const teamStats = new Map<
        string,
        {
          season_id: number;
          team_id: number;
          matches_played: number;
          wins: number;
          losses: number;
          draws: number;
          goals_for: number;
          goals_against: number;
          goal_difference: number;
          points: number;
        }
      >();

      matches.forEach((match) => {
        if (!match.season_id || !match.home_team_id || !match.away_team_id) {
          this.logger.log(
            `Skipping match ${match.match_id} - missing required data: season_id=${match.season_id}, home_team_id=${match.home_team_id}, away_team_id=${match.away_team_id}`,
          );
          return;
        }

        const homeKey = `${match.season_id}-${match.home_team_id}`;
        const awayKey = `${match.season_id}-${match.away_team_id}`;

        if (!teamStats.has(homeKey)) {
          teamStats.set(homeKey, {
            season_id: match.season_id,
            team_id: match.home_team_id,
            matches_played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            goal_difference: 0,
            points: 0,
          });
        }

        if (!teamStats.has(awayKey)) {
          teamStats.set(awayKey, {
            season_id: match.season_id,
            team_id: match.away_team_id,
            matches_played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            goal_difference: 0,
            points: 0,
          });
        }

        const homeStats = teamStats.get(homeKey);
        const awayStats = teamStats.get(awayKey);

        if (!homeStats || !awayStats) {
          this.logger.log(`Stats not found for match ${match.match_id}`);
          return;
        }

        // 경기 수 증가
        homeStats.matches_played++;
        awayStats.matches_played++;

        // 득점/실점
        homeStats.goals_for += match.home_score || 0;
        homeStats.goals_against += match.away_score || 0;
        awayStats.goals_for += match.away_score || 0;
        awayStats.goals_against += match.home_score || 0;

        // 승부 판정
        if ((match.home_score || 0) > (match.away_score || 0)) {
          homeStats.wins++;
          homeStats.points += 3;
          awayStats.losses++;
        } else if ((match.home_score || 0) < (match.away_score || 0)) {
          awayStats.wins++;
          awayStats.points += 3;
          homeStats.losses++;
        } else {
          // 정규시간 동점 - 승부차기로 승패 결정 (골때녀에는 무승부 없음)
          if (
            match.penalty_home_score !== null &&
            match.penalty_away_score !== null
          ) {
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
            // 승부차기 데이터 미입력 - 로그 경고 (무승부 처리하지 않음)
            this.logger.warn(
              `Match ${match.match_id}: Regular time tie but no penalty data. Result undetermined.`,
            );
          }
        }

        // 골차 계산
        homeStats.goal_difference = homeStats.goals_for - homeStats.goals_against;
        awayStats.goal_difference = awayStats.goals_for - awayStats.goals_against;
      });

      // standings 테이블에 저장
      for (const [, stats] of Array.from(teamStats.entries())) {
        await this.prisma.standing.create({
          data: {
            season_id: stats.season_id,
            team_id: stats.team_id,
            position: 1, // 임시값
            matches_played: stats.matches_played,
            wins: stats.wins,
            draws: stats.draws,
            losses: stats.losses,
            goals_for: stats.goals_for,
            goals_against: stats.goals_against,
            goal_difference: stats.goal_difference,
            points: stats.points,
          },
        });
      }

      // 순위 계산 및 업데이트
      const seasons = await this.prisma.season.findMany({ where: seasonFilter });

      for (const season of seasons) {
        const standings = await this.prisma.standing.findMany({
          where: { season_id: season.season_id },
          orderBy: [
            { points: 'desc' },
            { goal_difference: 'desc' },
            { goals_for: 'desc' },
          ],
        });

        for (let i = 0; i < standings.length; i++) {
          const sId = standings[i].season_id;
          const tId = standings[i].team_id;
          if (sId && tId) {
            await this.prisma.standing.update({
              where: {
                season_id_team_id: { season_id: sId, team_id: tId },
              },
              data: { position: i + 1 },
            });
          }
        }
      }

      results.standings = teamStats.size;
    }

    // 2. 선수 시즌 통계 재생성
    if (statsType === 'all' || statsType === 'player_stats') {
      this.logger.log('Regenerating player season stats...');

      await this.prisma.playerSeasonStats.deleteMany({ where: seasonFilter });

      const playerMatchStats = await this.prisma.playerMatchStats.findMany({
        where: {
          match: seasonFilter.season_id
            ? { season_id: seasonFilter.season_id }
            : {},
        },
        include: {
          match: { select: { season_id: true, status: true } },
        },
      });

      this.logger.log(
        `Calculating season stats from ${playerMatchStats.length} player-match records...`,
      );

      const playerSeasonStats = new Map<
        string,
        {
          season_id: number;
          player_id: number;
          team_id: number;
          matches_played: number;
          goals: number;
          assists: number;
          yellow_cards: number;
          red_cards: number;
          minutes_played: number;
          saves: number;
        }
      >();

      playerMatchStats.forEach((matchStat) => {
        if (matchStat.match?.status !== 'completed') return;
        if (!matchStat.player_id || !matchStat.team_id || !matchStat.match?.season_id) return;

        const key = `${matchStat.match.season_id}-${matchStat.player_id}-${matchStat.team_id}`;

        if (!playerSeasonStats.has(key)) {
          playerSeasonStats.set(key, {
            season_id: matchStat.match.season_id,
            player_id: matchStat.player_id,
            team_id: matchStat.team_id,
            matches_played: 0,
            goals: 0,
            assists: 0,
            yellow_cards: 0,
            red_cards: 0,
            minutes_played: 0,
            saves: 0,
          });
        }

        const stats = playerSeasonStats.get(key);
        if (!stats) return;

        // 경기 출장 카운트 (출장 시간이 0보다 큰 경우만)
        if ((matchStat.minutes_played || 0) > 0) {
          stats.matches_played++;
        }

        stats.goals += matchStat.goals || 0;
        stats.assists += matchStat.assists || 0;
        stats.yellow_cards += matchStat.yellow_cards || 0;
        stats.red_cards += matchStat.red_cards || 0;
        stats.minutes_played += matchStat.minutes_played || 0;
        stats.saves += matchStat.saves || 0;
      });

      this.logger.log(`Calculated player season stats: ${playerSeasonStats.size} entries`);

      let createdCount = 0;
      for (const [, stats] of Array.from(playerSeasonStats.entries())) {
        try {
          await this.prisma.playerSeasonStats.create({
            data: {
              season_id: stats.season_id,
              player_id: stats.player_id,
              team_id: stats.team_id,
              matches_played: stats.matches_played,
              goals: stats.goals,
              assists: stats.assists,
              yellow_cards: stats.yellow_cards,
              red_cards: stats.red_cards,
              minutes_played: stats.minutes_played,
              saves: stats.saves,
            },
          });
          createdCount++;
        } catch (error) {
          this.logger.error(
            `Failed to create player season stats (season: ${stats.season_id}, player: ${stats.player_id}, team: ${stats.team_id}):`,
            error,
          );
        }
      }

      this.logger.log(`Player season stats regeneration complete: ${createdCount} records created`);
      results.player_season_stats = createdCount;
    }

    // 3. 팀 시즌 통계 재생성
    if (statsType === 'all' || statsType === 'team_stats') {
      this.logger.log('Regenerating team season stats...');

      await this.prisma.teamSeasonStats.deleteMany({ where: seasonFilter });

      const standings = await this.prisma.standing.findMany({ where: seasonFilter });

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

      results.team_season_stats = standings.length;
    }

    // 4. 팀-시즌 관계 재생성
    if (statsType === 'all' || statsType === 'team_seasons') {
      this.logger.log('Regenerating team-season relationships...');

      await this.prisma.teamSeason.deleteMany({ where: seasonFilter });

      const teamSeasons = new Set<string>();
      const matches = await this.prisma.match.findMany({
        where: {
          ...seasonFilter,
          home_team_id: { not: null },
          away_team_id: { not: null },
        },
        select: { season_id: true, home_team_id: true, away_team_id: true },
      });

      matches.forEach((match) => {
        if (match.season_id && match.home_team_id && match.away_team_id) {
          teamSeasons.add(`${match.season_id}-${match.home_team_id}`);
          teamSeasons.add(`${match.season_id}-${match.away_team_id}`);
        }
      });

      for (const teamSeasonKey of Array.from(teamSeasons)) {
        const [sId, tId] = teamSeasonKey.split('-').map(Number);
        await this.prisma.teamSeason.create({
          data: { season_id: sId, team_id: tId },
        });
      }

      results.team_seasons = teamSeasons.size;
    }

    // 5. 상대전적 통계 재생성
    if (statsType === 'all' || statsType === 'h2h') {
      this.logger.log('Regenerating H2H stats...');

      if (seasonId && seasonId !== 'all') {
        this.logger.log('H2H stats are always calculated from all seasons. Season parameter ignored.');
      }

      await this.prisma.h2hPairStats.deleteMany();

      const matchFilter = {
        status: 'completed' as const,
        home_score: { not: null },
        away_score: { not: null },
      };

      const h2hMatches = await this.prisma.match.findMany({
        where: matchFilter,
        select: {
          match_id: true,
          home_team_id: true,
          away_team_id: true,
          home_score: true,
          away_score: true,
          penalty_home_score: true,
          penalty_away_score: true,
        },
      });

      this.logger.log(`Calculating H2H stats from ${h2hMatches.length} matches (all seasons)...`);

      const h2hStats = new Map<
        string,
        {
          team1_id: number;
          team2_id: number;
          team1_wins: number;
          team2_wins: number;
          draws: number;
          team1_goals: number;
          team2_goals: number;
        }
      >();

      h2hMatches.forEach((match) => {
        if (!match.home_team_id || !match.away_team_id) return;

        const team1 = Math.min(match.home_team_id, match.away_team_id);
        const team2 = Math.max(match.home_team_id, match.away_team_id);
        const key = `${team1}-${team2}`;

        if (!h2hStats.has(key)) {
          h2hStats.set(key, {
            team1_id: team1,
            team2_id: team2,
            team1_wins: 0,
            team2_wins: 0,
            draws: 0,
            team1_goals: 0,
            team2_goals: 0,
          });
        }

        const stats = h2hStats.get(key);
        if (!stats) return;

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
          // 정규시간 동점 - 승부차기로 승패 결정 (골때녀에는 무승부 없음)
          if (
            match.penalty_home_score !== null &&
            match.penalty_away_score !== null
          ) {
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
            this.logger.warn(
              `Match ${match.match_id}: Regular time tie but no penalty data. Result undetermined.`,
            );
          }
        }
      });

      for (const [, stats] of Array.from(h2hStats.entries())) {
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

      this.logger.log(`H2H stats regeneration complete: ${h2hStats.size} team pairs`);
      results.h2h_pair_stats = h2hStats.size;
    }

    this.logger.log('Stats regeneration complete:', JSON.stringify(results));

    return {
      message: 'Stats regeneration completed.',
      results,
      season_id: seasonId ? parseInt(seasonId) : null,
      type: statsType,
    };
  }

  // ── POST /admin/stats/backup ──
  async createBackup(seasonId?: string) {
    const seasonFilter = seasonId ? { season_id: parseInt(seasonId) } : {};
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const backupData = {
      timestamp,
      season_id: seasonId ? parseInt(seasonId) : null,
      data: {
        standings: await this.prisma.standing.findMany({ where: seasonFilter }),
        playerSeasonStats: await this.prisma.playerSeasonStats.findMany({ where: seasonFilter }),
        teamSeasonStats: await this.prisma.teamSeasonStats.findMany({ where: seasonFilter }),
        teamSeason: await this.prisma.teamSeason.findMany({ where: seasonFilter }),
        h2hPairStats: await this.prisma.h2hPairStats.findMany(),
      },
    };

    const backupFileName = `stats-backup-${timestamp}${seasonId ? `-season-${seasonId}` : '-all'}.json`;

    return {
      message: 'Stats backup created successfully.',
      backup_file: backupFileName,
      data: backupData,
      stats: {
        standings: backupData.data.standings.length,
        playerSeasonStats: backupData.data.playerSeasonStats.length,
        teamSeasonStats: backupData.data.teamSeasonStats.length,
        teamSeason: backupData.data.teamSeason.length,
        h2hPairStats: backupData.data.h2hPairStats.length,
      },
    };
  }

  // ── PUT /admin/stats/backup ──
  async restoreBackup(body: { data: BackupData; season_id?: string }) {
    const { data: backupData, season_id } = body;

    if (!backupData) {
      throw new BadRequestException('Backup data is required.');
    }

    const seasonFilter = season_id ? { season_id: parseInt(season_id) } : {};

    await Promise.all([
      this.prisma.standing.deleteMany({ where: seasonFilter }),
      this.prisma.playerSeasonStats.deleteMany({ where: seasonFilter }),
      this.prisma.teamSeasonStats.deleteMany({ where: seasonFilter }),
      this.prisma.teamSeason.deleteMany({ where: seasonFilter }),
      this.prisma.h2hPairStats.deleteMany(),
    ]);

    const results = {
      standings: 0,
      playerSeasonStats: 0,
      teamSeasonStats: 0,
      teamSeason: 0,
      h2hPairStats: 0,
    };

    if (backupData.standings && backupData.standings.length > 0) {
      await this.prisma.standing.createMany({ data: backupData.standings });
      results.standings = backupData.standings.length;
    }
    if (backupData.playerSeasonStats && backupData.playerSeasonStats.length > 0) {
      await this.prisma.playerSeasonStats.createMany({ data: backupData.playerSeasonStats });
      results.playerSeasonStats = backupData.playerSeasonStats.length;
    }
    if (backupData.teamSeasonStats && backupData.teamSeasonStats.length > 0) {
      await this.prisma.teamSeasonStats.createMany({ data: backupData.teamSeasonStats });
      results.teamSeasonStats = backupData.teamSeasonStats.length;
    }
    if (backupData.teamSeason && backupData.teamSeason.length > 0) {
      await this.prisma.teamSeason.createMany({ data: backupData.teamSeason });
      results.teamSeason = backupData.teamSeason.length;
    }
    if (backupData.h2hPairStats && backupData.h2hPairStats.length > 0) {
      await this.prisma.h2hPairStats.createMany({ data: backupData.h2hPairStats });
      results.h2hPairStats = backupData.h2hPairStats.length;
    }

    return {
      message: 'Backup data restored successfully.',
      restored: results,
      season_id: season_id || null,
    };
  }

  // ── GET /admin/stats/player-stats-debug ──
  async playerStatsDebug(query: { season_id?: string; player_id?: string }) {
    const seasonFilter = query.season_id ? { season_id: parseInt(query.season_id) } : {};
    const playerFilter = query.player_id ? { player_id: parseInt(query.player_id) } : {};

    const existingStats = await this.prisma.playerSeasonStats.findMany({
      where: { ...seasonFilter, ...playerFilter },
      include: {
        player: { select: { name: true } },
        season: { select: { season_name: true } },
        team: { select: { team_name: true } },
      },
      orderBy: [{ season_id: 'desc' }, { goals: 'desc' }],
    });

    const matchStats = await this.prisma.playerMatchStats.findMany({
      where: {
        match: seasonFilter.season_id ? { season_id: seasonFilter.season_id } : {},
        ...playerFilter,
      },
      include: {
        match: {
          select: {
            match_id: true,
            season_id: true,
            status: true,
            match_date: true,
            home_team: { select: { team_name: true } },
            away_team: { select: { team_name: true } },
          },
        },
        player: { select: { name: true } },
        team: { select: { team_name: true } },
      },
      orderBy: { match: { match_date: 'desc' } },
      take: 20,
    });

    const completedMatchStats = matchStats.filter(
      (stat) => stat.match?.status === 'completed',
    );

    const calculatedStats = new Map<
      string,
      {
        season_id: number;
        season_name: string;
        player_id: number;
        player_name: string;
        team_id: number;
        team_name: string;
        matches_played: number;
        goals: number;
        assists: number;
        yellow_cards: number;
        red_cards: number;
        minutes_played: number;
        saves: number;
      }
    >();

    completedMatchStats.forEach((stat) => {
      if (!stat.player_id || !stat.team_id || !stat.match?.season_id) return;

      const key = `${stat.match.season_id}-${stat.player_id}-${stat.team_id}`;

      if (!calculatedStats.has(key)) {
        calculatedStats.set(key, {
          season_id: stat.match.season_id,
          season_name: 'Unknown',
          player_id: stat.player_id,
          player_name: stat.player?.name || 'Unknown',
          team_id: stat.team_id,
          team_name: stat.team?.team_name || 'Unknown',
          matches_played: 0,
          goals: 0,
          assists: 0,
          yellow_cards: 0,
          red_cards: 0,
          minutes_played: 0,
          saves: 0,
        });
      }

      const calculated = calculatedStats.get(key)!;

      if ((stat.minutes_played || 0) > 0) {
        calculated.matches_played++;
      }

      calculated.goals += stat.goals || 0;
      calculated.assists += stat.assists || 0;
      calculated.yellow_cards += stat.yellow_cards || 0;
      calculated.red_cards += stat.red_cards || 0;
      calculated.minutes_played += stat.minutes_played || 0;
      calculated.saves += stat.saves || 0;
    });

    return {
      debug_info: {
        season_filter: seasonFilter,
        player_filter: playerFilter,
        total_match_stats: matchStats.length,
        completed_match_stats: completedMatchStats.length,
      },
      existing_player_season_stats: {
        count: existingStats.length,
        data: existingStats,
      },
      recent_match_stats: {
        count: matchStats.length,
        data: matchStats.map((stat) => ({
          match_id: stat.match?.match_id,
          match_date: stat.match?.match_date,
          season_id: stat.match?.season_id,
          status: stat.match?.status,
          player_name: stat.player?.name,
          team_name: stat.team?.team_name,
          opponent: stat.match
            ? `${stat.match.home_team?.team_name} vs ${stat.match.away_team?.team_name}`
            : 'Unknown',
          goals: stat.goals,
          assists: stat.assists,
          minutes_played: stat.minutes_played,
          yellow_cards: stat.yellow_cards,
          red_cards: stat.red_cards,
          saves: stat.saves,
        })),
      },
      calculated_season_stats: {
        count: calculatedStats.size,
        data: Array.from(calculatedStats.values()),
      },
    };
  }

  // ── GET /admin/stats/validate ──
  async validate(seasonId?: string) {
    const seasonFilter = seasonId ? { season_id: parseInt(seasonId) } : {};
    const issues: string[] = [];

    // 1. 순위표 vs 실제 경기 결과 검증
    const standings = await this.prisma.standing.findMany({
      where: seasonFilter,
      include: {
        team: { select: { team_name: true } },
        season: { select: { season_name: true } },
      },
    });

    for (const standing of standings) {
      const matches = await this.prisma.match.findMany({
        where: {
          season_id: standing.season_id,
          status: 'completed',
          OR: [{ home_team_id: standing.team_id }, { away_team_id: standing.team_id }],
        },
      });

      const actualStats = {
        matches_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        points: 0,
      };

      matches.forEach((match) => {
        if (match.home_score === null || match.away_score === null) return;

        actualStats.matches_played++;
        const isHome = match.home_team_id === standing.team_id;
        const teamScore = isHome ? match.home_score : match.away_score;
        const opponentScore = isHome ? match.away_score : match.home_score;

        actualStats.goals_for += teamScore;
        actualStats.goals_against += opponentScore;

        if (teamScore > opponentScore) {
          actualStats.wins++;
          actualStats.points += 3;
        } else if (teamScore < opponentScore) {
          actualStats.losses++;
        } else {
          actualStats.draws++;
          actualStats.points += 1;
        }
      });

      if (standing.matches_played !== actualStats.matches_played) {
        issues.push(
          `${standing.team?.team_name} (${standing.season?.season_name}): matches_played mismatch (DB: ${standing.matches_played}, actual: ${actualStats.matches_played})`,
        );
      }
      if (standing.wins !== actualStats.wins) {
        issues.push(
          `${standing.team?.team_name} (${standing.season?.season_name}): wins mismatch (DB: ${standing.wins}, actual: ${actualStats.wins})`,
        );
      }
      if (standing.points !== actualStats.points) {
        issues.push(
          `${standing.team?.team_name} (${standing.season?.season_name}): points mismatch (DB: ${standing.points}, actual: ${actualStats.points})`,
        );
      }
    }

    // 2. 선수 통계 vs player_match_stats 검증
    const playerSeasonStats = await this.prisma.playerSeasonStats.findMany({
      where: seasonFilter,
      include: {
        player: { select: { name: true } },
        season: { select: { season_name: true } },
      },
    });

    for (const playerStat of playerSeasonStats) {
      const actualStats = await this.prisma.playerMatchStats.aggregate({
        where: {
          player_id: playerStat.player_id,
          match: { season_id: playerStat.season_id },
        },
        _sum: { goals: true, assists: true, minutes_played: true },
        _count: { match_id: true },
      });

      if (playerStat.goals !== (actualStats._sum?.goals || 0)) {
        issues.push(
          `${playerStat.player?.name} (${playerStat.season?.season_name}): goals mismatch (DB: ${playerStat.goals}, actual: ${actualStats._sum?.goals || 0})`,
        );
      }
      if (playerStat.assists !== (actualStats._sum?.assists || 0)) {
        issues.push(
          `${playerStat.player?.name} (${playerStat.season?.season_name}): assists mismatch (DB: ${playerStat.assists}, actual: ${actualStats._sum?.assists || 0})`,
        );
      }
      if (playerStat.matches_played !== actualStats._count?.match_id) {
        issues.push(
          `${playerStat.player?.name} (${playerStat.season?.season_name}): matches_played mismatch (DB: ${playerStat.matches_played}, actual: ${actualStats._count?.match_id || 0})`,
        );
      }
    }

    // 3. team_season_stats vs standings 검증
    const teamSeasonStats = await this.prisma.teamSeasonStats.findMany({
      where: seasonFilter,
    });

    for (const teamStat of teamSeasonStats) {
      const correspondingStanding = standings.find(
        (s) => s.team_id === teamStat.team_id && s.season_id === teamStat.season_id,
      );

      if (!correspondingStanding) {
        issues.push(
          `Team ID ${teamStat.team_id} (Season ${teamStat.season_id}): exists in team_season_stats but not in standings`,
        );
        continue;
      }

      if (teamStat.points !== correspondingStanding.points) {
        issues.push(
          `Team ID ${teamStat.team_id} (Season ${teamStat.season_id}): points mismatch between team_season_stats and standings`,
        );
      }
    }

    // 4. h2h_pair_stats 검증 (샘플)
    const h2hStats = await this.prisma.h2hPairStats.findMany({ take: 10 });

    for (const h2h of h2hStats) {
      const h2hMatches = await this.prisma.match.findMany({
        where: {
          status: 'completed',
          OR: [
            { home_team_id: h2h.team_small_id, away_team_id: h2h.team_large_id },
            { home_team_id: h2h.team_large_id, away_team_id: h2h.team_small_id },
          ],
        },
      });

      const actualH2H = {
        matches_played: 0,
        small_wins: 0,
        large_wins: 0,
        draws: 0,
        small_goals: 0,
        large_goals: 0,
      };

      h2hMatches.forEach((match) => {
        if (match.home_score === null || match.away_score === null) return;

        actualH2H.matches_played++;
        let smallScore: number, largeScore: number;
        if (match.home_team_id === h2h.team_small_id) {
          smallScore = match.home_score;
          largeScore = match.away_score;
        } else {
          smallScore = match.away_score;
          largeScore = match.home_score;
        }

        if (smallScore > largeScore) actualH2H.small_wins++;
        else if (smallScore < largeScore) actualH2H.large_wins++;
        else actualH2H.draws++;

        actualH2H.small_goals += smallScore;
        actualH2H.large_goals += largeScore;
      });

      if (h2h.total_matches !== actualH2H.matches_played) {
        issues.push(
          `H2H (${h2h.team_small_id} vs ${h2h.team_large_id}): matches mismatch (DB: ${h2h.total_matches}, actual: ${actualH2H.matches_played})`,
        );
      }
    }

    return {
      message:
        issues.length === 0
          ? 'All stats data is consistent.'
          : `${issues.length} data inconsistencies found.`,
      valid: issues.length === 0,
      issues,
      checked: {
        standings: standings.length,
        player_season_stats: playerSeasonStats.length,
        team_season_stats: teamSeasonStats.length,
        h2h_pair_stats: h2hStats.length,
      },
      season_id: seasonId ? parseInt(seasonId) : null,
    };
  }

  // ── POST /admin/stats/restore-h2h ──
  async restoreH2H() {
    this.logger.log('H2H stats restore started...');

    await this.prisma.h2hPairStats.deleteMany();

    const matches = await this.prisma.match.findMany({
      where: {
        status: 'completed',
        home_score: { not: null },
        away_score: { not: null },
        home_team_id: { not: null },
        away_team_id: { not: null },
      },
      select: {
        match_id: true,
        home_team_id: true,
        away_team_id: true,
        home_score: true,
        away_score: true,
      },
    });

    this.logger.log(`Calculating H2H stats from ${matches.length} matches...`);

    const h2hStats = new Map<
      string,
      {
        team1_id: number;
        team2_id: number;
        team1_wins: number;
        team2_wins: number;
        draws: number;
        team1_goals: number;
        team2_goals: number;
        total_matches: number;
      }
    >();

    let processedMatches = 0;
    let skippedMatches = 0;

    matches.forEach((match) => {
      if (!match.home_team_id || !match.away_team_id) {
        skippedMatches++;
        return;
      }

      const team1 = Math.min(match.home_team_id, match.away_team_id);
      const team2 = Math.max(match.home_team_id, match.away_team_id);
      const key = `${team1}-${team2}`;

      if (!h2hStats.has(key)) {
        h2hStats.set(key, {
          team1_id: team1,
          team2_id: team2,
          team1_wins: 0,
          team2_wins: 0,
          draws: 0,
          team1_goals: 0,
          team2_goals: 0,
          total_matches: 0,
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
      stats.total_matches++;

      if (team1Score > team2Score) stats.team1_wins++;
      else if (team1Score < team2Score) stats.team2_wins++;
      else stats.draws++;

      processedMatches++;
    });

    let createdCount = 0;
    for (const [key, stats] of Array.from(h2hStats.entries())) {
      try {
        await this.prisma.h2hPairStats.create({
          data: {
            team_small_id: stats.team1_id,
            team_large_id: stats.team2_id,
            total_matches: stats.total_matches,
            small_wins: stats.team1_wins,
            large_wins: stats.team2_wins,
            draws: stats.draws,
            small_goals: stats.team1_goals,
            large_goals: stats.team2_goals,
          },
        });
        createdCount++;
      } catch (error) {
        this.logger.error(`Failed to create H2H pair ${key}:`, error);
      }
    }

    this.logger.log(`H2H stats restore complete: ${createdCount} pairs created`);

    return {
      message: 'H2H stats restored successfully.',
      results: {
        total_matches_processed: processedMatches,
        skipped_matches: skippedMatches,
        h2h_pairs_created: createdCount,
        expected_pairs: h2hStats.size,
      },
    };
  }

  // ── POST /admin/seasons/:seasonId/standings/fix-penalties ──
  async fixPenalties(seasonId: number) {
    if (seasonId !== 23) {
      throw new BadRequestException('This fix is only for season 23');
    }

    const updates = [
      { team_id: 20, wins: 5, draws: 0, losses: 2, points: 15 },
      { team_id: 19, wins: 4, draws: 0, losses: 1, points: 12 },
      { team_id: 30, wins: 4, draws: 0, losses: 2, points: 12 },
      { team_id: 37, wins: 4, draws: 0, losses: 2, points: 12 },
      { team_id: 29, wins: 3, draws: 0, losses: 3, points: 9 },
      { team_id: 38, wins: 2, draws: 0, losses: 3, points: 6 },
      { team_id: 39, wins: 2, draws: 0, losses: 3, points: 6 },
      { team_id: 17, wins: 2, draws: 0, losses: 3, points: 6 },
      { team_id: 18, wins: 1, draws: 0, losses: 5, points: 3 },
      { team_id: 35, wins: 1, draws: 0, losses: 4, points: 3 },
    ];

    const results: { team_id: number; updated_count: number; new_values: Record<string, number> }[] = [];

    for (const update of updates) {
      const result = await this.prisma.standing.updateMany({
        where: { season_id: seasonId, team_id: update.team_id },
        data: {
          wins: update.wins,
          draws: update.draws,
          losses: update.losses,
          points: update.points,
          updated_at: new Date(),
        },
      });

      results.push({
        team_id: update.team_id,
        updated_count: result.count,
        new_values: {
          wins: update.wins,
          draws: update.draws,
          losses: update.losses,
          points: update.points,
        },
      });
    }

    return {
      message: 'Successfully fixed standings with penalty shootout results',
      season_id: seasonId,
      updated_teams: results.length,
      results,
    };
  }
}
