import { NextRequest, NextResponse } from 'next/server';

import type { ChannelVideoItem } from '@/features/channel-videos/types';
import { prisma } from '@/lib/prisma';
import { parseYoutubeId } from '@/lib/youtube';

export const dynamic = 'force-dynamic';

/**
 * GET /api/channel-videos?match_id=401&limit=1
 * 골때녀 기록실(유튜브) 영상 목록 — channel_videos 행을 바꾸면 배포 없이 반영된다.
 * match_id가 있으면 그 경기 영상만, 없으면 최신순 전체. 링크 형식이 잘못된 행은 건너뛴다.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const matchIdParam = url.searchParams.get('match_id');
  const matchId = matchIdParam ? Number(matchIdParam) : null;
  const limit = Math.min(
    Math.max(Number(url.searchParams.get('limit')) || 3, 1),
    12
  );

  if (matchIdParam && !Number.isInteger(matchId)) {
    return NextResponse.json({ videos: [] }, { status: 400 });
  }

  try {
    const rows = await prisma.channelVideo.findMany({
      where: { is_active: true, ...(matchId ? { match_id: matchId } : {}) },
      orderBy: [{ published_at: 'desc' }, { video_id: 'desc' }],
      take: limit,
    });
    const videos: ChannelVideoItem[] = rows.flatMap((r) => {
      const youtube_id = parseYoutubeId(r.youtube_url);
      if (!youtube_id) return [];
      return [
        {
          video_id: r.video_id,
          youtube_id,
          youtube_url: r.youtube_url,
          title: r.title,
          video_type: r.video_type,
          match_id: r.match_id,
          published_at: r.published_at.toISOString(),
        },
      ];
    });
    // 엣지 캐시 1분 — DB 수정이 늦어도 1~2분 안에 화면에 반영된다
    return NextResponse.json(
      { videos },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    // 영상 노출은 부가 기능 — 테이블이 없거나 DB 오류여도 페이지는 영상 영역만 숨긴다
    console.error('channel-videos GET failed', error);
    return NextResponse.json({ videos: [] }, { status: 500 });
  }
}
