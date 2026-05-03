'use client';

import React from 'react';

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-gray-100 ${className ?? ''}`} />
  );
}

export default function CoachDetailSkeleton() {
  return (
    <section className="bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <SkeletonBlock className="h-7 w-36" />
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
                    <SkeletonBlock className="h-20 w-20 !rounded-full !bg-gray-300" />
                    <div className="space-y-2">
                      <SkeletonBlock className="h-7 w-40 !bg-gray-300" />
                      <SkeletonBlock className="h-4 w-24 !bg-gray-300" />
                    </div>
                  </div>
                </div>
                {/* Info grid */}
                <div className="divide-y divide-gray-100">
                  {[1, 2, 3].map((row) => (
                    <div
                      key={row}
                      className="grid grid-cols-2 divide-x divide-gray-100"
                    >
                      {[1, 2].map((col) => (
                        <div key={col} className="px-6 py-4 sm:px-8">
                          <SkeletonBlock className="h-6 w-12" />
                          <SkeletonBlock className="mt-1 h-3 w-10" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs card */}
              <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
                <div className="flex border-b border-gray-100">
                  <div className="flex-1 py-3 text-center">
                    <SkeletonBlock className="mx-auto h-4 w-20" />
                  </div>
                  <div className="flex-1 py-3 text-center">
                    <SkeletonBlock className="mx-auto h-4 w-16" />
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg p-2"
                    >
                      <SkeletonBlock className="h-4 w-20" />
                      <SkeletonBlock className="h-4 w-16" />
                      <SkeletonBlock className="h-4 flex-1" />
                      <SkeletonBlock className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4 lg:col-span-1">
              {/* Career card */}
              <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
                <div className="border-b border-gray-100 px-6 py-4">
                  <SkeletonBlock className="h-5 w-12" />
                </div>
                <div className="divide-y divide-gray-100">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-6 py-3">
                      <SkeletonBlock className="h-8 w-8 !rounded-full" />
                      <div className="flex-1 space-y-1">
                        <SkeletonBlock className="h-4 w-28" />
                        <SkeletonBlock className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Win rate card */}
              <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
                <div className="border-b border-gray-100 px-6 py-4">
                  <SkeletonBlock className="h-5 w-20" />
                </div>
                <div className="divide-y divide-gray-100">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <SkeletonBlock className="h-6 w-6 !rounded-full" />
                        <SkeletonBlock className="h-3 w-20" />
                        <SkeletonBlock className="ml-auto h-3 w-10" />
                      </div>
                      <SkeletonBlock className="ml-[34px] mt-1.5 h-1.5 w-full !rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
