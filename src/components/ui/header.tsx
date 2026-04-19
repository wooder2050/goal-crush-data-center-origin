'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { cn } from '@/lib/utils';

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  authButtons?: React.ReactNode;
}

const CHANNELS: { label: string; href: string }[] = [
  { label: '골 때리는 그녀들 데이터센터', href: '/' },
];

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className, children, authButtons, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-200 transform-gpu will-change-transform',
          className
        )}
        {...props}
      >
        {/* Row 1: channels (large, bold) with auth buttons */}
        <div className="px-4 lg:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex w-full items-center justify-between py-3 md:py-4">
              <div className="flex min-w-0 flex-1 items-center gap-6 overflow-x-auto">
                {CHANNELS.map((c) => (
                  <Link
                    key={c.label}
                    href={c.href}
                    className="whitespace-nowrap text-xl font-bold tracking-tight text-black md:text-2xl"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
              {/* Auth buttons in top right */}
              <div className="flex shrink-0 items-center gap-2">
                {authButtons}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: categories (children) with active underline */}
        <div className="px-4 lg:px-6">
          <div className="relative mx-auto max-w-7xl">
            <div className="flex h-8 md:h-8 items-end overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <nav className="flex items-end gap-6 whitespace-nowrap pr-6 md:pr-0">
                {children}
              </nav>
            </div>
            {/* Fade hint for horizontal scroll on mobile */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent md:hidden" />
          </div>
        </div>
      </header>
    );
  }
);
Header.displayName = 'Header';

interface NavItemProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href: string;
  isActive?: boolean; // optional override
}

const NavItem = React.forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ className, href, isActive, children, ...props }, ref) => {
    const pathname = usePathname();
    const computedActive = React.useMemo(() => {
      if (typeof isActive === 'boolean') return isActive;
      const normalize = (p: string) =>
        p.endsWith('/') && p !== '/' ? p.slice(0, -1) : p;
      const current = normalize(pathname || '/');
      const target = normalize(href);
      if (target === '/') return current === '/';
      return current === target || current.startsWith(`${target}/`);
    }, [href, isActive, pathname]);

    return (
      <Link
        // Next.js Link doesn't forward ref types directly; cast safely
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={cn(
          'relative group pb-2 text-sm leading-none tracking-wide transition-colors',
          computedActive
            ? 'font-bold text-black'
            : 'font-medium text-gray-700 hover:text-black',
          className
        )}
        {...props}
      >
        {children}
        <span
          className={cn(
            'absolute inset-x-0 -bottom-px transition-all',
            computedActive
              ? 'h-[3px] bg-black'
              : 'h-[2px] bg-transparent group-hover:bg-gray-300'
          )}
        />
      </Link>
    );
  }
);
NavItem.displayName = 'NavItem';

export { Header, NavItem };
