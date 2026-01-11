import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { spacing } from '../tokens/spacing';

const meta: Meta = {
  title: 'Design System/Tokens/Spacing',
  parameters: {
    docs: {
      description: {
        component:
          'Spacing scale and semantic spacing tokens used throughout the Goal Crush design system.',
      },
    },
  },
};

export default meta;

const SpacingDemo = ({
  value,
  label,
  description,
}: {
  value: string;
  label: string;
  description?: string;
}) => (
  <div className="flex items-center space-x-4 p-3 border rounded-lg">
    <div className="flex items-center space-x-3">
      <div className="text-sm font-mono w-16">{label}</div>
      <div
        className="bg-blue-100 border-l-2 border-r-2 border-blue-300"
        style={{ width: value, minWidth: '2px' }}
      >
        <div className="h-6"></div>
      </div>
      <div className="text-xs text-gray-500">{value}</div>
    </div>
    {description && (
      <div className="text-xs text-gray-600 flex-grow">{description}</div>
    )}
  </div>
);

export const BaseSpacing: StoryObj = {
  render: () => {
    const baseSpacing = Object.fromEntries(
      Object.entries(spacing)
        .filter(
          ([key, value]) =>
            !key.includes('component') &&
            !key.includes('interactive') &&
            !key.includes('layout') &&
            key !== 'px' &&
            key !== '0' &&
            typeof value === 'string'
        )
        .slice(0, 20) // Show first 20 for readability
    );

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Base Spacing Scale</h3>
          <p className="text-sm text-gray-600">
            Foundational spacing values based on 0.25rem (4px) increments,
            compatible with Tailwind CSS.
          </p>
        </div>
        <div className="space-y-2">
          {Object.entries(baseSpacing).map(([key, value]) => (
            <SpacingDemo key={key} label={key} value={value as string} />
          ))}
        </div>
      </div>
    );
  },
};

export const ComponentSpacing: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Component Spacing</h3>
        <p className="text-sm text-gray-600">
          Semantic spacing values for specific component types and contexts.
        </p>
      </div>

      {/* Button Spacing */}
      <div className="space-y-4">
        <h4 className="font-semibold">Button Padding</h4>
        <div className="space-y-2">
          {Object.entries(spacing.component.buttonPaddingX).map(
            ([size, value]) => (
              <SpacingDemo
                key={`btn-x-${size}`}
                label={`x-${size}`}
                value={value}
                description={`Horizontal padding for ${size} buttons`}
              />
            )
          )}
          {Object.entries(spacing.component.buttonPaddingY).map(
            ([size, value]) => (
              <SpacingDemo
                key={`btn-y-${size}`}
                label={`y-${size}`}
                value={value}
                description={`Vertical padding for ${size} buttons`}
              />
            )
          )}
        </div>
      </div>

      {/* Card Spacing */}
      <div className="space-y-4">
        <h4 className="font-semibold">Card Padding</h4>
        <div className="space-y-2">
          {Object.entries(spacing.component.cardPadding).map(
            ([size, value]) => (
              <SpacingDemo
                key={`card-${size}`}
                label={size}
                value={value}
                description={`Card padding for ${size} screens`}
              />
            )
          )}
        </div>
      </div>

      {/* Gap Spacing */}
      <div className="space-y-4">
        <h4 className="font-semibold">Gap Spacing</h4>
        <div className="space-y-2">
          {Object.entries(spacing.component.gap).map(([size, value]) => (
            <SpacingDemo
              key={`gap-${size}`}
              label={size}
              value={value}
              description={`Grid and flexbox gap for ${size} context`}
            />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const LayoutSpacing: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Layout Spacing</h3>
        <p className="text-sm text-gray-600">
          Spacing values for major layout elements like headers, sidebars, and
          modals.
        </p>
      </div>
      <div className="space-y-2">
        {Object.entries(spacing.layout).map(([key, value]) => (
          <SpacingDemo
            key={key}
            label={key}
            value={value}
            description={
              key === 'headerHeight'
                ? 'Standard header/navigation height'
                : key === 'navItemSpacing'
                  ? 'Space between navigation items'
                  : key === 'sidebarWidth'
                    ? 'Standard sidebar width'
                    : key === 'modalPadding'
                      ? 'Internal padding for modals'
                      : key === 'modalMargin'
                        ? 'External margin for modals'
                        : ''
            }
          />
        ))}
      </div>
    </div>
  ),
};

export const InteractiveSpacing: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Interactive Spacing</h3>
        <p className="text-sm text-gray-600">
          Accessibility and interaction-focused spacing values.
        </p>
      </div>
      <div className="space-y-2">
        <SpacingDemo
          label="touch"
          value={spacing.interactive.minTouchTarget}
          description="Minimum touch target size for accessibility"
        />
        <SpacingDemo
          label="focus"
          value={spacing.interactive.focusRingOffset}
          description="Focus ring offset distance"
        />
        {Object.entries(spacing.interactive.iconMargin).map(([size, value]) => (
          <SpacingDemo
            key={`icon-${size}`}
            label={`icon-${size}`}
            value={value}
            description={`Icon margin for ${size} context`}
          />
        ))}
      </div>
    </div>
  ),
};

