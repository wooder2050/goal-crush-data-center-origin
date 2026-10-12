-- 골때녀 기록실(유튜브 채널) 영상 목록 — 사이트 홈·경기 상세에 노출
-- 영상을 올린 뒤 행을 추가/수정하면 배포 없이 화면이 바뀐다 (API가 매 요청 DB를 읽음)
--   youtube_url : 쇼츠/일반 링크 그대로 (youtube.com/shorts/ID, watch?v=ID, youtu.be/ID 모두 가능)
--   match_id    : 경기 프리뷰·리뷰처럼 특정 경기 영상이면 지정 → 그 경기 상세 페이지에도 노출
--   is_active   : false 로 바꾸면 사이트에서 숨김
--   published_at: 홈에는 가장 최근 값 순으로 노출

CREATE TABLE IF NOT EXISTS public.channel_videos (
  video_id     serial PRIMARY KEY,
  youtube_url  text        NOT NULL UNIQUE,
  title        text        NOT NULL,
  video_type   text        NOT NULL DEFAULT 'preview'
               CHECK (video_type IN ('preview', 'recap', 'stats', 'etc')),
  match_id     integer     REFERENCES public.matches(match_id) ON DELETE SET NULL,
  is_active    boolean     NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_channel_videos_match ON public.channel_videos (match_id);
CREATE INDEX IF NOT EXISTS idx_channel_videos_published ON public.channel_videos (published_at DESC);

-- 사이트는 Prisma(서버)로 읽는다. 공개 데이터라 읽기만 열어 둔다 (2026-10-30 이후 새 테이블은 GRANT 필수)
ALTER TABLE public.channel_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS channel_videos_read ON public.channel_videos;
CREATE POLICY channel_videos_read ON public.channel_videos FOR SELECT USING (true);
GRANT SELECT ON public.channel_videos TO anon, authenticated;

-- 첫 영상: 401 탑걸 vs 월드클라쓰 프리뷰 (2026-10-12)
INSERT INTO public.channel_videos (youtube_url, title, video_type, match_id, published_at)
VALUES (
  'https://youtube.com/shorts/Vz8V0sB4jcA',
  '탑걸 vs 월드클라쓰, 흐름은 월클인데 맞대결은 2승 2패',
  'preview',
  401,
  '2026-10-12 22:40:00+09'
)
ON CONFLICT (youtube_url) DO NOTHING;

-- 다음 영상 추가 예시
-- INSERT INTO public.channel_videos (youtube_url, title, video_type, match_id)
-- VALUES ('https://youtube.com/shorts/XXXXXXXXXXX', '제목', 'preview', 402);
-- 숨기기: UPDATE public.channel_videos SET is_active = false WHERE video_id = 1;
