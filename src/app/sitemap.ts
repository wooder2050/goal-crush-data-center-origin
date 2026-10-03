import { MetadataRoute } from 'next';

import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/retry';

// 빌드 때 한 번만 만들면 새 경기·시즌 URL이 다음 배포 전까지 빠진다 — 1시간마다 재생성
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.gtndatacenter.com';

  // DB 조회 실패 시 상세 URL이 빠진 사이트맵을 200으로 내보내지 않는다 —
  // 재시도 후에도 실패하면 오류로 응답해 이전 캐시를 유지하고 크롤러가 다시 오게 한다
  const [seasons, teams, players, coaches, matches, posts] = await withRetry(
    () =>
      Promise.all([
        prisma.season.findMany({
          select: { season_id: true, updated_at: true, end_date: true },
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
          select: {
            match_id: true,
            season_id: true,
            updated_at: true,
            match_date: true,
          },
          orderBy: { updated_at: 'desc' },
        }),
        prisma.communityPost.findMany({
          select: { post_id: true, updated_at: true },
          where: { is_deleted: false },
          orderBy: { updated_at: 'desc' },
        }),
      ])
  );

  // 경기 기록이 바뀌면 순위·기록 목록 페이지도 바뀐다 — 생성 시각 대신 마지막 경기 변경 시각.
  // matches.updated_at은 DB 트리거(update_matches_updated_at)로 갱신된다
  const dataUpdatedAt = matches[0]?.updated_at ?? undefined;

  // 정적 페이지들
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: dataUpdatedAt,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/seasons`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/teams`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/players`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/coaches`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stats`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ratings`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/matches`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/stats/scoring`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stats/goalkeepers`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stats/teams`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stats/head-to-head`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/stats/player-vs-team`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/stats/starter-win-rate`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/stats/penalty-shootout`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/stats/player-compare`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stats/viewership-ratings`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/stats/power-ranking`,
      lastModified: dataUpdatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community`,
      changeFrequency: 'daily',
      priority: 0.6,
    },
  ];

  // 시즌 페이지들 (활성 시즌은 daily, 종료된 시즌은 monthly)
  const now = new Date();
  // seasons.updated_at은 트리거가 없어 경기 기록이 바뀌어도 그대로다 — 시즌 경기의 최신 변경 시각과 비교
  const seasonMatchUpdatedAt = new Map<number, Date>();
  for (const m of matches) {
    if (m.season_id == null || !m.updated_at) continue;
    const prev = seasonMatchUpdatedAt.get(m.season_id);
    if (!prev || m.updated_at > prev)
      seasonMatchUpdatedAt.set(m.season_id, m.updated_at);
  }
  const seasonPages: MetadataRoute.Sitemap = seasons.map((season) => {
    const isActive = !season.end_date || new Date(season.end_date) > now;
    return {
      url: `${baseUrl}/seasons/${season.season_id}`,
      lastModified:
        [season.updated_at, seasonMatchUpdatedAt.get(season.season_id)]
          .filter((d): d is Date => !!d)
          .sort((a, b) => b.getTime() - a.getTime())[0] ?? undefined,
      changeFrequency: isActive ? 'daily' : 'monthly',
      priority: isActive ? 0.9 : 0.7,
    };
  });

  // 팀 페이지들
  const teamPages: MetadataRoute.Sitemap = teams.map((team) => ({
    url: `${baseUrl}/teams/${team.team_id}`,
    lastModified: team.updated_at ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 선수 페이지들
  const playerPages: MetadataRoute.Sitemap = players.map((player) => ({
    url: `${baseUrl}/players/${player.player_id}`,
    lastModified: player.updated_at ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 감독 페이지들
  const coachPages: MetadataRoute.Sitemap = coaches.map((coach) => ({
    url: `${baseUrl}/coaches/${coach.coach_id}`,
    lastModified: coach.created_at ?? undefined,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 경기 페이지들 (최근 60일 이내 경기는 daily, 이전 경기는 monthly)
  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - 60);
  const matchPages: MetadataRoute.Sitemap = matches.map((match) => {
    const isRecent =
      match.match_date && new Date(match.match_date) > recentCutoff;
    return {
      url: `${baseUrl}/matches/${match.match_id}`,
      lastModified: match.updated_at ?? undefined,
      changeFrequency: isRecent ? 'daily' : 'monthly',
      priority: isRecent ? 0.8 : 0.6,
    };
  });

  // 커뮤니티 포스트 페이지들
  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/community/posts/${post.post_id}`,
    lastModified: post.updated_at ?? undefined,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...seasonPages,
    ...teamPages,
    ...playerPages,
    ...coachPages,
    ...matchPages,
    ...postPages,
  ];
}
