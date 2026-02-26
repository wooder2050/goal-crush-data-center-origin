'use client';

import {
  MessageCircle,
  PlusCircle,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { useAuth } from '@/components/AuthProvider';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import {
  CommunityPostsList,
  CommunityStats,
  CreatePostModal,
  HotTopics,
  MVPVoting,
  TeamCommunities,
} from '@/features/community/components';
import { ActivityLeaders } from '@/features/community/components/ActivityLeaders';
import { RecentBadges } from '@/features/community/components/RecentBadges';

export default function CommunityPageClient() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('hot');
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  return (
    <>
      {user && (
        <div className="text-center mb-8">
          <Button
            size="lg"
            className="px-6 py-3"
            onClick={() => setShowCreatePostModal(true)}
          >
            <PlusCircle className="w-5 h-5 mr-2" />글 작성하기
          </Button>
        </div>
      )}

      {/* 통계 카드 */}
      <GoalWrapper
        fallback={
          <div className="h-32 bg-gray-100 rounded-lg animate-pulse mb-8" />
        }
      >
        <CommunityStats />
      </GoalWrapper>

      {/* 메인 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 왼쪽: 게시글 목록 */}
        <div className="lg:col-span-2">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hot" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                인기글
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                최신글
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                팀별
              </TabsTrigger>
              <TabsTrigger value="mvp" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                MVP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hot" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">🔥 인기 게시글</h2>
                <GoalWrapper
                  fallback={
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-24 bg-gray-100 rounded-lg animate-pulse"
                        />
                      ))}
                    </div>
                  }
                >
                  <CommunityPostsList sortBy="popular" />
                </GoalWrapper>
              </div>
            </TabsContent>

            <TabsContent value="recent" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">📝 최신 게시글</h2>
                <GoalWrapper
                  fallback={
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-24 bg-gray-100 rounded-lg animate-pulse"
                        />
                      ))}
                    </div>
                  }
                >
                  <CommunityPostsList sortBy="recent" />
                </GoalWrapper>
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">⚽ 팀별 커뮤니티</h2>
                <GoalWrapper
                  fallback={
                    <div className="space-y-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-32 bg-gray-100 rounded-lg animate-pulse"
                        />
                      ))}
                    </div>
                  }
                >
                  <TeamCommunities />
                </GoalWrapper>
              </div>
            </TabsContent>

            <TabsContent value="mvp" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">🏆 MVP 투표</h2>
                <GoalWrapper
                  fallback={
                    <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
                  }
                >
                  <MVPVoting />
                </GoalWrapper>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 오른쪽: 사이드바 */}
        <div className="space-y-6">
          {/* 인기 토픽 */}
          <Card>
            <CardHeader className="pb-0 sm:pb-0">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                실시간 인기 토픽
              </CardTitle>
              <CardDescription>지금 가장 뜨거운 주제들</CardDescription>
            </CardHeader>
            <CardContent>
              <GoalWrapper
                fallback={
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-6 bg-gray-100 rounded animate-pulse"
                      />
                    ))}
                  </div>
                }
              >
                <HotTopics />
              </GoalWrapper>
            </CardContent>
          </Card>

          {/* 커뮤니티 가이드 */}
          <Card>
            <CardHeader className="pb-0 sm:pb-0">
              <CardTitle>커뮤니티 가이드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">
                <h4 className="font-medium text-gray-900 mb-2">
                  📝 글 작성 팁
                </h4>
                <ul className="space-y-1 text-xs">
                  <li>• 제목은 명확하고 구체적으로 작성해주세요</li>
                  <li>• 팀 관련 글은 해당 팀을 선택해주세요</li>
                  <li>• 존중하는 언어로 소통해주세요</li>
                </ul>
              </div>
              <div className="text-sm text-gray-600">
                <h4 className="font-medium text-gray-900 mb-2">
                  🏆 포인트 시스템
                </h4>
                <ul className="space-y-1 text-xs">
                  <li>• 게시글 작성: +10pt</li>
                  <li>• 댓글 작성: +5pt</li>
                  <li>• 좋아요 받기: +2pt</li>
                  <li>• MVP 투표: +5pt</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 최근 배지 획득자 */}
          <GoalWrapper
            fallback={
              <Card>
                <CardHeader className="pb-0 sm:pb-0">
                  <CardTitle>🏅 최근 배지 획득자</CardTitle>
                  <CardDescription>
                    활발한 커뮤니티 활동을 보여주는 팬들
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-16 bg-gray-100 rounded animate-pulse"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            }
          >
            <RecentBadges />
          </GoalWrapper>

          {/* 활발한 커뮤니티 활동 */}
          <GoalWrapper
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>🔥 활발한 커뮤니티 활동</CardTitle>
                  <CardDescription>
                    최근 30일간 가장 활발한 팬들
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-16 bg-gray-100 rounded animate-pulse"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            }
          >
            <ActivityLeaders />
          </GoalWrapper>
        </div>
      </div>

      {/* 게시글 작성 모달 */}
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
        teamId=""
        teamName=""
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
}
