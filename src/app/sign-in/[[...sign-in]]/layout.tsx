import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인',
  description: '골 때리는 그녀들 데이터 센터에 로그인하세요.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/sign-in',
  },
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
