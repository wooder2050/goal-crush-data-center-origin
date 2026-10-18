-- 2026-10-16 데이터 보정 (Supabase SQL Editor에서 실행, 여러 번 실행해도 결과 동일)

BEGIN;

-- 1) 시즌 34(제3회 지파컵) 8강 경기 라운드 표시: 비어 있는 경기만 '8강'(quarter_final)으로
UPDATE matches
SET tournament_stage = 'quarter_final'
WHERE season_id = 34
  AND match_id IN (400, 401, 402)
  AND tournament_stage IS NULL;

-- 2) 시즌 34 참가팀 추가: 원더우먼(37)·스트리밍파이터(39) (경기 402 대진 공개)
INSERT INTO team_seasons (team_id, season_id)
SELECT v.team_id, 34
FROM (VALUES (37), (39)) AS v(team_id)
WHERE NOT EXISTS (
  SELECT 1 FROM team_seasons ts WHERE ts.team_id = v.team_id AND ts.season_id = 34
);

-- 3) 교체 기록 누락 보정: 팀 선발 5명이 경기 전체를 뛰었는데 교체 기록 없이 절반만 뛴 선수 = 교체 출전 확정
--    (나간 선수·교체 시간은 모르므로 player_in만 기록. 출전 시간·골·도움은 건드리지 않음)
INSERT INTO substitutions (match_id, team_id, player_in_id)
SELECT v.match_id, v.team_id, v.player_in_id
FROM (VALUES
  (288, 39, 227),  -- 스트리밍파이터 진절미
  (326, 38, 256),  -- 발라드림 신유미
  (329, 20, 262),  -- 구척장신 임경민
  (351, 30, 267),  -- 액셔니스타 이영아
  (351, 38, 286)   -- 발라드림 벤
) AS v(match_id, team_id, player_in_id)
WHERE NOT EXISTS (
  SELECT 1 FROM substitutions s
  WHERE s.match_id = v.match_id
    AND (s.player_in_id = v.player_in_id OR s.player_out_id = v.player_in_id)
);

COMMIT;

-- 확인
SELECT match_id, tournament_stage FROM matches WHERE match_id IN (400, 401, 402) ORDER BY match_id;
SELECT t.team_name FROM team_seasons ts JOIN teams t ON t.team_id = ts.team_id WHERE ts.season_id = 34 ORDER BY t.team_name;
SELECT match_id, team_id, player_in_id FROM substitutions
WHERE (match_id, player_in_id) IN ((288,227),(326,256),(329,262),(351,267),(351,286)) ORDER BY match_id;
