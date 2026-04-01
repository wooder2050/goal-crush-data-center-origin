'use client';

import Image from 'next/image';
import { useState } from 'react';

import { useGoalQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';
import { shortenSeasonName } from '@/lib/utils';

// ========== Types ==========

interface Trophy {
  season_id: number;
  season_name: string;
  year: number | null;
  category: string | null;
}

interface TeamTrophies {
  team_id: number;
  team_name: string;
  logo: string | null;
  trophies: Trophy[];
}

interface PlayerTrophiesResponse {
  player_id: number;
  total: number;
  trophies: TeamTrophies[];
}

interface IndividualAward {
  award_type: 'top_scorer' | 'top_assists' | 'top_attack_points';
  award_label: string;
  season_id: number;
  season_name: string;
  category: string | null;
  stat_value: number;
  is_shared: boolean;
}

interface IndividualAwardsResponse {
  player_id: number;
  total: number;
  awards: IndividualAward[];
}

// ========== Helpers ==========

function getCategoryLabel(category: string | null): string | null {
  switch (category) {
    case 'SUPER_LEAGUE':
      return '슈퍼리그';
    case 'G_LEAGUE':
      return 'G리그';
    case 'SBS_CUP':
      return 'SBS컵';
    case 'CHAMPION_MATCH':
      return '챔피언 매치';
    case 'GIFA_CUP':
      return 'GIFA컵';
    default:
      return null;
  }
}

const AWARD_EMOJI: Record<string, string> = {
  top_scorer: '⚽',
  top_assists: '🎯',
  top_attack_points: '🔥',
};

// ========== API ==========

async function fetchPlayerTrophies(
  playerId: number
): Promise<PlayerTrophiesResponse> {
  const res = await fetch(apiUrl(`/api/players/${playerId}/trophies`));
  if (!res.ok) throw new Error('Failed to fetch trophies');
  return res.json();
}

async function fetchIndividualAwards(
  playerId: number
): Promise<IndividualAwardsResponse> {
  const res = await fetch(apiUrl(`/api/players/${playerId}/individual-awards`));
  if (!res.ok) throw new Error('Failed to fetch individual awards');
  return res.json();
}

// ========== Main Component ==========

export default function PlayerTrophiesCard({ playerId }: { playerId: number }) {
  const { data: teamData } = useGoalQuery(fetchPlayerTrophies, [playerId], {
    staleTime: 10 * 60 * 1000,
  });
  const { data: individualData } = useGoalQuery(
    fetchIndividualAwards,
    [playerId],
    { staleTime: 10 * 60 * 1000 }
  );

  const hasTeam = (teamData?.total ?? 0) > 0;
  const hasIndividual = (individualData?.total ?? 0) > 0;

  if (!hasTeam && !hasIndividual) return null;

  const bothTabs = hasTeam && hasIndividual;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      <div className="px-6 py-4">
        <p className="text-[18px] font-medium text-gray-900">트로피</p>
      </div>

      {bothTabs ? (
        <TabbedContent teamData={teamData!} individualData={individualData!} />
      ) : hasTeam ? (
        <TeamTrophyList trophies={teamData!.trophies} />
      ) : (
        <IndividualAwardList awards={individualData!.awards} />
      )}
    </div>
  );
}

// ========== Tabbed View ==========

