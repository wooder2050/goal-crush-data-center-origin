import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '프로필',
  description:
    '골 때리는 그녀들 데이터 센터 내 프로필을 확인하고 계정 정보를 관리하세요.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
