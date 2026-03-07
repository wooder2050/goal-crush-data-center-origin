import { Calendar, Trophy } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  H1,
  Section,
} from '@/components/ui';

export const metadata: Metadata = {
  title: '경기 결과',
  description:
    '골 때리는 그녀들 역대 경기 결과를 확인하세요. 시즌별 경기 일정, 스코어, 라인업, 득점 기록을 모두 제공합니다.',
  keywords: [
    '골때녀 경기',
    '골때녀 경기 결과',
    '골때리는 그녀들 경기',
    '골때녀 스코어',
    '골때녀 경기 일정',
    '골때녀 라인업',
  ],
  alternates: { canonical: '/matches' },
  openGraph: {
    title: '경기 결과 | 골때녀 데이터 센터',
    description:
      '골 때리는 그녀들 역대 경기 결과를 확인하세요. 시즌별 경기 일정, 스코어, 라인업, 득점 기록을 모두 제공합니다.',
    url: 'https://www.gtndatacenter.com/matches',
  },
  twitter: {
    card: 'summary',
    title: '경기 결과 | 골때녀 데이터 센터',
    description: '골 때리는 그녀들 역대 경기 결과를 확인하세요.',
  },
};

export default function MatchesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Section padding="sm">
        <div className="text-center mb-8 sm:mb-12">
          <H1 className="mb-3 sm:mb-4 text-xl sm:text-3xl flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            경기 결과
          </H1>
          <p className="text-base sm:text-lg text-gray-600">
            골 때리는 그녀들의 역대 경기 결과와 상세 기록을 확인하세요
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <Link href="/seasons" className="block h-full">
              <CardContent className="p-6 h-full">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                  <CardTitle className="text-center text-lg font-bold text-gray-900 mb-2">
                    시즌별 경기
                  </CardTitle>
                  <CardDescription className="text-center text-sm text-gray-600">
                    시즌을 선택하여 해당 시즌의 경기 결과와 순위를 확인하세요
                  </CardDescription>
                </div>
                <div className="text-center">
                  <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white transition-colors">
                    시즌 목록 보기
                  </Button>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <Link href="/stats" className="block h-full">
              <CardContent className="p-6 h-full">
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <Trophy className="h-8 w-8 text-amber-500" />
                  </div>
                  <CardTitle className="text-center text-lg font-bold text-gray-900 mb-2">
                    경기 통계
                  </CardTitle>
                  <CardDescription className="text-center text-sm text-gray-600">
                    득점 랭킹, 팀 순위, 맞대결 전적 등 다양한 경기 통계를
                    확인하세요
                  </CardDescription>
                </div>
                <div className="text-center">
                  <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white transition-colors">
                    통계 보기
                  </Button>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>
      </Section>
    </div>
  );
}
