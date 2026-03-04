import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '회원가입',
  description: '골 때리는 그녀들 데이터 센터에 회원가입하세요.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
