import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '프로필',
  description:
    '골 때리는 그녀들 데이터 센터 내 프로필을 확인하고 계정 정보를 관리하세요.',
  alternates: { canonical: '/profile' },
  openGraph: {
    title: '프로필 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 데이터 센터 내 프로필을 확인하고 계정 정보를 관리하세요.',
    url: 'https://www.gtndatacenter.com/profile',
  },
  twitter: {
    card: 'summary',
    title: '프로필 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 데이터 센터 내 프로필을 확인하고 계정 정보를 관리하세요.',
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
