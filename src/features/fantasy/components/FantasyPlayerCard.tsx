'use client';

import { Shield, Star, Target, TrendingUp } from 'lucide-react';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Player {
  player_id: number;
  name: string;
  profile_image_url?: string;
  jersey_number?: number;
  current_team?: {
    team_id: number;
    team_name: string;
    logo?: string;
    primary_color?: string;
    secondary_color?: string;
  };
  season_stats?: {
    goals: number;
    assists: number;
    matches_played: number;
  };
}

interface FantasyPlayerCardProps {
  player: Player;
  isSelected?: boolean;
  isRecommended?: boolean;
  recommendationScore?: number;
  points?: number;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function FantasyPlayerCard({
  player,
  isSelected = false,
  isRecommended = false,
  recommendationScore,
  points,
  onClick,
  disabled = false,
  className = '',
}: FantasyPlayerCardProps) {
  const stats = player.season_stats;
  const team = player.current_team;

  return (
    <Card
      className={`
        relative cursor-pointer transition-all duration-200 hover:shadow-md
        ${isSelected ? 'ring-2 ring-primary shadow-lg' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={disabled ? undefined : onClick}
    >
      <CardContent className="p-4">
        {/* 추천 배지 */}
        {isRecommended && (
          <div className="absolute -top-2 -right-2">
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800 border-yellow-300"
            >
              <Star className="w-3 h-3 mr-1" />
              추천
            </Badge>
          </div>
        )}

        {/* 선수 정보 */}
        <div className="flex items-start space-x-3">
          {/* 선수 사진 */}
          <div className="relative flex-shrink-0">
            <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-gray-100">
              {player.profile_image_url ? (
                <Image
                  src={player.profile_image_url}
                  alt={player.name}
                  fill
                  className="object-contain"
                  sizes="64px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Shield className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* 등번호 */}
            {player.jersey_number != null && (
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {player.jersey_number}
              </div>
            )}
          </div>

          {/* 선수 세부 정보 */}
          <div className="flex-1 min-w-0">
            {/* 이름 */}
            <h3 className="font-semibold text-sm text-gray-900 truncate">
              {player.name}
            </h3>

            {/* 팀 정보 */}
            {team && (
              <div className="flex items-center space-x-2 mt-1">
                {team.logo && (
                  <div className="relative w-4 h-4 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={team.logo}
                      alt={team.team_name}
                      fill
                      className="object-contain"
                      sizes="16px"
                    />
                  </div>
                )}
                <span className="text-xs text-gray-600 truncate">
                  {team.team_name}
                </span>
              </div>
            )}

            {/* 시즌 스탯 */}
            {stats && (
              <div className="flex flex-wrap gap-1 mt-2">
                <div className="flex items-center space-x-1">
                  <Target className="w-3 h-3 text-green-600 flex-shrink-0" />
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    {stats.goals}골
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3 text-blue-600 flex-shrink-0" />
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    {stats.assists}도움
                  </span>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {stats.matches_played}경기
                </div>
              </div>
            )}

            {/* 추천 점수 */}
            {recommendationScore && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  추천점수: {recommendationScore.toFixed(1)}
                </Badge>
              </div>
            )}

            {/* 획득 점수 */}
            {points !== undefined && (
              <div className="mt-2">
                <Badge
                  variant={points > 0 ? 'default' : 'secondary'}
                  className="text-xs whitespace-nowrap"
                >
                  {points > 0 ? '+' : ''}
                  {points}점
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* 선택 상태 표시 */}
        {isSelected && (
          <div className="absolute top-2 left-2">
            <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
