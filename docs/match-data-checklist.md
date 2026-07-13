# 경기 데이터 입력 체크리스트

경기(방송) 종료 후 데이터 입력 절차와 검증 방법. 시즌 33 1라운드 운영에서 실제 발생한 실수 유형을 기반으로 작성.

## 1. 경기 전 (시즌/로스터 준비)

- [ ] 참가팀 `team_seasons` 등록 — **경기를 등록하는 두 팀이 시즌 참가팀에 있어야 함**
- [ ] 감독 등록: `team_coach_history`에 시즌 행 추가 (`is_current=true`), 이전 시즌 행 닫기(`end_date`, `is_current=false`)
  - `team_current_head_coach`는 DB 트리거가 `is_current` 기준으로 자동 재계산 (2026-07-13부터) — **직접 UPDATE 금지**, 다음 재계산 때 덮어써짐. 감독 프로필 이미지는 `coaches.profile_image_url`이 원본
- [ ] 신규/이적 선수: `players` + `player_team_history`(시즌 행) + `player_positions`(시즌 행)
- [ ] 경기 등록 시: `description` 관례 준수 ("YYYY 골 때리는 그녀들 [대회명] N라운드 N경기"), `home_coach_id`/`away_coach_id` 연결

## 2. 경기 입력 (admin `/admin/matches/record/[matchId]`)

- [ ] 라인업: 출전 전원 `player_match_stats` — 선발 26분 / 교체 13분 (minutes_played로 선발·교체 구분)
- [ ] 교체: `substitutions` (IN/OUT/시간, 하프타임=13분)
- [ ] 골: 골 1건당 3곳 세트 —
  1. `goals` (goal_time=통산 분, goal_type: regular/own_goal/penalty, assist_id)
  2. **`assists` 테이블** (어시스트 있을 때 — **화면 표시는 이 테이블 기준**, goals.assist_id만으론 안 뜸)
  3. `player_match_stats` 누적 (득점자 goals, 도움 assists, GK goals_conceded)
- [ ] 자책골: `goals`에 own_goal로만 — 개인 득점 스탯에는 미반영
- [ ] 스코어·승부차기: `matches.home/away_score`, 동점 시 `penalty_*` 필수 (무승부 없음)
- [ ] 경기 감독: `match_coaches` 2행 (감독 상세 페이지 경기 기록용)
- [ ] 종료: `status='completed'`

## 3. 경기 후 (집계·검증)

- [ ] `/admin/stats`에서 해당 시즌 **통계 재생성** (standings·player_season_stats·team_season_stats — 수동 SQL 집계 금지)
- [ ] `/admin/stats`에서 **통계 검증** 실행 — 다음을 자동 확인:
  - 순위표·시즌 스탯 vs 경기 실계산
  - 경기 스코어 vs 골 기록 집계 (자책골 귀속 포함)
  - GK 실점 합 vs 상대 득점
  - 어시스트 `assists` 테이블 연결 누락
  - 개인 골/도움 스탯 vs 골 기록
  - 라인업/경기 감독/시청률 미입력 경기
  - 감독 현재 팀 테이블 드리프트
- [ ] 발견된 문제 0이 될 때까지 수정 후 재검증

## 4. 방송 다음 날

- [ ] 시청률 입력: 닐슨코리아(nielsenkorea.co.kr, area=00 전국/01 수도권)에서 **방송일 기준으로 확인** — 경기 없는 특집 회차가 끼면 회차-경기 매핑이 밀리기 쉬움 (시즌 32에서 4건 밀림 사례)
  - TOP 20 밖이면 수도권이 미공개일 수 있음 → null 유지가 정답
- [ ] 선수 평점(`player_match_ratings`) 입력 시 파워랭킹이 새 시즌으로 자동 전환됨
