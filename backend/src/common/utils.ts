export type LeagueType = 'super' | 'challenge' | 'playoff' | 'cup' | 'g-league' | 'other';

export function inferLeague(seasonName: string | null): LeagueType {
  if (!seasonName) return 'other';
  const name = seasonName.toLowerCase();
  if (name.includes('super') || name.includes('슈퍼')) return 'super';
  if (name.includes('challenge') || name.includes('챌린지')) return 'challenge';
  if (name.includes('playoff') || name.includes('플레이오프')) return 'playoff';
  if (name.includes('champion') || name.includes('챔피언')) return 'cup';
  if (name.includes('sbs') || name.includes('cup') || name.includes('컵')) return 'cup';
  if (name.includes('g-league') || name.includes('g리그') || name.includes('G리그'))
    return 'g-league';
  return 'other';
}
