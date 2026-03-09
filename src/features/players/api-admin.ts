import { PlayerFormValues } from '@/common/form/fields/player';
import { apiUrl } from '@/lib/api-url';

export interface CreatePlayerData {
  name: string;
  birth_date?: string;
  nationality?: string;
  height_cm?: number;
  profile_image_url?: string;
  jersey_number?: number;
}

export type UpdatePlayerData = CreatePlayerData;

export interface PlayerWithStats {
  player_id: number;
  name: string;
  birth_date?: string | null;
  nationality?: string | null;
  height_cm?: number | null;
  profile_image_url?: string | null;
  jersey_number?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  team?: {
    team_id: number;
    team_name: string;
    logo: string | null;
  } | null;
  position?: string | null;
  seasons: Array<{
    season_name: string | null;
    year: number | null;
  }>;
  totals: {
    appearances: number;
    goals: number;
    assists: number;
  };
}

// GET /api/players - 모든 선수 조회 (페이지네이션 지원)
export const getAllPlayersPrisma = async (params?: {
  name?: string;
  page?: number;
  limit?: number;
  team_id?: number;
  order?: 'apps' | 'goals' | 'assists';
  position?: string;
}): Promise<
  | {
      items: PlayerWithStats[];
      nextPage: number | null;
      totalCount: number;
    }
  | PlayerWithStats[]
> => {
  const searchParams = new URLSearchParams();

  if (params?.name) searchParams.set('name', params.name);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.team_id) searchParams.set('team_id', params.team_id.toString());
  if (params?.order) searchParams.set('order', params.order);
  if (params?.position) searchParams.set('position', params.position);

  const url = `/api/players${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  const response = await fetch(apiUrl(url), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch players');
  }

  return response.json();
};

// GET /api/players/[player_id] - 특정 선수 조회
export const getPlayerPrisma = async (playerId: number) => {
  const response = await fetch(apiUrl(`/api/players/${playerId}`), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch player');
  }

  return response.json();
};

// POST /api/players - 새 선수 생성
export const createPlayerPrisma = async (data: CreatePlayerData) => {
  const response = await fetch(apiUrl('/api/players'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create player');
  }

  return response.json();
};

// PUT /api/players/[player_id] - 선수 정보 수정
export const updatePlayerPrisma = async (
  playerId: number,
  data: UpdatePlayerData
) => {
  const response = await fetch(apiUrl(`/api/players/${playerId}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update player');
  }

  return response.json();
};

// DELETE /api/players/[player_id] - 선수 삭제
export const deletePlayerPrisma = async (playerId: number) => {
  const response = await fetch(apiUrl(`/api/players/${playerId}`), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete player');
  }

  return response.json();
};

// Helper function to convert form values to API data
export const convertFormToApiData = (
  formValues: PlayerFormValues
): CreatePlayerData | UpdatePlayerData => {
  return {
    name: formValues.name,
    birth_date: formValues.birth_date || undefined,
    nationality: formValues.nationality || undefined,
    height_cm: formValues.height_cm,
    profile_image_url: formValues.profile_image_url || undefined,
    jersey_number: formValues.jersey_number,
  };
};
