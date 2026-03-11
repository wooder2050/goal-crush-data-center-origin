import { Zap } from 'lucide-react';
import { Metadata } from 'next';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Container,
} from '@/components/ui';
import FantasyTeams from '@/features/fantasy/components/FantasyTeams';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: '골때녀 판타지 리그 - 드림팀 만들고 팬 순위 경쟁',
  description:
    '골 때리는 그녀들 판타지 리그에서 5명의 선수를 골라 나만의 드림팀을 구성! 실제 경기 성과 기반 점수로 다른 팬들과 순위를 겨뤄보세요.',
  keywords: [
    '골때녀 판타지',
    '골때녀 판타지 리그',
    '골때리는 그녀들 판타지',
    '골때녀 드림팀',
    '골때녀 팬 게임',
  ],
  alternates: { canonical: '/fantasy' },
  openGraph: {
    title: '골때녀 판타지 리그 - 드림팀 만들고 팬 순위 경쟁',
    description:
      '골 때리는 그녀들 판타지 리그에서 5명의 선수를 골라 나만의 드림팀을 구성! 실제 경기 성과 기반 점수로 다른 팬들과 순위를 겨뤄보세요.',
    url: 'https://www.gtndatacenter.com/fantasy',
  },
  twitter: {
    card: 'summary',
    title: '골때녀 판타지 리그 - 드림팀 만들고 팬 순위 경쟁',
    description:
      '골 때리는 그녀들 판타지 리그에서 5명의 선수를 골라 나만의 드림팀을 구성!',
  },
};

export default async function FantasyPage() {
  const user = await getCurrentUser();

  return (
    <Container className="py-8">
      {/* 헤더 - 서버에서 렌더링되어 Googlebot이 볼 수 있음 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">판타지 축구</h1>
        <p className="text-gray-600">
          5명의 선수를 선택하여 실제 경기 성과로 점수를 획득하고 다른 팬들과
          경쟁하세요!
        </p>
      </div>

      {/* 게임 규칙 안내 - 서버에서 렌더링 */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Zap className="w-5 h-5" />
            <span>게임 방법</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">팀 편성</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• 5명의 선수를 선택하세요</li>
                <li>• 같은 팀에서 최대 2명까지</li>
                <li>• 언제든지 팀 수정 가능</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">점수 획득</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• 골: +4점, 어시스트: +2점</li>
                <li>• 출전: +2점, 선발: +1점 추가</li>
                <li>• 무실점(수비진): +3점</li>
                <li>• 옐로카드: -1점, 레드카드: -2점</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 동적 콘텐츠 - 클라이언트에서 렌더링 */}
      <FantasyTeams user={user} />
    </Container>
  );
}
