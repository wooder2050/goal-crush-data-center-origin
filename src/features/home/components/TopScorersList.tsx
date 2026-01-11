'use client';

import { Target } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { useGoalSuspenseQuery } from '@/hooks/useGoalQuery';

import { fetchTopScorers } from '../api';

export function TopScorersList() {
  const { data: topScorers } = useGoalSuspenseQuery(fetchTopScorers, [5]);

  if (!topScorers || topScorers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">득점 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {topScorers.map((player, index) => (
        <Link
          key={player.player_id}
          href={`/players/${player.player_id}`}
          className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow group"
        >
          <div className="flex-shrink-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                index === 0
                  ? 'bg-yellow-100 text-yellow-700'
                  : index === 1
                    ? 'bg-gray-100 text-gray-700'
                    : index === 2
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-50 text-blue-600'
              }`}
            >
              {index + 1}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-gray-900 group-hover:text-[#ff4800] transition-colors">
                {player.player_name}
              </h3>
              {player.team_logo && (
                <div className="w-5 h-5 relative">
                  <Image
                    src={player.team_logo}
                    alt={`${player.team_name} 로고`}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <span className="text-sm text-gray-600">{player.team_name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {player.goals}골
              </span>
              <span>{player.assists}도움</span>
              <span>{player.matches_played}경기</span>
            </div>
          </div>

          <div className="text-2xl font-bold text-[#ff4800]">
            {player.goals}
          </div>
        </Link>
      ))}
    </div>
  );
}

export function TopScorersLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 animate-pulse"
        >
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="w-8 h-6 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}
