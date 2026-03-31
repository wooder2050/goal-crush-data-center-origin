import { Section } from '@/components/ui';

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-gray-100 ${className ?? ''}`} />
  );
}

export default function Loading() {
  return (
    <Section padding="sm">
      <div className="mb-6">
        <div className="h-8 w-44 rounded bg-gray-100 animate-pulse" />
      </div>

      <div
        className="mx-auto max-w-[1280px]"
        role="status"
        aria-label="선수 상세 정보 로딩 중"
      >
        {/* Top row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Header card */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
              <div className="px-6 pb-5 pt-8 sm:px-8">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 !rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px border-t border-gray-100">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="px-6 py-4">
                    <Skeleton className="h-5 w-10" />
                    <Skeleton className="mt-1 h-3 w-14" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Traits */}
          <div className="lg:col-span-1">
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white p-6">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-2 h-3 w-40" />
              <Skeleton className="mx-auto mt-6 h-48 w-48 !rounded-full" />
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left */}
          <div className="space-y-4 lg:col-span-2">
            {/* Current Season */}
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
              <div className="border-b border-gray-100 px-6 py-4">
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="grid grid-cols-4 gap-px">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="py-5 text-center">
                    <Skeleton className="mx-auto h-5 w-8" />
                    <Skeleton className="mx-auto mt-1 h-3 w-12" />
                  </div>
                ))}
              </div>
            </div>

            {/* Compare */}
            <Skeleton className="h-12 w-full !rounded-2xl" />

            {/* Match Log */}
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
              <div className="px-6 py-4">
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="divide-y divide-gray-100">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>

            {/* Pass Map */}
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
              <div className="border-b border-gray-100 px-6 py-4">
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex flex-col sm:flex-row">
                <div className="flex-1 p-4">
                  <Skeleton className="aspect-[2/1] w-full" />
                </div>
                <div className="flex flex-1 flex-col gap-4 p-4 sm:border-l sm:border-gray-100">
                  <div className="flex justify-around">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="text-center">
                        <Skeleton className="mx-auto h-6 w-10" />
                        <Skeleton className="mx-auto mt-1 h-3 w-12" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-8 w-20 !rounded-full" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Season Stats */}
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
              <div className="border-b border-gray-100 px-6 py-4">
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="space-y-3 px-5 py-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-2 w-[45%]" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4 lg:col-span-1">
            {/* Career */}
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
              <div className="px-6 py-4">
                <Skeleton className="h-5 w-12" />
              </div>
              <div className="space-y-3 px-4 py-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Skeleton className="h-7 w-7 !rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attack Points */}
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
              <div className="px-6 py-4">
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="divide-y divide-gray-100">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="px-4 py-3">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="mt-2 h-4 w-3/4" />
                  </div>
                ))}
              </div>
            </div>

            {/* Trophies */}
            <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
              <div className="px-6 py-4">
                <Skeleton className="h-5 w-14" />
              </div>
              <div className="px-4 pb-4">
                <Skeleton className="h-20 w-full !rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
