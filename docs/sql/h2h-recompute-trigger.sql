-- 맞대결(h2h_pair_stats) 트리거: 누적(+1) → 쌍 단위 재계산 (2026-10-07 운영 DB 적용)
--
-- 배경: 기존 h2h_upsert_from_match_trg()는 matches의 스코어가 UPDATE될 때마다
-- total_matches를 +1, 득점을 누적했다. 실시간 입력(골마다 스코어 갱신)을 하면 한 경기가
-- 여러 번 더해지고, 0:0·동점 상태 저장마다 draws가 쌓였다(골때녀는 무승부 없음).
-- 2026-07-29 "원인 미상" 전면 정정과 398·399·400 부풀림의 원인.
-- 이제 트리거는 해당 팀 쌍을 matches에서 매번 다시 계산하므로 몇 번을 갱신해도 결과가 같다.

CREATE OR REPLACE FUNCTION public.h2h_recompute_pair(p_small int, p_large int)
RETURNS void LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  WITH m AS (
    SELECT home_team_id AS h, home_score AS hs, away_score AS aws, penalty_home_score AS phs, penalty_away_score AS pas
    FROM matches
    WHERE LEAST(home_team_id, away_team_id) = p_small AND GREATEST(home_team_id, away_team_id) = p_large
      AND home_score IS NOT NULL AND away_score IS NOT NULL
  ), c AS (
    SELECT count(*)::int AS total,
      count(*) FILTER (WHERE CASE WHEN phs IS NOT NULL AND pas IS NOT NULL
                                  THEN (CASE WHEN h = p_small THEN phs > pas ELSE pas > phs END)
                                  ELSE (CASE WHEN h = p_small THEN hs > aws ELSE aws > hs END) END)::int AS sw,
      count(*) FILTER (WHERE CASE WHEN phs IS NOT NULL AND pas IS NOT NULL THEN phs = pas ELSE hs = aws END)::int AS dr,
      count(*) FILTER (WHERE CASE WHEN phs IS NOT NULL AND pas IS NOT NULL
                                  THEN (CASE WHEN h = p_large THEN phs > pas ELSE pas > phs END)
                                  ELSE (CASE WHEN h = p_large THEN hs > aws ELSE aws > hs END) END)::int AS lw,
      coalesce(sum(CASE WHEN h = p_small THEN hs ELSE aws END), 0)::int AS sg,
      coalesce(sum(CASE WHEN h = p_small THEN aws ELSE hs END), 0)::int AS lg
    FROM m
  )
  INSERT INTO h2h_pair_stats (team_small_id, team_large_id, total_matches, small_wins, draws, large_wins, small_goals, large_goals)
  SELECT p_small, p_large, total, sw, dr, lw, sg, lg FROM c
  ON CONFLICT (team_small_id, team_large_id) DO UPDATE SET
    total_matches = EXCLUDED.total_matches, small_wins = EXCLUDED.small_wins, draws = EXCLUDED.draws,
    large_wins = EXCLUDED.large_wins, small_goals = EXCLUDED.small_goals, large_goals = EXCLUDED.large_goals,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.h2h_upsert_from_match_trg()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.home_team_id IS NULL OR NEW.away_team_id IS NULL THEN RETURN NEW; END IF;
  PERFORM h2h_recompute_pair(LEAST(NEW.home_team_id, NEW.away_team_id), GREATEST(NEW.home_team_id, NEW.away_team_id));
  IF TG_OP = 'UPDATE' AND OLD.home_team_id IS NOT NULL AND OLD.away_team_id IS NOT NULL
     AND (LEAST(OLD.home_team_id, OLD.away_team_id), GREATEST(OLD.home_team_id, OLD.away_team_id))
         IS DISTINCT FROM (LEAST(NEW.home_team_id, NEW.away_team_id), GREATEST(NEW.home_team_id, NEW.away_team_id)) THEN
    PERFORM h2h_recompute_pair(LEAST(OLD.home_team_id, OLD.away_team_id), GREATEST(OLD.home_team_id, OLD.away_team_id));
  END IF;
  RETURN NEW;
END;
$$;

-- 트리거 자체(기존 유지): trg_h2h_after_match_change
--   AFTER INSERT OR UPDATE OF home_score, away_score, penalty_home_score, penalty_away_score ON matches
--   FOR EACH ROW WHEN (NEW.home_team_id IS NOT NULL AND NEW.away_team_id IS NOT NULL)

-- 전체 재계산(정정용, 멱등):
-- SELECT h2h_recompute_pair(s, l)
-- FROM (SELECT DISTINCT LEAST(home_team_id, away_team_id) AS s, GREATEST(home_team_id, away_team_id) AS l
--       FROM matches WHERE home_team_id IS NOT NULL AND away_team_id IS NOT NULL) x;
