import type { Metadata } from 'next';

import { TermsOfServicePage } from '@/features/policy';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '이용약관',
  description: '골크러쉬 데이터센터 이용약관 - 서비스 이용 규정 및 정책',
  alternates: { canonical: '/terms' },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <TermsOfServicePage />;
}