// Visual demonstration of spacing in context
export const SpacingInAction: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Spacing in Action</h3>
        <p className="text-sm text-gray-600">
          Examples of how spacing tokens are applied in real components.
        </p>
      </div>

      {/* Button examples */}
      <div className="space-y-4">
        <h4 className="font-semibold">Button Spacing Examples</h4>
        <div className="flex flex-wrap gap-4">
          <button className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded">
            Small Button (px-3 py-1.5)
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded">
            Default Button (px-4 py-2)
          </button>
          <button className="px-8 py-2 bg-blue-500 text-white text-sm rounded">
            Large Button (px-8 py-2)
          </button>
        </div>
      </div>

      {/* Card examples */}
      <div className="space-y-4">
        <h4 className="font-semibold">Card Spacing Examples</h4>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border rounded p-2">
            <div className="text-sm font-medium">Mobile Card (p-2)</div>
            <div className="text-xs text-gray-500 mt-1">
              Compact spacing for mobile
            </div>
          </div>
          <div className="border rounded p-4">
            <div className="text-sm font-medium">Desktop Card (p-4)</div>
            <div className="text-xs text-gray-500 mt-1">
              Standard desktop spacing
            </div>
          </div>
          <div className="border rounded p-6">
            <div className="text-sm font-medium">Large Card (p-6)</div>
            <div className="text-xs text-gray-500 mt-1">
              Spacious layout for emphasis
            </div>
          </div>
        </div>
      </div>

      {/* Gap examples */}
      <div className="space-y-4">
        <h4 className="font-semibold">Gap Spacing Examples</h4>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-600 mb-2">Small gap (gap-1)</div>
            <div className="flex gap-1">
              <div className="w-12 h-12 bg-gray-200 rounded"></div>
              <div className="w-12 h-12 bg-gray-200 rounded"></div>
              <div className="w-12 h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Medium gap (gap-4)</div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded"></div>
              <div className="w-12 h-12 bg-gray-200 rounded"></div>
              <div className="w-12 h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Large gap (gap-8)</div>
            <div className="flex gap-8">
              <div className="w-12 h-12 bg-gray-200 rounded"></div>
              <div className="w-12 h-12 bg-gray-200 rounded"></div>
              <div className="w-12 h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const AllSpacing: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">모든 간격</h2>
        <p className="text-sm text-gray-600 mb-6">
          Goal Crush 디자인 시스템의 전체 간격 체계입니다.
        </p>

        <div className="space-y-6">
          {/* Base spacing sample */}
          <div>
            <h3 className="text-lg font-semibold mb-3">기본 간격 (샘플)</h3>
            <div className="space-y-2">
              {[
                ['1', '0.25rem'],
                ['2', '0.5rem'],
                ['4', '1rem'],
                ['6', '1.5rem'],
                ['8', '2rem'],
              ].map(([key, value]) => (
                <SpacingDemo key={key} label={key} value={value} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};
