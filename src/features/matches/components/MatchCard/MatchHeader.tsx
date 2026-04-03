'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { CardHeader } from '@/components/ui/card';
import { MatchWithTeams } from '@/lib/types/database';

interface MatchHeaderProps {
  match: MatchWithTeams;
  className?: string;
  compact?: boolean;
}

const MatchHeader: React.FC<MatchHeaderProps> = ({
  match,
  className = '',
  compact = false,
}) => {
  const matchDate = new Date(match.match_date);
  const baseLabel = match.description || match.season?.season_name || '';
  const mobileLabel =
    baseLabel.replace(/\s*골\s*때리는\s*그녀들\s*/g, '').trim() || baseLabel;

  if (compact) {
    return (
      <CardHeader
        className={`px-0 pt-2 pb-0 sm:px-4 sm:pt-3 sm:pb-0 ${className}`}
      >
        <div className="w-full flex items-center justify-between">
          <Badge variant="secondary" className="text-[11px] sm:text-sm">
            {mobileLabel}
          </Badge>
          {match.is_date_confirmed === false ? (
            <Badge
              variant="outline"
              className="text-[11px] sm:text-xs text-amber-600 border-amber-300 bg-amber-50"
            >
              방영일 미정
            </Badge>
          ) : (
            <div className="text-xs sm:text-sm text-gray-500">
              {format(matchDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })}
            </div>
          )}
        </div>
      </CardHeader>
    );
  }

  return (
    <CardHeader
      className={`px-0 pt-3 pb-0 sm:px-6 sm:pt-6 sm:pb-0 ${className}`}
    >
      <div className="flex flex-col items-start gap-3 w-full">
        {/* Mobile: remove the common phrase; Desktop: show full */}
        <Badge variant="secondary" className="text-sm sm:hidden">
          {mobileLabel}
        </Badge>
        <Badge variant="secondary" className="hidden text-sm sm:inline-flex">
          {baseLabel}
        </Badge>
        {/* 감독 노출 제거 (요청에 따라 헤더에서는 표시하지 않음) */}
        <div className="w-full text-sm text-gray-500 flex justify-end">
          {match.is_date_confirmed === false ? (
            <Badge
              variant="outline"
              className="text-xs text-amber-600 border-amber-300 bg-amber-50"
            >
              방영일 미정
            </Badge>
          ) : (
            format(matchDate, 'yyyy년 M월 d일 (EEE)', { locale: ko })
          )}
        </div>
      </div>
    </CardHeader>
  );
};

export default MatchHeader;
