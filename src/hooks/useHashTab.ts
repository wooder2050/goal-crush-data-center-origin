'use client';

import { useCallback, useEffect, useState } from 'react';

export function useHashTab(defaultTab: string) {
  const [tab, setTab] = useState(defaultTab);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) setTab(hash);
  }, []);

  const onTabChange = useCallback((value: string) => {
    setTab(value);
    window.history.replaceState(null, '', `#${value}`);
  }, []);

  return { tab, onTabChange };
}
