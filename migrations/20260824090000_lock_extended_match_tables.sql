-- 확장 경기 기록 테이블 PostgREST 직접 접근 차단 (2026-08-24)
--
-- 배경:
--   확장 경기 기록(팀 통계 비교·패스 네트워크·선수별 상세 통계·선수 평점/xT)
--   로그인 게이트 도입의 선행 작업. 게이트를 Next API에서만 걸면
--   anon 키 + PostgREST(/rest/v1)로 우회 가능하므로 테이블 직접 접근을 막는다.
--
-- 발견된 문제 (2026-08-23 실서버 pg_policies 실측):
--   1) 5개 테이블 모두 public/anon SELECT 허용 → 비로그인 우회 읽기 가능
--   2) match_actions·player_match_detailed_stats·player_match_stats에
--      auth.role()='authenticated'만 검사하는 INSERT/UPDATE/DELETE 정책 존재
--      → 일반 회원이 운영자 기록 데이터를 쓰거나 지울 수 있었음
--
-- 결정:
--   웹·모바일 앱 모두 이 테이블들을 PostgREST로 직접 읽는 코드가 없음을 확인
--   (supabase.from 사용 0건 — 모든 접근은 Next API Route + Prisma 경유).
--   따라서 anon·authenticated 모두 차단하고 서버(Prisma, postgres 롤)만 접근한다.
--   Prisma는 테이블 소유자(postgres)로 접속하므로 RLS의 영향을 받지 않는다.
--
-- 실행: Supabase SQL Editor에서 직접 실행 (Supabase MCP는 읽기 전용)

BEGIN;

-- ── 1. 기존 정책 제거 (실서버 정책명 기준) ─────────────────────────

-- match_actions
DROP POLICY IF EXISTS "Allow public read access" ON public.match_actions;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.match_actions;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.match_actions;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.match_actions;

-- player_match_detailed_stats
DROP POLICY IF EXISTS "Allow public read access" ON public.player_match_detailed_stats;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.player_match_detailed_stats;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.player_match_detailed_stats;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.player_match_detailed_stats;

-- player_match_ratings
DROP POLICY IF EXISTS "Allow read access" ON public.player_match_ratings;

-- player_match_xt_ratings
DROP POLICY IF EXISTS "Allow public read access" ON public.player_match_xt_ratings;

-- player_match_stats
DROP POLICY IF EXISTS "Allow public read access" ON public.player_match_stats;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.player_match_stats;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.player_match_stats;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.player_match_stats;

-- ── 2. RLS 유지 확인 (정책이 없으면 기본 거부) ─────────────────────

ALTER TABLE public.match_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_match_detailed_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_match_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_match_xt_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_match_stats ENABLE ROW LEVEL SECURITY;

-- ── 3. 테이블 권한 자체도 회수 (RLS + GRANT 이중 차단) ─────────────

REVOKE ALL ON TABLE public.match_actions FROM anon, authenticated;
REVOKE ALL ON TABLE public.player_match_detailed_stats FROM anon, authenticated;
REVOKE ALL ON TABLE public.player_match_ratings FROM anon, authenticated;
REVOKE ALL ON TABLE public.player_match_xt_ratings FROM anon, authenticated;
REVOKE ALL ON TABLE public.player_match_stats FROM anon, authenticated;

COMMIT;

-- ── 검증 쿼리 (실행 후 확인용) ──────────────────────────────────────
-- 1) 남은 정책이 없어야 함:
--    SELECT tablename, policyname FROM pg_policies
--    WHERE schemaname='public' AND tablename IN
--      ('match_actions','player_match_detailed_stats','player_match_ratings',
--       'player_match_xt_ratings','player_match_stats');
-- 2) anon/authenticated 권한이 없어야 함:
--    SELECT table_name, grantee, privilege_type
--    FROM information_schema.role_table_grants
--    WHERE table_schema='public' AND grantee IN ('anon','authenticated')
--      AND table_name IN
--      ('match_actions','player_match_detailed_stats','player_match_ratings',
--       'player_match_xt_ratings','player_match_stats');
-- 3) 사이트 동작 확인: 경기 상세 통계/평점 탭, 선수 상세, 홈 위젯이
--    정상 표시되어야 함 (모두 Prisma 경유라 영향 없음이 정상).
