import { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다',
  description:
    '요청하신 페이지가 존재하지 않거나 이동되었습니다. 홈페이지로 돌아가서 원하는 정보를 찾아보세요.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
      <h1 className="text-2xl font-semibold text-gray-900">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="text-gray-500">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <div className="mt-4 space-y-2">
        <Link href="/" className="block text-blue-600 hover:underline">
          홈으로 돌아가기
        </Link>
        <Link href="/seasons" className="block text-blue-600 hover:underline">
          시즌 보기
        </Link>
        <Link href="/teams" className="block text-blue-600 hover:underline">
          팀 보기
        </Link>
        <Link href="/players" className="block text-blue-600 hover:underline">
          선수 보기
        </Link>
      </div>
    </div>
  );
}
