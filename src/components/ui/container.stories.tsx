import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Container } from './container';

const meta: Meta<typeof Container> = {
  title: 'Design System/Layout/Container',
  component: Container,
  parameters: {
    docs: {
      description: {
        component:
          'A flexible container component with responsive width constraints and padding options. Perfect for creating consistent page layouts.',
      },
    },
  },
  argTypes: {
    maxWidth: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', '2xl', '7xl'],
      description: 'Maximum width constraint',
    },
    padding: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Padding size',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="bg-blue-100 p-4 rounded">
        <h3 className="font-semibold mb-2">기본 컨테이너</h3>
        <p className="text-sm text-gray-700">
          이것은 기본 설정을 사용하는 컨테이너입니다. 최대 너비는 7xl이고 중간
          패딩이 적용됩니다.
        </p>
      </div>
    ),
  },
};

export const MaxWidths: Story = {
  render: () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">다양한 최대 너비</h3>

      <Container maxWidth="sm">
        <div className="bg-red-100 p-4 rounded text-center">
          <strong>sm (24rem)</strong> - 작은 컨테이너
        </div>
      </Container>

      <Container maxWidth="md">
        <div className="bg-green-100 p-4 rounded text-center">
          <strong>md (28rem)</strong> - 중간 컨테이너
        </div>
      </Container>

      <Container maxWidth="lg">
        <div className="bg-blue-100 p-4 rounded text-center">
          <strong>lg (32rem)</strong> - 큰 컨테이너
        </div>
      </Container>

      <Container maxWidth="xl">
        <div className="bg-yellow-100 p-4 rounded text-center">
          <strong>xl (36rem)</strong> - 매우 큰 컨테이너
        </div>
      </Container>

      <Container maxWidth="2xl">
        <div className="bg-purple-100 p-4 rounded text-center">
          <strong>2xl (42rem)</strong> - 초대형 컨테이너
        </div>
      </Container>

      <Container maxWidth="7xl">
        <div className="bg-gray-100 p-4 rounded text-center">
          <strong>7xl (80rem)</strong> - 최대 컨테이너 (기본값)
        </div>
      </Container>
    </div>
  ),
};

export const PaddingOptions: Story = {
  render: () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">다양한 패딩 옵션</h3>

      <Container maxWidth="lg" padding="none">
        <div className="bg-red-100 border-2 border-red-300 rounded">
          <div className="bg-red-200 p-2 text-center">
            <strong>none</strong> - 패딩 없음
          </div>
        </div>
      </Container>

      <Container maxWidth="lg" padding="sm">
        <div className="bg-green-100 border-2 border-green-300 rounded">
          <div className="bg-green-200 p-2 text-center">
            <strong>sm (px-4)</strong> - 작은 패딩
          </div>
        </div>
      </Container>

      <Container maxWidth="lg" padding="md">
        <div className="bg-blue-100 border-2 border-blue-300 rounded">
          <div className="bg-blue-200 p-2 text-center">
            <strong>md (px-4 lg:px-6)</strong> - 중간 패딩 (기본값)
          </div>
        </div>
      </Container>

      <Container maxWidth="lg" padding="lg">
        <div className="bg-yellow-100 border-2 border-yellow-300 rounded">
          <div className="bg-yellow-200 p-2 text-center">
            <strong>lg (px-6 lg:px-8)</strong> - 큰 패딩
          </div>
        </div>
      </Container>

      <Container maxWidth="lg" padding="xl">
        <div className="bg-purple-100 border-2 border-purple-300 rounded">
          <div className="bg-purple-200 p-2 text-center">
            <strong>xl (px-8 lg:px-12)</strong> - 매우 큰 패딩
          </div>
        </div>
      </Container>
    </div>
  ),
};

export const TypicalUsage: Story = {
  name: 'Typical Page Layout',
  render: () => (
    <div className="space-y-8">
      {/* Header */}
      <Container maxWidth="7xl" padding="md" className="bg-gray-900 text-white">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-xl font-bold">Goal Crush</h1>
          <nav className="flex space-x-6">
            <a href="#" className="hover:text-[#ff4800]">
              홈
            </a>
            <a href="#" className="hover:text-[#ff4800]">
              판타지
            </a>
            <a href="#" className="hover:text-[#ff4800]">
              통계
            </a>
          </nav>
        </div>
      </Container>

      {/* Hero Section */}
      <Container maxWidth="2xl" padding="lg" className="text-center">
        <h2 className="text-3xl font-bold mb-4">판타지 축구의 새로운 경험</h2>
        <p className="text-gray-600 mb-6">
          매달 5명의 선수를 선택하여 실제 경기 성과로 점수를 획득하고 다른
          팬들과 경쟁하세요!
        </p>
        <button className="bg-[#ff4800] text-white px-6 py-3 rounded-lg hover:bg-[#e6410a]">
          지금 시작하기
        </button>
      </Container>

      {/* Content Section */}
      <Container maxWidth="xl" padding="md">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-2">쉬운 팀 편성</h3>
            <p className="text-sm text-gray-600">
              직관적인 인터페이스로 간편하게 팀을 편성하세요.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-2">실시간 점수</h3>
            <p className="text-sm text-gray-600">
              경기 진행에 따라 실시간으로 업데이트되는 점수를 확인하세요.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-2">친구와 경쟁</h3>
            <p className="text-sm text-gray-600">
              리그를 만들어 친구들과 함께 경쟁해보세요.
            </p>
          </div>
        </div>
      </Container>

      {/* Footer */}
      <Container
        maxWidth="7xl"
        padding="md"
        className="bg-gray-100 text-center"
      >
        <p className="text-sm text-gray-600 py-4">
          © 2025 Goal Crush. All rights reserved.
        </p>
      </Container>
    </div>
  ),
};

export const ResponsiveBehavior: Story = {
  name: 'Responsive Behavior Demo',
  render: () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">반응형 동작 데모</h3>
      <p className="text-sm text-gray-600 mb-4">
        브라우저 창 크기를 조절해서 패딩이 어떻게 변화하는지 확인해보세요.
      </p>

      <Container maxWidth="lg" padding="md">
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-lg">
          <h4 className="font-semibold mb-2">반응형 컨테이너</h4>
          <p className="text-sm text-gray-700">
            이 컨테이너는 화면 크기에 따라 패딩이 자동으로 조정됩니다:
          </p>
          <ul className="text-sm text-gray-600 mt-3 space-y-1">
            <li>• 작은 화면: px-4 (좌우 16px)</li>
            <li>• 큰 화면: px-6 (좌우 24px)</li>
          </ul>
        </div>
      </Container>
    </div>
  ),
};
