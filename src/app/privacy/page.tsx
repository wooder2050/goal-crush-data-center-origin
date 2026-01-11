import type { Metadata } from 'next';

import { PrivacyPolicyPage } from '@/features/policy';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description:
    '골크러쉬 데이터센터 개인정보처리방침 - 사용자 개인정보 보호 정책',
  alternates: { canonical: '/privacy' },
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
