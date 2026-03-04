import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '게시글 작성',
  description: '골때녀 커뮤니티에 새 게시글을 작성하세요.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CreatePostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
