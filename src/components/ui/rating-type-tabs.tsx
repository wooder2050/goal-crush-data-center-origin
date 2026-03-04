'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as React from 'react';

import { cn } from '@/lib/utils';

type RatingType = 'stats' | 'xt';

interface RatingTypeTabsProps {
  value: RatingType;
  onValueChange: (value: RatingType) => void;
  /** Compact mode for tight layouts (smaller padding/font) */
  size?: 'sm' | 'default';
  className?: string;
}

const RATING_DESCRIPTIONS: Record<RatingType, string> = {
  stats: '골, 어시스트, 패스 등 경기 스탯을 기반으로 산출한 평점입니다.',
  xt: '패스, 드리블, 수비 등 볼 이동의 위협도(xT)를 기반으로 산출한 평점입니다.',
};

const RATING_DESCRIPTIONS_SHORT: Record<RatingType, string> = {
  stats: '경기 스탯 기반 평점',
  xt: 'xT(위협도) 기반 평점',
};

function RatingTypeTabs({
  value,
  onValueChange,
  size = 'default',
  className,
}: RatingTypeTabsProps) {
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={(v) => onValueChange(v as RatingType)}
      className={className}
    >
      <TabsPrimitive.List
        className={cn(
          'inline-flex items-center rounded-md bg-muted p-0.5',
          size === 'sm' ? 'h-7' : 'h-8'
        )}
      >
        <TabsPrimitive.Trigger
          value="stats"
          className={cn(
            'inline-flex items-center justify-center whitespace-nowrap rounded-sm font-medium transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:pointer-events-none disabled:opacity-50',
            'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
            'data-[state=inactive]:text-muted-foreground',
            size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          )}
        >
          스탯 평점
        </TabsPrimitive.Trigger>
        <TabsPrimitive.Trigger
          value="xt"
          className={cn(
            'inline-flex items-center justify-center whitespace-nowrap rounded-sm font-medium transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:pointer-events-none disabled:opacity-50',
            'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
            'data-[state=inactive]:text-muted-foreground',
            size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          )}
        >
          xT 평점
        </TabsPrimitive.Trigger>
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}

function RatingTypeDescription({
  type,
  variant = 'long',
  className,
}: {
  type: RatingType;
  variant?: 'long' | 'short';
  className?: string;
}) {
  const descriptions =
    variant === 'short' ? RATING_DESCRIPTIONS_SHORT : RATING_DESCRIPTIONS;
  return (
    <p className={cn('text-[11px] text-muted-foreground', className)}>
      {descriptions[type]}
    </p>
  );
}

export { RatingTypeDescription, RatingTypeTabs };
export type { RatingType };
