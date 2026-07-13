'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState } from 'react';

import { Section } from '@/components/ui';
import PlayersContent from '@/features/players/components/PlayersContent';
import { PlayersHeader } from '@/features/players/components/PlayersHeader';
import type { InitialPlayersData } from '@/features/players/server';

// ISR 페이지라 page searchParams 대신 client useSearchParams + Suspense로 처리
export default function PlayersPage({
  initialData,
}: {
  initialData: InitialPlayersData;
}) {
  return (
    <Suspense fallback={<PlayersPageBody initialData={initialData} />}>
      <PlayersPageWithParams initialData={initialData} />
    </Suspense>
  );
}

function PlayersPageWithParams({
  initialData,
}: {
  initialData: InitialPlayersData;
}) {
  const searchParams = useSearchParams();
  const parseId = (v: string | null) => {
    const n = v ? parseInt(v, 10) : NaN;
    return Number.isInteger(n) && n > 0 ? n : null;
  };
  return (
    <PlayersPageBody
      initialData={initialData}
      initialSeasonId={parseId(searchParams?.get('season') ?? null)}
      initialTeamId={parseId(searchParams?.get('team') ?? null)}
    />
  );
}

function PlayersPageBody({
  initialData,
  initialSeasonId,
  initialTeamId,
}: {
  initialData: InitialPlayersData;
  initialSeasonId?: number | null;
  initialTeamId?: number | null;
}) {
  const [total, setTotal] = useState<number | null>(
    initialData.playersPage.totalCount
  );

  // Controlled search state
  const [keyword, setKeyword] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const applySearch = useCallback(() => {
    const next = keywordInput.trim();
    if (next === keyword.trim()) return;
    setKeyword(next);
  }, [keywordInput, keyword]);

  const onKeyDownInput = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applySearch();
      }
    },
    [applySearch]
  );

  return (
    <Section padding="sm" className="pt-2 sm:pt-3">
      <PlayersContent
        initialTeams={initialData.teams}
        initialSeasons={initialData.seasons}
        initialPlayersPage={initialData.playersPage}
        initialSeasonId={initialSeasonId}
        initialTeamId={initialTeamId}
        onTotalChange={setTotal}
        controlledKeyword={keyword}
        hideInternalSearch
        stickyHeaderSlot={
          <PlayersHeader
            total={total}
            keyword={keyword}
            keywordInput={keywordInput}
            onChangeKeywordInput={setKeywordInput}
            onKeyDownInput={onKeyDownInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            isFocused={isFocused}
            onClickSearch={applySearch}
          />
        }
      />
    </Section>
  );
}
