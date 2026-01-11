import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Typography } from '../../components/ui/typography';
import { typography } from '../tokens/typography';

const meta: Meta = {
  title: 'Design System/Tokens/Typography',
  parameters: {
    docs: {
      description: {
        component:
          'Typography scales, weights, and text styles used throughout the Goal Crush design system.',
      },
    },
  },
};

export default meta;

const TypographyScale = ({
  scale,
  title,
  description,
}: {
  scale: Record<string, Record<string, string>>;
  title: string;
  description?: string;
}) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="text-sm text-gray-600">{description}</p>}
    </div>
    <div className="space-y-6">
      {Object.entries(scale).map(([key, styles]) => (
        <div key={key} className="border-b pb-4">
          <div
            className="mb-2"
            style={{
              fontSize: styles.fontSize,
              fontWeight: styles.fontWeight,
              lineHeight: styles.lineHeight,
              color: styles.color || 'inherit',
            }}
          >
            {key === 'body' &&
              '이것은 본문 텍스트의 예시입니다. Goal Crush에서 사용되는 기본 텍스트 스타일입니다.'}
            {key === 'label' && '라벨 텍스트'}
            {key === 'caption' && '캡션이나 부가 정보를 위한 작은 텍스트'}
            {key === 'link' && (
              <a href="#" className="underline">
                링크 텍스트 스타일
              </a>
            )}
            {key.startsWith('h') &&
              `${key.toUpperCase()} 제목 - Goal Crush ${key === 'h1' ? '메인' : key === 'h2' ? '섹션' : '하위'} 제목`}
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>
              <strong>{key}</strong>
            </div>
            <div>Font Size: {styles.fontSize}</div>
            <div>Font Weight: {styles.fontWeight}</div>
            <div>Line Height: {styles.lineHeight}</div>
            {styles.color && <div>Color: {styles.color}</div>}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const HeadingScale: StoryObj = {
  render: () => {
    const headings = Object.fromEntries(
      Object.entries(typography.scale).filter(([key]) => key.startsWith('h'))
    );
    return (
      <TypographyScale
        scale={headings}
        title="Heading Scale"
        description="Typography hierarchy for headings H1-H6"
      />
    );
  },
};

export const TextStyles: StoryObj = {
  render: () => {
    const textStyles = Object.fromEntries(
      Object.entries(typography.scale).filter(([key]) => !key.startsWith('h'))
    );
    return (
      <TypographyScale
        scale={textStyles}
        title="Text Styles"
        description="Body text, labels, captions, and interactive text styles"
      />
    );
  },
};

export const FontSizes: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Font Size Scale</h3>
        <p className="text-sm text-gray-600">
          Available font sizes in the design system
        </p>
      </div>
      <div className="space-y-3">
        {Object.entries(typography.fontSize).map(([key, size]) => (
          <div
            key={key}
            className="flex items-baseline space-x-4 p-3 border rounded"
          >
            <div className="w-12 text-xs text-gray-500 font-mono">{key}</div>
            <div style={{ fontSize: size }} className="flex-grow">
              텍스트 크기 예시 - Text Size Example
            </div>
            <div className="text-xs text-gray-500 font-mono">{size}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const FontWeights: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Font Weights</h3>
        <p className="text-sm text-gray-600">
          Available font weights in the design system
        </p>
      </div>
      <div className="space-y-3">
        {Object.entries(typography.fontWeight).map(([key, weight]) => (
          <div
            key={key}
            className="flex items-center space-x-4 p-3 border rounded"
          >
            <div className="w-16 text-xs text-gray-500 font-mono">{key}</div>
            <div style={{ fontWeight: weight }} className="flex-grow text-lg">
              폰트 굵기 예시 - Font Weight Example
            </div>
            <div className="text-xs text-gray-500 font-mono">{weight}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const LineHeights: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Line Heights</h3>
        <p className="text-sm text-gray-600">
          Different line height values for optimal readability
        </p>
      </div>
      <div className="space-y-6">
        {Object.entries(typography.lineHeight).map(([key, lineHeight]) => (
          <div key={key} className="p-4 border rounded">
            <div className="text-sm font-medium mb-2 text-gray-600">
              {key} ({lineHeight})
            </div>
            <div style={{ lineHeight }} className="text-sm">
              이것은 줄 간격 예시 텍스트입니다. Goal Crush 디자인 시스템에서는
              다양한 줄 간격을 사용하여 최적의 가독성을 제공합니다. 텍스트의
              종류와 용도에 따라 적절한 줄 간격을 선택할 수 있습니다. This is
              example text for line height demonstration. The Goal Crush design
              system uses various line heights to provide optimal readability.
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const AllTypography: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">모든 타이포그래피</h2>
        <p className="text-sm text-gray-600 mb-6">
          Goal Crush 디자인 시스템의 전체 타이포그래피 체계입니다.
        </p>

        <div className="space-y-6">
          <Typography variant="h1">H1 - 가장 큰 제목입니다</Typography>
          <Typography variant="h2">H2 - 두 번째 제목입니다</Typography>
          <Typography variant="h3">H3 - 세 번째 제목입니다</Typography>
          <Typography variant="body">
            Body - 본문 텍스트입니다. Goal Crush 플랫폼에서 사용되는 기본 텍스트
            스타일입니다.
          </Typography>
          <Typography variant="caption">
            Caption - 작은 설명 텍스트나 부가 정보를 표시할 때 사용됩니다.
          </Typography>
          <Typography variant="label">
            Label - 폼 라벨이나 강조가 필요한 텍스트에 사용됩니다.
          </Typography>
        </div>
      </div>
    </div>
  ),
};
