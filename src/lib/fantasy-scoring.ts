import { prisma } from '@/lib/prisma';
import { FantasyRules } from '@/types/fantasy';

// 판타지 점수 규칙 (JSON에서 정의한 규칙)
export const FANTASY_RULES: FantasyRules = {
  version: '1.0.0',
  effective_date: '2025-09-05',
  rules: {
    appearance: {
      played: 2,
      starter_bonus: 1,
    },
    attack: {
      goal: 4,
      assist: 2,
      multiple_goal_contribution_bonus: 1,
    },
    defense: {
      clean_sheet: 3,
      goalkeeper_save_per_2: 1,
      important_block_or_tackle: 2,
    },
    deductions: {
      yellow_card: -1,
      red_card: -2,
      own_goal: -2,
      missed_penalty: -2,
    },
  },
};

interface PlayerMatchPerformance {
  player_id: number;
  match_id: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  minutes_played: number;
  saves: number;
  position: string | null;
  team_id: number | null;
}

interface TeamMatchData {
  team_id: number;
  goals_conceded: number;
  is_clean_sheet: boolean;
}

/**
 * 경기별 선수 판타지 점수 계산
 */
export function calculatePlayerFantasyPoints(
  performance: PlayerMatchPerformance,
  teamData: TeamMatchData,
  isStarter: boolean = false
): {
  appearance_points: number;
  goal_points: number;
  assist_points: number;
  clean_sheet_points: number;
  save_points: number;
  defensive_points: number;
  penalty_points: number;
  card_points: number;
  bonus_points: number;
  total_points: number;
} {
  const rules = FANTASY_RULES.rules;

  let appearance_points = 0;
  let goal_points = 0;
  let assist_points = 0;
  let clean_sheet_points = 0;
  let save_points = 0;
  const defensive_points = 0;
  const penalty_points = 0;
  let card_points = 0;
  let bonus_points = 0;

  // 출전 점수
  if (performance.minutes_played > 0) {
    appearance_points = rules.appearance.played;

    // 선발 출전 보너스
    if (isStarter) {
      appearance_points += rules.appearance.starter_bonus;
    }
  }

  // 골 점수
  if (performance.goals > 0) {
    goal_points = performance.goals * rules.attack.goal;

    // 여러 골 기여 보너스 (골 + 어시스트 >= 2)
    if (performance.goals + performance.assists >= 2) {
      bonus_points += rules.attack.multiple_goal_contribution_bonus;
    }
  }

  // 어시스트 점수
  if (performance.assists > 0) {
    assist_points = performance.assists * rules.attack.assist;
  }

  // 무실점 보너스 (골키퍼와 수비수만)
  if (
    teamData.is_clean_sheet &&
    performance.position &&
    ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(
      performance.position.toUpperCase()
    )
  ) {
    clean_sheet_points = rules.defense.clean_sheet;
  }

  // 골키퍼 세이브 점수
  if (performance.saves > 0) {
    save_points =
      Math.floor(performance.saves / 2) * rules.defense.goalkeeper_save_per_2;
  }

  // 중요한 수비 액션 점수 (임시로 0, 추후 데이터 수집 시 구현)
  // defensive_points = important_actions * rules.defense.important_block_or_tackle;

  // 페널티 실축 감점 (임시로 0, 추후 데이터 수집 시 구현)
  // penalty_points = missed_penalties * rules.deductions.missed_penalty;

  // 카드 감점
  if (performance.yellow_cards > 0) {
    card_points += performance.yellow_cards * rules.deductions.yellow_card;
  }

  if (performance.red_cards > 0) {
    card_points += performance.red_cards * rules.deductions.red_card;
  }

  // 자책골 감점 (임시로 0, 추후 Goal 모델에 own_goal 필드 추가 시 구현)
  // own_goal_points = own_goals * rules.deductions.own_goal;

  const total_points =
    appearance_points +
    goal_points +
    assist_points +
    clean_sheet_points +
    save_points +
    defensive_points +
    penalty_points +
    card_points +
    bonus_points;

  return {
    appearance_points,
    goal_points,
    assist_points,
    clean_sheet_points,
    save_points,
    defensive_points,
    penalty_points,
    card_points,
    bonus_points,
    total_points,
  };
}

/**
 * 특정 경기의 판타지 점수 계산 및 업데이트
 */
