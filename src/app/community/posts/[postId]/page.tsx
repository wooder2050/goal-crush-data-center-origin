'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowLeft, Heart, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

import { useGoalForm } from '@/common/form/useGoalForm';
import { GoalWrapper } from '@/common/GoalWrapper';
import { useAuth } from '@/components/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoalMutation } from '@/hooks/useGoalMutation';
import { useGoalQuery, useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { usePostViewTracking } from '@/hooks/usePostViewTracking';
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
  user_id: string;
  user_nickname: string;
  user_profile_image?: string;
  comment_count: number;
  like_count: number;
  views_count: number;
  is_liked?: boolean;
}

interface Comment {
  comment_id: number;
  content: string;
  created_at: string;
  user_nickname: string;
  user_profile_image?: string;
  is_deleted: boolean;
}

interface PostDetailResponse {
  post: CommunityPost;
  comments: Comment[];
}

// API 함수들
const getPostDetail = async (postId: string): Promise<PostDetailResponse> => {
  const response = await fetch(apiUrl(`/api/community/posts/${postId}`));

  if (!response.ok) {
    throw new Error('게시글을 불러오는데 실패했습니다.');
  }

  const result = await response.json();
  return result.data;
};

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

const toggleLike = async (params: {
  postId: string;
  userId: string;
  action: 'like' | 'unlike';
}): Promise<{ liked: boolean }> => {
  const response = await authFetch(`/api/community/posts/${params.postId}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: params.userId,
      action: params.action,
    }),
  });

  if (!response.ok) {
    throw new Error('좋아요 처리에 실패했습니다.');
  }

  const result = await response.json();
  return result.data;
};

const createComment = async (params: {
  postId: string;
  userId: string;
  content: string;
}): Promise<Comment> => {
  const response = await authFetch(
    `/api/community/posts/${params.postId}/comments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: params.userId,
        content: params.content,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('댓글 작성에 실패했습니다.');
  }

  const result = await response.json();
  return result.data;
};

const getUserPoints = async (userId: string): Promise<number> => {
  const response = await authFetch(`/api/user/points?userId=${userId}`);

  if (!response.ok) {
    throw new Error('포인트 정보를 가져올 수 없습니다.');
  }

  const result = await response.json();
  return result.data.totalPoints;
};

function PostDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const postId = params.postId as string;

  const { data: postData } = useGoalSuspenseQuery(getPostDetail, [postId]);

  const { post, comments } = postData;
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [viewsCount, setViewsCount] = useState(post.views_count || 0);
  const [currentComments, setCurrentComments] = useState(comments);

  // 댓글 작성 폼
  const commentForm = useGoalForm({
    zodSchema: z.object({
      content: z.string().min(1, '댓글 내용을 입력해주세요.'),
    }),
    defaultValues: {
      content: '',
    },
  });

  // 조회수 추적
  usePostViewTracking({
    postId,
    enabled: true,
    onViewTracked: (isNewView) => {
      if (isNewView) {
        setViewsCount((prev) => prev + 1);
      }
    },
  });

  // 로그인한 사용자의 좋아요 상태 조회
  const { data: likeStatus } = useGoalQuery(
    getLikeStatus,
    [postId, user?.id || ''],
    {
      enabled: !!user?.id,
    }
  );

  // 로그인한 사용자의 포인트 정보 조회
  const { data: userPoints } = useGoalQuery(getUserPoints, [user?.id || ''], {
    enabled: !!user?.id,
  });

  // 좋아요 처리 mutation
  const likeMutation = useGoalMutation(toggleLike, {
    onSuccess: (data) => {
      setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
    },
    onError: (error) => {
      console.error('좋아요 처리 오류:', error);
      alert('좋아요 처리에 실패했습니다.');
    },
  });

  // 댓글 작성 mutation
  const commentMutation = useGoalMutation(createComment, {
    onSuccess: (newComment) => {
      setCurrentComments((prev) => [...prev, newComment]);
      commentForm.reset();
      setCommentCount((prev) => prev + 1);
    },
    onError: (error) => {
      console.error('댓글 작성 오류:', error);
      alert('댓글 작성에 실패했습니다.');
    },
  });

  const isLiked = likeStatus?.liked || false;

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
  const isOwnPost = user?.id === post.user_id;

  const handleLike = () => {
    if (!user?.id) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (isOwnPost) {
      alert('본인이 작성한 게시글에는 좋아요를 할 수 없습니다.');
      return;
    }

    const action = isLiked ? 'unlike' : 'like';
    likeMutation.mutate({ postId, userId: user.id, action });
  };

  const handleCommentSubmit = commentForm.handleSubmit((data) => {
    if (!user?.id) {
      alert('로그인이 필요합니다.');
      return;
    }
    commentMutation.mutate({
      postId,
      userId: user.id,
      content: data.content.trim(),
    });
  });

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* 뒤로가기 버튼 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로가기
        </Button>
      </div>

      {/* 게시글 상세 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <Badge variant={categoryBadge.variant}>
                  {categoryBadge.label}
                </Badge>
                {post.team_name && (
                  <Badge variant="outline">{post.team_name}</Badge>
                )}
              </div>
              <div className="flex items-center space-x-3 mb-3">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {post.title}
                </CardTitle>
                {isOwnPost && (
                  <Badge variant="secondary" className="text-xs">
                    내 게시글
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 작성자 정보 */}
          <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 relative flex-shrink-0 rounded-full overflow-hidden bg-gray-100">
              {post.user_profile_image ? (
                <Image
                  src={post.user_profile_image}
                  alt={`${post.user_nickname} 프로필`}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-lg text-gray-500 font-medium">
                  {post.user_nickname.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {post.user_nickname}
              </div>
              <div className="text-sm text-gray-500">
                {format(new Date(post.created_at), 'yyyy년 MM월 dd일 HH:mm', {
                  locale: ko,
                })}
              </div>
              {user?.id === post.user_id && userPoints !== undefined && (
                <div className="text-xs text-blue-600 font-medium">
                  포인트: {userPoints}pt
                </div>
              )}
            </div>
          </div>

          {/* 게시글 내용 */}
          {post.content && (
            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
          )}

          {/* 게시글 메타 정보 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              {!isOwnPost && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={`flex items-center space-x-2 ${
                    isLiked ? 'text-red-500' : 'text-gray-500'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}
                  />
                  <span>{likeCount}</span>
                </Button>
              )}
              {isOwnPost && (
                <div className="flex items-center space-x-2 text-gray-400">
                  <Heart className="w-4 h-4" />
                  <span>{likeCount}</span>
                  <span className="text-xs">(본인 게시글)</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-gray-500">
                <MessageCircle className="w-4 h-4" />
                <span>{commentCount}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span>{viewsCount}</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {post.updated_at !== post.created_at && '수정됨'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 댓글 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            댓글 ({commentCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 댓글 작성 폼 */}
          {!isOwnPost ? (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="comment"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    댓글 작성
                  </label>
                  <textarea
                    id="comment"
                    {...commentForm.register('content')}
                    placeholder="댓글을 입력하세요..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={commentMutation.isPending}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={
                      commentMutation.isPending ||
                      !commentForm.watch('content').trim()
                    }
                    size="sm"
                  >
                    {commentMutation.isPending ? '작성 중...' : '댓글 작성'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
              <p>본인이 작성한 게시글에는 댓글을 작성할 수 없습니다.</p>
            </div>
          )}

          {currentComments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              아직 댓글이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {currentComments.map((comment) => (
                <div
                  key={comment.comment_id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-8 h-8 relative flex-shrink-0 rounded-full overflow-hidden bg-gray-200">
                    {comment.user_profile_image ? (
                      <Image
                        src={comment.user_profile_image}
                        alt={`${comment.user_nickname} 프로필`}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center text-sm text-gray-500 font-medium">
                        {comment.user_nickname.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {comment.user_nickname}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comment.created_at), 'MM/dd HH:mm', {
                          locale: ko,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="space-y-3">
            <div className="flex space-x-2">
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PostDetailPage() {
  return (
    <GoalWrapper fallback={<PostDetailSkeleton />}>
      <PostDetailContent />
    </GoalWrapper>
  );
}
