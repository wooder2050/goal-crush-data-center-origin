'use client';

import { Card, CardContent } from '@/components/ui';

interface Props {
  summary: string | null | undefined;
}

export default function MatchSummarySection({ summary }: Props) {
  if (!summary) return null;

  return (
    <Card>
      <CardContent className="px-4 py-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          경기 요약
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
      </CardContent>
    </Card>
  );
}
