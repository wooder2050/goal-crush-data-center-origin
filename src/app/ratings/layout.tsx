import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '선수 평가',
  description:
    '골 때리는 그녀들 선수들의 능력치 평가를 확인하세요. 팬들이 직접 평가한 선수 능력치와 리뷰를 모아볼 수 있습니다.',
  keywords: [
    '골때녀 선수 평가',
    '골때녀 능력치',
    '골때리는 그녀들 선수 평가',
    '골때녀 선수 리뷰',
  ],
  alternates: { canonical: '/ratings' },
  openGraph: {
    title: '선수 평가 | 골때녀 데이터센터',
    description:
      '골 때리는 그녀들 선수들의 능력치 평가를 확인하세요. 팬들이 직접 평가한 선수 능력치와 리뷰를 모아볼 수 있습니다.',
    url: 'https://www.gtndatacenter.com/ratings',
  },
  twitter: {
    card: 'summary',
    title: '선수 평가 | 골때녀 데이터센터',
    description:
      '골 때리는 그녀들 선수들의 능력치 평가를 확인하세요. 팬들이 직접 평가한 선수 능력치와 리뷰를 모아볼 수 있습니다.',
  },
};

export default function RatingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
