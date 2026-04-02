import {
  CircleDot,
  Shield,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
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
  title: '골때녀 통계 - 득점·골키퍼·팀 순위·맞대결 전적 모음',
  description:
    '골 때리는 그녀들 역대 통계를 한곳에서! 득점 순위, 골키퍼 선방률, 팀별 승률, 맞대결 전적, 선발 출전 승률까지 다양한 통계를 확인하세요.',
  keywords: [
    '골때녀 통계',
    '골때녀 순위',
    '골때녀 득점 순위',
    '골때녀 랭킹',
    '골때리는 그녀들 통계',
    '골때녀 맞대결',
    '골때녀 팀 성적',
  ],
  alternates: { canonical: '/stats' },
  openGraph: {
    title: '골때녀 통계 - 득점·골키퍼·팀 순위·맞대결 전적 모음',
    description:
      '골 때리는 그녀들 역대 통계를 한곳에서! 득점 순위, 골키퍼 선방률, 팀별 승률, 맞대결 전적, 선발 출전 승률까지 다양한 통계를 확인하세요.',
    url: 'https://www.gtndatacenter.com/stats',
  },
  twitter: {
    card: 'summary',
    title: '골때녀 통계 - 득점·골키퍼·팀 순위·맞대결 전적 모음',
    description:
      '골 때리는 그녀들 역대 통계를 한곳에서! 득점 순위, 골키퍼 선방률, 팀별 승률, 맞대결 전적까지 확인하세요.',
  },
};

export default function StatsPage() {
  const statsCategories = [
    {
      title: '득점 랭킹',
      description: '골, 도움, 공격포인트 순위',
      href: '/stats/scoring',
      icon: <Trophy className="h-8 w-8 text-amber-500" />,
      gradient: 'from-amber-50 to-yellow-50',
    },
    {
      title: '골키퍼 랭킹',
      description: '클린시트, 실점률 순위',
      href: '/stats/goalkeepers',
      icon: <Shield className="h-8 w-8 text-green-500" />,
      gradient: 'from-green-50 to-emerald-50',
    },
    {
      title: '팀 순위',
      description: '승부 기록, 승점, 득실차',
      href: '/stats/teams',
      icon: <Target className="h-8 w-8 text-blue-500" />,
      gradient: 'from-blue-50 to-cyan-50',
    },
    {
      title: '팀 맞대결',
      description: '두 팀 간 상대 전적과 통계',
      href: '/stats/head-to-head',
      icon: <Swords className="h-8 w-8 text-red-500" />,
      gradient: 'from-red-50 to-pink-50',
    },
    {
      title: '선수 vs 팀',
      description: '개별 선수의 팀별 상대 기록',
      href: '/stats/player-vs-team',
      icon: <Users className="h-8 w-8 text-purple-500" />,
      gradient: 'from-purple-50 to-indigo-50',
    },
    {
      title: '선수 비교',
      description: '두 선수의 기록을 나란히 비교',
      href: '/stats/player-compare',
      icon: <Users className="h-8 w-8 text-teal-500" />,
      gradient: 'from-teal-50 to-emerald-50',
    },
    {
      title: '선발 출전 승률',
      description: '선발 출전 시 팀 승률 순위',
      href: '/stats/starter-win-rate',
      icon: <TrendingUp className="h-8 w-8 text-cyan-500" />,
      gradient: 'from-cyan-50 to-sky-50',
    },
    {
      title: '승부차기 통계',
      description: '키커 성공률, 골키퍼 선방율 순위',
      href: '/stats/penalty-shootout',
      icon: <CircleDot className="h-8 w-8 text-orange-500" />,
      gradient: 'from-orange-50 to-amber-50',
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
                    <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white transition-colors">
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
