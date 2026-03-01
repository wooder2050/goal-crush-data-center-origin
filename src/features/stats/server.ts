import { prisma } from '@/lib/prisma';

// ── Types ──────────────────────────────────────────────

export type TeamOption = {
  team_id: number;
  team_name: string;
  logo?: string;
};

export type InitialHeadToHeadData = {
  teams: TeamOption[];
};

// ── /stats/head-to-head ────────────────────────────────

/**
 * Fetches team list for the head-to-head page team dropdowns.
 */
export async function getInitialHeadToHeadData(): Promise<InitialHeadToHeadData> {
  const teams = await prisma.team.findMany({
    select: {
      team_id: true,
      team_name: true,
      logo: true,
    },
    orderBy: { team_name: 'asc' },
  });

  return {
    teams: teams.map((t) => ({
      team_id: t.team_id,
      team_name: t.team_name,
      logo: t.logo ?? undefined,
    })),
  };
}
