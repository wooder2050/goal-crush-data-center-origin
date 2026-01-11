import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Calendar, MapPin, Star, Trophy, Users } from 'lucide-react';

// Avatar component not available - using placeholder
import { Badge } from './badge';
import { Button } from './button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

const meta: Meta<typeof Card> = {
  title: 'Design System/Components/Card',
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          'A flexible card component with header, content, and footer sections. Perfect for displaying structured information with custom shadows.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>카드 제목</CardTitle>
        <CardDescription>카드에 대한 설명이 여기에 표시됩니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          카드의 주요 내용이 이곳에 들어갑니다. 다양한 정보를 구조화하여 보여줄
          수 있습니다.
        </p>
      </CardContent>
      <CardFooter>
        <Button>액션 버튼</Button>
      </CardFooter>
    </Card>
  ),
};

export const BasicStructure: Story = {
  render: () => (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Header Only */}
      <Card>
        <CardHeader>
          <CardTitle>헤더만 있는 카드</CardTitle>
          <CardDescription>설명 텍스트</CardDescription>
        </CardHeader>
      </Card>

      {/* Content Only */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">컨텐츠만 있는 카드</h3>
          <p className="text-sm text-gray-600">내용이 바로 시작됩니다.</p>
        </CardContent>
      </Card>

      {/* Header + Content */}
      <Card>
        <CardHeader>
          <CardTitle>헤더 + 컨텐츠</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            헤더와 컨텐츠가 함께 있는 카드입니다.
          </p>
        </CardContent>
      </Card>

      {/* Full Structure */}
      <Card>
        <CardHeader>
          <CardTitle>완전한 구조</CardTitle>
          <CardDescription>모든 섹션이 포함된 카드</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            헤더, 컨텐츠, 푸터가 모두 있습니다.
          </p>
        </CardContent>
        <CardFooter>
          <Button size="sm">액션</Button>
        </CardFooter>
      </Card>
    </div>
  ),
};

export const PlayerCard: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">손</span>
          </div>
          <div>
            <CardTitle className="text-lg">손흥민</CardTitle>
            <CardDescription>토트넘 • 공격수 • #7</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-[#ff4800]">15</div>
            <div className="text-xs text-gray-500">골</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">8</div>
            <div className="text-xs text-gray-500">어시스트</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">125</div>
            <div className="text-xs text-gray-500">판타지 점수</div>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <Badge variant="trophy">
            <Star className="mr-1 h-3 w-3" />
            베스트 11
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">선수 선택</Button>
      </CardFooter>
    </Card>
  ),
};

export const MatchCard: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription className="flex items-center">
            <Calendar className="mr-1 h-4 w-4" />
            2025년 9월 15일 15:00
          </CardDescription>
          <Badge variant="emphasis">LIVE</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-red-600 font-bold">FC</span>
            </div>
            <div className="font-semibold">FC 서울</div>
          </div>

          {/* Score */}
          <div className="text-center px-6">
            <div className="text-3xl font-bold">2 - 1</div>
            <div className="text-sm text-gray-500 mt-1">전반 45분</div>
          </div>

          {/* Away Team */}
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 font-bold">수원</span>
            </div>
            <div className="font-semibold">수원 삼성</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
          <MapPin className="mr-1 h-4 w-4" />
          서울월드컵경기장
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full space-x-2">
          <Button variant="outline" className="flex-1">
            하이라이트
          </Button>
          <Button className="flex-1">상세보기</Button>
        </div>
      </CardFooter>
    </Card>
  ),
};

export const FantasySeasonCard: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>2025년 9월 시즌</span>
              <Badge variant="default">편성 중</Badge>
            </CardTitle>
            <CardDescription>골때리는 그녀들 시즌 7 G리그</CardDescription>
          </div>
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">참여 팀 수</span>
            <div className="flex items-center">
              <Users className="mr-1 h-4 w-4" />
              <span className="font-semibold">124팀</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">편성 마감</span>
            <span className="font-semibold">2025.9.15 23:59</span>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="text-sm font-medium mb-1">내 팀 현황</div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Goal Crushers</span>
              <Badge variant="outline">98점</Badge>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full space-x-2">
          <Button variant="outline" className="flex-1">
            내 팀 관리
          </Button>
          <Button className="flex-1">랭킹 보기</Button>
        </div>
      </CardFooter>
    </Card>
  ),
};

export const StatsCard: Story = {
  name: 'Stats Card Example',
  render: () => (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Simple Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#ff4800]">1,247</div>
            <div className="text-sm text-gray-500 mt-1">총 경기 수</div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">시즌 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">득점</span>
              <span className="font-semibold">2.3 경기당</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">어시스트</span>
              <span className="font-semibold">1.8 경기당</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">승률</span>
              <span className="font-semibold text-green-600">68.5%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

export const InteractiveCard: Story = {
  render: () => (
    <Card className="w-80 cursor-pointer hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <CardTitle>클릭 가능한 카드</CardTitle>
        <CardDescription>이 카드는 호버 효과가 있습니다</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          마우스를 올려보세요. 그림자가 변화하는 것을 확인할 수 있습니다.
        </p>
      </CardContent>
    </Card>
  ),
};

export const VariousWidths: Story = {
  render: () => (
    <div className="space-y-6">
      {/* Narrow */}
      <Card className="w-64">
        <CardHeader>
          <CardTitle>좁은 카드</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">최소 너비의 카드입니다.</p>
        </CardContent>
      </Card>

      {/* Medium */}
      <Card className="w-96">
        <CardHeader>
          <CardTitle>중간 크기 카드</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            일반적으로 사용되는 중간 크기의 카드입니다.
          </p>
        </CardContent>
      </Card>

      {/* Full Width */}
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>전체 너비 카드</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            컨테이너의 전체 너비를 사용하는 카드입니다. 더 많은 정보를 표시할 수
            있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
};
