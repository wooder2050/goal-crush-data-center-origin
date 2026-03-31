/**
 * 축구장 풀 피치 SVG + 포지션 뱃지
 * viewBox 170x230, 라이트 테마
 */

interface PositionPitchProps {
  positions: string[];
  teamColor?: string;
}

// 포지션별 좌표 (풀 피치 기준, 상단이 공격 방향)
const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  FW: { x: 85, y: 45 },
  MF: { x: 85, y: 90 },
  DF: { x: 85, y: 150 },
  GK: { x: 85, y: 205 },
};

export default function PositionPitch({
  positions,
  teamColor,
}: PositionPitchProps) {
  if (positions.length === 0) return null;

  const bg = '#EFEFEF';
  const line = '#FFFFFF';

  return (
    <div className="relative inline-block">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="170"
        height="230"
        viewBox="0 0 170 230"
        fill="none"
        role="img"
        aria-label="포지션 피치"
      >
        {/* Background */}
        <rect width="170" height="230" rx="6" fill={bg} />

        {/* Outer border */}
        <rect
          x="10"
          y="10"
          width="150"
          height="210"
          stroke={line}
          strokeWidth="1.5"
        />

        {/* Center line */}
        <line
          x1="10"
          y1="115"
          x2="160"
          y2="115"
          stroke={line}
          strokeWidth="1.5"
        />

        {/* Center circle */}
        <circle
          cx="85"
          cy="115"
          r="22"
          stroke={line}
          strokeWidth="1.5"
          fill="none"
        />

        {/* Center dot */}
        <circle cx="85" cy="115" r="2" fill={line} />

        {/* Top penalty area */}
        <rect
          x="34"
          y="10"
          width="102"
          height="44"
          stroke={line}
          strokeWidth="1.5"
          fill="none"
        />

        {/* Top goal area */}
        <rect
          x="54"
          y="10"
          width="62"
          height="22"
          stroke={line}
          strokeWidth="1.5"
          fill="none"
        />

        {/* Top penalty spot */}
        <circle cx="85" cy="40" r="2" fill={line} />

        {/* Bottom penalty area */}
        <rect
          x="34"
          y="176"
          width="102"
          height="44"
          stroke={line}
          strokeWidth="1.5"
          fill="none"
        />

        {/* Bottom goal area */}
        <rect
          x="54"
          y="198"
          width="62"
          height="22"
          stroke={line}
          strokeWidth="1.5"
          fill="none"
        />

        {/* Bottom penalty spot */}
        <circle cx="85" cy="190" r="2" fill={line} />
      </svg>

      {/* Position badges (absolute positioned over SVG) */}
      {positions.map((pos, i) => {
        const coord = POSITION_COORDS[pos];
        if (!coord) return null;
        const isPrimary = i === 0;
        return (
          <div
            key={`${pos}-${i}`}
            className="absolute flex items-center justify-center rounded"
            style={{
              left: coord.x - 16,
              top: coord.y - 11,
              width: 32,
              height: 22,
              backgroundColor: isPrimary
                ? teamColor || 'rgb(231, 76, 60)'
                : 'rgba(0,0,0,0.15)',
              borderRadius: '4px',
            }}
          >
            <span className="text-[12px] font-medium text-white">{pos}</span>
          </div>
        );
      })}
    </div>
  );
}
