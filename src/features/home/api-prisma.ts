import type { HomePageData } from './types';

export const fetchHomePageData = async (): Promise<HomePageData> => {
  const response = await fetch('/api/home/data', {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch home page data');
  }

  return response.json();
};

fetchHomePageData.queryKey = 'homePageData';
