'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 사이트 소개 */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold mb-4 text-[#ff4800]">
              골 때리는 그녀들 데이터센터
            </h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              &ldquo;골 때리는 그녀들&rdquo; 방송 데이터를 정리하는 비공식 팬
              아카이브입니다. 매주 업데이트되는 경기 데이터와 선수 통계를
              제공합니다.
            </p>
            <div className="flex space-x-4 text-sm text-gray-400">
              <span>© {currentYear} 골 때리는 그녀들 데이터센터</span>
            </div>
          </div>

          {/* 기록실 */}
          <div>
            <h4 className="text-lg font-semibold mb-4">기록실</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/seasons"
                  className="text-gray-300 hover:text-[#ff4800] transition-colors"
                >
                  시즌
                </Link>
              </li>
              <li>
                <Link
                  href="/matches"
                  className="text-gray-300 hover:text-[#ff4800] transition-colors"
                >
                  경기
                </Link>
              </li>
              <li>
                <Link
                  href="/teams"
                  className="text-gray-300 hover:text-[#ff4800] transition-colors"
                >
                  팀
                </Link>
              </li>
              <li>
                <Link
                  href="/players"
                  className="text-gray-300 hover:text-[#ff4800] transition-colors"
                >
                  선수
                </Link>
              </li>
              <li>
                <Link
                  href="/coaches"
                  className="text-gray-300 hover:text-[#ff4800] transition-colors"
                >
                  감독
                </Link>
              </li>
              <li>
                <Link
                  href="/stats"
                  className="text-gray-300 hover:text-[#ff4800] transition-colors"
                >
                  통계
                </Link>
              </li>
            </ul>
          </div>

          {/* 안내 */}
          <div>
            <h4 className="text-lg font-semibold mb-4">안내</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-[#ff4800] transition-colors"
                >
                  사이트 소개
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-300 hover:text-[#ff4800] transition-colors"
                >
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-300 hover:text-[#ff4800] transition-colors"
                >
                  이용약관
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 구분선 및 저작권 */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <div>
              <p>
                본 사이트는 &ldquo;골 때리는 그녀들&rdquo; 팬사이트로, 공식
                사이트가 아닙니다.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <Link
                href="/privacy"
                className="hover:text-[#ff4800] transition-colors"
              >
                개인정보처리방침
              </Link>
              <Link
                href="/terms"
                className="hover:text-[#ff4800] transition-colors"
              >
                이용약관
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
