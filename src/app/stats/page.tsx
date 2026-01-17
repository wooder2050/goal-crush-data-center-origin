import { Shield, Swords, Target, TrendingUp, Trophy, Users } from 'lucide-react';
import { Metadata } from 'next';
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
  title: '통계',
  description: '선수 통계 및 랭킹 - 골때리는 그녀들',
};

export default function StatsPage() {
  const statsCategories = [
    {
      title: '득점 랭킹',
      description: '골, 도움, 공격포인트 순위',
      href: '/stats/scoring',
      icon: <Trophy className="h-8 w-8 text-amber-500" />,
      gradient: 'from-amber-50 to-yellow-50',
      buttonColor: 'bg-amber-500 hover:bg-amber-600',
    },
    {
      title: '골키퍼 랭킹',
      description: '클린시트, 실점률 순위',
      href: '/stats/goalkeepers',
      icon: <Shield className="h-8 w-8 text-green-500" />,
      gradient: 'from-green-50 to-emerald-50',
      buttonColor: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: '팀 순위',
      description: '승부 기록, 승점, 득실차',
      href: '/stats/teams',
      icon: <Target className="h-8 w-8 text-blue-500" />,
      gradient: 'from-blue-50 to-cyan-50',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: '팀 맞대결',
      description: '두 팀 간 상대 전적과 통계',
      href: '/stats/head-to-head',
      icon: <Swords className="h-8 w-8 text-red-500" />,
      gradient: 'from-red-50 to-pink-50',
      buttonColor: 'bg-red-500 hover:bg-red-600',
    },
    {
      title: '선수 vs 팀',
      description: '개별 선수의 팀별 상대 기록',
      href: '/stats/player-vs-team',
      icon: <Users className="h-8 w-8 text-purple-500" />,
      gradient: 'from-purple-50 to-indigo-50',
      buttonColor: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: '선발 출전 승률',
      description: '선발 출전 시 팀 승률 순위',
      href: '/stats/starter-win-rate',
      icon: <TrendingUp className="h-8 w-8 text-cyan-500" />,
      gradient: 'from-cyan-50 to-sky-50',
      buttonColor: 'bg-cyan-500 hover:bg-cyan-600',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Section padding="sm">
        <div className="text-center mb-8 sm:mb-12">
          <H1 className="mb-3 sm:mb-4 text-xl sm:text-3xl flex items-center justify-center gap-2">
            <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            통계
          </H1>
          <p className="text-base sm:text-lg text-gray-600">
            선수들의 다양한 통계와 랭킹을 확인하세요
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {statsCategories.map((category) => (
            <Card
              key={category.href}
              className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <Link href={category.href} className="block h-full">
                <CardContent className="p-6 h-full">
                  <div
                    className={`bg-gradient-to-br ${category.gradient} rounded-lg p-6 mb-6`}
                  >
                    <div className="flex items-center justify-center mb-4">
                      {category.icon}
                    </div>
                    <CardTitle className="text-center text-lg font-bold text-gray-900 mb-2">
                      {category.title}
                    </CardTitle>
                    <CardDescription className="text-center text-sm text-gray-600">
                      {category.description}
                    </CardDescription>
                  </div>
                  <div className="text-center">
                    <Button
                      className={`w-full ${category.buttonColor} text-white transition-colors`}
                    >
                      랭킹 보기
                    </Button>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
