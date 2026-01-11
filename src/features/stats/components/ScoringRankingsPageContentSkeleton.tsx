import { Card, CardContent, Section } from '@/components/ui';

export default function ScoringRankingsPageContentSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <Section padding="sm">
        {/* 헤더 스켈레톤 */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 sm:h-12 w-36 sm:w-52 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-6 sm:h-7 w-72 sm:w-96 bg-gray-200 rounded mx-auto animate-pulse"></div>
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
                    {[
                      '순위',
                      '선수명',
                      '팀',
                      '포지션',
                      '경기',
                      '득점',
                      '어시스트',
                      '공격P',
                      '득점/경기',
                    ].map((header, i) => (
                      <th
                        key={i}
                        className="px-3 py-3 text-left font-medium text-gray-700"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <tr key={i} className="border-t border-gray-200">
                      <td className="px-3 py-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                          <div>
                            <div className="h-4 w-20 bg-gray-200 rounded mb-1 animate-pulse"></div>
                            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </td>
                      {[1, 2, 3, 4, 5, 6, 7].map((j) => (
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

        {/* 모바일 카드 스켈레톤 */}
        <div className="block sm:hidden">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="ml-3 w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 ml-3">
                    <div className="h-4 w-24 bg-gray-200 rounded mb-1 animate-pulse"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="text-center">
                      <div className="h-6 w-8 bg-gray-200 rounded mb-1 mx-auto animate-pulse"></div>
                      <div className="h-3 w-12 bg-gray-200 rounded mx-auto animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
