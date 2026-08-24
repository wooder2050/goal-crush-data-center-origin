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
-- PUBLIC 포함: role_table_grants에 안 잡히는 PUBLIC 경유 권한까지 차단
-- (codex GPT-5.6 리뷰 반영)

REVOKE ALL ON TABLE public.match_actions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.player_match_detailed_stats FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.player_match_ratings FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.player_match_xt_ratings FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.player_match_stats FROM PUBLIC, anon, authenticated;

-- ── 4. 커밋 전 검증: 하나라도 남아 있으면 트랜잭션 전체 실패 ───────
-- 유효 권한은 has_table_privilege로 검사 (직접 GRANT + 역할 상속 + PUBLIC 합산).
-- information_schema.role_table_grants는 PUBLIC 경유 권한을 생략하므로 쓰지 않음.

DO $$
DECLARE
  v_count int;
BEGIN
  -- 4-1. 남은 정책이 없어야 함
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN
      ('match_actions','player_match_detailed_stats','player_match_ratings',
       'player_match_xt_ratings','player_match_stats');
  IF v_count > 0 THEN
    RAISE EXCEPTION '정책이 % 건 남아 있습니다. 정책명이 실서버와 다른지 확인하세요.', v_count;
  END IF;

  -- 4-2. RLS가 모두 켜져 있어야 함
  SELECT count(*) INTO v_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN
      ('match_actions','player_match_detailed_stats','player_match_ratings',
       'player_match_xt_ratings','player_match_stats')
    AND NOT c.relrowsecurity;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'RLS가 꺼진 테이블이 % 건 있습니다.', v_count;
  END IF;

  -- 4-3. anon/authenticated의 유효 권한이 전무해야 함
  SELECT count(*) INTO v_count
  FROM (VALUES
    ('match_actions'),
    ('player_match_detailed_stats'),
    ('player_match_ratings'),
    ('player_match_xt_ratings'),
    ('player_match_stats')
  ) AS t(table_name)
  CROSS JOIN (VALUES ('anon'), ('authenticated')) AS r(role_name)
  WHERE has_table_privilege(
          r.role_name,
          format('public.%I', t.table_name),
          'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
        )
     OR has_any_column_privilege(
          r.role_name,
          format('public.%I', t.table_name),
          'SELECT,INSERT,UPDATE,REFERENCES'
        );
  IF v_count > 0 THEN
    RAISE EXCEPTION 'anon/authenticated에 유효 권한이 % 건 남아 있습니다.', v_count;
  END IF;
END $$;

COMMIT;

-- ── 실행 후 확인 ────────────────────────────────────────────────────
-- 위 DO 블록이 통과해야만 COMMIT되므로 별도 SQL 검증은 불필요.
-- 사이트 동작 확인: 경기 상세 통계/평점 탭, 선수 상세, 홈 위젯이
-- 정상 표시되어야 함 (모두 Prisma 경유라 영향 없음이 정상).
--
-- 참고 (2026-08-24 실서버 확인): 이 5개 테이블에 의존하는 뷰/구체화 뷰 없음
-- (pg_depend 조회 0건 — 뷰 경유 RLS 우회 경로 없음).
--
-- 주의: 이 테이블을 DROP 후 재생성하는 마이그레이션은 Supabase 기본 권한이
-- 다시 붙으므로, 재생성 시 이 파일의 RLS+REVOKE를 재적용할 것.
