import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta = {
  title: 'Design System/Introduction',
  parameters: {
    docs: {
      description: {
        component:
          'Goal Crush Design System - 스포츠 데이터 플랫폼을 위한 포괄적인 디자인 시스템',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Welcome: Story = {
  render: () => (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Goal Crush Design System
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          스포츠 데이터 플랫폼을 위한 포괄적인 디자인 시스템입니다. 일관된
          사용자 경험을 제공하는 재사용 가능한 컴포넌트와 디자인 토큰을
          제공합니다.
        </p>
      </div>

      {/* Key Principles */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-blue-900">일관성</h3>
          <p className="text-sm text-blue-700">
            모든 인터페이스에서 통일된 시각적 언어를 제공합니다.
          </p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-green-900">접근성</h3>
          <p className="text-sm text-green-700">
            WCAG 2.1 AA 기준을 준수하는 접근 가능한 컴포넌트를 제공합니다.
          </p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-purple-900">성능</h3>
          <p className="text-sm text-purple-700">
            최적화된 경량 컴포넌트로 빠른 로딩을 보장합니다.
          </p>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-orange-900">
            스포츠 특화
          </h3>
          <p className="text-sm text-orange-700">
            스포츠 데이터와 판타지 애플리케이션에 특화된 컴포넌트입니다.
          </p>
        </div>
      </div>

      {/* Architecture */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">아키텍처</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-[#ff4800]">
              🎨 디자인 토큰
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Colors - 브랜드, 시멘틱, 중성 색상</li>
              <li>• Typography - 폰트 스케일과 텍스트 스타일</li>
              <li>• Spacing - 일관된 간격 체계</li>
            </ul>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-[#ff4800]">
              🧩 컴포넌트
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Base - 버튼, 입력, 카드, 배지</li>
              <li>• Layout - 컨테이너, 그리드, 섹션</li>
              <li>• Sports - 선수 카드, 팀 디스플레이</li>
            </ul>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-[#ff4800]">
              📱 반응형
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Mobile First 접근</li>
              <li>• 일관된 브레이크포인트</li>
              <li>• 적응형 컴포넌트</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">주요 기능</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">TypeScript 완전 지원</span>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Tailwind CSS 통합</span>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">접근성 우선 설계</span>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">React 18 호환</span>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Next.js 최적화</span>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">테스트 준비 완료</span>
          </div>
        </div>
      </div>

      {/* Brand Integration */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-8 rounded-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">브랜드 통합</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-[#ff4800] rounded"></div>
            <div>
              <div className="font-semibold">Primary Brand Color: #ff4800</div>
              <div className="text-sm text-gray-600">
                역동적인 오렌지-레드 컬러
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">🏆 스포츠 컨텍스트</h4>
              <p className="text-gray-600">
                트로피 아이콘, 팀 컬러, 선수 이미지
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🇰🇷 한국어 지원</h4>
              <p className="text-gray-600">
                한국어 콘텐츠에 최적화된 타이포그래피
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">⚡ 판타지 게임</h4>
              <p className="text-gray-600">판타지 스포츠 전용 UI 패턴</p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">시작하기</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <ol className="space-y-3 text-sm">
            <li className="flex items-start space-x-3">
              <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                1
              </span>
              <span>
                <strong>Design Tokens</strong> 섹션에서 기본 토큰을 확인하세요
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                2
              </span>
              <span>
                <strong>Components</strong> 섹션에서 사용 가능한 UI 요소를
                탐색하세요
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                3
              </span>
              <span>
                <strong>Examples</strong>에서 일반적인 사용 패턴을 확인하세요
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                4
              </span>
              <span>
                <strong>Guidelines</strong>에서 구현 모범 사례를 검토하세요
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  ),
};
