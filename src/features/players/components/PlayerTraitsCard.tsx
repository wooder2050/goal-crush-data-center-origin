'use client';

import { useEffect, useRef } from 'react';

import { useGoalQuery } from '@/hooks/useGoalQuery';

interface Traits {
  [key: string]: number | boolean;
  matches_analyzed: number;
  is_goalkeeper: boolean;
}

interface TraitsResponse {
  traits: Traits | null;
}

async function fetchTraits(playerId: number): Promise<TraitsResponse> {
  const res = await fetch(`/api/stats/player-traits?player_id=${playerId}`);
  if (!res.ok) throw new Error('Failed to fetch player traits');
  return res.json();
}

const FIELD_TRAITS = [
  { key: 'touches', label: '터치' },
  { key: 'chance_creation', label: '기회 창출' },
  { key: 'shots', label: '슛 시도' },
  { key: 'goals', label: '득점' },
  { key: 'defensive', label: '수비적 행동' },
  { key: 'pass_accuracy', label: '패스 성공' },
];

const GK_TRAITS = [
  { key: 'pass_accuracy', label: '정확한 긴 패스 %' },
  { key: 'gk_distribution', label: '배급 정확도' },
  { key: 'clean_sheet', label: '클린 시트' },
  { key: 'goals_conceded', label: '실점 수' },
  { key: 'saves', label: '선방 횟수' },
  { key: 'clearances', label: '클리어런스' },
];

export default function PlayerTraitsCard({
  playerId,
  teamColor,
  onHasData,
}: {
  playerId: number;
  teamColor?: string;
  onHasData?: (has: boolean) => void;
}) {
  const { data } = useGoalQuery(fetchTraits, [playerId], {
    staleTime: 5 * 60 * 1000,
  });

  const traits = data?.traits;

  // data가 로드되면 부모에게 알림
  const hasTraits = !!traits;
  const onHasDataRef = useRef(onHasData);
  onHasDataRef.current = onHasData;
  useEffect(() => {
    if (data !== undefined) {
      onHasDataRef.current?.(hasTraits);
    }
  }, [data, hasTraits]);

  if (!traits) return null;

  const isGK = traits.is_goalkeeper === true;
  const TRAIT_ITEMS = isGK ? GK_TRAITS : FIELD_TRAITS;
  const subtitle = isGK
    ? '다른 골키퍼와 비교한 통계'
    : '다른 선수와 비교한 통계';

  const color = teamColor || 'rgb(220, 38, 38)';
  const cx = 150;
  const cy = 130;
  const maxR = 80;
  const angles = TRAIT_ITEMS.map(
    (_, i) => (Math.PI * 2 * i) / TRAIT_ITEMS.length - Math.PI / 2
  );

  const radarPoints = TRAIT_ITEMS.map((item, i) => {
    const val = (Number(traits[item.key]) || 0) / 100;
    const r = maxR * val;
    return {
      x: cx + r * Math.cos(angles[i]),
      y: cy + r * Math.sin(angles[i]),
    };
  });

  const radarPath =
    radarPoints
      .map(
        (p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
      )
      .join(' ') + ' Z';

  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white h-full">
      <div className="border-b border-gray-100 px-6 py-4">
        <p className="text-[18px] font-medium text-gray-900">선수 특성</p>
        <p className="mt-0.5 text-[14px] text-[#9F9F9F]">
          {subtitle} ({traits.matches_analyzed}경기 기준)
        </p>
      </div>
      <div className="flex items-center justify-center px-4 py-8">
        <svg
          viewBox="0 0 300 260"
          className="w-full max-w-[300px]"
          role="img"
          aria-label="선수 특성 레이더 차트"
        >
          {/* Grid rings */}
          {rings.map((scale) => {
            const pts = angles
              .map((a) => {
                const r = maxR * scale;
                return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
              })
              .join(' ');
            return (
              <polygon
                key={scale}
                points={pts}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Grid lines */}
          {angles.map((a, i) => (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + maxR * Math.cos(a)}
              y2={cy + maxR * Math.sin(a)}
              stroke="#E5E7EB"
              strokeWidth="0.5"
            />
          ))}

          {/* Radar fill */}
          <path d={radarPath} fill={`${color}20`} />
          <path d={radarPath} fill="none" stroke={color} strokeWidth="1.5" />

          {/* Dots */}
          {radarPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
          ))}

          {/* Labels + Percentages */}
          {TRAIT_ITEMS.map((item, i) => {
            const labelR = maxR + 32;
            const lx = cx + labelR * Math.cos(angles[i]);
            const ly = cy + labelR * Math.sin(angles[i]);
            const anchor =
              Math.abs(Math.cos(angles[i])) < 0.15
                ? 'middle'
                : Math.cos(angles[i]) > 0
                  ? 'start'
                  : 'end';
            const val = Number(traits[item.key]) || 0;
            return (
              <g key={item.key}>
                <text
                  x={lx}
                  y={ly - 2}
                  textAnchor={anchor}
                  fill="#9F9F9F"
                  fontSize="11"
                  fontFamily="sans-serif"
                >
                  {item.label}
                </text>
                <text
                  x={lx}
                  y={ly + 12}
                  textAnchor={anchor}
                  fill="#111827"
                  fontSize="13"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {val}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
