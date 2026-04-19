'use client';

import React from 'react';

import { Section } from '@/components/ui';
import DetailMatchCard from '@/features/matches/components/MatchCard/DetailMatchCard';
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

  return (
    <main className="min-h-screen bg-white">
      <Section padding="sm">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">경기 상세</h1>
          {!Number.isFinite(id) ? (
            <div className="rounded-md border p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-6 w-40 rounded bg-gray-200" />
                <div className="h-24 rounded bg-gray-100" />
              </div>
            </div>
          ) : (
            <DetailMatchCard matchId={id} initialMatch={initialData.match} />
          )}
        </div>
      </Section>
    </main>
  );
}
