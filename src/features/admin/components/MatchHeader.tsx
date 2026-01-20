'use client';

import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { H1 } from '@/components/ui/typography';

interface MatchHeaderProps {
  onBackClick: () => void;
  matchStatus?: string | null;
}

export default function MatchHeader({
  onBackClick,
  matchStatus,
}: MatchHeaderProps) {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;

  const isCompleted = matchStatus === 'completed';

  return (
    <div className="flex justify-between items-center">
      <H1>경기 결과 기록</H1>
      <div className="flex gap-2">
        {matchId && isCompleted && (
          <>
            <Button
              variant="default"
              onClick={() =>
                router.push(`/admin/matches/record/${matchId}/detailed-stats`)
              }
            >
              상세 통계 기록
            </Button>
            <Button
              variant="default"
              onClick={() =>
                router.push(`/admin/matches/record/${matchId}/possession`)
              }
            >
              점유율 기록
            </Button>
          </>
        )}
        <Button variant="outline" onClick={onBackClick}>
          경기 목록으로 돌아가기
        </Button>
      </div>
    </div>
  );
}