export async function calculateMatchFantasyScores(matchId: number) {
  try {
    // 경기 정보 조회
    const match = await prisma.match.findUnique({
      where: { match_id: matchId },
      include: {
        home_team: { select: { team_id: true, team_name: true } },
        away_team: { select: { team_id: true, team_name: true } },
        player_match_stats: {
          include: {
            player: { select: { player_id: true, name: true } },
            team: { select: { team_id: true } },
          },
        },
      },
    });

    if (!match || !match.home_team || !match.away_team) {
      throw new Error('경기 정보를 찾을 수 없습니다.');
    }

    // 팀별 무실점 여부 계산
    const homeTeamData: TeamMatchData = {
      team_id: match.home_team.team_id,
      goals_conceded: match.away_score || 0,
      is_clean_sheet: (match.away_score || 0) === 0,
    };

    const awayTeamData: TeamMatchData = {
      team_id: match.away_team.team_id,
      goals_conceded: match.home_score || 0,
      is_clean_sheet: (match.home_score || 0) === 0,
    };

    // 현재 활성화된 판타지 시즌 조회
    const activeFantasySeasons = await prisma.fantasySeason.findMany({
      where: {
        is_active: true,
        ...(match.season_id && { season_id: match.season_id }),
      },
    });

    // 각 선수의 매치 성과에 대해 판타지 점수 계산
    const fantasyPerformances = [];

    for (const playerStats of match.player_match_stats) {
      const performance: PlayerMatchPerformance = {
        player_id: playerStats.player_id || 0,
        match_id: matchId,
        goals: playerStats.goals || 0,
        assists: playerStats.assists || 0,
        yellow_cards: playerStats.yellow_cards || 0,
        red_cards: playerStats.red_cards || 0,
        minutes_played: playerStats.minutes_played || 0,
        saves: playerStats.saves || 0,
        position: playerStats.position,
        team_id: playerStats.team_id,
      };

      const teamData =
        performance.team_id === homeTeamData.team_id
          ? homeTeamData
          : awayTeamData;

      // 선발 출전 여부 (90분 이상 출전한 경우를 선발로 가정)
      const isStarter = (performance.minutes_played || 0) >= 60;

      const points = calculatePlayerFantasyPoints(
        performance,
        teamData,
        isStarter
      );

      // 해당 선수가 포함된 판타지 팀들 찾기
      for (const fantasySeason of activeFantasySeasons) {
        const playerSelections = await prisma.fantasyPlayerSelection.findMany({
          where: {
            player_id: performance.player_id,
            fantasy_team: {
              fantasy_season_id: fantasySeason.fantasy_season_id,
            },
          },
        });

        // 각 선택에 대해 성과 기록 생성/업데이트
        for (const selection of playerSelections) {
          fantasyPerformances.push({
            selection_id: selection.selection_id,
            match_id: matchId,
            player_id: performance.player_id,
            ...points,
          });
        }
      }
    }

    // 판타지 매치 성과 저장 (upsert)
    for (const perf of fantasyPerformances) {
      await prisma.fantasyMatchPerformance.upsert({
        where: {
          selection_id_match_id: {
            selection_id: perf.selection_id,
            match_id: perf.match_id,
          },
        },
        update: {
          appearance_points: perf.appearance_points,
          goal_points: perf.goal_points,
          assist_points: perf.assist_points,
          clean_sheet_points: perf.clean_sheet_points,
          save_points: perf.save_points,
          defensive_points: perf.defensive_points,
          penalty_points: perf.penalty_points,
          card_points: perf.card_points,
          bonus_points: perf.bonus_points,
          total_points: perf.total_points,
        },
        create: perf,
      });
    }

    // 판타지 팀 총점 업데이트
    await updateFantasyTeamTotals(
      activeFantasySeasons.map((s) => s.fantasy_season_id)
    );

    console.log(
      `경기 ${matchId}의 판타지 점수 계산 완료: ${fantasyPerformances.length}개 성과 처리`
    );

    return {
      match_id: matchId,
      processed_performances: fantasyPerformances.length,
      fantasy_seasons: activeFantasySeasons.length,
    };
  } catch (error) {
    console.error('판타지 점수 계산 중 오류:', error);
    throw error;
  }
}

/**
 * 판타지 팀 총점 업데이트
 */
export async function updateFantasyTeamTotals(fantasySeasonIds: number[]) {
  for (const fantasySeasonId of fantasySeasonIds) {
    const fantasyTeams = await prisma.fantasyTeam.findMany({
      where: { fantasy_season_id: fantasySeasonId },
      include: {
        player_selections: {
          include: {
            match_performances: true,
          },
        },
      },
    });

    for (const team of fantasyTeams) {
      // 각 팀의 총점 계산
      let totalPoints = 0;
      let selectionPoints = 0;

      for (const selection of team.player_selections) {
        selectionPoints = selection.match_performances.reduce(
          (sum, perf) => sum + perf.total_points,
          0
        );

        // 선수별 점수 업데이트
        await prisma.fantasyPlayerSelection.update({
          where: { selection_id: selection.selection_id },
          data: { points_earned: selectionPoints },
        });

        totalPoints += selectionPoints;
      }

      // 팀 총점 업데이트
      await prisma.fantasyTeam.update({
        where: { fantasy_team_id: team.fantasy_team_id },
        data: { total_points: totalPoints },
      });
    }
  }
}

/**
 * 특정 시즌의 모든 경기에 대해 판타지 점수 재계산
 */
export async function recalculateSeasonFantasyScores(seasonId: number) {
  try {
    const matches = await prisma.match.findMany({
      where: {
        season_id: seasonId,
        status: 'finished', // 완료된 경기만
      },
      select: { match_id: true },
    });

    const results = [];
    for (const match of matches) {
      const result = await calculateMatchFantasyScores(match.match_id);
      results.push(result);
    }

    console.log(
      `시즌 ${seasonId}의 판타지 점수 재계산 완료: ${results.length}개 경기 처리`
    );

    return {
      season_id: seasonId,
      processed_matches: results.length,
      results,
    };
  } catch (error) {
    console.error('시즌 판타지 점수 재계산 중 오류:', error);
    throw error;
  }
}
