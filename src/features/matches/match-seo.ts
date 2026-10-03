/**
 * 경기 상세의 title·description·H1에 공통으로 쓰는 결과 문구.
 * 메타·본문·공유 문구가 같은 결과를 말하도록 한곳에서 만든다.
 */
import { formatKstDotDate, formatKstLongDate } from '@/lib/kst';

interface MatchSeoInput {
  homeTeamName: string;
  awayTeamName: string;
  seasonName: string;
  status: string | null;
  matchDate: Date | string | null;
  isDateConfirmed: boolean;
  homeScore: number | null;
  awayScore: number | null;
  penaltyHomeScore: number | null;
  penaltyAwayScore: number | null;
  scorers: string[];
}

/** 제목용 짧은 팀명 — 'FC ' 접두어 제거 */
function shortTeam(name: string): string {
  return name.replace(/^FC\s+/, '');
}

export function buildMatchSeo(m: MatchSeoInput) {
  const isCompleted =
    m.status === 'completed' && m.homeScore != null && m.awayScore != null;
  const hasPenalty = m.penaltyHomeScore != null && m.penaltyAwayScore != null;
  const iso = m.matchDate ? new Date(m.matchDate).toISOString() : null;
  const dotDate = iso ? formatKstDotDate(iso) : '';
  const longDate = iso ? formatKstLongDate(iso) : '';
  // 시즌명이 이미 '골 때리는 그녀들'로 시작하는 경우가 많아 중복되지 않게
  const seasonLabel = m.seasonName.includes('골 때리는 그녀들')
    ? m.seasonName
    : `골 때리는 그녀들 ${m.seasonName}`.trim();
  const home = shortTeam(m.homeTeamName);
  const away = shortTeam(m.awayTeamName);

  if (isCompleted) {
    const h = m.homeScore!;
    const a = m.awayScore!;
    const pkText = hasPenalty
      ? ` (승부차기 ${m.penaltyHomeScore}:${m.penaltyAwayScore})`
      : '';
    let winner: string | null = null;
    if (h !== a) winner = h > a ? m.homeTeamName : m.awayTeamName;
    else if (hasPenalty && m.penaltyHomeScore !== m.penaltyAwayScore)
      winner =
        m.penaltyHomeScore! > m.penaltyAwayScore!
          ? m.homeTeamName
          : m.awayTeamName;

    const resultLine = `${home} ${h}:${a} ${away}${pkText}`;
    const scorers =
      m.scorers.length > 3
        ? `${m.scorers.slice(0, 3).join(', ')} 외 ${m.scorers.length - 3}명`
        : m.scorers.join(', ');
    const winnerText = winner
      ? hasPenalty
        ? `, 승부차기 ${m.penaltyHomeScore}:${m.penaltyAwayScore}로 ${winner} 승리`
        : `, ${winner} 승리`
      : '';

    return {
      title: `${resultLine} 경기 결과${dotDate ? ` (${dotDate})` : ''}`,
      description: `${seasonLabel} ${m.homeTeamName} vs ${m.awayTeamName} 경기 결과 ${h}:${a}${winnerText}${longDate ? ` (${longDate} 방송)` : ''}.${scorers ? ` 득점: ${scorers}.` : ''} 선수별 평점·상세 기록 확인.`,
      heading: `${m.homeTeamName} ${h}:${a} ${m.awayTeamName}${pkText} 경기 결과`,
    };
  }

  const dated = m.isDateConfirmed && dotDate;
  return {
    title: `${home} vs ${away} 경기 일정·라인업${dated ? ` (${dotDate} 방송)` : ''}`,
    description: `${seasonLabel} ${m.homeTeamName} vs ${m.awayTeamName}.${m.isDateConfirmed && longDate ? ` ${longDate} 방송 예정.` : ''} 최근 전적·맞대결 기록을 확인하세요.`,
    heading: `${m.homeTeamName} vs ${m.awayTeamName}`,
  };
}
