import { MetadataRoute } from 'next';

import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.gtndatacenter.com';

  // 정적 페이지들
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/seasons`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/teams`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/players`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/coaches`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stats`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stats/scoring`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stats/goalkeepers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stats/teams`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stats/head-to-head`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/stats/player-vs-team`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/stats/starter-win-rate`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/stats/penalty-shootout`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  try {
    // 데이터베이스에서 실제 데이터 가져오기 (모든 데이터 포함)
    const [seasons, teams, players, coaches, matches] = await Promise.all([
      prisma.season.findMany({
        select: { season_id: true, updated_at: true },
        orderBy: { updated_at: 'desc' },
      }),
      prisma.team.findMany({
        select: { team_id: true, updated_at: true },
        orderBy: { updated_at: 'desc' },
      }),
      prisma.player.findMany({
        select: { player_id: true, updated_at: true },
        orderBy: { updated_at: 'desc' },
      }),
      prisma.coach.findMany({
        select: { coach_id: true, created_at: true },
        orderBy: { created_at: 'desc' },
      }),
      prisma.match.findMany({
        select: { match_id: true, updated_at: true },
        orderBy: { updated_at: 'desc' },
      }),
    ]);

    // 시즌 페이지들
    const seasonPages: MetadataRoute.Sitemap = seasons.map((season) => ({
      url: `${baseUrl}/seasons/${season.season_id}`,
      lastModified: season.updated_at || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // 팀 페이지들
    const teamPages: MetadataRoute.Sitemap = teams.map((team) => ({
      url: `${baseUrl}/teams/${team.team_id}`,
      lastModified: team.updated_at || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // 선수 페이지들
    const playerPages: MetadataRoute.Sitemap = players.map((player) => ({
      url: `${baseUrl}/players/${player.player_id}`,
      lastModified: player.updated_at || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // 감독 페이지들
    const coachPages: MetadataRoute.Sitemap = coaches.map((coach) => ({
      url: `${baseUrl}/coaches/${coach.coach_id}`,
      lastModified: coach.created_at || new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    }));

    // 경기 페이지들
    const matchPages: MetadataRoute.Sitemap = matches.map((match) => ({
      url: `${baseUrl}/matches/${match.match_id}`,
      lastModified: match.updated_at || new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [
      ...staticPages,
      ...seasonPages,
      ...teamPages,
      ...playerPages,
      ...coachPages,
      ...matchPages,
    ];
  } catch (error) {
    console.error('Sitemap 생성 중 오류 발생:', error);
    // 오류 발생 시 정적 페이지만 반환
    return staticPages;
  }
}
