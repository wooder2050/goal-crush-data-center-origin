'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { ShareButtons } from '@/components/ShareButtons';
import { Section } from '@/components/ui';
import DetailMatchCard from '@/features/matches/components/MatchCard/DetailMatchCard';
import MatchSidebar from '@/features/matches/components/MatchCard/MatchSidebar';
import type {
  InitialMatchDetailData,
  MatchRecordCoverage,
} from '@/features/matches/server';

/** 상세 기록이 있는 경기에만, 등록된 건수를 사실 그대로 표시 */
function RecordCoverageNote({ coverage }: { coverage: MatchRecordCoverage }) {
  const { detailedStatsPlayers, actions, ratedPlayers } = coverage;
  if (detailedStatsPlayers === 0 && actions === 0 && ratedPlayers === 0) {
    return null;
  }
  const parts = [
    detailedStatsPlayers > 0 && `선수 ${detailedStatsPlayers}명 상세 통계`,
    actions > 0 && `플레이 ${actions.toLocaleString('ko-KR')}건`,
    ratedPlayers > 0 && `평점 ${ratedPlayers}명`,
  ].filter(Boolean);
  return (
    <p className="mt-3 text-xs text-gray-400">
      상세 기록: {parts.join(' · ')} — 상세 통계·플레이는 운영자가 방송 화면을
      보고 직접 기록했고, 평점은 이 기록으로 계산한 값입니다.
    </p>
  );
}

interface MatchDetailPageContentProps {
  matchId: string;
  initialData: InitialMatchDetailData;
}

export default function MatchDetailPageContent({
  matchId,
  initialData,
}: MatchDetailPageContentProps) {
  const id = Number(matchId);
  const match = initialData.match;
  const homeTeam = match.home_team?.team_name || '홈팀';
  const awayTeam = match.away_team?.team_name || '원정팀';
  const hasScore = match.home_score !== null && match.away_score !== null;
  const shareTitle = hasScore
    ? `${homeTeam} vs ${awayTeam} ${match.home_score}:${match.away_score}`
    : `${homeTeam} vs ${awayTeam}`;

  return (
    <main className="min-h-screen bg-white">
      <Section padding="sm">
        <div className="mx-auto max-w-5xl">
          {match.season_id && (
            <Link
              href={`/seasons/${match.season_id}`}
              className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              {match.season?.season_name || '시즌 목록'}
            </Link>
          )}
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">경기 상세</h1>
            <ShareButtons
              title={`${shareTitle} | 골때녀 데이터센터`}
              description={
                hasScore
                  ? `경기 결과 ${match.home_score}:${match.away_score}`
                  : undefined
              }
              contentType="match"
              itemId={matchId}
            />
          </div>
          {!Number.isFinite(id) ? (
            <div className="rounded-md border p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-6 w-40 rounded bg-gray-200" />
                <div className="h-24 rounded bg-gray-100" />
              </div>
            </div>
          ) : (
            <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6">
              <div className="min-w-0">
                <DetailMatchCard
                  matchId={id}
                  initialMatch={initialData.match}
                />
                <RecordCoverageNote coverage={initialData.recordCoverage} />
              </div>
              <aside className="hidden lg:block">
                <div className="sticky top-4 space-y-4">
                  <MatchSidebar
                    match={initialData.match}
                    recentSeasonMatches={initialData.recentSeasonMatches}
                  />
                </div>
              </aside>
            </div>
          )}
        </div>
      </Section>
    </main>
  );
}
