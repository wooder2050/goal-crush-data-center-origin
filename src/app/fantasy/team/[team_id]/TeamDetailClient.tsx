'use client';

import { ArrowLeft, Share2, Target, TrendingUp, Trophy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import FootballPitch from '@/features/fantasy/components/FootballPitch';
import { PlayerWithPosition } from '@/types/fantasy';

// 시즌 통계를 포함한 선수 타입 (옵셔널)
interface PlayerWithOptionalStats extends PlayerWithPosition {
  season_stats?: {
    goals: number;
    assists: number;
    matches_played: number;
  };
}

interface TeamDetailClientProps {
  fantasyTeam: {
    team_name: string | null;
    total_points: number;
    rank_position: number;
    total_teams: number;
  };
  user: {
    name: string;
    avatar?: string;
  };
  fantasySeason: {
    fantasy_season_id: number;
  };
  players: PlayerWithOptionalStats[];
}

export default function TeamDetailClient({
  fantasyTeam,
  user,
  fantasySeason,
  players,
}: TeamDetailClientProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const getRankBadge = () => {
    if (fantasyTeam.rank_position === 1)
      return { text: '1위', color: 'bg-yellow-500 text-white' };
    if (fantasyTeam.rank_position === 2)
      return { text: '2위', color: 'bg-gray-400 text-white' };
    if (fantasyTeam.rank_position === 3)
      return { text: '3위', color: 'bg-amber-600 text-white' };
    if (fantasyTeam.rank_position <= 10)
      return { text: 'TOP 10', color: 'bg-blue-500 text-white' };
    return {
      text: `${fantasyTeam.rank_position}위`,
      color: 'bg-gray-600 text-white',
    };
  };

  const rankBadge = getRankBadge();

  // 현재 URL 가져오기
  const getCurrentUrl = () => {
    return typeof window !== 'undefined' ? window.location.href : '';
  };

  // 클립보드 복사
  const copyToClipboard = async () => {
    try {
      const shareText = `${user.name}님의 판타지 축구 팀을 확인해보세요! ${fantasyTeam.rank_position}위 (${fantasyTeam.total_points}점)`;
      const textToCopy = `${shareText}\n${getCurrentUrl()}`;
      await navigator.clipboard.writeText(textToCopy);
      toast.success('링크가 클립보드에 복사되었습니다.');
      setIsShareModalOpen(false);
    } catch (error) {
      console.error('클립보드 복사 중 오류:', error);
      toast.error('클립보드 복사 중 오류가 발생했습니다.');
    }
  };

  // 공유 모달 열기
  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  return (
    <Container className="py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link href={`/fantasy/${fantasySeason.fantasy_season_id}/rankings`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              랭킹으로 돌아가기
            </Button>
          </Link>
          <Button onClick={handleShare} variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />팀 공유하기
          </Button>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Trophy className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {fantasyTeam.team_name || `${user.name}님의 팀`}
            </h1>
          </div>
          <p className="text-gray-600 mb-2">골때녀 판타지 축구</p>
          <div className="flex items-center justify-center space-x-4">
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${rankBadge.color}`}
            >
              {rankBadge.text}
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {fantasyTeam.total_points}
              </div>
              <p className="text-sm text-gray-600">총 획득 점수</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {fantasyTeam.total_teams}팀 중 {fantasyTeam.rank_position}위
          </p>
        </div>
      </div>

      {/* 매니저 정보 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            <span>매니저</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {user.avatar ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden">
                <Image
                  src={user.avatar}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-600">
                  {user.name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user.name}
              </h3>
              <p className="text-gray-600">매니저</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 선수 카드들 */}
      <div className="space-y-6">
        {/* 경기장 레이아웃 */}
        <Card>
          <CardHeader>
            <CardTitle>경기장 배치</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-6 rounded-lg">
              <FootballPitch
                players={players as PlayerWithPosition[]}
                onPlayerClick={() => {}} // 읽기 전용
                allowPositionChange={false}
                className="max-w-2xl mx-auto"
              />
            </div>
          </CardContent>
        </Card>

        {/* 팀 구성 통계 */}
        <Card>
          <CardHeader>
            <CardTitle>팀 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 팀별 선수 수 */}
              <div>
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-blue-600" />
                  <span>팀별 구성</span>
                </h4>
                <div className="space-y-2">
                  {Object.entries(
                    players.reduce(
                      (acc) => {
                        // player에서 현재 팀 정보를 가져올 수 없으므로 기본값 사용
                        const teamName = '선수';
                        acc[teamName] = (acc[teamName] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>
                    )
                  ).map(([teamName, count]) => (
                    <div
                      key={teamName}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-600">총 선수</span>
                      <Badge variant="outline">{count}명</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* 통계 요약 */}
              <div>
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <Target className="w-4 h-4 text-green-600" />
                  <span>선수 통계</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center space-x-1">
                      <Target className="w-3 h-3" />
                      <span>총 골</span>
                    </span>
                    <Badge variant="outline">
                      {players.reduce(
                        (sum, p) => sum + (p.season_stats?.goals || 0),
                        0
                      )}
                      골
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>총 어시스트</span>
                    </span>
                    <Badge variant="outline">
                      {players.reduce(
                        (sum, p) => sum + (p.season_stats?.assists || 0),
                        0
                      )}
                      어시
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">평균 출전</span>
                    <Badge variant="outline">
                      {Math.round(
                        players.reduce(
                          (sum, p) =>
                            sum + (p.season_stats?.matches_played || 0),
                          0
                        ) / players.length
                      )}
                      경기
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 참여 안내 */}
      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              당신도 판타지 축구에 참여해보세요!
            </h3>
            <p className="text-gray-600 mb-4">
              좋아하는 선수들로 나만의 드림팀을 구성하고 순위를 겨루어보세요.
            </p>
            <Link href="/fantasy">
              <Button size="lg" className="w-full sm:w-auto">
                <Trophy className="w-4 h-4 mr-2" />
                판타지 축구 시작하기
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 공유하기 모달 */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-gray-900">
              팀 공유하기
            </DialogTitle>
          </DialogHeader>

          {/* URL 표시 및 복사 */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-3">
              <input
                type="text"
                value={getCurrentUrl()}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-600 outline-none"
              />
              <Button
                onClick={copyToClipboard}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
              >
                복사
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
