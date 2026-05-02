import type { Metadata } from 'next';

import { TeamCommunityDetailPage } from '@/features/community/components/TeamCommunityDetailPage';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '팀 커뮤니티',
  description: '팀별 커뮤니티 게시글 및 활동',
  alternates: { canonical: '/community/teams' },
};

interface TeamCommunityPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamCommunityPage({
  params,
}: TeamCommunityPageProps) {
  const { teamId } = await params;

  return <TeamCommunityDetailPage teamId={teamId} />;
}
