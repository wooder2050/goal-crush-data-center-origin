import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '선수 평가 목록',
  description:
    '골 때리는 그녀들 선수에 대한 팬들의 능력치 평가와 리뷰를 확인하세요.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/players',
  },
};

export default function PlayerRatingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
