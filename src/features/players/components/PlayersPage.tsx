'use client';

import { useCallback, useState } from 'react';

import { Section } from '@/components/ui';
import PlayersContent from '@/features/players/components/PlayersContent';
import { PlayersHeader } from '@/features/players/components/PlayersHeader';
import type { InitialPlayersData } from '@/features/players/server';

export default function PlayersPage({
  initialData,
}: {
  initialData: InitialPlayersData;
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
