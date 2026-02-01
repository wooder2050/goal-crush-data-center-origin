import { Card, CardContent, Section } from '@/components/ui';

export default function PenaltyShootoutPageContentSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <Section padding="sm">
        {/* 헤더 스켈레톤 */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 sm:h-12 w-40 sm:w-56 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-6 sm:h-7 w-56 sm:w-72 bg-gray-200 rounded mx-auto animate-pulse"></div>
        </div>

        {/* 탭 스켈레톤 */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* 필터 스켈레톤 */}
        <Card className="mb-6">
          <CardContent className="px-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="h-4 w-12 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 w-16 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 통계 요약 스켈레톤 */}
        <div className="mb-6 grid gap-4 grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="px-4 py-4 text-center">
                <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 테이블 스켈레톤 - 데스크톱 */}
        <Card className="hidden sm:block">
          <CardContent className="px-0 py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['순위', '선수', '총 킥', '성공', '실패', '성공률'].map(
                      (header, i) => (
                        <th
                          key={i}
                          className={`px-3 py-3 font-medium text-gray-700 ${i === 0 ? 'text-center w-16' : i === 1 ? 'text-left' : 'text-center'}`}
                        >
                          {header}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <tr key={i} className="border-t border-gray-200">
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center">
                          <div className="w-7 h-5 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          {/* 선수 이미지 + 팀 로고 오버레이 */}
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-gray-300 rounded-full animate-pulse"></div>
                          </div>
                          <div>
                            <div className="h-4 w-20 bg-gray-200 rounded mb-1 animate-pulse"></div>
                            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </td>
                      {[1, 2, 3, 4].map((j) => (
                        <td key={j} className="px-3 py-3 text-center">
                          <div className="h-4 w-8 bg-gray-200 rounded mx-auto animate-pulse"></div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 모바일 리스트 스켈레톤 */}
        <Card className="block sm:hidden">
          <CardContent className="px-0 py-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className="flex items-center px-4 py-3 border-b border-gray-100 last:border-b-0"
              >
                {/* 순위 */}
                <div className="w-8 flex-shrink-0">
                  <div className="h-5 w-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                {/* 선수 이미지 + 팀 로고 오버레이 */}
                <div className="relative flex-shrink-0 ml-2">
                  <div className="w-11 h-11 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-gray-300 rounded-full animate-pulse"></div>
                </div>
                {/* 선수 정보 */}
                <div className="flex-1 min-w-0 ml-3">
                  <div className="h-4 w-20 bg-gray-200 rounded mb-1 animate-pulse"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                {/* 통계 */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center">
                    <div className="h-5 w-6 bg-gray-200 rounded mx-auto mb-0.5 animate-pulse"></div>
                    <div className="h-2.5 w-6 bg-gray-200 rounded mx-auto animate-pulse"></div>
                  </div>
                  <div className="text-center">
                    <div className="h-5 w-6 bg-gray-200 rounded mx-auto mb-0.5 animate-pulse"></div>
                    <div className="h-2.5 w-6 bg-gray-200 rounded mx-auto animate-pulse"></div>
                  </div>
                  <div className="text-center">
                    <div className="h-5 w-6 bg-gray-200 rounded mx-auto mb-0.5 animate-pulse"></div>
                    <div className="h-2.5 w-6 bg-gray-200 rounded mx-auto animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
