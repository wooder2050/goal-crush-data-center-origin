'use client';

import { Camera } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import type { StandingsGroup } from '../types';

interface NewProfilesNoticeProps {
  seasonId: number;
  seasonName: string;
  standings: StandingsGroup[];
}

/**
 * 새 시즌 출전 선수 프로필 안내 — /players 딥링크(?season=&team=)로 연결.
 * 팀 칩은 현재 시즌 순위표에 있는 팀(= 출전 기록이 있는 팀)만 노출.
 */
export default function NewProfilesNotice({
  seasonId,
  seasonName,
  standings,
}: NewProfilesNoticeProps) {
  const teams = standings
    .flatMap((g) => g.standings)
    .map((s) => s.team)
    .filter((t): t is NonNullable<typeof t> => t != null);

  if (teams.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#ffd9c7] bg-[#fff7f3] px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Camera
            className="h-4 w-4 flex-shrink-0 text-[#ff4800]"
            aria-hidden="true"
          />
          <p className="text-sm text-gray-800 truncate">
            <span className="font-semibold">{seasonName}</span> 출전 선수들의 새
            프로필이 공개됐어요
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/players?season=${seasonId}`}
            className="rounded-full bg-[#ff4800] px-3 py-1 text-xs font-semibold text-white hover:bg-[#e04100] transition-colors"
          >
            전체 선수 보기
          </Link>
          {teams.map((team) => (
            <Link
              key={team.team_id}
              href={`/players?season=${seasonId}&team=${team.team_id}`}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:border-[#ff4800] hover:text-[#ff4800] transition-colors"
            >
              {team.logo && (
                <span className="relative h-3.5 w-3.5 overflow-hidden rounded-full">
                  <Image
                    src={team.logo}
                    alt=""
                    fill
                    sizes="14px"
                    className="object-cover"
                  />
                </span>
              )}
              {team.team_name.replace('FC ', '')}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
