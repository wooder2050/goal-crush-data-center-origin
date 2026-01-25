'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import FantasyTeamBuilder from '@/features/fantasy/components/FantasyTeamBuilder';

interface Player {
  player_id: number;
  name: string;
  profile_image_url?: string;
  jersey_number?: number;
  position?: 'GK' | 'DF' | 'MF' | 'FW';
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

interface FantasySeason {
  fantasy_season_id: number;
}

interface EditTeamClientProps {
  seasonId: number;
  fantasySeason: FantasySeason;
  availablePlayers: Player[];
  recommendedPlayers: Player[];
  initialSelectedPlayers: Player[];
  initialTeamName: string;
  teamId: number;
  isLocked: boolean;
}

export default function EditTeamClient({
  seasonId,
  availablePlayers,
  recommendedPlayers,
  initialSelectedPlayers,
  initialTeamName,
  teamId,
  isLocked,
}: Omit<EditTeamClientProps, 'fantasySeason'>) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href={`/fantasy/${seasonId}/my-team`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />내 팀으로 돌아가기
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            판타지 팀 수정하기
          </h1>
          <p className="text-gray-600">골때녀 판타지 축구</p>
          <p className="text-sm text-gray-500 mt-1">
            현재 팀 구성을 수정할 수 있습니다. 같은 팀에서 최대 2명까지 선택할
            수 있습니다.
          </p>
          {initialTeamName && (
            <p className="text-sm text-blue-600 mt-2 font-medium">
              현재 팀명: {initialTeamName}
            </p>
          )}
        </div>
      </div>

      {/* 팀 빌더 */}
      <FantasyTeamBuilder
        fantasySeasonId={seasonId}
        availablePlayers={availablePlayers}
        recommendedPlayers={recommendedPlayers}
        initialSelectedPlayers={initialSelectedPlayers}
        initialTeamName={initialTeamName}
        mode="edit"
        teamId={teamId}
        isLocked={isLocked}
      />
    </div>
  );
}
