import { Card, CardContent } from '@/components/ui';

export default function MatchDetailedStatsSectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-48 rounded bg-gray-200" />

      {/* 팀 테이블 스켈레톤 */}
      {[1, 2].map((team) => (
        <Card key={team}>
          <CardContent className="px-0 py-4">
            <div className="mb-3 px-4">
              <div className="h-5 w-32 rounded bg-gray-200" />
            </div>

            {/* 탭 스켈레톤 */}
            <div className="mb-3 flex gap-1 px-4">
              {[1, 2, 3, 4, 5, 6].map((tab) => (
                <div key={tab} className="h-6 w-14 rounded-full bg-gray-200" />
              ))}
            </div>

            {/* 테이블 스켈레톤 */}
            <div className="px-4">
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((row) => (
                  <div key={row} className="flex gap-4">
                    <div className="h-8 w-32 rounded bg-gray-200" />
                    <div className="h-8 w-12 rounded bg-gray-200" />
                    <div className="h-8 w-12 rounded bg-gray-200" />
                    <div className="h-8 w-12 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
