# 방송 당일 배포 체크리스트

> 목표 SLA: **방송 종료 후 60~90분 이내 결과+요약 발행**
> 북극성 지표: 최근 4개 방송 주 GA4 Returning users 중앙값 (방송 없는 주 제외)

## 방송 전 (수요일 낮)

- [ ] `/admin/matches`에서 오늘 경기 존재·대진·일시 확인
- [ ] 시즌 페이지(`/seasons/[id]`)가 "진행 중" 상태로 노출되는지 확인

## 방송 직후 (21:00~22:30)

- [ ] **경기 기록 입력**: `/admin/matches/record/[matchId]` — 스코어, 득점·어시스트, 라인업(선발 26분/교체 13분), 교체, 승부차기(`penalty_*`)
- [ ] **AI 경기 요약 생성**: 데이터 추출 → Claude 초안 → codex 리뷰 → `matches.summary` 저장
  - 금지 표현: 완봉승(→클린시트), 난타전(→골잔치), 전반/후반, 7인제 풋살, 골키퍼 익명표기
- [ ] **프로덕션 확인**: 경기 상세 페이지에서 스코어·요약·OG 이미지 렌더링 확인
  - `curl -s https://www.gtndatacenter.com/matches/[id] | grep 팀명`
- [ ] **배포**: 경기 상세 URL을 UTM 붙여 기존 채널에 공유
  - 형식: `https://www.gtndatacenter.com/matches/[id]?utm_source=[채널]&utm_medium=social&utm_campaign=matchday`

## 다음 날 (목요일)

- [ ] **시청률 반영**: 닐슨코리아 일일 시청률(전국·수도권) 확인 → `matches.rating_nationwide`, `rating_metropolitan` 업데이트
  - 출처: https://www.nielsenkorea.co.kr/tv_terrestrial_day.asp?menu=Tit_1&sub_menu=1_1&area=00 (전국), area=01 (수도권)
- [ ] 시즌 페이지 SSR 요약에 어제 경기가 반영됐는지 확인 (revalidate 600초)

## 주간 점검 (금요일)

- [ ] GA4에서 방송 주 Returning users 기록 (북극성 지표)
- [ ] `share` 이벤트 수 확인 (method·content_type별)
- [ ] Search Console·네이버 서치어드바이저에서 색인 오류 확인

## 운영 기록

| 방송일 | 발행 소요 시간 | 특이사항 |
| ------ | -------------- | -------- |
| (기록) |                |          |
