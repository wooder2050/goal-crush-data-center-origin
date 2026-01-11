import { Card, CardContent } from '@/components/ui';

export default function MatchGoalkeeperStatsSectionSkeleton() {
  return (
    <div className="space-y-4">
      {/* 헤더 스켈레톤 */}
      <div className="h-7 w-32 bg-gray-200 rounded animate-pulse"></div>

      {/* 홈팀 골키퍼 카드 스켈레톤 */}
      <Card>
        <CardContent className="px-0 py-4">
          {/* 카드 헤더 */}
          <div className="mb-3 px-4">
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* 테이블 헤더 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-2 text-center">
                    <div className="h-4 w-12 bg-gray-200 rounded mx-auto animate-pulse"></div>
                  </th>
                  <th className="px-3 py-2 text-center">
                    <div className="h-4 w-8 bg-gray-200 rounded mx-auto animate-pulse"></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1, 2].map((i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-5 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="h-5 w-6 bg-gray-200 rounded mx-auto animate-pulse"></div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="h-4 w-4 bg-gray-200 rounded mx-auto animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 원정팀 골키퍼 카드 스켈레톤 */}
      <Card>
        <CardContent className="px-0 py-4">
          {/* 카드 헤더 */}
          <div className="mb-3 px-4">
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* 테이블 헤더 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-2 text-center">
                    <div className="h-4 w-12 bg-gray-200 rounded mx-auto animate-pulse"></div>
                  </th>
                  <th className="px-3 py-2 text-center">
                    <div className="h-4 w-8 bg-gray-200 rounded mx-auto animate-pulse"></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1].map((i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="h-5 w-6 bg-gray-200 rounded mx-auto animate-pulse"></div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="h-4 w-4 bg-gray-200 rounded mx-auto animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
