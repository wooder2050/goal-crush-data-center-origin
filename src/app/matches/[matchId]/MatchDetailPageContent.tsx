'use client';

import Link from 'next/link';
import React from 'react';

import { ShareButtons } from '@/components/ShareButtons';
import { Section } from '@/components/ui';
import DetailMatchCard from '@/features/matches/components/MatchCard/DetailMatchCard';
import MatchSidebar from '@/features/matches/components/MatchCard/MatchSidebar';
import type { InitialMatchDetailData } from '@/features/matches/server';

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
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
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
