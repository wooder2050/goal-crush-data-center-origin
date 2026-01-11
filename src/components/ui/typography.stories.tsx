import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Body, Caption, H1, H2, H3, Label, Typography } from './typography';

const meta: Meta<typeof Typography> = {
  title: 'Design System/Components/Typography',
  component: Typography,
  parameters: {
    docs: {
      description: {
        component:
          'Typography component system with consistent text styles and semantic variants. Includes convenience components for common text elements.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'caption', 'label'],
      description: 'Typography variant/style',
    },
    as: {
      control: { type: 'select' },
      options: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'span',
        'div',
        'label',
      ],
      description: 'HTML element to render as',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'body',
    children: '기본 타이포그래피 컴포넌트입니다.',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <Typography variant="h1">H1 - 가장 큰 제목입니다</Typography>
      <Typography variant="h2">H2 - 두 번째 제목입니다</Typography>
      <Typography variant="h3">H3 - 세 번째 제목입니다</Typography>
      <Typography variant="h4">H4 - 네 번째 제목입니다</Typography>
      <Typography variant="h5">H5 - 다섯 번째 제목입니다</Typography>
      <Typography variant="h6">H6 - 여섯 번째 제목입니다</Typography>
      <Typography variant="body">
        Body - 본문 텍스트입니다. Goal Crush 플랫폼에서 사용되는 기본 텍스트
        스타일로, 가독성을 위해 적절한 줄 간격과 색상이 적용되어 있습니다.
      </Typography>
      <Typography variant="caption">
        Caption - 작은 설명 텍스트나 부가 정보를 표시할 때 사용됩니다.
      </Typography>
      <Typography variant="label">
        Label - 폼 라벨이나 강조가 필요한 텍스트에 사용됩니다.
      </Typography>
    </div>
  ),
};

export const ConvenienceComponents: Story = {
  render: () => (
    <div className="space-y-4">
      <H1>H1 컴포넌트 - Goal Crush 메인 제목</H1>
      <H2>H2 컴포넌트 - 섹션 제목</H2>
      <H3>H3 컴포넌트 - 하위 섹션 제목</H3>
      <Body>
        Body 컴포넌트 - 본문 텍스트를 위한 편의 컴포넌트입니다. 별도의 variant
        속성 없이 바로 사용할 수 있습니다.
      </Body>
      <Caption>Caption 컴포넌트 - 작은 텍스트용 편의 컴포넌트</Caption>
      <Label>Label 컴포넌트 - 라벨용 편의 컴포넌트</Label>
    </div>
  ),
};

export const SemanticUsage: Story = {
  name: 'Semantic HTML Usage',
  render: () => (
    <div className="space-y-6">
      <div>
        <H2>의미론적 HTML 사용 예시</H2>
        <Body>
          as 속성을 사용하여 스타일과 별개로 적절한 HTML 요소를 선택할 수
          있습니다.
        </Body>
      </div>

      <div className="space-y-4">
        {/* 실제 heading으로 렌더링 */}
        <Typography variant="h2" as="h1">
          H2 스타일이지만 h1 태그로 렌더링
        </Typography>

        {/* paragraph로 렌더링되는 제목 스타일 */}
        <Typography variant="h3" as="p">
          H3 스타일이지만 p 태그로 렌더링
        </Typography>

        {/* label 요소로 렌더링 */}
        <Typography variant="label" as="label">
          실제 label 태그로 렌더링되는 라벨
        </Typography>

        {/* span으로 렌더링되는 body 텍스트 */}
        <Typography variant="body" as="span">
          인라인으로 표시되는 본문 텍스트
        </Typography>
      </div>
    </div>
  ),
};

export const SportsContent: Story = {
  name: 'Sports Content Examples',
  render: () => (
    <div className="space-y-8">
      {/* Fantasy Section */}
      <div className="space-y-3">
        <H1>판타지 축구</H1>
        <Body>
          매달 5명의 선수를 선택하여 실제 경기 성과로 점수를 획득하고 다른
          팬들과 경쟁하세요!
        </Body>

        <div className="space-y-2">
          <H3>게임 방법</H3>
          <Body>
            팀 편성은 매달 첫째~둘째 주 + 셋째 주 화요일까지 가능하며, 같은
            팀에서 최대 2명까지 선택할 수 있습니다.
          </Body>
        </div>
      </div>

      {/* Player Stats */}
      <div className="space-y-3">
        <H2>선수 통계</H2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label>득점 순위</Label>
            <Body>시즌 누적 득점 기준 상위 선수들을 확인하세요.</Body>
          </div>
          <div>
            <Label>어시스트 순위</Label>
            <Body>도움을 가장 많이 기록한 선수들의 목록입니다.</Body>
          </div>
        </div>
        <Caption>
          * 통계는 매 경기 후 업데이트되며, 공식 기록을 기준으로 합니다.
        </Caption>
      </div>

      {/* Match Information */}
      <div className="space-y-3">
        <H2>경기 정보</H2>
        <H3>FC 서울 vs 수원 삼성</H3>
        <Body>2025년 9월 15일 15:00 | 서울월드컵경기장</Body>
        <Caption>K리그1 34라운드</Caption>
      </div>
    </div>
  ),
};

export const ColorVariations: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <H2>색상 변형 예시</H2>
        <Body>
          Tailwind CSS 클래스를 사용하여 다양한 색상으로 표시할 수 있습니다.
        </Body>
      </div>

      <div className="space-y-4">
        {/* Brand Colors */}
        <H3 className="text-[#ff4800]">브랜드 컬러 제목</H3>
        <Body className="text-[#ff4800]">브랜드 컬러 본문 텍스트</Body>

        {/* Semantic Colors */}
        <H3 className="text-green-600">성공 메시지</H3>
        <Body className="text-green-700">
          선수가 성공적으로 추가되었습니다.
        </Body>

        <H3 className="text-red-600">에러 메시지</H3>
        <Body className="text-red-700">
          선수 선택에 실패했습니다. 다시 시도해주세요.
        </Body>

        <H3 className="text-blue-600">정보 메시지</H3>
        <Body className="text-blue-700">경기는 오후 3시에 시작됩니다.</Body>

        <H3 className="text-yellow-600">경고 메시지</H3>
        <Body className="text-yellow-700">편성 마감까지 2시간 남았습니다.</Body>

        {/* Muted Text */}
        <H3 className="text-gray-600">부가 정보</H3>
        <Caption className="text-gray-500">
          마지막 업데이트: 2025.9.7 22:30
        </Caption>
      </div>
    </div>
  ),
};

export const ResponsiveText: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <H2>반응형 타이포그래피</H2>
        <Body>
          Tailwind CSS의 반응형 클래스를 사용하여 화면 크기에 따라 텍스트 크기를
          조절할 수 있습니다.
        </Body>
      </div>

      <div className="space-y-4">
        <Typography
          variant="h1"
          className="text-lg sm:text-xl md:text-2xl lg:text-3xl"
        >
          화면 크기에 따라 변화하는 제목
        </Typography>

        <Typography variant="body" className="text-sm sm:text-base md:text-lg">
          모바일에서는 작게, 데스크톱에서는 크게 표시되는 본문 텍스트입니다.
        </Typography>

        <Caption className="text-xs sm:text-sm">
          브라우저 창 크기를 조절해서 확인해보세요.
        </Caption>
      </div>
    </div>
  ),
};
