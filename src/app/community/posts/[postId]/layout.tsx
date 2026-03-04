import type { Metadata } from 'next';

import { prisma } from '@/lib/prisma';

export async function generateMetadata({
  params,
}: {
  params: { postId: string };
}): Promise<Metadata> {
  const postId = Number(params.postId);

  if (isNaN(postId)) {
    return { title: '게시글을 찾을 수 없습니다' };
  }

  const post = await prisma.communityPost.findUnique({
    where: { post_id: postId },
    select: {
      title: true,
      content: true,
      category: true,
      is_deleted: true,
    },
  });

  if (!post || post.is_deleted) {
    return { title: '게시글을 찾을 수 없습니다' };
  }

  const description = post.content
    ? post.content.slice(0, 160).replace(/\n/g, ' ')
    : '골때녀 커뮤니티 게시글';

  const categoryLabels: Record<string, string> = {
    general: '일반',
    match: '경기',
    team: '팀',
    data: '데이터',
    prediction: '예측',
  };
  const categoryLabel = categoryLabels[post.category] || post.category;

  return {
    title: `${post.title} - 골때녀 커뮤니티`,
    description,
    keywords: [
      '골때녀 커뮤니티',
      '골때리는 그녀들',
      categoryLabel,
      '팬 게시판',
    ],
    alternates: {
      canonical: `/community/posts/${postId}`,
    },
    openGraph: {
      title: `${post.title} | 골때녀 커뮤니티`,
      description,
      url: `https://www.gtndatacenter.com/community/posts/${postId}`,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${post.title} | 골때녀 커뮤니티`,
      description,
    },
  };
}

export default function PostDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
