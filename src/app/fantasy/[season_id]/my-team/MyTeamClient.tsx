'use client';

import { ArrowLeft, Edit3, Share2, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
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
import { MyTeamClientProps } from '@/types/fantasy';

export default function MyTeamClient({
  seasonId,
  fantasyTeam,
  players,
  isLocked,
}: Omit<MyTeamClientProps, 'fantasySeason'>) {
  console.log('players', players);
  const pitchRef = useRef<HTMLDivElement>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // 현재 URL 가져오기
  const getCurrentUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/fantasy/team/${fantasyTeam.fantasy_team_id}`;
    }
    return '';
  };

  // 클립보드 복사
  const copyToClipboard = async () => {
    try {
      const shareText = `${fantasyTeam.team_name || '내 팀'} 포메이션을 확인해보세요! 총 점수: ${fantasyTeam.total_points}점`;
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
  const handleShareFormation = () => {
    setIsShareModalOpen(true);
  };

  return (
    <Container className="py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/fantasy">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
          </Link>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {fantasyTeam.team_name || '내 팀'}
            </h1>
            <p className="text-sm text-gray-500">
              총 점수:{' '}
              <span className="font-bold text-lg text-gray-900">
                {fantasyTeam.total_points}점
              </span>
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            {!isLocked && (
              <Link href={`/fantasy/${seasonId}/edit-team`}>
                <Button>
                  <Edit3 className="w-4 h-4 mr-2" />팀 수정
                </Button>
              </Link>
            )}
            <Link href={`/fantasy/${seasonId}/rankings`}>
              <Button variant="outline">
                <Trophy className="w-4 h-4 mr-2" />
                랭킹 보기
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 선수 카드들 */}
      <div className="space-y-6">
        {/* 경기장 레이아웃 */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>경기장 배치</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareFormation}
              >
                <Share2 className="w-4 h-4 mr-2" />
                공유하기
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={pitchRef} className="bg-white p-6 rounded-lg">
              {/* 공유 이미지용 헤더 */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {fantasyTeam.team_name || '내 팀'}
                </h2>
                <p className="text-gray-600 mb-2">골때녀 판타지 축구</p>
                <p className="text-lg font-semibold text-green-600">
                  총 점수: {fantasyTeam.total_points}점
                </p>
              </div>

              <FootballPitch
                players={players}
                onPlayerClick={() => {}} // 읽기 전용
                allowPositionChange={false}
                className="max-w-2xl mx-auto"
              />

              {/* 공유 이미지용 워터마크 */}
              <div className="text-center mt-4">
                <p className="text-xs text-gray-400">Goal Crush Fantasy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 팀 구성 통계 */}
        <Card>
          <CardHeader>
            <CardTitle>팀 구성</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 팀별 선수 수 */}
              <div>
                <h4 className="font-medium mb-2">팀별 구성</h4>
                <div className="space-y-2">
                  {Object.entries(
                    players.reduce(
                      (acc, player) => {
                        if (player.current_team) {
                          const teamName = player.current_team.team_name;
                          acc[teamName] = (acc[teamName] || 0) + 1;
                        }
                        return acc;
                      },
                      {} as Record<string, number>
                    )
                  ).map(([teamName, count]) => (
                    <div
                      key={teamName}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-600">{teamName}</span>
                      <Badge variant="outline">{count}명</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* 통계 요약 */}
              <div>
                <h4 className="font-medium mb-2">선수 통계</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">총 골</span>
                    <Badge variant="outline">
                      {players.reduce(
                        (sum, p) => sum + (p.season_stats?.goals || 0),
                        0
                      )}
                      골
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">총 어시스트</span>
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

      {/* 공유하기 모달 */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-gray-900">
              포메이션 공유하기
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
