import type { Metadata } from 'next';

import { SupportPage } from '@/features/policy';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '고객 지원/문의',
  description:
    '골 때리는 그녀들 데이터센터 고객 지원 - 서비스 이용 문의, 버그 신고, 건의사항',
  alternates: { canonical: '/support' },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <SupportPage />;
}
