// Admin용 감독 API 함수들

export type CoachWithStats = {
  coach_id: number;
  name: string;
  birth_date?: string | null;
  nationality?: string | null;
  profile_image_url?: string | null;
  created_at?: string | null;
  total_matches?: number;
  current_team?: {
    team_id: number;
    team_name: string;
    logo: string | null;
  } | null;
};

// 모든 감독 목록 조회 (관리자용)
export const getCoachesForAdmin = async (): Promise<CoachWithStats[]> => {
  const response = await fetch('/api/coaches?limit=1000');
  if (!response.ok) {
    throw new Error(`Failed to fetch coaches: ${response.statusText}`);
  }

  const result = await response.json();

  // API 응답을 CoachWithStats 형태로 변환
  return result.coaches.map(
    (coach: {
      coach_id: number;
      name: string;
      birth_date?: string | null;
      nationality?: string | null;
      profile_image_url?: string | null;
      created_at?: string | null;
      total_matches?: number;
      current_team_verified?: {
        team_id: number;
        team_name: string;
        logo: string | null;
      } | null;
    }) => ({
      coach_id: coach.coach_id,
      name: coach.name,
      birth_date: coach.birth_date,
      nationality: coach.nationality,
      profile_image_url: coach.profile_image_url,
      created_at: coach.created_at,
      total_matches: coach.total_matches || 0,
      current_team: coach.current_team_verified || null,
    })
  );
};

Object.defineProperty(getCoachesForAdmin, 'queryKey', { value: 'coachesAll' });
