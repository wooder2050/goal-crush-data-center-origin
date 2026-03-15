'use client';

import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useId, useState } from 'react';

import { cn } from '@/lib/utils';

import { Card, CardContent } from '.';

interface CollapsibleFilterProps {
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleFilter({
  children,
  className,
}: CollapsibleFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  return (
    <Card className={cn('mb-6', className)}>
      {/* Mobile toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 sm:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          필터 설정
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Filter content - always visible on desktop, toggleable on mobile */}
      <CardContent
        id={contentId}
        className={cn(
          'px-4 py-4',
          // Mobile: hidden by default, shown when open
          !isOpen && 'hidden sm:block',
          // Mobile: add top border when open
          isOpen && 'border-t border-gray-100 sm:border-t-0'
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}
