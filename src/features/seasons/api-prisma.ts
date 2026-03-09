import { apiUrl } from '@/lib/api-url';
import { Season } from '@/lib/types';

// Extended season type definition
export interface SeasonWithStats extends Season {
  status?: 'upcoming' | 'ongoing' | 'completed';
  match_count?: number;
  champion_team_id?: number | null;
  champion_team_name?: string | null;
  champion_team_logo?: string | null;
  champion_label?: '우승팀' | '승격팀' | '1위' | '현재 1위' | null;
  champion_teams?: Array<{
    team_id: number | null;
    team_name: string | null;
    logo: string | null;
  }>;
}

// Prisma-based Seasons API client functions
// Provides the same interface as Supabase but uses Next.js API Routes

// ============== Basic Season CRUD Operations ==============

// Get all seasons
export const getAllSeasonsPrisma = async (): Promise<SeasonWithStats[]> => {
  const response = await fetch(apiUrl('/api/seasons'));
  if (!response.ok) {
    throw new Error(`Failed to fetch seasons: ${response.statusText}`);
  }
  return response.json();
};

Object.defineProperty(getAllSeasonsPrisma, 'queryKey', {
  value: 'allSeasons',
});

// Get seasons with pagination
export const getSeasonsPaginatedPrisma = async ({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<{
  items: SeasonWithStats[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> => {
  const response = await fetch(apiUrl(`/api/seasons?page=${page}&limit=${limit}`));
  if (!response.ok) {
    throw new Error(`Failed to fetch seasons: ${response.statusText}`);
  }
  return response.json();
};

Object.defineProperty(getSeasonsPaginatedPrisma, 'queryKey', {
  value: 'seasonsPaginated',
});

// 무한 스크롤용 seasons 함수
export const getSeasonsPagePrisma = async (
  page: number,
  limit: number = 6
): Promise<{
  items: SeasonWithStats[];
  totalCount: number;
  nextPage: number | null;
  hasNextPage: boolean;
  currentPage: number;
}> => {
  const response = await fetch(apiUrl(`/api/seasons?page=${page}&limit=${limit}`));
  if (!response.ok) {
    throw new Error(`Failed to fetch seasons page: ${response.statusText}`);
  }
  return response.json();
};

// Get season by ID
export const getSeasonByIdPrisma = async (
  seasonId: number
): Promise<Season | null> => {
  const response = await fetch(apiUrl(`/api/seasons/${seasonId}`));
  if (!response.ok) {
    if (response.status === 404) {
      return null; // Season not found
    }
    throw new Error(`Failed to fetch season: ${response.statusText}`);
  }
  return response.json();
};

Object.defineProperty(getSeasonByIdPrisma, 'queryKey', {
  value: 'seasonById',
});

// Get seasons by year
export const getSeasonsByYearPrisma = async (
  year: number
): Promise<Season[]> => {
  const response = await fetch(apiUrl(`/api/seasons?year=${year}`));
  if (!response.ok) {
    throw new Error(`Failed to fetch seasons by year: ${response.statusText}`);
  }
  return response.json();
};

Object.defineProperty(getSeasonsByYearPrisma, 'queryKey', {
  value: 'seasonsByYear',
});

// Get latest season
export const getLatestSeasonPrisma = async (): Promise<Season | null> => {
  const response = await fetch(apiUrl('/api/seasons/latest'));
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch latest season: ${response.statusText}`);
  }
  return response.json();
};

Object.defineProperty(getLatestSeasonPrisma, 'queryKey', {
  value: 'latestSeason',
});

// Search seasons by name
export const searchSeasonsByNamePrisma = async (
  name: string
): Promise<Season[]> => {
  const response = await fetch(apiUrl(`/api/seasons?name=${encodeURIComponent(name)}`));
  if (!response.ok) {
    throw new Error(`Failed to search seasons: ${response.statusText}`);
  }
  return response.json();
};

Object.defineProperty(searchSeasonsByNamePrisma, 'queryKey', {
  value: 'seasonsByName',
});

// Get season by name
export const getSeasonByNamePrisma = async (
  seasonName: string
): Promise<Season | null> => {
  const response = await fetch(
    apiUrl(`/api/seasons?name=${encodeURIComponent(seasonName)}`)
  );
  if (!response.ok) {
    if (response.status === 404) {
      return null; // Season not found
    }
    throw new Error(`Failed to fetch season: ${response.statusText}`);
  }
  const seasons = await response.json();
  return seasons.length > 0 ? seasons[0] : null;
};

// Create new season
export const createSeasonPrisma = async (seasonData: {
  season_name: string;
  year: number;
  start_date?: string;
  end_date?: string;
}): Promise<Season> => {
  const response = await fetch(apiUrl('/api/seasons'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(seasonData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || `Failed to create season: ${response.statusText}`
    );
  }

  return response.json();
};

Object.defineProperty(createSeasonPrisma, 'queryKey', {
  value: 'createSeason',
});

// Update season
export const updateSeasonPrisma = async (
  seasonId: number,
  seasonData: {
    season_name: string;
    year: number;
    start_date?: string;
    end_date?: string;
  }
): Promise<Season> => {
  const response = await fetch(apiUrl(`/api/seasons/${seasonId}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(seasonData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || `Failed to update season: ${response.statusText}`
    );
  }

  return response.json();
};

Object.defineProperty(updateSeasonPrisma, 'queryKey', {
  value: 'updateSeason',
});

// Delete season
export const deleteSeasonPrisma = async (seasonId: number): Promise<void> => {
  const response = await fetch(apiUrl(`/api/seasons?id=${seasonId}`), {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || `Failed to delete season: ${response.statusText}`
    );
  }
};

Object.defineProperty(deleteSeasonPrisma, 'queryKey', {
  value: 'deleteSeason',
});
