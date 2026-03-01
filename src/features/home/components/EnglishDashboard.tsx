import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { getRatingBgColor } from '@/lib/utils';

import type {
  CareerStatRow,
  HomeMatch,
  HomePageData,
  HomeStanding,
  PlayerStatRow,
  StandingsGroup,
} from '../types';

/* ─── group name mapping ─── */
function translateGroupName(name: string): string {
  const map: Record<string, string> = {
    전체: 'Overall',
    A조: 'Group A',
    B조: 'Group B',
    C조: 'Group C',
    D조: 'Group D',
    '4강': 'Semi-finals',
    결승: 'Final',
  };
  return map[name] ?? name;
}

/* ─── career stat key type ─── */
type CareerStatKey =
  | 'goals'
  | 'assists'
  | 'goals_per_match'
  | 'assists_per_match'
  | 'attack_points'
  | 'attack_points_per_match';

/* ═══════════════════════════════════════════
   Main Dashboard
   ═══════════════════════════════════════════ */
export function EnglishDashboard({ data }: { data: HomePageData }) {
  return (
    <section className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Season Header */}
        <h1 className="text-lg font-bold text-gray-900 mb-1">
          {data.currentSeason.season_name}
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          SBS Kick a Goal — Current Season
        </p>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-4">
            <StandingsSection standings={data.standings} />
            <PlayerRankingsSection
              topScorers={data.topScorers}
              topAssists={data.topAssists}
              topRatings={data.topRatings}
            />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-4">
            <MatchesSection
              recentMatches={data.recentMatches}
              upcomingMatches={data.upcomingMatches}
            />
            <CareerRecordsSection
              careerTopScorers={data.careerTopScorers}
              careerTopAssists={data.careerTopAssists}
              careerGoalsPerMatch={data.careerGoalsPerMatch}
              careerAssistsPerMatch={data.careerAssistsPerMatch}
              careerAttackPoints={data.careerAttackPoints}
              careerAttackPointsPerMatch={data.careerAttackPointsPerMatch}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   Standings
   ═══════════════════════════════════════════ */
function StandingsSection({ standings }: { standings: StandingsGroup[] }) {
  const hasData = standings.some((g) => g.standings.length > 0);

  if (!hasData) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            No standings data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasMultipleGroups = standings.length > 1;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Standings</CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-6 pb-4">
        <div className="space-y-4">
          {standings.map((group) => (
            <div key={group.group_name}>
              {hasMultipleGroups && (
                <h3 className="text-sm font-semibold text-gray-700 px-3 sm:px-0 mb-2">
                  {translateGroupName(group.group_name)}
                </h3>
              )}
              <StandingsTable standings={group.standings} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StandingsTable({ standings }: { standings: HomeStanding[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-sm text-gray-500">
            <th className="text-center py-2.5 px-3 w-10">#</th>
            <th className="text-left py-2.5 px-3">Team</th>
            <th className="text-center py-2.5 px-2 hidden sm:table-cell">P</th>
            <th className="text-center py-2.5 px-2 hidden sm:table-cell">W</th>
            <th className="text-center py-2.5 px-2 hidden sm:table-cell">L</th>
            <th className="text-center py-2.5 px-2">GD</th>
            <th className="text-center py-2.5 px-2 font-bold">Pts</th>
            <th className="text-left py-2.5 px-2">Form</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => (
            <tr
              key={s.standing_id}
              className="border-b border-gray-100 last:border-0"
            >
              <td className="text-center py-2.5 px-3 text-sm font-medium text-gray-500">
                {s.position}
              </td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  {s.team?.logo && (
                    <div className="w-6 h-6 relative flex-shrink-0 rounded-full overflow-hidden">
                      <Image
                        src={s.team.logo}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="24px"
                      />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-800 truncate max-w-[120px] sm:max-w-none">
                    {s.team?.team_name}
                  </span>
                </div>
              </td>
              <td className="text-center py-2.5 px-2 text-sm text-gray-600 hidden sm:table-cell">
                {s.matches_played ?? 0}
              </td>
              <td className="text-center py-2.5 px-2 text-sm text-gray-600 hidden sm:table-cell">
                {s.wins ?? 0}
              </td>
              <td className="text-center py-2.5 px-2 text-sm text-gray-600 hidden sm:table-cell">
                {s.losses ?? 0}
              </td>
              <td className="text-center py-2.5 px-2 text-sm text-gray-600">
                {(s.goal_difference ?? 0) > 0
                  ? `+${s.goal_difference}`
                  : (s.goal_difference ?? 0)}
              </td>
              <td className="text-center py-2.5 px-2 text-sm font-bold text-gray-900">
                {s.points ?? 0}
              </td>
              <td className="py-2.5 px-2">
                <FormIndicator form={s.form} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormIndicator({ form }: { form: string | null }) {
  if (!form) return null;
  return (
    <div className="flex items-center gap-1">
      {form.split('').map((char, i) => (
        <span
          key={i}
          className={`w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center ${
            char === 'W' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Player Rankings (Season)
   ═══════════════════════════════════════════ */
function PlayerRankingsSection({
  topScorers,
  topAssists,
  topRatings,
}: {
  topScorers: PlayerStatRow[];
  topAssists: PlayerStatRow[];
  topRatings: PlayerStatRow[];
}) {
  const hasRatings = topRatings.length > 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Season Player Rankings</CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4">
        <div
          className={`grid gap-4 ${hasRatings ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}
        >
          {hasRatings && (
            <PlayerColumn
              title="Top Rating"
              players={topRatings}
              statKey="avg_rating"
            />
          )}
          <PlayerColumn
            title="Top Scorers"
            players={topScorers}
            statKey="goals"
          />
          <PlayerColumn
            title="Top Assists"
            players={topAssists}
            statKey="assists"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function PlayerColumn({
  title,
  players,
  statKey,
}: {
  title: string;
  players: PlayerStatRow[];
  statKey: 'goals' | 'assists' | 'avg_rating';
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      {players.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No data available.
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {players.slice(0, 5).map((player, index) => (
            <PlayerRow
              key={player.player_id ?? index}
              player={player}
              rank={index + 1}
              statKey={statKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerRow({
  player,
  rank,
  statKey,
}: {
  player: PlayerStatRow;
  rank: number;
  statKey: 'goals' | 'assists' | 'avg_rating';
}) {
  const statValue =
    statKey === 'avg_rating'
      ? (player.avg_rating?.toFixed(1) ?? '0')
      : String(player[statKey] ?? 0);

  const isFirst = rank === 1;
  const teamColor = player.team_primary_color;
  const teamSecondaryColor = player.team_secondary_color;

  const content = (
    <>
      <span className="w-4 text-xs font-bold text-gray-400 text-center flex-shrink-0">
        {rank}
      </span>
      <div className="flex-shrink-0">
        {player.player_image ? (
          <div className="w-8 h-8 relative rounded-full overflow-hidden">
            <Image
              src={player.player_image}
              alt=""
              fill
              className="object-cover"
              sizes="32px"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xs text-gray-400">?</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate group-hover:text-[#ff4800] transition-colors">
          {player.player_name}
        </div>
        <div className="text-[11px] text-gray-400 truncate">
          {player.team_name}
        </div>
      </div>
      {statKey === 'avg_rating' ? (
        <span
          className={`flex-shrink-0 inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-bold text-white ${getRatingBgColor(player.avg_rating ?? 0)}`}
        >
          {statValue}
        </span>
      ) : isFirst && teamColor ? (
        <span
          className="flex-shrink-0 inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 text-xs font-semibold rounded-full"
          style={{
            backgroundColor: teamColor,
            color: teamSecondaryColor ?? '#FFFFFF',
          }}
        >
          {statValue}
        </span>
      ) : (
        <span className="flex-shrink-0 text-sm font-bold text-gray-900 tabular-nums">
          {statValue}
        </span>
      )}
    </>
  );

  if (!player.player_id) {
    return <div className="flex items-center gap-2 py-2">{content}</div>;
  }

  return (
    <Link
      href={`/players/${player.player_id}`}
      className="flex items-center gap-2 py-2 group"
    >
      {content}
    </Link>
  );
}

/* ═══════════════════════════════════════════
   Matches
   ═══════════════════════════════════════════ */
function MatchesSection({
  recentMatches,
  upcomingMatches,
}: {
  recentMatches: HomeMatch[];
  upcomingMatches: HomeMatch[];
}) {
  const hasNoMatches =
    recentMatches.length === 0 && upcomingMatches.length === 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Matches</CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4">
        {hasNoMatches ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No match data available.
          </p>
        ) : (
          <div className="space-y-1">
            {recentMatches.length > 0 && (
              <>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 py-1.5">
                  Recent Results
                </div>
                {recentMatches.map((match) => (
                  <CompletedMatchRow key={match.match_id} match={match} />
                ))}
              </>
            )}
            {upcomingMatches.length > 0 && (
              <>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 py-1.5 mt-2">
                  Upcoming Matches
                </div>
                {upcomingMatches.map((match) => (
                  <UpcomingMatchRow key={match.match_id} match={match} />
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CompletedMatchRow({ match }: { match: HomeMatch }) {
  const hasPenalty =
    match.penalty_home_score != null && match.penalty_away_score != null;
  const tied =
    match.home_score != null &&
    match.away_score != null &&
    match.home_score === match.away_score;
  const homeWin =
    match.home_score != null &&
    match.away_score != null &&
    (match.home_score > match.away_score ||
      (tied &&
        hasPenalty &&
        match.penalty_home_score! > match.penalty_away_score!));
  const awayWin =
    match.home_score != null &&
    match.away_score != null &&
    (match.away_score > match.home_score ||
      (tied &&
        hasPenalty &&
        match.penalty_away_score! > match.penalty_home_score!));

  return (
    <Link
      href={`/matches/${match.match_id}`}
      className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
    >
      <span className="text-xs text-gray-400 w-7 flex-shrink-0 text-center">
        FT
      </span>
      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
        <span
          className={`text-xs sm:text-sm truncate ${homeWin ? 'font-bold text-gray-900' : 'text-gray-600'}`}
        >
          {match.home_team?.team_name}
        </span>
        {match.home_team?.logo && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 rounded-full overflow-hidden">
            <Image
              src={match.home_team.logo}
              alt=""
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
        )}
      </div>
      <div className="flex-shrink-0 w-12 sm:w-14 text-center">
        <span className="text-xs sm:text-sm font-bold text-gray-900">
          {match.home_score ?? 0} - {match.away_score ?? 0}
        </span>
        {hasPenalty && (
          <div className="text-[10px] text-gray-400 leading-tight">
            PK {match.penalty_home_score}-{match.penalty_away_score}
          </div>
        )}
      </div>
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        {match.away_team?.logo && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 rounded-full overflow-hidden">
            <Image
              src={match.away_team.logo}
              alt=""
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
        )}
        <span
          className={`text-xs sm:text-sm truncate ${awayWin ? 'font-bold text-gray-900' : 'text-gray-600'}`}
        >
          {match.away_team?.team_name}
        </span>
      </div>
    </Link>
  );
}

function UpcomingMatchRow({ match }: { match: HomeMatch }) {
  const dateStr = format(new Date(match.match_date), 'MMM d', {
    locale: enUS,
  });
  const timeStr = format(new Date(match.match_date), 'HH:mm');

  return (
    <Link
      href={`/matches/${match.match_id}`}
      className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-gray-50 transition-colors"
    >
      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
        <span className="text-xs sm:text-sm font-medium text-gray-800 truncate">
          {match.home_team?.team_name}
        </span>
        {match.home_team?.logo && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 rounded-full overflow-hidden">
            <Image
              src={match.home_team.logo}
              alt=""
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
        )}
      </div>
      <div className="flex-shrink-0 w-14 sm:w-16 text-center">
        <div className="text-[10px] sm:text-xs text-gray-400">{dateStr}</div>
        <div className="text-xs sm:text-sm font-medium text-gray-600">
          {timeStr}
        </div>
      </div>
      <div className="flex-1 flex items-center gap-1.5 min-w-0">
        {match.away_team?.logo && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 rounded-full overflow-hidden">
            <Image
              src={match.away_team.logo}
              alt=""
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
        )}
        <span className="text-xs sm:text-sm font-medium text-gray-800 truncate">
          {match.away_team?.team_name}
        </span>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════
   Career Records (All-Time)
   ═══════════════════════════════════════════ */
function CareerRecordsSection({
  careerTopScorers,
  careerTopAssists,
  careerGoalsPerMatch,
  careerAssistsPerMatch,
  careerAttackPoints,
  careerAttackPointsPerMatch,
}: {
  careerTopScorers: CareerStatRow[];
  careerTopAssists: CareerStatRow[];
  careerGoalsPerMatch: CareerStatRow[];
  careerAssistsPerMatch: CareerStatRow[];
  careerAttackPoints: CareerStatRow[];
  careerAttackPointsPerMatch: CareerStatRow[];
}) {
  const hasData =
    careerTopScorers.length > 0 ||
    careerTopAssists.length > 0 ||
    careerAttackPoints.length > 0;

  if (!hasData) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">All-Time Career Records</CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4 space-y-6">
        {/* Goals */}
        {(careerTopScorers.length > 0 || careerGoalsPerMatch.length > 0) && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Goals
            </h3>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <CareerColumn
                title="Career Goals"
                players={careerTopScorers}
                statKey="goals"
              />
              <CareerColumn
                title="Goals per Match"
                players={careerGoalsPerMatch}
                statKey="goals_per_match"
                subtitle="min. 10 matches"
              />
            </div>
          </div>
        )}

        {/* Assists */}
        {(careerTopAssists.length > 0 || careerAssistsPerMatch.length > 0) && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Assists
            </h3>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <CareerColumn
                title="Career Assists"
                players={careerTopAssists}
                statKey="assists"
              />
              <CareerColumn
                title="Assists per Match"
                players={careerAssistsPerMatch}
                statKey="assists_per_match"
                subtitle="min. 10 matches"
              />
            </div>
          </div>
        )}

        {/* Attack Points */}
        {(careerAttackPoints.length > 0 ||
          careerAttackPointsPerMatch.length > 0) && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Attack Points
            </h3>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <CareerColumn
                title="Career Attack Pts"
                players={careerAttackPoints}
                statKey="attack_points"
              />
              <CareerColumn
                title="Attack Pts / Match"
                players={careerAttackPointsPerMatch}
                statKey="attack_points_per_match"
                subtitle="min. 10 matches"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CareerColumn({
  title,
  players,
  statKey,
  subtitle,
}: {
  title: string;
  players: CareerStatRow[];
  statKey: CareerStatKey;
  subtitle?: string;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">
        {title}
        {subtitle && (
          <span className="text-[10px] font-normal text-gray-400 ml-1">
            ({subtitle})
          </span>
        )}
      </h4>
      {players.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No data available.
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {players.slice(0, 5).map((player, index) => (
            <CareerPlayerRow
              key={player.player_id}
              player={player}
              rank={index + 1}
              statKey={statKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CareerPlayerRow({
  player,
  rank,
  statKey,
}: {
  player: CareerStatRow;
  rank: number;
  statKey: CareerStatKey;
}) {
  const isPerMatch =
    statKey === 'goals_per_match' ||
    statKey === 'assists_per_match' ||
    statKey === 'attack_points_per_match';
  const statValue = isPerMatch
    ? (player[statKey]?.toFixed(2) ?? '0.00')
    : String(player[statKey] ?? 0);

  const isFirst = rank === 1;
  const teamColor = player.team_primary_color;
  const teamSecondaryColor = player.team_secondary_color;

  return (
    <Link
      href={`/players/${player.player_id}`}
      className="flex items-center gap-2 py-2 group"
    >
      <span className="w-4 text-xs font-bold text-gray-400 text-center flex-shrink-0">
        {rank}
      </span>
      <div className="flex-shrink-0">
        {player.player_image ? (
          <div className="w-8 h-8 relative rounded-full overflow-hidden">
            <Image
              src={player.player_image}
              alt=""
              fill
              className="object-cover"
              sizes="32px"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xs text-gray-400">?</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate group-hover:text-[#ff4800] transition-colors">
          {player.player_name}
        </div>
        <div className="text-[11px] text-gray-400 truncate">
          {player.team_name}
        </div>
      </div>
      {isFirst && teamColor ? (
        <span
          className="flex-shrink-0 inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 text-xs font-semibold rounded-full"
          style={{
            backgroundColor: teamColor,
            color: teamSecondaryColor ?? '#FFFFFF',
          }}
        >
          {statValue}
        </span>
      ) : (
        <span className="flex-shrink-0 text-sm font-bold text-gray-900 tabular-nums">
          {statValue}
        </span>
      )}
    </Link>
  );
}
