'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

import {
  getMatchRatingsPrisma,
  type PlayerMatchRating,
} from '../../api-prisma';
import { getPositionColor, getPositionText } from '../../lib/matchUtils';

interface Props {
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
}

// FotMob 스타일 평점 색상
function getRatingBgColor(rating: number): string {
  if (rating >= 9.0) return 'bg-[#14A0FF]';
  if (rating >= 7.0) return 'bg-[#33C771]';
  return 'bg-[#FF963F]';
}

// FotMob 스타일: 모든 평점에 흰색 텍스트
function getRatingTextColor(): string {
  return 'text-white';
}

function PlayerRatingRow({
  player,
  isBest,
}: {
  player: PlayerMatchRating;
  isBest: boolean;
}) {
  const posCode = getPositionText(player.position);

  return (
    <div className="flex items-center gap-2.5 py-1.5 border-b border-gray-100 last:border-0">
      {/* 프로필 이미지 (먼저, 더 크게) */}
      <div className="flex-shrink-0">
        {player.profile_image_url ? (
          <div className="relative h-9 w-9 overflow-hidden rounded-full">
            <Image
              src={player.profile_image_url}
              alt={player.player_name}
              fill
              sizes="36px"
              className="object-cover object-top"
            />
          </div>
        ) : (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
            {player.player_name.charAt(0)}
          </span>
        )}
      </div>

      {/* 선수 정보 (등번호 + 이름 + 포지션 한 줄) */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {player.jersey_number != null && (
            <span className="text-[11px] text-gray-400 font-medium">
              {player.jersey_number}
            </span>
          )}
          <Link
            href={`/players/${player.player_id}`}
            className="text-xs font-medium text-gray-900 hover:underline truncate"
          >
            {player.player_name}
          </Link>
          <span
            className={`text-[9px] px-1 py-0 rounded flex-shrink-0 ${getPositionColor(player.position)}`}
          >
            {posCode}
          </span>
        </div>
      </div>

      {/* 골/어시스트/카드 아이콘 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {player.goals > 0 &&
          Array.from({ length: player.goals }).map((_, i) => (
            <span key={`g${i}`} className="text-[10px]">
              ⚽
            </span>
          ))}
        {player.assists > 0 &&
          Array.from({ length: player.assists }).map((_, i) => (
            <span key={`a${i}`} className="text-[10px]">
              🎯
            </span>
          ))}
        {player.yellow_cards > 0 && <span className="text-[10px]">🟨</span>}
        {player.red_cards > 0 && <span className="text-[10px]">🟥</span>}
      </div>

      {/* 평점 배지 (오른쪽 끝) */}
      <div className="flex-shrink-0">
        <span
          className={`inline-flex items-center gap-0.5 rounded-xl px-1.5 py-0.5 text-xs font-bold ${getRatingBgColor(player.rating)} ${getRatingTextColor()}`}
        >
          {player.rating.toFixed(1)}
          {isBest && (
            <svg
              width="10"
              height="10"
              viewBox="0 0 13 13"
              className="inline-block"
            >
              <path
                d="M4.633.453a.5.5 0 01.95 0l.908 2.81a.5.5 0 00.475.345h2.953a.5.5 0 01.294.904L7.824 6.26a.5.5 0 00-.181.559l.908 2.81a.5.5 0 01-.769.559l-2.389-1.748a.5.5 0 00-.588 0L2.416 10.19a.5.5 0 01-.77-.559l.909-2.81a.5.5 0 00-.182-.56L.984 4.513a.5.5 0 01.294-.904h2.953a.5.5 0 00.475-.345L4.633.453z"
                fill="currentColor"
              />
            </svg>
          )}
        </span>
      </div>
    </div>
  );
}

function TeamRatingCard({
  teamName,
  teamLogo,
  players,
  bestPlayerId,
}: {
  teamName: string;
  teamLogo?: string | null;
  players: PlayerMatchRating[];
  bestPlayerId: number | null;
}) {
  if (players.length === 0) return null;

  return (
    <Card>
      <CardContent className="px-3 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          {teamLogo && (
            <div className="w-4 h-4 relative flex-shrink-0 rounded-full overflow-hidden">
              <Image
                src={teamLogo}
                alt={teamName}
                fill
                className="object-cover"
                sizes="16px"
              />
            </div>
          )}
          <h4 className="text-xs font-semibold text-gray-700">{teamName}</h4>
        </div>
        {players.map((p) => (
          <PlayerRatingRow
            key={p.player_id}
            player={p}
            isBest={p.player_id === bestPlayerId}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export default function MatchPlayerRatingsSection({
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
}: Props) {
  const { data } = useGoalSuspenseQuery(getMatchRatingsPrisma, [matchId]);

  if (!data || data.ratings.length === 0) return null;

  const homeRatings = data.ratings.filter((r) => r.team_id === homeTeamId);
  const awayRatings = data.ratings.filter((r) => r.team_id === awayTeamId);

  // 각 팀 최고 평점 선수 찾기
  // tie-break: 평점 > 골 > 어시스트
  const pickBest = (ratings: typeof homeRatings) =>
    ratings.length > 0
      ? ratings.reduce((best, r) => {
          if (r.rating !== best.rating)
            return r.rating > best.rating ? r : best;
          if (r.goals !== best.goals) return r.goals > best.goals ? r : best;
          return r.assists > best.assists ? r : best;
        }).player_id
      : null;
  const homeBestId = pickBest(homeRatings);
  const awayBestId = pickBest(awayRatings);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">⭐ 선수 평점</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TeamRatingCard
          teamName={homeTeamName}
          teamLogo={homeTeamLogo}
          players={homeRatings}
          bestPlayerId={homeBestId}
        />
        <TeamRatingCard
          teamName={awayTeamName}
          teamLogo={awayTeamLogo}
          players={awayRatings}
          bestPlayerId={awayBestId}
        />
      </div>
    </div>
  );
}
