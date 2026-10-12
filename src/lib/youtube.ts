// 골때녀 기록실 — 사이트와 연결된 유튜브 채널
export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@골때녀기록실';
export const YOUTUBE_CHANNEL_NAME = '골때녀 기록실';
/** 구조화 데이터 sameAs용 — 핸들이 바뀌어도 유지되는 채널 ID 주소 */
export const YOUTUBE_CHANNEL_SAME_AS =
  'https://www.youtube.com/channel/UCJTMzAPHU_W5UqJ_pcfAeeg';

const YOUTUBE_ID = /^[\w-]{11}$/;

/** shorts/ID, watch?v=ID, youtu.be/ID, embed/ID 링크에서 영상 ID를 꺼낸다. 알 수 없는 형식이면 null */
export function parseYoutubeId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www\.|m\.)/, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = u.pathname.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, kind, rest] = u.pathname.split('/');
    if (kind === 'watch') id = u.searchParams.get('v');
    else if (kind === 'shorts' || kind === 'embed' || kind === 'live')
      id = rest ?? null;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}
