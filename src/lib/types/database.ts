// Goal Crush Data Center database type definitions (Supabase-aligned)

export interface User {
  user_id: string;
  korean_nickname: string;
  display_name?: string | null;
  profile_image_url?: string | null;
  bio?: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatchSupport {
  support_id: number;
  user_id: string;
  match_id: number;
  team_id: number;
  support_type: string;
  message?: string | null;
  created_at: string;
  updated_at: string;
}

// ========================================
// 커뮤니티 기능 관련 인터페이스들
// ========================================

export interface CommunityPost {
  post_id: number;
  user_id: string;
  title: string;
  content?: string | null;
  category: string;
  team_id?: number | null;
  match_id?: number | null;
  season_id?: number | null;
  is_pinned?: boolean | null;
  likes_count?: number | null;
  comments_count?: number | null;
  views_count?: number | null;
  is_deleted?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PostComment {
  comment_id: number;
  post_id: number;
  user_id: string;
  parent_comment_id?: number | null;
  content: string;
  likes_count?: number | null;
  is_deleted?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PostLike {
  like_id: number;
  post_id: number;
  user_id: string;
  created_at?: string | null;
}

export interface CommentLike {
  like_id: number;
  comment_id: number;
  user_id: string;
  created_at?: string | null;
}

export interface MvpVote {
  vote_id: number;
  season_id: number;
  user_id: string;
  player_id: number;
  vote_type: string;
  match_id?: number | null;
  created_at?: string | null;
}

export interface MatchPrediction {
  prediction_id: number;
  match_id: number;
  user_id: string;
  home_score: number;
  away_score: number;
  predicted_winner?: string | null;
  predicted_mvp_id?: number | null;
  confidence_level?: number | null;
  is_correct?: boolean | null;
  points_earned?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface UserPoint {
  point_id: number;
  user_id: string;
  points_change: number;
  point_type: string;
  reference_id?: number | null;
  description?: string | null;
  created_at?: string | null;
}

export interface UserBadge {
  badge_id: number;
  user_id: string;
  badge_type: string;
  badge_name: string;
  badge_description?: string | null;
  badge_icon?: string | null;
  earned_at?: string | null;
}

export interface CommunityEvent {
  event_id: number;
  title: string;
  description?: string | null;
  event_type: string;
  start_date: string;
  end_date: string;
  reward_points?: number | null;
  max_participants?: number | null;
  current_participants?: number | null;
  is_active?: boolean | null;
  created_by?: string | null;
  created_at?: string | null;
}

export interface EventParticipation {
  participation_id: number;
  event_id: number;
  user_id: string;
  answer_data?: unknown | null; // jsonb type
  score?: number | null;
  is_winner?: boolean | null;
  participated_at?: string | null;
}

export interface UserNotification {
  notification_id: number;
  user_id: string;
  notification_type: string;
  title: string;
  message?: string | null;
  reference_type?: string | null;
  reference_id?: number | null;
  is_read?: boolean | null;
  created_at?: string | null;
}

export interface Player {
  player_id: number;
  name: string;
  birth_date?: string | null;
  nationality?: string | null;
  height_cm?: number | null;
  profile_image_url?: string | null;
  jersey_number?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Team {
  team_id: number;
  team_name: string;
  logo?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  founded_year?: number | null;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Season {
  season_id: number;
  season_name: string;
  year: number;
  start_date: string | null;
  end_date: string | null;
  // New: season category (G_LEAGUE, SUPER_LEAGUE, CHALLENGE_LEAGUE, PLAYOFF, OTHER)
  category?:
    | 'G_LEAGUE'
    | 'SUPER_LEAGUE'
    | 'CHALLENGE_LEAGUE'
    | 'PLAYOFF'
    | 'SBS_CUP'
    | 'GIFA_CUP'
    | 'OTHER'
    | 'CHAMPION_MATCH'
    | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TeamSeason {
  team_season_id: number;
  team_id: number | null;
  season_id: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
}

export interface PlayerTeamHistory {
  history_id: number;
  player_id: number | null;
  team_id: number | null;
  season_id: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
}

export interface Match {
  match_id: number;
  match_date: string; // ISO
  season_id: number | null;
  home_team_id: number | null;
  away_team_id: number | null;
  home_coach_id?: number | null;
  away_coach_id?: number | null;
  home_score: number | null;
  away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
  location: string | null;
  status: string | null;
  description: string | null;
  group_stage?: string | null;
  tournament_stage?: string | null;
  highlight_url?: string | null;
  full_video_url?: string | null;
  is_date_confirmed?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PlayerMatchStats {
  stat_id: number;
  match_id: number | null;
  player_id: number | null;
  team_id: number | null;
  goals: number | null;
  assists: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  minutes_played: number | null;
  saves: number | null;
  position?: string | null;
  card_type?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PlayerSeasonStats {
  stat_id: number;
  player_id: number | null;
  season_id: number | null;
  team_id: number | null;
  matches_played: number | null;
  goals: number | null;
  assists: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  minutes_played: number | null;
  saves: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PlayerSeasonStatsWithNames extends PlayerSeasonStats {
  player_name: string | null;
  team_name: string | null;
  team_logo?: string | null;
}

export interface TeamSeasonStats {
  stat_id: number;
  team_id: number | null;
  season_id: number | null;
  matches_played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goals_for: number | null;
  goals_against: number | null;
  points: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Standing {
  standing_id: number;
  season_id: number | null;
  team_id: number | null;
  position: number; // rank
  matches_played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goals_for: number | null;
  goals_against: number | null;
  goal_difference: number | null;
  points: number | null;
  form?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Goal {
  goal_id: number;
  match_id: number;
  player_id: number;
  goal_time?: number | null;
  goal_type: string | null;
  description?: string | null;
  assist_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Assist {
  assist_id: number;
  match_id: number;
  player_id: number;
  goal_id: number;
  assist_time?: number | null;
  assist_type?: string | null;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Substitution {
  substitution_id: number;
  match_id: number;
  player_in_id: number;
  player_out_id: number | null;
  team_id: number;
  substitution_time?: number | null;
  substitution_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SubstitutionInput {
  match_id: number;
  player_in_id: number;
  player_out_id?: number | null;
  team_id: number;
  substitution_time?: number | null;
  substitution_reason?: string | null;
}

export interface SubstitutionUpdate {
  substitution_time?: number | null;
  substitution_reason?: string | null;
}

export interface SubstitutionWithDetails extends Substitution {
  player_in: Player;
  player_out: Player | null;
  team: Team;
  match: Match;
}

export interface PenaltyShootoutDetail {
  penalty_detail_id: number;
  match_id: number;
  team_id: number;
  goalkeeper_id: number | null;
  kicker_order: number;
  kicker_id: number;
  is_successful: boolean;
  kick_description: string | null;
  created_at: string | null;
}

export interface PenaltyShootoutDetailWithPlayers
  extends PenaltyShootoutDetail {
  goalkeeper: Player | null;
  kicker: Player;
  team: Team;
}

// New tables reflected from schema.json
export interface GroupLeagueStanding {
  group_standing_id: number;
  season_id: number;
  group_stage: string;
  group_name: string | null;
  team_id: number;
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
  created_at: string | null;
  updated_at: string | null;
  tournament_stage: string | null;
}

export interface PlayerPosition {
  player_position_id: number;
  player_id: number;
  position: string;
  season_id: number | null;
  start_date: string; // date
  end_date: string | null; // date
  created_at: string | null;
  updated_at: string | null;
}

export interface TeamSeasonName {
  id: number;
  team_id: number;
  season_id: number;
  team_name: string;
  is_current: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface PlayerCurrentPositionRow {
  player_id: number | null;
  position: string | null;
}

// 코치(감독) 관련 타입들
export interface Coach {
  coach_id: number;
  name: string;
  birth_date: string | null;
  nationality: string | null;
  profile_image_url: string | null;
  created_at: string | null;
}

export interface TeamCoachHistory {
  id: number;
  coach_id: number;
  team_id: number;
  season_id: number;
  start_date: string;
  end_date: string | null;
  role: string;
  is_current: boolean;
  created_at: string | null;
}

export interface MatchCoach {
  id: number;
  match_id: number;
  team_id: number;
  coach_id: number;
  role: string;
  created_at: string | null;
}

// Input types (for auto-generated IDs)
export type UserInput = Omit<User, 'created_at' | 'updated_at'>;
export type PlayerInput = Omit<
  Player,
  'player_id' | 'created_at' | 'updated_at'
>;
export type TeamInput = Omit<Team, 'team_id' | 'created_at' | 'updated_at'>;
export type SeasonInput = Omit<
  Season,
  'season_id' | 'created_at' | 'updated_at'
>;
export type TeamSeasonInput = Omit<TeamSeason, 'team_season_id' | 'created_at'>;
export type PlayerTeamHistoryInput = Omit<
  PlayerTeamHistory,
  'history_id' | 'created_at'
>;
export type MatchInput = Omit<Match, 'match_id'>;
export type PlayerMatchStatsInput = Omit<
  PlayerMatchStats,
  'stat_id' | 'created_at' | 'updated_at'
>;
export type PlayerSeasonStatsInput = Omit<
  PlayerSeasonStats,
  'stat_id' | 'created_at' | 'updated_at'
>;
export type TeamSeasonStatsInput = Omit<
  TeamSeasonStats,
  'stat_id' | 'created_at' | 'updated_at'
>;
export type StandingInput = Omit<
  Standing,
  'standing_id' | 'created_at' | 'updated_at'
>;
export type GoalInput = Omit<Goal, 'goal_id' | 'created_at' | 'updated_at'>;
export type AssistInput = Omit<
  Assist,
  'assist_id' | 'created_at' | 'updated_at'
>;
export type CoachInput = Omit<Coach, 'coach_id' | 'created_at'>;
export type TeamCoachHistoryInput = Omit<TeamCoachHistory, 'id' | 'created_at'>;
export type MatchCoachInput = Omit<MatchCoach, 'id' | 'created_at'>;

// 커뮤니티 기능 Input 타입들
export type CommunityPostInput = Omit<
  CommunityPost,
  'post_id' | 'created_at' | 'updated_at'
>;
export type PostCommentInput = Omit<
  PostComment,
  'comment_id' | 'created_at' | 'updated_at'
>;
export type PostLikeInput = Omit<PostLike, 'like_id' | 'created_at'>;
export type CommentLikeInput = Omit<CommentLike, 'like_id' | 'created_at'>;
export type MvpVoteInput = Omit<MvpVote, 'vote_id' | 'created_at'>;
export type MatchPredictionInput = Omit<
  MatchPrediction,
  'prediction_id' | 'created_at' | 'updated_at'
>;
export type UserPointInput = Omit<UserPoint, 'point_id' | 'created_at'>;
export type UserBadgeInput = Omit<UserBadge, 'badge_id' | 'earned_at'>;
export type CommunityEventInput = Omit<
  CommunityEvent,
  'event_id' | 'created_at'
>;
export type EventParticipationInput = Omit<
  EventParticipation,
  'participation_id' | 'participated_at'
>;
export type UserNotificationInput = Omit<
  UserNotification,
  'notification_id' | 'created_at'
>;

// Update types (all fields optional)
export type UserUpdate = Partial<
  Omit<User, 'user_id' | 'created_at' | 'updated_at'>
>;
export type PlayerUpdate = Partial<
  Omit<Player, 'player_id' | 'created_at' | 'updated_at'>
>;
export type TeamUpdate = Partial<Omit<Team, 'team_id'>>;
export type SeasonUpdate = Partial<Omit<Season, 'season_id'>>;
export type TeamSeasonUpdate = Partial<Omit<TeamSeason, 'team_season_id'>>;
export type PlayerTeamHistoryUpdate = Partial<
  Omit<PlayerTeamHistory, 'history_id'>
>;
export type MatchUpdate = Partial<Omit<Match, 'match_id'>>;
export type PlayerMatchStatsUpdate = Partial<Omit<PlayerMatchStats, 'stat_id'>>;
export type PlayerSeasonStatsUpdate = Partial<
  Omit<PlayerSeasonStats, 'stat_id'>
>;
export type TeamSeasonStatsUpdate = Partial<Omit<TeamSeasonStats, 'stat_id'>>;
export type StandingUpdate = Partial<Omit<Standing, 'standing_id'>>;
export type GoalUpdate = Partial<
  Omit<Goal, 'goal_id' | 'created_at' | 'updated_at'>
>;
export type AssistUpdate = Partial<
  Omit<Assist, 'assist_id' | 'created_at' | 'updated_at'>
>;
export type CoachUpdate = Partial<Omit<Coach, 'coach_id' | 'created_at'>>;
export type TeamCoachHistoryUpdate = Partial<Omit<TeamCoachHistory, 'id'>>;
export type MatchCoachUpdate = Partial<Omit<MatchCoach, 'id'>>;

// 커뮤니티 기능 Update 타입들
export type CommunityPostUpdate = Partial<
  Omit<CommunityPost, 'post_id' | 'user_id'>
>;
export type PostCommentUpdate = Partial<
  Omit<PostComment, 'comment_id' | 'post_id' | 'user_id'>
>;
export type MvpVoteUpdate = Partial<Omit<MvpVote, 'vote_id' | 'user_id'>>;
export type MatchPredictionUpdate = Partial<
  Omit<MatchPrediction, 'prediction_id' | 'match_id' | 'user_id'>
>;
export type UserBadgeUpdate = Partial<Omit<UserBadge, 'badge_id' | 'user_id'>>;
export type CommunityEventUpdate = Partial<Omit<CommunityEvent, 'event_id'>>;
export type EventParticipationUpdate = Partial<
  Omit<EventParticipation, 'participation_id' | 'event_id' | 'user_id'>
>;
export type UserNotificationUpdate = Partial<
  Omit<UserNotification, 'notification_id' | 'user_id'>
>;

// Joined data types
export interface PlayerWithTeam extends Player {
  team: Team;
}

export interface MatchWithTeams extends Match {
  home_team: Team;
  away_team: Team;
  season: Season;
  home_coach?: Coach | null;
  away_coach?: Coach | null;
}

export interface PlayerMatchStatsWithDetails extends PlayerMatchStats {
  player: Player;
  team: Team;
  match: Match;
}

export interface PlayerSeasonStatsWithDetails extends PlayerSeasonStats {
  player: Player;
  team: Team;
  season: Season;
}

export interface TeamSeasonStatsWithDetails extends TeamSeasonStats {
  team: Team;
  season: Season;
}

export interface StandingWithDetails extends Standing {
  team: Team;
  season: Season;
}

export interface GoalWithDetails extends Goal {
  player: Player;
  match: MatchWithTeams;
  assists?: AssistWithDetails[];
}

export interface AssistWithDetails extends Assist {
  player: Player;
  goal: GoalWithDetails;
  match: MatchWithTeams;
}

// 코치 관련 조인 타입들
export interface CoachWithHistory extends Coach {
  team_coach_history: Array<{
    id: number;
    team_id: number;
    season_id: number;
    start_date: Date;
    end_date: Date | null;
    role: string;
    is_current: boolean | null;
    team: {
      team_id: number;
      team_name: string;
      logo: string | null;
    };
    season: {
      season_id: number;
      season_name: string;
      year: number;
    };
  }>;
}

export interface CoachDetail extends Coach {
  team_coach_history: Array<{
    id: number;
    team_id: number;
    season_id: number;
    start_date: Date;
    end_date: Date | null;
    role: string;
    is_current: boolean | null;
    team: {
      team_id: number;
      team_name: string;
      logo: string | null;
    };
    season: {
      season_id: number;
      season_name: string;
      year: number;
    };
  }>;
  match_coaches: Array<{
    id: number;
    match_id: number;
    team_id: number;
    role: string;
    match: {
      match_id: number;
      match_date: string;
      home_team_id: number | null;
      away_team_id: number | null;
      home_score: number | null;
      away_score: number | null;
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
    };
    team: {
      team_id: number;
      team_name: string;
      logo: string | null;
    };
  }>;
}

export interface CoachSeasonStats {
  season_id: number;
  season_name: string;
  year: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
  win_rate: number;
  goal_difference: number;
  teams: string[];
  position?: number | null;
  teams_detailed?: Array<{
    team_id: number;
    team_name: string;
    logo: string | null;
  }>;
}

export interface CoachOverview {
  coach_id: number;
  total_matches: number;
  season_stats: CoachSeasonStats[];
  trophies: CoachTrophies;
}

export interface CoachFull {
  coach: CoachDetail;
  overview: CoachOverview;
  current_team_verified: TeamCurrentHeadCoach | null;
}

export interface MatchCoaches {
  match_id: number;
  home_team_coaches: Array<{
    id: number;
    team_id: number;
    coach_id: number;
    role: string;
    coach: {
      coach_id: number;
      name: string;
    };
    team: {
      team_id: number;
      team_name: string;
    };
  }>;
  away_team_coaches: Array<{
    id: number;
    team_id: number;
    coach_id: number;
    role: string;
    coach: {
      coach_id: number;
      name: string;
    };
    team: {
      team_id: number;
      team_name: string;
    };
  }>;
}

// 현재팀(헤드코치) 뷰 응답 타입
export interface TeamCurrentHeadCoach {
  team_id: number;
  team_name: string;
  logo: string | null;
  coach_id: number;
  coach_name?: string;
  nationality?: string | null;
  profile_image_url?: string | null;
  last_match_date: string;
}

export interface CoachTrophies {
  coach_id: number;
  total: number;
  league_wins: number;
  cup_wins: number;
  items: Array<{
    season_id: number;
    season_name: string;
    category: Season['category'];
  }>;
}

// 커뮤니티 관련 조인 타입들
export interface CommunityPostWithDetails extends CommunityPost {
  user: User;
  team?: Team | null;
  match?: Match | null;
  season?: Season | null;
  comments?: PostComment[];
  likes?: PostLike[];
}

export interface PostCommentWithDetails extends PostComment {
  user: User;
  post: CommunityPost;
  likes?: CommentLike[];
  replies?: PostCommentWithDetails[];
}

export interface MvpVoteWithDetails extends MvpVote {
  user: User;
  player: Player;
  season: Season;
  match?: Match | null;
}

export interface MatchPredictionWithDetails extends MatchPrediction {
  user: User;
  match: MatchWithTeams;
  predicted_mvp?: Player | null;
}

export interface UserPointWithDetails extends UserPoint {
  user: User;
}

export interface UserBadgeWithDetails extends UserBadge {
  user: User;
}

export interface CommunityEventWithDetails extends CommunityEvent {
  created_by_user?: User | null;
  participations?: EventParticipation[];
}

export interface EventParticipationWithDetails extends EventParticipation {
  user: User;
  event: CommunityEvent;
}

export interface UserNotificationWithDetails extends UserNotification {
  user: User;
}

// Table name types
export type TableName =
  | 'users'
  | 'players'
  | 'teams'
  | 'seasons'
  | 'team_seasons'
  | 'team_season_names'
  | 'player_team_history'
  | 'matches'
  | 'player_match_stats'
  | 'player_season_stats'
  | 'team_season_stats'
  | 'standings'
  | 'group_league_standings'
  | 'goals'
  | 'assists'
  | 'substitutions'
  | 'penalty_shootout_details'
  | 'player_positions'
  | 'player_current_position'
  | 'coaches'
  | 'team_coach_history'
  | 'match_coaches'
  | 'match_supports'
  | 'community_posts'
  | 'post_comments'
  | 'post_likes'
  | 'comment_likes'
  | 'mvp_votes'
  | 'match_predictions'
  | 'user_points'
  | 'user_badges'
  | 'community_events'
  | 'event_participations'
  | 'user_notifications';

// Database schema types
export interface Database {
  public: {
    Tables: {
      users: { Row: User; Insert: UserInput; Update: UserUpdate };
      players: { Row: Player; Insert: PlayerInput; Update: PlayerUpdate };
      teams: { Row: Team; Insert: TeamInput; Update: TeamUpdate };
      seasons: { Row: Season; Insert: SeasonInput; Update: SeasonUpdate };
      team_seasons: {
        Row: TeamSeason;
        Insert: TeamSeasonInput;
        Update: TeamSeasonUpdate;
      };
      team_season_names: { Row: TeamSeasonName };
      player_team_history: {
        Row: PlayerTeamHistory;
        Insert: PlayerTeamHistoryInput;
        Update: PlayerTeamHistoryUpdate;
      };
      matches: { Row: Match; Insert: MatchInput; Update: MatchUpdate };
      player_match_stats: {
        Row: PlayerMatchStats;
        Insert: PlayerMatchStatsInput;
        Update: PlayerMatchStatsUpdate;
      };
      player_season_stats: {
        Row: PlayerSeasonStats;
        Insert: PlayerSeasonStatsInput;
        Update: PlayerSeasonStatsUpdate;
      };
      team_season_stats: {
        Row: TeamSeasonStats;
        Insert: TeamSeasonStatsInput;
        Update: TeamSeasonStatsUpdate;
      };
      standings: {
        Row: Standing;
        Insert: StandingInput;
        Update: StandingUpdate;
      };
      group_league_standings: { Row: GroupLeagueStanding };
      goals: { Row: Goal; Insert: GoalInput; Update: GoalUpdate };
      assists: { Row: Assist; Insert: AssistInput; Update: AssistUpdate };
      substitutions: {
        Row: Substitution;
        Insert: SubstitutionInput;
        Update: SubstitutionUpdate;
      };
      penalty_shootout_details: { Row: PenaltyShootoutDetail };
      player_positions: { Row: PlayerPosition };
      player_current_position: { Row: PlayerCurrentPositionRow };
      coaches: { Row: Coach; Insert: CoachInput; Update: CoachUpdate };
      team_coach_history: {
        Row: TeamCoachHistory;
        Insert: TeamCoachHistoryInput;
        Update: TeamCoachHistoryUpdate;
      };
      match_coaches: {
        Row: MatchCoach;
        Insert: MatchCoachInput;
        Update: MatchCoachUpdate;
      };
      match_supports: {
        Row: MatchSupport;
        Insert: Omit<MatchSupport, 'support_id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MatchSupport, 'support_id'>>;
      };
      community_posts: {
        Row: CommunityPost;
        Insert: CommunityPostInput;
        Update: CommunityPostUpdate;
      };
      post_comments: {
        Row: PostComment;
        Insert: PostCommentInput;
        Update: PostCommentUpdate;
      };
      post_likes: {
        Row: PostLike;
        Insert: PostLikeInput;
        Update: never; // 좋아요는 업데이트 없음
      };
      comment_likes: {
        Row: CommentLike;
        Insert: CommentLikeInput;
        Update: never; // 좋아요는 업데이트 없음
      };
      mvp_votes: {
        Row: MvpVote;
        Insert: MvpVoteInput;
        Update: MvpVoteUpdate;
      };
      match_predictions: {
        Row: MatchPrediction;
        Insert: MatchPredictionInput;
        Update: MatchPredictionUpdate;
      };
      user_points: {
        Row: UserPoint;
        Insert: UserPointInput;
        Update: never; // 포인트는 업데이트 없음
      };
      user_badges: {
        Row: UserBadge;
        Insert: UserBadgeInput;
        Update: UserBadgeUpdate;
      };
      community_events: {
        Row: CommunityEvent;
        Insert: CommunityEventInput;
        Update: CommunityEventUpdate;
      };
      event_participations: {
        Row: EventParticipation;
        Insert: EventParticipationInput;
        Update: EventParticipationUpdate;
      };
      user_notifications: {
        Row: UserNotification;
        Insert: UserNotificationInput;
        Update: UserNotificationUpdate;
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never } & {
      season_category:
        | 'G_LEAGUE'
        | 'SUPER_LEAGUE'
        | 'CHALLENGE_LEAGUE'
        | 'PLAYOFF'
        | 'SBS_CUP'
        | 'GIFA_CUP'
        | 'CHAMPION_MATCH'
        | 'OTHER';
    };
    CompositeTypes: { [_ in never]: never };
  };
}

// Internal schema (read-only via service role)
export interface InternalSchema {
  internal: {
    Tables: {
      coach_season_stats_mv: {
        Row: {
          coach_id: number;
          season_id: number;
          season_name: string | null;
          matches_played: number | null;
          wins: number | null;
          losses: number | null;
          goals_for: number | null;
          goals_against: number | null;
          position: number | null;
          teams_detailed: unknown;
        };
      };
    };
  };
}
