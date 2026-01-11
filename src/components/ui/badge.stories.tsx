import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Calendar, Star, Trophy, Users } from 'lucide-react';

import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'Design System/Components/Badge',
  component: Badge,
  parameters: {
    docs: {
      description: {
        component:
          'A flexible badge component for displaying status, categories, and achievements. Includes sports-specific variants for trophies and categories.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'default',
        'secondary',
        'destructive',
        'outline',
        'discount',
        'category',
        'emphasis',
        'emphasisOutline',
        'trophy',
        'trophyOutline',
      ],
      description: 'Visual style variant of the badge',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: '기본 배지',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default">기본</Badge>
      <Badge variant="secondary">보조</Badge>
      <Badge variant="destructive">삭제</Badge>
      <Badge variant="outline">외곽선</Badge>
      <Badge variant="discount">할인</Badge>
      <Badge variant="category">카테고리</Badge>
      <Badge variant="emphasis">강조</Badge>
      <Badge variant="emphasisOutline">강조 외곽선</Badge>
      <Badge variant="trophy">트로피</Badge>
      <Badge variant="trophyOutline">트로피 외곽선</Badge>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="trophy">
        <Trophy className="mr-1 h-3 w-3" />
        우승
      </Badge>
      <Badge variant="emphasis">
        <Star className="mr-1 h-3 w-3" />
        베스트
      </Badge>
      <Badge variant="secondary">
        <Calendar className="mr-1 h-3 w-3" />
        시즌 진행중
      </Badge>
      <Badge variant="outline">
        <Users className="mr-1 h-3 w-3" />
        124팀 참여
      </Badge>
    </div>
  ),
};

export const StatusBadges: Story = {
  name: 'Status Examples',
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2">Fantasy Season Status</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">시작 예정</Badge>
          <Badge variant="default">편성 중</Badge>
          <Badge variant="secondary">편성 마감</Badge>
          <Badge variant="destructive">시즌 종료</Badge>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Player Status</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="emphasis">선발</Badge>
          <Badge variant="secondary">교체</Badge>
          <Badge variant="outline">벤치</Badge>
          <Badge variant="destructive">부상</Badge>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Match Status</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">경기 전</Badge>
          <Badge variant="emphasis">진행 중</Badge>
          <Badge variant="default">종료</Badge>
          <Badge variant="secondary">연기</Badge>
        </div>
      </div>
    </div>
  ),
};

export const ScoringBadges: Story = {
  name: 'Scoring & Stats',
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2">Fantasy Points</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="trophy">125점</Badge>
          <Badge variant="emphasis">98점</Badge>
          <Badge variant="default">76점</Badge>
          <Badge variant="outline">45점</Badge>
          <Badge variant="secondary">12점</Badge>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Player Stats</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="emphasis">15골</Badge>
          <Badge variant="default">8어시</Badge>
          <Badge variant="outline">3클린시트</Badge>
          <Badge variant="secondary">2옐로카드</Badge>
          <Badge variant="destructive">1레드카드</Badge>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Team Performance</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="trophy">1위</Badge>
          <Badge variant="emphasisOutline">2위</Badge>
          <Badge variant="default">3위</Badge>
          <Badge variant="outline">중위권</Badge>
          <Badge variant="destructive">강등권</Badge>
        </div>
      </div>
    </div>
  ),
};

export const CategoryBadges: Story = {
  name: 'League Categories',
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2">League Types</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="category">K리그1</Badge>
          <Badge variant="category">K리그2</Badge>
          <Badge variant="category">WK리그</Badge>
          <Badge variant="category">G리그</Badge>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Position Tags</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="emphasis">GK</Badge>
          <Badge variant="default">DF</Badge>
          <Badge variant="default">MF</Badge>
          <Badge variant="emphasis">FW</Badge>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Achievement Badges</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="trophy">
            <Trophy className="mr-1 h-3 w-3" />
            챔피언
          </Badge>
          <Badge variant="trophyOutline">
            <Star className="mr-1 h-3 w-3" />
            MVP
          </Badge>
          <Badge variant="emphasis">베스트11</Badge>
          <Badge variant="emphasisOutline">득점왕</Badge>
        </div>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Badge className="text-xs px-2 py-0.5">작은 배지</Badge>
      <Badge>기본 배지</Badge>
      <Badge className="text-sm px-3 py-1">큰 배지</Badge>
    </div>
  ),
};

export const Interactive: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2">Clickable Badges</h4>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => alert('Category clicked')}
          >
            클릭 가능한 카테고리
          </Badge>
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-gray-200"
            onClick={() => alert('Filter clicked')}
          >
            필터: 공격수
          </Badge>
          <Badge
            variant="emphasis"
            className="cursor-pointer hover:bg-[#ff4800]/90"
            onClick={() => alert('Action clicked')}
          >
            액션 배지
          </Badge>
        </div>
      </div>
      <div className="text-xs text-gray-600">위 배지들을 클릭해보세요!</div>
    </div>
  ),
};
