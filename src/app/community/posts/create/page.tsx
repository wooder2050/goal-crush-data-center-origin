'use client';

import { ArrowLeft, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { useGoalForm } from '@/common/form/useGoalForm';
import { GoalWrapper } from '@/common/GoalWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useGoalMutation } from '@/hooks/useGoalMutation';

// 폼 검증 스키마
const createPostSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요.')
    .max(200, '제목은 200자 이하여야 합니다.'),
  content: z.string().min(1, '내용을 입력해주세요.'),
  category: z.enum(['general', 'match', 'team', 'data', 'prediction']),
  team_id: z.string().optional(),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

// API 함수
const createPost = async (
  formData: CreatePostForm
): Promise<{ post_id: number }> => {
  const response = await fetch('/api/community/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: formData.title.trim(),
      content: formData.content.trim(),
      category: formData.category,
      team_id: formData.team_id || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error('게시글 작성에 실패했습니다.');
  }

  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error || '게시글 작성에 실패했습니다.');
  }
};

function CreatePostContent() {
  const router = useRouter();

  // 게시글 작성 mutation
  const createPostMutation = useGoalMutation(createPost, {
    onSuccess: (data) => {
      // 작성 성공 시 게시글 상세 페이지로 이동
      router.push(`/community/posts/${data.post_id}`);
    },
    onError: (error) => {
      console.error('게시글 작성 오류:', error);
      alert('게시글 작성에 실패했습니다.');
    },
  });

  // 폼 관리
  const form = useGoalForm({
    zodSchema: createPostSchema,
    defaultValues: {
      title: '',
      content: '',
      category: 'general',
      team_id: '',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    createPostMutation.mutate(data);
  });

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
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

      {/* 게시글 작성 폼 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">새 게시글 작성</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 카테고리 선택 */}
            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Select
                value={form.watch('category')}
                onValueChange={(value) => form.setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">일반</SelectItem>
                  <SelectItem value="match">경기</SelectItem>
                  <SelectItem value="team">팀</SelectItem>
                  <SelectItem value="data">데이터</SelectItem>
                  <SelectItem value="prediction">예측</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 팀 선택 (선택사항) */}
            <div className="space-y-2">
              <Label htmlFor="team_id">팀 (선택사항)</Label>
              <Select
                value={form.watch('team_id')}
                onValueChange={(value) => form.setValue('team_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="팀을 선택하세요 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">팀 없음</SelectItem>
                  <SelectItem value="1">FC 서울</SelectItem>
                  <SelectItem value="2">수원 삼성 블루윙즈</SelectItem>
                  <SelectItem value="3">울산 현대</SelectItem>
                  <SelectItem value="4">전북 현대 모터스</SelectItem>
                  <SelectItem value="5">포항 스틸러스</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 제목 입력 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={form.watch('title')}
                onChange={(e) => form.setValue('title', e.target.value)}
                placeholder="게시글 제목을 입력하세요"
                maxLength={200}
                required
              />
              <div className="text-xs text-gray-500 text-right">
                {form.watch('title').length}/200
              </div>
            </div>

            {/* 내용 입력 */}
            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                value={form.watch('content')}
                onChange={(e) => form.setValue('content', e.target.value)}
                placeholder="게시글 내용을 입력하세요"
                rows={10}
                required
              />
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={createPostMutation.isPending}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={
                  createPostMutation.isPending ||
                  !form.watch('title').trim() ||
                  !form.watch('content').trim()
                }
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {createPostMutation.isPending ? '작성 중...' : '게시글 작성'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function CreatePostSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-32 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <GoalWrapper fallback={<CreatePostSkeleton />}>
      <CreatePostContent />
    </GoalWrapper>
  );
}
