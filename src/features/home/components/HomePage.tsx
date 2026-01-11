'use client';

import {
  BarChart3,
  Database,
  List,
  PlayCircle,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { GoalWrapper } from '@/common/GoalWrapper';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  H1,
  Section,
} from '@/components/ui';
import UpcomingMatches from '@/features/matches/components/UpcomingMatches';
import UpcomingMatchesSkeleton from '@/features/matches/components/UpcomingMatchesSkeleton';

import { TopScorersList, TopScorersLoading } from './TopScorersList';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Section padding="sm" className="pt-16 pb-20">
        <div className="text-center mb-16">
          <Badge variant="emphasisOutline" className="w-fit mb-6 text-sm">
            골 때리는 그녀들 · 데이터 아카이브
          </Badge>
          <H1 className="mb-6 text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight">
            경기 결과, 선수/팀 기록을
            <br />
            <span className="text-[#ff4800]/80">한 곳에서</span>
          </H1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            &ldquo;골 때리는 그녀들&rdquo;에서 다룬 경기 데이터를 한눈에
            확인하고, 매주 업데이트되는 경기 하이라이트와 선수 통계를
            탐색해보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/seasons">
              <Button size="lg" className="px-8 py-4 text-lg">
                시즌 기록 보기
              </Button>
            </Link>
            <Link href="/players">
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                선수 정보 보기
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative aspect-[16/9] w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
          <Image
            src="https://ppqctvmpsmlagsmmmdee.supabase.co/storage/v1/object/sign/playerprofile/mwE1721003437663.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iZWM2YjcyNS1hYWJjLTQzOGUtODkzMi00NDU1ZmM1ZGEyY2EiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwbGF5ZXJwcm9maWxlL213RTE3MjEwMDM0Mzc2NjMuanBnIiwiaWF0IjoxNzU1MTY2Njk5LCJleHAiOjIwNzA1MjY2OTl9.c0a4K6VimPMfItbZq1rjL5TEWhcC_319UMgLRRSj9sI"
            alt="데이터 센터 미리보기"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
            priority
          />
        </div>
      </Section>

      {/* 골 때리는 그녀들 데이터센터 소개 Section */}
      <Section
        padding="sm"
        className="py-20 bg-gradient-to-br from-[#ff4800]/5 via-white to-orange-50"
      >
        <div className="max-w-4xl mx-auto text-center">
          <Badge
            variant="emphasisOutline"
            className="w-fit mb-6 text-sm bg-white/50"
          >
            🏆 골 때리는 그녀들 공식 데이터센터
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            방송과 함께하는 데이터 여행
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="bg-white/80 rounded-2xl p-8 backdrop-blur-sm border border-orange-200/50 shadow-lg">
              <div className="flex items-center mb-6">
                <span className="text-3xl mr-3">📺</span>
                <h3 className="text-2xl font-bold text-[#ff4800] tracking-tight">
                  방송 연계
                </h3>
              </div>
              <p className="text-gray-800 leading-relaxed mb-6 text-base font-medium">
                매주 &ldquo;골 때리는 그녀들&rdquo;에서 다룬 경기의 상세
                데이터를 실시간으로 업데이트하여 제공합니다.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-[#ff4800] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-sm font-medium leading-relaxed">
                    매주 업데이트되는 경기 하이라이트
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-[#ff4800] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-sm font-medium leading-relaxed">
                    방송에서 언급된 선수들의 세부 통계
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-[#ff4800] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-sm font-medium leading-relaxed">
                    팀별 시즌 성적 및 순위 변화
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-white/80 rounded-2xl p-8 backdrop-blur-sm border border-orange-200/50 shadow-lg">
              <div className="flex items-center mb-6">
                <span className="text-3xl mr-3">📊</span>
                <h3 className="text-2xl font-bold text-[#ff4800] tracking-tight">
                  체계적 데이터
                </h3>
              </div>
              <p className="text-gray-800 leading-relaxed mb-6 text-base font-medium">
                선수별 포지션, 득점, 어시스트부터 팀별 전적까지 모든 데이터를
                구조화하여 관리합니다.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-[#ff4800] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-sm font-medium leading-relaxed">
                    시즌별/팀별 상세 통계 제공
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-[#ff4800] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-sm font-medium leading-relaxed">
                    선수 개인 기록 및 커리어 추적
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-[#ff4800] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-sm font-medium leading-relaxed">
                    직관적인 검색 및 비교 기능
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* 득점왕 랭킹 Section */}
      <Section padding="sm" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#ff4800]/10 flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-[#ff4800]" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              현재 득점왕 TOP 5
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              이번 시즌 가장 많은 골을 넣은 선수들을 확인해보세요
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <GoalWrapper fallback={<TopScorersLoading />}>
              <TopScorersList />
            </GoalWrapper>

            <div className="text-center mt-8">
              <Link href="/stats/scoring">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-[#ff4800] border-[#ff4800] hover:bg-[#ff4800] hover:text-white"
                >
                  전체 득점 랭킹 보기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* 다가오는 경기 Section */}
      <Section padding="sm" className="py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">다가오는 경기</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            곧 펼쳐질 흥미진진한 경기들을 미리 확인해보세요
          </p>
        </div>
        <GoalWrapper fallback={<UpcomingMatchesSkeleton items={1} />}>
          <UpcomingMatches />
        </GoalWrapper>
      </Section>

      {/* 핵심 특징 Section */}
      <Section padding="sm" className="py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">핵심 특징</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            우리만의 방식으로 축구 데이터를 제공합니다
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center group">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ff4800]/5 flex items-center justify-center group-hover:bg-[#ff4800]/10 transition-colors">
              <Sparkles className="h-8 w-8 text-[#ff4800]/70" />
            </div>
            <h3 className="text-xl font-bold mb-3">정돈된 기록</h3>
            <p className="text-gray-600 leading-relaxed">
              시즌/리그 체계에 맞춘 일관된 데이터 구조
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ff4800]/5 flex items-center justify-center group-hover:bg-[#ff4800]/10 transition-colors">
              <TrendingUp className="h-8 w-8 text-[#ff4800]/70" />
            </div>
            <h3 className="text-xl font-bold mb-3">빠른 탐색</h3>
            <p className="text-gray-600 leading-relaxed">
              시즌, 선수, 팀 단위로 즉시 비교/조회
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ff4800]/5 flex items-center justify-center group-hover:bg-[#ff4800]/10 transition-colors">
              <PlayCircle className="h-8 w-8 text-[#ff4800]/70" />
            </div>
            <h3 className="text-xl font-bold mb-3">하이라이트 링크</h3>
            <p className="text-gray-600 leading-relaxed">
              경기 카드에서 바로 영상으로 이동
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ff4800]/5 flex items-center justify-center group-hover:bg-[#ff4800]/10 transition-colors">
              <BarChart3 className="h-8 w-8 text-[#ff4800]/70" />
            </div>
            <h3 className="text-xl font-bold mb-3">다양한 통계</h3>
            <p className="text-gray-600 leading-relaxed">
              득점, 골키퍼, 팀 순위 등 다각도 분석
            </p>
          </div>
        </div>
      </Section>

      {/* 소개 Section */}
      <Section padding="sm" className="py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">우리의 미션</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              여자 축구의 데이터를 체계적으로 보존하고 공유합니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-[#ff4800]/10 flex items-center justify-center mb-4">
                  <PlayCircle className="h-6 w-6 text-[#ff4800]" />
                </div>
                <CardTitle className="text-2xl text-[#ff4800]">
                  방송 연계 데이터
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  &ldquo;골 때리는 그녀들&rdquo; 방송에서 다룬 모든 경기의 상세
                  데이터를 실시간으로 수집하고 정리하여, 시청자들이 방송 내용을
                  더 깊이 이해할 수 있도록 돕습니다.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-[#ff4800]/10 flex items-center justify-center mb-4">
                  <Database className="h-6 w-6 text-[#ff4800]" />
                </div>
                <CardTitle className="text-2xl text-[#ff4800]">
                  체계적 아카이브
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  선수 개인 기록부터 팀 전적, 시즌별 통계까지 모든 데이터를
                  구조화하여 보관하고, 누구나 쉽게 검색하고 비교할 수 있는
                  플랫폼을 제공합니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>

      {/* 바로가기 Section */}
      <Section padding="sm" className="py-20 bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            서비스 바로가기
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            원하는 정보를 빠르게 찾아보세요
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="group hover:scale-105 transition-all duration-300 border-l-4 border-[#ff4800]/60 h-full bg-white shadow-lg hover:shadow-xl">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#ff4800]/5 flex items-center justify-center group-hover:bg-[#ff4800]/10 transition-colors">
                <List className="h-6 w-6 text-[#ff4800]/70" />
              </div>
              <CardTitle className="text-xl font-bold">
                시즌별 기록 보기
              </CardTitle>
              <CardDescription className="text-base">
                시즌별 경기 결과와 순위를 확인합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/seasons">
                <Button className="w-full">시즌 목록 보기</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-300 h-full bg-white shadow-lg hover:shadow-xl">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#ff4800]/5 flex items-center justify-center group-hover:bg-[#ff4800]/10 transition-colors">
                <Users className="h-6 w-6 text-[#ff4800]/70" />
              </div>
              <CardTitle className="text-xl font-bold">
                선수 정보 보기
              </CardTitle>
              <CardDescription className="text-base">
                선수 프로필과 시즌별 기록을 조회합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/players">
                <Button className="w-full">선수 정보 보기</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-300 h-full bg-white shadow-lg hover:shadow-xl">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#ff4800]/5 flex items-center justify-center group-hover:bg-[#ff4800]/10 transition-colors">
                <Trophy className="h-6 w-6 text-[#ff4800]/70" />
              </div>
              <CardTitle className="text-xl font-bold">팀 정보 보기</CardTitle>
              <CardDescription className="text-base">
                팀 스쿼드, 시즌 성적, 우승 기록을 확인합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/teams">
                <Button className="w-full">팀 정보 보기</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-300 border-l-4 border-[#ff4800]/60 h-full bg-white shadow-lg hover:shadow-xl">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#ff4800]/5 flex items-center justify-center group-hover:bg-[#ff4800]/10 transition-colors">
                <BarChart3 className="h-6 w-6 text-[#ff4800]/70" />
              </div>
              <CardTitle className="text-xl font-bold">통계 분석</CardTitle>
              <CardDescription className="text-base">
                득점, 골키퍼, 팀별 통계 및 순위를 확인합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/stats">
                <Button className="w-full">통계 보기</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:scale-105 transition-all duration-300 h-full bg-white shadow-lg hover:shadow-xl">
            <CardHeader className="space-y-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <Database className="h-6 w-6 text-gray-400" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-400">
                데이터베이스
              </CardTitle>
              <CardDescription className="text-base">
                데이터 백업/관리 (개발 예정)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full" disabled>
                개발 예정
              </Button>
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  );
}
