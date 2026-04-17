import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '응원하기',
  description:
    '골 때리는 그녀들 다가오는 경기에 응원을 보내세요. 팬들의 응원 현황을 확인하고 함께 열정을 나눠보세요.',
  keywords: [
    '골때녀 응원',
    '골때녀 경기 응원',
    '골때리는 그녀들 응원',
    '골때녀 팬 응원',
  ],
  alternates: { canonical: '/supports' },
  robots: { index: false, follow: true },
  openGraph: {
    title: '응원하기 | 골때녀 데이터센터',
    description:
      '골 때리는 그녀들 다가오는 경기에 응원을 보내세요. 팬들의 응원 현황을 확인하고 함께 열정을 나눠보세요.',
    url: 'https://www.gtndatacenter.com/supports',
  },
  twitter: {
    card: 'summary',
    title: '응원하기 | 골때녀 데이터센터',
    description:
      '골 때리는 그녀들 다가오는 경기에 응원을 보내세요. 팬들의 응원 현황을 확인하고 함께 열정을 나눠보세요.',
  },
};

export default function SupportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
