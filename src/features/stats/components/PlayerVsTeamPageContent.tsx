'use client';

import { ArrowUpDown, Search, Target, Users } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import InfiniteSeasonSelect from '@/features/stats/components/InfiniteSeasonSelect';
import type {
  Player,
  PlayerVsTeamData,
  SortOption,
} from '@/features/stats/types';
import { useGoalQuery } from '@/hooks/useGoalQuery';

// API 함수들
async function fetchPlayers(searchTerm: string): Promise<Player[]> {
  if (!searchTerm) return [];
  const response = await fetch(
    `/api/players?name=${encodeURIComponent(searchTerm)}&limit=20`
  );
  if (!response.ok) throw new Error('Failed to fetch players');
  return response.json();
}

async function fetchPlayerVsTeamData(
  playerId: number,
  seasonId?: number
): Promise<PlayerVsTeamData> {
  const response = await fetch(
    `/api/stats/player-vs-team?player_id=${playerId}&season_id=${seasonId === undefined ? 'all' : seasonId}`
  );
  if (!response.ok) throw new Error('Failed to fetch player vs team data');
  return response.json();
}

export function PlayerVsTeamPageContent() {
  const [selectedSeason, setSelectedSeason] = useState<number | undefined>(
    undefined
  );
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('attack_points');

  // Fetch players with search
  const { data: playersData, isLoading: isLoadingPlayers } = useGoalQuery(
    fetchPlayers,
    [searchTerm],
    {
      enabled: searchTerm.length > 0,
    }
  );

  // Fetch player vs team data
  const { data: playerVsTeamData, isLoading: isLoadingPlayerVsTeam } =
    useGoalQuery(fetchPlayerVsTeamData, [selectedPlayer!, selectedSeason], {
      enabled: selectedPlayer !== null,
    });

  const handlePlayerSelect = (playerId: number) => {
    setSelectedPlayer(playerId);
  };

  // 정렬 함수
  const getSortedTeamRecords = (records: PlayerVsTeamData['team_records']) => {
    if (!records) return [];

    return [...records].sort((a, b) => {
      switch (sortBy) {
        case 'goals':
          return b.goals - a.goals;
        case 'assists':
          return b.assists - a.assists;
        case 'attack_points':
          return b.attack_points - a.attack_points;
        case 'goals_per_match':
          return parseFloat(b.goals_per_match) - parseFloat(a.goals_per_match);
        case 'assists_per_match':
          return (
            parseFloat(b.assists_per_match) - parseFloat(a.assists_per_match)
          );
        case 'attack_points_per_match':
          return (
            parseFloat(b.attack_points_per_match) -
            parseFloat(a.attack_points_per_match)
          );
        default:
          return b.attack_points - a.attack_points;
      }
    });
  };

  return (
    <Section padding="sm">
      <div className="max-w-7xl mx-auto">
        {/* 선수 선택 섹션 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              선수 선택
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 선수 검색 */}
              <div className="flex-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  선수 검색
                </label>
                <Input
                  placeholder="선수 이름을 입력하세요"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* 시즌 선택 */}
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시즌
                </label>
                <InfiniteSeasonSelect
                  value={selectedSeason}
                  onValueChange={setSelectedSeason}
                />
              </div>
            </div>

            {/* 선수 목록 */}
            {searchTerm && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {isLoadingPlayers ? (
                  <div className="col-span-full text-center py-8">
                    <div className="text-gray-500">검색 중...</div>
                  </div>
                ) : playersData && playersData.length > 0 ? (
                  playersData.map((player) => (
                    <Card
                      key={player.player_id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPlayer === player.player_id
                          ? 'ring-2 ring-primary'
                          : ''
                      }`}
                      onClick={() => handlePlayerSelect(player.player_id)}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                          {player.profile_image_url ? (
                            <Image
                              src={player.profile_image_url}
                              alt={player.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{player.name}</div>
                          {player.team && (
                            <div className="text-sm text-gray-500">
                              {player.team.team_name}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : searchTerm.length > 0 ? (
                  <div className="col-span-full text-center py-8">
                    <div className="text-gray-500">검색 결과가 없습니다.</div>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 선수 vs 팀 통계 결과 */}
        {selectedPlayer && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                <span className="font-bold text-primary">
                  {isLoadingPlayerVsTeam
                    ? '로딩 중...'
                    : playerVsTeamData?.player_name || '선수'}
                </span>
                <span>vs 팀별 상대 기록</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPlayerVsTeam ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">데이터를 불러오는 중...</div>
                </div>
              ) : playerVsTeamData?.team_records &&
                playerVsTeamData.team_records.length > 0 ? (
                <>
                  {/* 정렬 옵션 */}
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowUpDown className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      정렬:
                    </span>
                    <Select
                      value={sortBy}
                      onValueChange={(value: SortOption) => setSortBy(value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attack_points">
                          공격포인트 많은순
                        </SelectItem>
                        <SelectItem value="goals">골 많은순</SelectItem>
                        <SelectItem value="assists">도움 많은순</SelectItem>
                        <SelectItem value="attack_points_per_match">
                          경기당 공격포인트 많은순
                        </SelectItem>
                        <SelectItem value="goals_per_match">
                          경기당 골 많은순
                        </SelectItem>
                        <SelectItem value="assists_per_match">
                          경기당 도움 많은순
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 데스크톱 테이블 */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>상대 팀</TableHead>
                          <TableHead className="text-center">경기수</TableHead>
                          <TableHead className="text-center">골</TableHead>
                          <TableHead className="text-center">도움</TableHead>
                          <TableHead className="text-center">공격P</TableHead>
                          <TableHead className="text-center">
                            경기당 골
                          </TableHead>
                          <TableHead className="text-center">
                            경기당 도움
                          </TableHead>
                          <TableHead className="text-center">
                            경기당 공격P
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getSortedTeamRecords(
                          playerVsTeamData.team_records
                        ).map((record) => (
                          <TableRow key={record.opponent_team_id}>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-primary">
                                  {playerVsTeamData.player_name}
                                </span>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span>vs</span>
                                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                    {record.opponent_team_logo ? (
                                      <Image
                                        src={record.opponent_team_logo}
                                        alt={record.opponent_team_name}
                                        width={24}
                                        height={24}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Target className="h-3 w-3 text-gray-400" />
                                    )}
                                  </div>
                                  <span>{record.opponent_team_name}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {record.matches_played}
                            </TableCell>
                            <TableCell className="text-center font-semibold text-blue-600">
                              {record.goals}
                            </TableCell>
                            <TableCell className="text-center font-semibold text-green-600">
                              {record.assists}
                            </TableCell>
                            <TableCell className="text-center font-semibold text-primary">
                              {record.attack_points}
                            </TableCell>
                            <TableCell className="text-center text-sm text-gray-600">
                              {record.goals_per_match}
                            </TableCell>
                            <TableCell className="text-center text-sm text-gray-600">
                              {record.assists_per_match}
                            </TableCell>
                            <TableCell className="text-center text-sm text-gray-600">
                              {record.attack_points_per_match}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* 모바일 카드 형태 */}
                  <div className="md:hidden space-y-4">
                    {getSortedTeamRecords(playerVsTeamData.team_records).map(
                      (record) => (
                        <Card key={record.opponent_team_id} className="p-4">
                          <div className="mb-4">
                            <div className="font-bold text-lg text-primary mb-2">
                              {playerVsTeamData.player_name}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <span>vs</span>
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                {record.opponent_team_logo ? (
                                  <Image
                                    src={record.opponent_team_logo}
                                    alt={record.opponent_team_name}
                                    width={24}
                                    height={24}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Target className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                              <span>{record.opponent_team_name}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {record.matches_played}경기
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-blue-600">
                                {record.goals}
                              </div>
                              <div className="text-xs text-gray-500">골</div>
                              <div className="text-xs text-gray-400">
                                {record.goals_per_match}/경기
                              </div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-green-600">
                                {record.assists}
                              </div>
                              <div className="text-xs text-gray-500">도움</div>
                              <div className="text-xs text-gray-400">
                                {record.assists_per_match}/경기
                              </div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-primary">
                                {record.attack_points}
                              </div>
                              <div className="text-xs text-gray-500">공격P</div>
                              <div className="text-xs text-gray-400">
                                {record.attack_points_per_match}/경기
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    )}
                  </div>

                  {/* 총합 통계 */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">
                      전체 통계 요약
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {playerVsTeamData.team_records.reduce(
                            (sum, record) => sum + record.matches_played,
                            0
                          )}
                        </div>
                        <div className="text-sm text-gray-600">총 경기수</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {playerVsTeamData.team_records.reduce(
                            (sum, record) => sum + record.goals,
                            0
                          )}
                        </div>
                        <div className="text-sm text-gray-600">총 골</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {playerVsTeamData.team_records.reduce(
                            (sum, record) => sum + record.assists,
                            0
                          )}
                        </div>
                        <div className="text-sm text-gray-600">총 도움</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {playerVsTeamData.team_records.reduce(
                            (sum, record) => sum + record.attack_points,
                            0
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          총 공격포인트
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    해당 선수의 팀별 상대 기록이 없습니다.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 선수 미선택 상태 */}
        {!selectedPlayer && (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                선수를 선택해주세요
              </h3>
              <p className="text-gray-600">
                위의 검색창에서 선수 이름을 검색하고 선택하면
                <br />
                해당 선수의 팀별 상대 기록을 확인할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Section>
  );
}