function TabbedContent({
  teamData,
  individualData,
}: {
  teamData: PlayerTrophiesResponse;
  individualData: IndividualAwardsResponse;
}) {
  const [activeTab, setActiveTab] = useState<'team' | 'individual'>('team');

  return (
    <>
      <div className="mb-1 flex border-b border-gray-100 px-6">
        <button
          onClick={() => setActiveTab('team')}
          className={`relative pb-3 pr-6 text-[14px] font-medium ${
            activeTab === 'team' ? 'text-gray-900' : 'text-[#9F9F9F]'
          }`}
        >
          팀 ({teamData.total})
          {activeTab === 'team' && (
            <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-yellow-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('individual')}
          className={`relative pb-3 pr-6 text-[14px] font-medium ${
            activeTab === 'individual' ? 'text-gray-900' : 'text-[#9F9F9F]'
          }`}
        >
          개인 ({individualData.total})
          {activeTab === 'individual' && (
            <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-yellow-500" />
          )}
        </button>
      </div>

      {activeTab === 'team' ? (
        <TeamTrophyList trophies={teamData.trophies} />
      ) : (
        <IndividualAwardList awards={individualData.awards} />
      )}
    </>
  );
}

// ========== Team Trophies ==========

function TeamTrophyList({ trophies }: { trophies: TeamTrophies[] }) {
  return (
    <div className="space-y-3 px-4 pb-4">
      {trophies.map((team) => (
        <TeamTrophyGroup key={team.team_id} team={team} />
      ))}
    </div>
  );
}

function TeamTrophyGroup({ team }: { team: TeamTrophies }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="flex items-center gap-2.5 bg-gray-50 px-4 py-2.5">
        {team.logo ? (
          <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
            <Image
              src={team.logo}
              alt={team.team_name}
              fill
              sizes="24px"
              className="object-cover"
            />
          </span>
        ) : (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-600">
            {team.team_name.charAt(0)}
          </span>
        )}
        <p className="text-[14px] font-medium text-gray-900">
          {team.team_name}
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {team.trophies.map((t) => {
          const categoryLabel = getCategoryLabel(t.category);
          return (
            <div
              key={t.season_id}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <span className="shrink-0 text-[16px]" aria-hidden="true">
                🏆
              </span>
              <p className="text-[14px] text-gray-900">
                {categoryLabel
                  ? `${categoryLabel} 우승`
                  : `${shortenSeasonName(t.season_name)} 우승`}
              </p>
              <p className="ml-auto shrink-0 text-[12px] text-gray-500">
                {shortenSeasonName(t.season_name)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========== Individual Awards ==========

const AWARD_GROUP_LABEL: Record<string, string> = {
  top_scorer: '득점왕',
  top_assists: '도움왕',
  top_attack_points: '공격포인트왕',
};

const AWARD_STAT_UNIT: Record<string, string> = {
  top_scorer: '골',
  top_assists: '도움',
  top_attack_points: '포인트',
};

function IndividualAwardList({ awards }: { awards: IndividualAward[] }) {
  // award_type별 그룹핑 (순서 유지)
  const grouped = new Map<string, IndividualAward[]>();
  for (const award of awards) {
    const list = grouped.get(award.award_type) ?? [];
    list.push(award);
    grouped.set(award.award_type, list);
  }

  return (
    <div className="space-y-3 px-4 pb-4">
      {Array.from(grouped.entries()).map(([type, items]) => {
        const emoji = AWARD_EMOJI[type] ?? '🏅';
        const groupLabel = AWARD_GROUP_LABEL[type] ?? type;
        const unit = AWARD_STAT_UNIT[type] ?? '';

        return (
          <div
            key={type}
            className="overflow-hidden rounded-xl border border-gray-200"
          >
            {/* Group header */}
            <div className="flex items-center gap-2.5 bg-gray-50 px-4 py-2.5">
              <span className="text-[16px]" aria-hidden="true">
                {emoji}
              </span>
              <p className="text-[14px] font-medium text-gray-900">
                {groupLabel} ({items.length})
              </p>
            </div>

            {/* Award rows */}
            <div className="divide-y divide-gray-100">
              {items.map((award) => {
                const categoryLabel = getCategoryLabel(award.category);
                const seasonLabel = categoryLabel
                  ? categoryLabel
                  : shortenSeasonName(award.season_name);

                return (
                  <div
                    key={`${award.award_type}-${award.season_id}`}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] text-gray-900">
                        {seasonLabel}
                        {award.is_shared && (
                          <span className="ml-1 text-[12px] text-gray-400">
                            공동
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="shrink-0 text-[12px] text-gray-500">
                      {award.stat_value}
                      {unit}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
