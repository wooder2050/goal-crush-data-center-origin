'use client';

type Props = {
  className?: string;
};

export default function GroupStandingsTableSkeleton({ className }: Props) {
  return (
    <div className={className}>
      <div className="mb-4">
        <div className="h-6 w-48 rounded bg-gray-200 animate-pulse" />
      </div>
      <div className="hidden sm:block border rounded-md overflow-hidden">
        <div className="grid grid-cols-9 gap-0 border-b bg-gray-50">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="p-3 text-sm font-medium text-gray-600">
              <div className="h-4 w-12 rounded bg-gray-200 animate-pulse" />
            </div>
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-9 gap-0 border-b">
            {Array.from({ length: 9 }).map((__, colIdx) => (
              <div key={colIdx} className="p-3">
                <div className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="sm:hidden space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-10 rounded bg-gray-200 animate-pulse" />
              <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {Array.from({ length: 5 }).map((__, j) => (
                <div key={j} className="rounded bg-gray-50 border px-2 py-2">
                  <div className="h-3 w-10 rounded bg-gray-200 animate-pulse mb-1" />
                  <div className="h-4 w-12 rounded bg-gray-200 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
