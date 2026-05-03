'use client';

import type { MatchWithTeams } from '@/lib/types';

import TeamLineupsSection from '../TeamLineupsSection';

export default function LineupsTab({ match }: { match: MatchWithTeams }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <TeamLineupsSection match={match} />
    </div>
  );
}
