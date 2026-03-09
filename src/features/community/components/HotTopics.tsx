'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Eye, Heart, MessageCircle } from 'lucide-react';
import Link from 'next/link';

import { GoalWrapper } from '@/common/GoalWrapper';
import { Badge } from '@/components/ui/badge';
import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';
import { HotTopic, POST_CATEGORIES } from '@/types';

// API 함수
const getHotTopics = async (): Promise<HotTopic[]> => {
  const response = await fetch(apiUrl('/api/community/hot-topics?limit=5'));

  if (!response.ok) {
    throw new Error('인기 토픽을 불러오는데 실패했습니다.');
  }

  const result = await response.json();
  return result.data;
};

// 고유한 쿼리 키 설정
getHotTopics.queryKey = 'hot-topics';

function HotTopicsContent() {
  const { data: hotTopics } = useGoalSuspenseQuery(getHotTopics, []);

  const getCategoryLabel = (category: string) => {
    const categoryInfo = POST_CATEGORIES.find((cat) => cat.value === category);
    return categoryInfo?.label || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'bg-gray-100 text-gray-800',
      match: 'bg-blue-100 text-blue-800',
      team: 'bg-green-100 text-green-800',
      data: 'bg-purple-100 text-purple-800',
      prediction: 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-3">
      {hotTopics.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          아직 인기 토픽이 없습니다.
        </p>
      ) : (
        hotTopics.map((topic, index) => (
          <Link
            key={topic.id}
            href={`/community/posts/${topic.id}`}
            className="block group"
          >
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-sm font-semibold">
                {index + 1}위
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">카테고리:</span>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getCategoryColor(topic.category)}`}
                  >
                    {getCategoryLabel(topic.category)}
                  </Badge>
                </div>
                <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                  {topic.title}
                </h4>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {topic.likes_count}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {topic.comments_count}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span
                      title={`전체 조회: ${topic.views_count}, 독립 방문자: ${topic.unique_views}`}
                    >
                      {topic.unique_views} ({topic.views_count})
                    </span>
                  </div>
                  <span className="ml-auto">
                    {format(new Date(topic.created_at), 'MM/dd HH:mm', {
                      locale: ko,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}

function HotTopicsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-start gap-3 p-3">
          <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <div className="flex gap-4">
              <div className="h-3 bg-gray-200 rounded w-8 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-8 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-8 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HotTopics() {
  return (
    <GoalWrapper fallback={<HotTopicsSkeleton />}>
      <HotTopicsContent />
    </GoalWrapper>
  );
}
