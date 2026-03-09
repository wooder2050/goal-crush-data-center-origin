'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Section,
} from '@/components/ui';
import { Button } from '@/components/ui/button';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';

import { CreatePostModal } from './CreatePostModal';

// 타입 정의
interface TeamCommunity {
  team_id: string;
  team_name: string;
  logo?: string | null;
  recent_posts_count: number;
  total_members: number;
  latest_post?: {
    id: string;
    title: string;
    content?: string | null;
    created_at: string;
    user_nickname: string;
  } | null;
}

interface CommunityPost {
  id: string;
  title: string;
  content?: string | null;
  created_at: string;
  updated_at: string;
  user_nickname: string;
  user_avatar?: string | null;
  likes_count: number;
  comments_count: number;
}

// API 함수들
const getTeamCommunity = async (
  teamId: string
): Promise<{ data: TeamCommunity }> => {
  const response = await fetch(apiUrl(`/api/community/team-communities/${teamId}`));

  if (!response.ok) {
    throw new Error('팀 커뮤니티 정보를 불러오는데 실패했습니다.');
  }

  const result = await response.json();
  return result;
};

// 고유한 쿼리 키 설정
getTeamCommunity.queryKey = 'team-community';

const getTeamCommunityPosts = async (
  teamId: string
): Promise<{ data: CommunityPost[] }> => {
  const response = await fetch(apiUrl(`/api/community/teams/${teamId}/posts?limit=20`));

  if (!response.ok) {
    throw new Error('팀 커뮤니티 게시글을 불러오는데 실패했습니다.');
  }

  const result = await response.json();
  return result;
};

// 고유한 쿼리 키 설정
getTeamCommunityPosts.queryKey = 'team-community-posts';

interface TeamCommunityDetailPageProps {
  teamId: string;
}

function TeamCommunityDetailPageContent({
  teamId,
}: TeamCommunityDetailPageProps) {
  console.log('TeamCommunityDetailPageContent 렌더링:', { teamId });

  const { data: teamResponse } = useGoalSuspenseQuery(getTeamCommunity, [
    teamId,
  ]);

  console.log('팀 응답:', teamResponse);

  // API 응답에서 team 데이터 추출
  const team = teamResponse?.data;

  console.log('팀 데이터:', team);

  const { data: postsResponse } = useGoalSuspenseQuery(getTeamCommunityPosts, [
    teamId,
  ]);

  console.log('게시글 응답:', postsResponse);

  // API 응답에서 posts 배열 추출
  const posts = postsResponse?.data || [];

  console.log('게시글 배열:', posts);

  // 게시글 작성 모달 상태
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  // 게시글 데이터가 로딩 중인 경우
  if (!postsResponse) {
    return (
      <Section padding="sm">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Link href="/community">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                커뮤니티로 돌아가기
              </Button>
            </Link>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">게시글을 불러오는 중...</p>
          </div>
        </div>
      </Section>
    );
  }

  // 데이터가 로딩 중인 경우
  if (!teamResponse) {
    return (
      <Section padding="sm">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Link href="/community">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                커뮤니티로 돌아가기
              </Button>
            </Link>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">팀 정보를 불러오는 중...</p>
          </div>
        </div>
      </Section>
    );
  }

  // 팀 데이터가 없는 경우
  if (!team) {
    return (
      <Section padding="sm">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Link href="/community">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                커뮤니티로 돌아가기
              </Button>
            </Link>
          </div>
          <div className="text-center py-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto animate-pulse" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  팀을 찾을 수 없습니다
                </h2>
                <p className="text-gray-500">
                  요청하신 팀 정보가 존재하지 않거나 삭제되었습니다.
                </p>
                <p className="text-sm text-gray-400">
                  다른 팀을 선택하거나 커뮤니티로 돌아가세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section padding="sm">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center space-x-4">
          <Link href="/community">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              커뮤니티로 돌아가기
            </Button>
          </Link>
        </div>

        {/* 팀 정보 카드 */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 relative rounded-full overflow-hidden bg-gray-100">
                {team.logo ? (
                  <Image
                    src={team.logo}
                    alt={`${team.team_name} 로고`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                    {team.team_name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <CardTitle className="text-2xl">{team.team_name}</CardTitle>
                <div className="flex items-center space-x-6 text-sm text-gray-500 mt-2">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>{team.recent_posts_count}개 글</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>{team.total_members}명</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 게시글 목록 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">최근 게시글</h2>
            <Link href={`/community/teams/${teamId}/posts`}>
              <Button variant="outline" size="sm">
                전체 보기
              </Button>
            </Link>
          </div>

          {!Array.isArray(posts) || posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto animate-pulse" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      아직 게시글이 없습니다
                    </h3>
                    <p className="text-gray-500">
                      이 팀의 첫 번째 게시글을 작성해보세요!
                    </p>
                    <p className="text-sm text-gray-400">
                      팀원들과 소통하고 정보를 공유할 수 있습니다.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setShowCreatePostModal(true)}
                  >
                    게시글 작성하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {Array.isArray(posts) &&
                posts.map((post: CommunityPost) => (
                  <Link key={post.id} href={`/community/posts/${post.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <h3 className="font-medium text-gray-900 line-clamp-2">
                            {post.title}
                          </h3>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{post.user_nickname}</span>
                            <span>
                              {format(
                                new Date(post.created_at),
                                'MM/dd HH:mm',
                                {
                                  locale: ko,
                                }
                              )}
                            </span>
                          </div>
                          {post.content && (
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {post.content}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* 게시글 작성 모달 */}
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
        teamId={teamId}
        teamName={team.team_name}
        onSuccess={() => {
          // 게시글 작성 성공 시 페이지 새로고침
          window.location.reload();
        }}
      />
    </Section>
  );
}

function TeamCommunityDetailPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center space-x-4">
        <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* 팀 정보 카드 스켈레톤 */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="flex space-x-6">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 게시글 목록 스켈레톤 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TeamCommunityDetailPage({
  teamId,
}: TeamCommunityDetailPageProps) {
  return (
    <GoalWrapper fallback={<TeamCommunityDetailPageSkeleton />}>
      <TeamCommunityDetailPageContent teamId={teamId} />
    </GoalWrapper>
  );
}
