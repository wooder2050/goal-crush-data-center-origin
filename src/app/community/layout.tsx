import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '커뮤니티',
  description:
    '골 때리는 그녀들 팬 커뮤니티에서 다른 팬들과 소통하세요. 인기글, 팀별 게시판, MVP 투표 등 다양한 기능을 이용할 수 있습니다.',
  keywords: [
    '골때녀 커뮤니티',
    '골때녀 팬 게시판',
    '골때리는 그녀들 커뮤니티',
    '골때녀 MVP 투표',
  ],
  alternates: { canonical: '/community' },
  openGraph: {
    title: '커뮤니티 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 팬 커뮤니티에서 다른 팬들과 소통하세요. 인기글, 팀별 게시판, MVP 투표 등 다양한 기능을 이용할 수 있습니다.',
    url: 'https://www.gtndatacenter.com/community',
  },
  twitter: {
    card: 'summary',
    title: '커뮤니티 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 팬 커뮤니티에서 다른 팬들과 소통하세요. 인기글, 팀별 게시판, MVP 투표 등 다양한 기능을 이용할 수 있습니다.',
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
