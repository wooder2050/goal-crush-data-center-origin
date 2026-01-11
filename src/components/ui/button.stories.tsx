import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Download, Heart, Mail, Plus, Trash2 } from 'lucide-react';

import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Design System/Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'A versatile button component with multiple variants and sizes. Built with class-variance-authority for consistent styling.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ],
      description: 'Visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Size variant of the button',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disable the button interaction',
    },
    asChild: {
      control: { type: 'boolean' },
      description: 'Render as child element (using Radix Slot)',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: '기본 버튼',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">기본</Button>
      <Button variant="destructive">삭제</Button>
      <Button variant="outline">외곽선</Button>
      <Button variant="secondary">보조</Button>
      <Button variant="ghost">고스트</Button>
      <Button variant="link">링크</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="sm">작은 버튼</Button>
      <Button size="default">기본 버튼</Button>
      <Button size="lg">큰 버튼</Button>
      <Button size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>
        <Mail className="mr-2 h-4 w-4" />
        이메일 보내기
      </Button>
      <Button variant="outline">
        <Download className="mr-2 h-4 w-4" />
        다운로드
      </Button>
      <Button variant="destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        삭제하기
      </Button>
      <Button variant="ghost" size="icon">
        <Heart className="h-4 w-4" />
      </Button>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Button>기본 상태</Button>
        <Button disabled>비활성화</Button>
      </div>
      <div className="text-sm text-gray-600">
        호버 상태를 확인하려면 버튼에 마우스를 올려보세요.
      </div>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button disabled>
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
        로딩 중...
      </Button>
      <Button variant="outline" disabled>
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
        처리 중...
      </Button>
    </div>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-2">
      <Button className="w-full">전체 너비 버튼</Button>
      <Button variant="outline" className="w-full">
        전체 너비 외곽선 버튼
      </Button>
    </div>
  ),
};

export const SportsContext: Story = {
  name: 'Sports Context Examples',
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3">Fantasy Team Actions</h4>
        <div className="flex flex-wrap gap-3">
          <Button>팀 만들기</Button>
          <Button variant="outline">내 팀 관리</Button>
          <Button variant="secondary">랭킹 보기</Button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">Player Actions</h4>
        <div className="flex flex-wrap gap-3">
          <Button size="sm">선수 선택</Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-1 h-3 w-3" />
            선수 제거
          </Button>
          <Button variant="ghost" size="sm">
            선수 정보
          </Button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">Match Actions</h4>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline">경기 보기</Button>
          <Button variant="secondary">하이라이트</Button>
          <Button variant="link">상세 통계</Button>
        </div>
      </div>
    </div>
  ),
};
