import { NextRequest, NextResponse } from 'next/server';

import type { ChannelVideoItem } from '@/features/channel-videos/types';
import { prisma } from '@/lib/prisma';
import { parseYoutubeUrl, youtubeWatchUrl } from '@/lib/youtube';

export const dynamic = 'force-dynamic';

const INT4_MAX = 2147483647;

/** 양의 정수 문자열만 허용 (공백·소수·0·범위 초과는 null) */
function positiveInt(value: string | null, max: number): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return n >= 1 && n <= max ? n : null;
}

/**
 * GET /api/channel-videos?match_id=401&limit=1
 * 골때녀 기록실(유튜브) 영상 목록 — channel_videos 행을 바꾸면 배포 없이 반영된다.
 * match_id가 있으면 그 경기 영상만, 없으면 최신순 전체. 링크 형식이 잘못된 행은 건너뛴다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawMatchId = searchParams.get('match_id');
  const rawLimit = searchParams.get('limit');
  const matchId = rawMatchId === null ? null : positiveInt(rawMatchId, INT4_MAX);
  const limit = rawLimit === null ? 3 : positiveInt(rawLimit, 12);

  if ((rawMatchId !== null && matchId === null) || limit === null) {
    return NextResponse.json({ error: 'invalid parameter' }, { status: 400 });
  }

  try {
    // 잘못 입력된 링크 행이 최신이어도 정상 영상이 가려지지 않게 후보를 넉넉히 읽고 거른다
    const rows = await prisma.channelVideo.findMany({
      where: {
        is_active: true,
        ...(matchId !== null ? { match_id: matchId } : {}),
      },
      orderBy: [{ published_at: 'desc' }, { video_id: 'desc' }],
      take: limit + 10,
    });
    const videos: ChannelVideoItem[] = rows
      .flatMap((r) => {
        const parsed = parseYoutubeUrl(r.youtube_url);
        if (!parsed) return [];
        return [
          {
            video_id: r.video_id,
            youtube_id: parsed.id,
            youtube_url: youtubeWatchUrl(parsed),
            title: r.title,
            video_type: r.video_type,
            match_id: r.match_id,
            published_at: r.published_at.toISOString(),
          },
        ];
      })
      .slice(0, limit);
    // 엣지 캐시 60초(+재검증 중 최대 60초 이전 응답) — DB 수정은 보통 1~2분 안에 화면에 반영된다
    return NextResponse.json(
      { videos },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    // 영상 노출은 부가 기능 — 테이블이 없거나 DB 오류여도 페이지는 영상 영역만 숨긴다
    console.error('channel-videos GET failed', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
