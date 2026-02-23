import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '게시글',
  description: '골 때리는 그녀들 커뮤니티 게시글을 확인하고 댓글로 참여하세요.',
  alternates: { canonical: undefined },
};

export default function PostDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
