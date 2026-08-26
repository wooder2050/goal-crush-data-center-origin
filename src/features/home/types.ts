export interface HomeStanding {
  standing_id: number;
  position: number;
  matches_played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goals_for: number | null;
  goals_against: number | null;
  goal_difference: number | null;
  points: number | null;
  form: string | null;
  group_name: string | null;
  team: {
    team_id: number;
    team_name: string;
    logo: string | null;
  } | null;
}

export interface StandingsGroup {
  group_name: string;
  standings: HomeStanding[];
}

export interface PlayerStatRow {
  player_id: number | null;
  player_name: string | null;
  player_image: string | null;
  team_name: string | null;
  team_logo: string | null;
  team_primary_color: string | null;
  team_secondary_color: string | null;
  goals: number | null;
  assists: number | null;
  matches_played: number | null;
  avg_rating: number | null;
}

export interface GoalScorerRow {
  goal_id: number;
  player_id: number;
  player_name: string;
  jersey_number: number | null;
  goal_time: number | null;
  goal_type: string | null;
  team: {
    team_id: number;
    team_name: string;
  } | null;
}

export interface HomeMatch {
  match_id: number;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
  status: string | null;
  is_date_confirmed?: boolean;
  tournament_stage?: string | null;
  season: {
    season_id: number;
    season_name: string;
  } | null;
  home_team: {
    team_id: number;
    team_name: string;
    logo: string | null;
  } | null;
  away_team: {
    team_id: number;
    team_name: string;
    logo: string | null;
  } | null;
}

export interface LatestMatchGoals {
  match: HomeMatch;
  goals: GoalScorerRow[];
}

export interface CareerStatRow {
  player_id: number;
  player_name: string | null;
  player_image: string | null;
  team_name: string | null;
  team_primary_color: string | null;
  team_secondary_color: string | null;
  goals: number;
  assists: number;
  matches_played: number;
  goals_per_match: number;
  assists_per_match: number;
  attack_points: number;
  attack_points_per_match: number;
}

/** 시즌 마무리 배너용 우승팀 로스터 한 명 */
export interface ChampionRosterPlayer {
  player_id: number;
  player_name: string;
  player_image: string | null;
  jersey_number: number | null;
  matches_played: number;
  goals: number;
  assists: number;
}

export interface SeasonSummaryStats {
  totalMatches: number;
  completedMatches: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
  participatingTeams: number;
}

export interface HomePageData {
  currentSeason: {
    season_id: number;
    season_name: string;
    start_date: string | null;
    /** 시즌 종료일 — 채워져 있으면 시즌이 끝난 상태 (시즌 마무리 배너 노출 조건) */
    end_date: string | null;
    /** 시즌 카테고리 (GIFA_CUP 등 컵 대회면 순위표 대신 토너먼트 현황 표시) */
    category: string | null;
  };
  /** 순위표·선수 스탯이 실제로 어느 시즌 데이터인지 (개막 전엔 직전 시즌으로 폴백) */
  statsSeason: {
    season_id: number;
    season_name: string;
    is_fallback: boolean;
  };
  /** 컵 대회 시즌의 전 경기 (라운드별 토너먼트 현황용, 컵이 아니면 빈 배열) */
  cupMatches: HomeMatch[];
  /** 새 시즌 개막전 (개막 배너용, 폴백 상태에서만 조회됨) */
  kickoffMatch: HomeMatch | null;
  /** 우승팀 로스터 (시즌 종료 상태에서만 조회됨, 아니면 빈 배열) */
  championRoster: ChampionRosterPlayer[];
  recentMatches: HomeMatch[];
  upcomingMatches: HomeMatch[];
  /** 매치데이 카드 전용: 윈도우에 걸릴 수 있는 최근 36h~향후 24h 경기 (완료 포함) */
  todayMatches: HomeMatch[];
  knockoutMatches: HomeMatch[];
  standings: StandingsGroup[];
  topScorers: PlayerStatRow[];
  topAssists: PlayerStatRow[];
  topRatings: PlayerStatRow[];
  topXtRatings: PlayerStatRow[];
  latestMatchGoals: LatestMatchGoals | null;
  seasonSummary: SeasonSummaryStats;
  careerTopScorers: CareerStatRow[];
  careerTopAssists: CareerStatRow[];
  careerGoalsPerMatch: CareerStatRow[];
  careerAssistsPerMatch: CareerStatRow[];
  careerAttackPoints: CareerStatRow[];
  careerAttackPointsPerMatch: CareerStatRow[];
}
