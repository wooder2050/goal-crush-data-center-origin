'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PassMap } from '@/features/event-actions/components/PassMap';

interface PlayerPosition {
  player_id: number;
  player_name: string;
  jersey_number: number;
  avg_x: number;
  avg_y: number;
  total_passes: number;
  success_passes: number;
}

interface PassConnection {
  from_jersey: number;
  to_jersey: number;
  count: number;
}

interface TeamPassNetworkData {
  team_id: number;
  team_name: string;
  primary_color: string;
  secondary_color: string;
  players: PlayerPosition[];
  connections: PassConnection[];
  total_passes: number;
  success_passes: number;
}

interface MatchInfo {
  match_id: number;
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
}

export default function PassMapPage() {
  const params = useParams();
  const matchId = Number(params.matchId);

  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [teamsData, setTeamsData] = useState<TeamPassNetworkData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);

        // 경기 정보 가져오기
        const matchRes = await fetch(`/api/admin/matches/${matchId}`);
        if (!matchRes.ok) throw new Error('경기 정보를 불러올 수 없습니다.');
        const matchData = await matchRes.json();
        setMatchInfo({
          match_id: matchData.match_id,
          home_team_name: matchData.home_team?.team_name || '홈팀',
          away_team_name: matchData.away_team?.team_name || '원정팀',
          home_score: matchData.home_score || 0,
          away_score: matchData.away_score || 0,
        });

        // 패스 네트워크 데이터 가져오기
        const passRes = await fetch(
          `/api/admin/matches/${matchId}/actions/pass-map`
        );
        if (!passRes.ok) throw new Error('패스 데이터를 불러올 수 없습니다.');
        const passData = await passRes.json();
        setTeamsData(passData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    if (matchId) {
      fetchData();
    }
  }, [matchId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/matches/record/${matchId}`}>
            <Button variant="outline" size="sm">
              ← 돌아가기
            </Button>
          </Link>
          <h1 className="text-xl font-bold">패스 네트워크 분석</h1>
        </div>
        {matchInfo && (
          <div className="text-sm text-gray-600">
            {matchInfo.home_team_name} {matchInfo.home_score} -{' '}
            {matchInfo.away_score} {matchInfo.away_team_name}
          </div>
        )}
      </div>

      {/* 패스맵 그리드 */}
      {teamsData.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            패스 데이터가 없습니다. 이벤트 기록 페이지에서 데이터를
            입력해주세요.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teamsData.map((teamData) => {
            // 팀 색상은 API에서 받아온 팀 고유 색상 사용
            const isHomeTeam = matchInfo?.home_team_name === teamData.team_name;
            const primaryColor = teamData.primary_color || '#3b82f6';
            const secondaryColor = teamData.secondary_color || '#FFFFFF';

            return (
              <Card key={teamData.team_id}>
                <CardHeader className="pb-2">
                  <CardTitle
                    className="text-base"
                    style={{ color: primaryColor }}
                  >
                    {teamData.team_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PassMap
                    players={teamData.players}
                    connections={teamData.connections}
                    teamName={teamData.team_name}
                    totalPasses={teamData.total_passes}
                    successPasses={teamData.success_passes}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                    isHomeTeam={isHomeTeam}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 범례 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6 text-xs text-gray-600">
            <span className="font-medium">범례:</span>
            <span className="flex items-center gap-1">
              <span
                className="w-6 h-1 inline-block rounded"
                style={{ backgroundColor: '#3b82f6' }}
              />
              패스 연결 (두꺼울수록 많은 패스)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-blue-500 inline-block" />
              선수 평균 위치 (클수록 많은 패스 시도)
            </span>
            <span className="text-gray-400">|</span>
            <span>공격 방향: 위 → 아래</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
