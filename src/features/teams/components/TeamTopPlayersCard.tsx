'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import type { TeamPlayerStatRow } from '@/features/teams/server';

interface TeamTopPlayersCardProps {
  topScorers: TeamPlayerStatRow[];
  topAssists: TeamPlayerStatRow[];
  topRated: TeamPlayerStatRow[];
  teamColor: string;
}

type Tab = 'scorers' | 'assists' | 'rated';

export default function TeamTopPlayersCard({
  topScorers,
  topAssists,
  topRated,
  teamColor,
}: TeamTopPlayersCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('scorers');

  const hasData =
    topScorers.length > 0 || topAssists.length > 0 || topRated.length > 0;
  if (!hasData) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'scorers', label: '득점' },
    { key: 'assists', label: '도움' },
    { key: 'rated', label: '평점' },
  ];

  const data =
    activeTab === 'scorers'
      ? topScorers
      : activeTab === 'assists'
        ? topAssists
        : topRated;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      <div className="px-6 py-4">
        <p className="text-[18px] font-medium text-gray-900">선수 순위</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative pb-3 pr-6 text-[14px] font-medium ${
              activeTab === tab.key ? 'text-gray-900' : 'text-[#9F9F9F]'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span
                className="absolute bottom-0 left-0 h-[2px] rounded-full"
                style={{
                  backgroundColor: teamColor,
                  width: '100%',
                  maxWidth: '32px',
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Player list */}
      <div className="px-4 py-3">
        {data.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-[#9F9F9F]">
            데이터가 없습니다.
          </p>
        ) : (
          <div className="space-y-1">
            {data.map((player, index) => (
              <Link
                key={player.player_id}
                href={`/players/${player.player_id}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50"
              >
                {/* Rank */}
                <span className="w-5 text-center text-[13px] font-bold text-[#9F9F9F]">
                  {index + 1}
                </span>

                {/* Profile image */}
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
                  {player.profile_image_url ? (
                    <Image
                      src={player.profile_image_url}
                      alt={player.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-400">
                      {player.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Name + Team */}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[14px] font-medium text-gray-900">
                    {player.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {player.team_logo && (
                      <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={player.team_logo}
                          alt=""
                          fill
                          sizes="16px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <span className="truncate text-[12px] text-[#9F9F9F]">
                      {player.team_name ?? '-'}
                    </span>
                  </div>
                </div>

                {/* Value */}
                {index === 0 ? (
                  <span
                    className="shrink-0 inline-flex items-center justify-center min-w-[2rem] rounded-full px-2.5 py-1 text-[13px] font-bold text-white"
                    style={{ backgroundColor: teamColor }}
                  >
                    {player.value}
                  </span>
                ) : (
                  <span className="shrink-0 text-[14px] font-bold text-gray-900 tabular-nums">
                    {player.value}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
