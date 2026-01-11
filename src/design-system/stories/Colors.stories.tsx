import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { colors } from '../tokens/colors';

const meta: Meta = {
  title: 'Design System/Tokens/Colors',
  parameters: {
    docs: {
      description: {
        component:
          'Color palette and tokens used throughout the Goal Crush design system.',
      },
    },
  },
};

export default meta;

// Color swatch component for display
const ColorSwatch = ({
  color,
  name,
  description,
}: {
  color: string;
  name: string;
  description?: string;
}) => (
  <div className="flex items-center space-x-3 p-3 border rounded-lg">
    <div
      className="w-12 h-12 rounded-lg border shadow-sm flex-shrink-0"
      style={{ backgroundColor: color }}
    />
    <div className="flex-grow">
      <div className="font-semibold text-sm">{name}</div>
      <div className="text-xs text-gray-500 font-mono">{color}</div>
      {description && (
        <div className="text-xs text-gray-600 mt-1">{description}</div>
      )}
    </div>
  </div>
);

const ColorGrid = ({
  colors: colorObj,
  title,
  description,
}: {
  colors: Record<string, string>;
  title: string;
  description?: string;
}) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="text-sm text-gray-600">{description}</p>}
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      {Object.entries(colorObj).map(([key, value]) => (
        <ColorSwatch key={key} name={key} color={value} />
      ))}
    </div>
  </div>
);

export const BrandColors: StoryObj = {
  render: () => (
    <ColorGrid
      colors={colors.brand}
      title="Brand Colors"
      description="Primary brand colors used for CTAs, emphasis, and brand recognition."
    />
  ),
};

export const NeutralColors: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Neutral Colors</h3>
        <p className="text-sm text-gray-600">
          Grayscale palette for backgrounds, borders, and text. Based on HSL
          values from our CSS custom properties.
        </p>
      </div>
      <div className="grid gap-2">
        {Object.entries(colors.neutral).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center space-x-3 p-2 border rounded"
          >
            <div
              className="w-8 h-8 rounded border shadow-sm flex-shrink-0"
              style={{ backgroundColor: value }}
            />
            <div className="flex-grow">
              <span className="font-semibold text-sm">neutral.{key}</span>
              <div className="text-xs text-gray-500 font-mono">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const SemanticColors: StoryObj = {
  render: () => (
    <div className="space-y-8">
      {Object.entries(colors.semantic).map(([category, colorScale]) => (
        <div key={category} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold capitalize">
              {category} Colors
            </h3>
            <p className="text-sm text-gray-600">
              {category === 'success' &&
                'Used for positive actions, confirmations, and success states.'}
              {category === 'warning' &&
                'Used for warnings, cautions, and attention-grabbing elements.'}
              {category === 'error' &&
                'Used for errors, destructive actions, and critical alerts.'}
              {category === 'info' &&
                'Used for informational content and neutral notifications.'}
            </p>
          </div>
          <div className="grid gap-2">
            {Object.entries(colorScale).map(([shade, color]) => (
              <div
                key={shade}
                className="flex items-center space-x-3 p-2 border rounded"
              >
                <div
                  className="w-8 h-8 rounded border shadow-sm flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-grow">
                  <span className="font-semibold text-sm">
                    {category}.{shade}
                  </span>
                  <div className="text-xs text-gray-500 font-mono">{color}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

export const ComponentColors: StoryObj = {
  render: () => (
    <ColorGrid
      colors={colors.component}
      title="Component Colors"
      description="Specialized colors for specific component states and sports-related elements."
    />
  ),
};

export const AllColors: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">모든 색상</h2>
        <p className="text-sm text-gray-600 mb-6">
          Goal Crush 디자인 시스템의 전체 색상 팔레트입니다.
        </p>

        <ColorGrid
          colors={colors.brand}
          title="Brand Colors"
          description="Primary brand colors used for CTAs, emphasis, and brand recognition."
        />

        <div className="mt-8">
          <ColorGrid
            colors={colors.component}
            title="Component Colors"
            description="Specialized colors for specific component states and sports-related elements."
          />
        </div>
      </div>
    </div>
  ),
};
