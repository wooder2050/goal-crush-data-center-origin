'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Heart, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useMemo } from 'react';

import { GoalWrapper } from '@/common/GoalWrapper';
import { ScrollTrigger } from '@/common/ScrollTrigger';
import { useAuth } from '@/components/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGoalInfiniteQuery, useGoalQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';
import { authFetch } from '@/lib/auth-fetch';

interface CommunityPost {
  post_id: string;
  title: string;
  content: string | null;
  category: string;
  team_id?: string;
  team_name?: string;
  created_at: string;
  updated_at: string;
  user_nickname: string;
  user_profile_image?: string;
  comment_count: number;
  like_count: number;
}

interface CommunityPostsResponse {
  posts: CommunityPost[];
  nextPage?: number;
  hasNextPage: boolean;
}

interface Props {
  category?: string;
  teamId?: number;
  seasonId?: number;
  sortBy?: 'recent' | 'popular';
  limit?: number;
}

// API 함수들
const getCommunityPosts = async (
  page: number,
  limit: number,
  params: {
    category?: string;
    teamId?: number;
    seasonId?: number;
    sortBy?: 'recent' | 'popular';
  }
): Promise<CommunityPostsResponse> => {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (params.category) {
    searchParams.append('category', params.category);
  }
  if (params.teamId) {
    searchParams.append('team_id', params.teamId.toString());
  }
  if (params.seasonId) {
    searchParams.append('season_id', params.seasonId.toString());
  }

  const response = await fetch(apiUrl(`/api/community/posts?${searchParams}`));

  if (!response.ok) {
    throw new Error('게시글을 불러오는데 실패했습니다.');
  }

  const result = await response.json();

  // 새로운 API 응답 구조에 맞게 변환
  if (result.success && result.data) {
    return {
      posts: result.data.posts,
      nextPage: result.data.pagination.hasNextPage
        ? result.data.pagination.currentPage + 1
        : undefined,
      hasNextPage: result.data.pagination.hasNextPage,
    };
  }

  return result;
};

// 고유한 쿼리 키 설정
getCommunityPosts.queryKey = 'community-posts';

const getLikeStatus = async (
  postId: string,
  userId: string
): Promise<{ liked: boolean }> => {
  const response = await authFetch(
    `/api/community/posts/${postId}/like?userId=${userId}`
  );

  if (!response.ok) {
    throw new Error('좋아요 상태를 확인할 수 없습니다.');
  }

  const result = await response.json();
  return result.data;
};

// 고유한 쿼리 키 설정
getLikeStatus.queryKey = 'like-status';

function PostItem({ post }: { post: CommunityPost }) {
  const { user } = useAuth();

  // 로그인한 사용자의 좋아요 상태 조회
  const { data: likeStatus } = useGoalQuery(
    getLikeStatus,
    [post.post_id, user?.id || ''],
    {
      enabled: !!user?.id,
    }
  );

  const getCategoryBadge = (category: string) => {
    const badges = {
      general: { label: '일반', variant: 'default' as const },
      match: { label: '경기', variant: 'secondary' as const },
      team: { label: '팀', variant: 'outline' as const },
      data: { label: '데이터', variant: 'destructive' as const },
      prediction: { label: '예측', variant: 'default' as const },
    };
    return badges[category as keyof typeof badges] || badges.general;
  };

  const categoryBadge = getCategoryBadge(post.category);
  const isLiked = likeStatus?.liked || false;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* 프로필 이미지 */}
          <div className="w-10 h-10 relative flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
            {post.user_profile_image ? (
              <Image
                src={post.user_profile_image}
                alt={`${post.user_nickname} 프로필`}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-500 font-medium">
                {post.user_nickname.charAt(0)}
              </div>
            )}
          </div>

          {/* 게시글 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-medium text-sm text-gray-900">
                {post.user_nickname}
              </span>
              <Badge variant={categoryBadge.variant} className="text-xs">
                {categoryBadge.label}
              </Badge>
              {post.team_name && (
                <Badge variant="outline" className="text-xs">
                  {post.team_name}
                </Badge>
              )}
            </div>

            <Link href={`/community/posts/${post.post_id}`}>
              <h3 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer mb-2 line-clamp-2">
                {post.title}
              </h3>
            </Link>

            {post.content && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                {post.content}
              </p>
            )}

            {/* 게시글 메타 정보 */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <Heart
                    className={`w-3 h-3 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-500'}`}
                  />
                  <span>{post.like_count}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{post.comment_count}</span>
                </span>
              </div>
              <span>
                {format(new Date(post.created_at), 'MM/dd HH:mm', {
                  locale: ko,
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CommunityPostsListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-3 bg-gray-200 rounded w-8 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-8 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-8 animate-pulse" />
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CommunityPostsListContent({
  category,
  teamId,
  seasonId,
  sortBy = 'recent',
  limit = 10,
}: Props) {
  const PAGE_SIZE = limit;

  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useGoalInfiniteQuery(
    getCommunityPosts,
    ({ pageParam }) =>
      [
        pageParam as number,
        PAGE_SIZE,
        { category, teamId, seasonId, sortBy },
      ] as const,
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    }
  );

  const typedData = infiniteData as typeof infiniteData;
  const allPosts = useMemo(
    () => (typedData?.pages ?? []).flatMap((p) => p.posts),
    [typedData]
  );

  const isLoading =
    status === 'pending' && (typedData?.pages?.length ?? 0) === 0;
  const canFetchNext = hasNextPage && !isFetchingNextPage && !isLoading;

  const handleFetchNext = useCallback(() => {
    if (!canFetchNext) return;
    void fetchNextPage();
  }, [canFetchNext, fetchNextPage]);

  if (isLoading) {
    return <CommunityPostsListSkeleton />;
  }

  if (!allPosts || allPosts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">아직 게시글이 없습니다.</p>
          <p className="text-sm text-gray-400">
            첫 번째 게시글을 작성해보세요!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {allPosts.map((post) => (
        <PostItem key={post.post_id} post={post} />
      ))}

      {/* 무한 스크롤 트리거 */}
      {canFetchNext && (
        <>
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              onClick={handleFetchNext}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? '로딩 중...' : '더 보기'}
            </Button>
          </div>
          <ScrollTrigger updateOptions={handleFetchNext} />
        </>
      )}

      {isFetchingNextPage && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={`loading-${index}`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function CommunityPostsList(props: Props) {
  return (
    <GoalWrapper fallback={<CommunityPostsListSkeleton />}>
      <CommunityPostsListContent {...props} />
    </GoalWrapper>
  );
}
