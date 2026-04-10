'use client';

import { Section } from '@/components/ui';

function Block({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-100 ${className ?? ''}`}
      style={style}
    />
  );
}

export default function TeamDetailSkeleton() {
  return (
    <Section padding="sm">
      <div className="mb-6">
        <Block className="h-7 w-40" />
      </div>
      <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-4 lg:col-span-2">
            {/* Header card */}
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
              {/* Banner */}
              <div className="bg-gray-200 px-6 pb-5 pt-8 sm:px-8">
                <div className="flex items-center gap-4">
                  <Block className="h-20 w-20 !rounded-full !bg-gray-300" />
                  <div className="space-y-2">
                    <Block className="h-7 w-36 !bg-gray-300" />
                    <Block className="h-4 w-20 !bg-gray-300/60" />
                  </div>
                </div>
              </div>
              {/* Stats grid */}
              <div className="divide-y divide-gray-100">
                {[0, 1, 2].map((row) => (
                  <div
                    key={row}
                    className="grid grid-cols-2 divide-x divide-gray-100"
                  >
                    {[0, 1].map((col) => (
                      <div key={col} className="px-6 py-4 sm:px-8">
                        <Block className="h-6 w-10" />
                        <Block className="mt-1 h-3 w-8" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Squad table */}
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
              <div className="flex items-center justify-between px-6 py-4">
                <Block className="h-5 w-16" />
                <Block className="h-4 w-10" />
              </div>
              <div className="px-4 pb-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Block className="h-9 w-9 !rounded-full" />
                    <Block className="h-4 w-20" />
                    <Block className="ml-auto h-4 w-8" />
                    <Block className="h-4 w-6" />
                    <Block className="h-4 w-6" />
                  </div>
                ))}
              </div>
            </div>

            {/* Season standings */}
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
              <div className="px-6 py-4">
                <Block className="h-5 w-24" />
              </div>
              <div className="px-4 pb-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Block className="h-4 w-10" />
                    <Block className="h-4 w-24" />
                    <Block className="ml-auto h-4 w-8" />
                    <Block className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4 lg:col-span-1">
            {/* Formation */}
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
              <div className="px-6 py-4">
                <Block className="h-5 w-24" />
                <Block className="mt-1 h-3 w-32" />
              </div>
              <div className="flex items-center justify-center px-4 pb-4">
                <Block
                  className="w-full !rounded-md"
                  style={{ aspectRatio: '170 / 230' }}
                />
              </div>
            </div>

            {/* Top players */}
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
              <div className="px-6 py-4">
                <Block className="h-5 w-20" />
              </div>
              <div className="px-4 pb-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Block className="h-4 w-4" />
                    <Block className="h-10 w-10 !rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Block className="h-4 w-20" />
                      <Block className="h-3 w-14" />
                    </div>
                    <Block className="h-5 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
