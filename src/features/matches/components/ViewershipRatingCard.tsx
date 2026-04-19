'use client';

import { Tv } from 'lucide-react';

interface ViewershipRatingCardProps {
  ratingNationwide: number | null | undefined;
  ratingMetropolitan: number | null | undefined;
}

export default function ViewershipRatingCard({
  ratingNationwide,
  ratingMetropolitan,
}: ViewershipRatingCardProps) {
  if (!ratingNationwide && !ratingMetropolitan) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <Tv className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-700">시청률</h3>
        <span className="text-[10px] text-gray-300 ml-auto">
          출처: 닐슨코리아
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ratingNationwide != null && (
          <div className="text-center rounded-lg bg-gray-50 py-3">
            <div className="text-xs text-gray-400 mb-1">전국</div>
            <div className="text-xl font-bold text-gray-900">
              {ratingNationwide}%
            </div>
          </div>
        )}
        {ratingMetropolitan != null && (
          <div className="text-center rounded-lg bg-gray-50 py-3">
            <div className="text-xs text-gray-400 mb-1">수도권</div>
            <div className="text-xl font-bold text-[#3b82f6]">
              {ratingMetropolitan}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
