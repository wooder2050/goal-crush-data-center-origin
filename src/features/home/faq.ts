import type { HomePageData } from './types';

const kstMonthDay = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'long',
  day: 'numeric',
});

/** 마지막 글자 받침 유무로 은/는 선택 */
function topicParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return '은(는)';
  return code % 28 === 0 ? '는' : '은';
}

/**
 * 홈 FAQ "골때녀 GIFA컵 일정은?" 답변 — 홈 데이터로 생성해 시즌이 바뀌어도 낡지 않게.
 * 공개된 일정만 말하고, 대진·라운드가 미정이면 그렇다고 밝힌다.
 */
export function buildGifaCupFaqAnswer(data: HomePageData): string {
  const season = data.currentSeason;
  const generic =
    '골때녀 데이터센터에서 역대 GIFA컵의 대진과 경기 결과를 확인할 수 있고, 새 대회는 매 경기 방송 후 업데이트합니다.';

  if (season.category !== 'GIFA_CUP' || !season.season_name) return generic;

  const name = `골 때리는 그녀들 ${season.season_name.replace(/골\s*때리는\s*그녀들\s*/, '').trim()}`;
  const particle = topicParticle(name);

  // 종료일이 미리 입력돼 있어도 실제로 지나기 전에는 종료로 보지 않는다
  if (season.end_date && new Date(season.end_date).getTime() <= Date.now()) {
    return `${name}${particle} ${kstMonthDay.format(new Date(season.end_date))} 종료됐습니다. ${generic}`;
  }

  const hasCompleted = !data.statsSeason?.is_fallback;
  if (hasCompleted) {
    return `${name}${particle} 현재 진행 중입니다. 경기 결과와 다음 일정은 매 경기 방송 후 업데이트합니다.`;
  }

  // 개막 전: 공개된 첫 경기만 안내
  const first =
    data.kickoffMatch ??
    data.upcomingMatches.find(
      (m) => m.season?.season_id === season.season_id
    ) ??
    null;
  if (first && first.is_date_confirmed !== false) {
    const home = first.home_team?.team_name;
    const away = first.away_team?.team_name;
    const matchup = home && away ? ` ${home} vs ${away} 경기로` : '';
    return `${name}${particle} ${kstMonthDay.format(new Date(first.match_date))}${matchup} 개막합니다. 라운드와 나머지 대진은 공개되는 대로 반영하고, 매 경기 방송 후 결과를 업데이트합니다.`;
  }
  if (season.start_date) {
    return `${name}${particle} ${kstMonthDay.format(new Date(season.start_date))} 개막 예정입니다. 대진은 공개되는 대로 반영합니다.`;
  }
  return generic;
}
