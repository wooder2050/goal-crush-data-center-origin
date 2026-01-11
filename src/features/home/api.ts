export interface TopScorer {
  player_id: number;
  player_name: string;
  team_name: string;
  team_logo: string;
  goals: number;
  assists: number;
  matches_played: number;
  total_teams?: number;
  total_seasons?: number;
}

export const fetchTopScorers = async (
  limit: number = 5
): Promise<TopScorer[]> => {
  const response = await fetch(
    `/api/stats/player-season/top-scorers?limit=${limit}`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch top scorers');
  }

  return response.json();
};

fetchTopScorers.queryKey = 'topScorers';
