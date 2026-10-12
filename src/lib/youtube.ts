// 골때녀 기록실 — 사이트와 연결된 유튜브 채널
export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@골때녀기록실';
export const YOUTUBE_CHANNEL_NAME = '골때녀 기록실';
/** 구조화 데이터 sameAs용 — 핸들이 바뀌어도 유지되는 채널 ID 주소 */
export const YOUTUBE_CHANNEL_SAME_AS =
  'https://www.youtube.com/channel/UCJTMzAPHU_W5UqJ_pcfAeeg';

const YOUTUBE_ID = /^[\w-]{11}$/;

/**
 * shorts/ID, watch?v=ID, youtu.be/ID, embed/ID 링크에서 영상 ID를 꺼낸다.
 * http(s) 유튜브 주소가 아니면 null. isShort는 쇼츠 링크 여부 (다시 만드는 링크 형식에 사용)
 */
export function parseYoutubeUrl(
  url: string
): { id: string; isShort: boolean } | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const host = u.hostname.replace(/^(www\.|m\.)/, '');
  let id: string | null = null;
  let isShort = false;
  if (host === 'youtu.be') {
    id = u.pathname.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, kind, rest] = u.pathname.split('/');
    if (kind === 'watch') id = u.searchParams.get('v');
    else if (kind === 'shorts' || kind === 'embed' || kind === 'live') {
      id = rest ?? null;
      isShort = kind === 'shorts';
    }
  }
  return id && YOUTUBE_ID.test(id) ? { id, isShort } : null;
}

/** 검증한 ID로 링크를 다시 만든다 — DB에 적힌 원문 URL을 그대로 링크에 쓰지 않기 위해 */
export function youtubeWatchUrl({
  id,
  isShort,
}: {
  id: string;
  isShort: boolean;
}): string {
  return isShort
    ? `https://www.youtube.com/shorts/${id}`
    : `https://www.youtube.com/watch?v=${id}`;
}
