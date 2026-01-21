'use client';

import React, { useCallback, useRef } from 'react';

import { PITCH_HEIGHT, PITCH_WIDTH } from '../constants';
import { MatchAction, PitchCoordinate } from '../types';

interface PitchViewProps {
  onCoordinateSelect: (coord: PitchCoordinate) => void;
  startCoordinate?: PitchCoordinate | null;
  endCoordinate?: PitchCoordinate | null;
  recentActions?: MatchAction[];
  showEndCoordinate?: boolean;
  disabled?: boolean;
  homeTeamName?: string;
  awayTeamName?: string;
}

export function PitchView({
  onCoordinateSelect,
  startCoordinate,
  endCoordinate,
  recentActions = [],
  showEndCoordinate = false,
  disabled = false,
  homeTeamName = '홈',
  awayTeamName = '원정',
}: PitchViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // SVG viewBox 크기 (내부 좌표계)
  const SVG_WIDTH = 100;
  const SVG_HEIGHT = 50;

  // 클릭 좌표를 피치 좌표로 변환
  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (disabled || !svgRef.current) return;

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();

      // 화면 좌표 → 0~1 비율 → 피치 좌표 (0~40, 0~20)
      const ratioX = (e.clientX - rect.left) / rect.width;
      const ratioY = (e.clientY - rect.top) / rect.height;

      const x = ratioX * PITCH_WIDTH;
      const y = ratioY * PITCH_HEIGHT;

      // 좌표 범위 제한
      const clampedX = Math.max(0, Math.min(PITCH_WIDTH, x));
      const clampedY = Math.max(0, Math.min(PITCH_HEIGHT, y));

      onCoordinateSelect({ x: clampedX, y: clampedY });
    },
    [disabled, onCoordinateSelect]
  );

  // 피치 좌표 (0~40, 0~20)를 SVG viewBox 좌표 (0~100, 0~50)로 변환
  const toSvgX = (x: number) => (x / PITCH_WIDTH) * SVG_WIDTH;
  const toSvgY = (y: number) => (y / PITCH_HEIGHT) * SVG_HEIGHT;

  return (
    <div className="relative w-full">
      {/* 팀 레이블 */}
      <div className="absolute top-1 left-2 text-xs text-blue-600 font-medium z-10">
        {homeTeamName}
      </div>
      <div className="absolute top-1 right-2 text-xs text-red-600 font-medium z-10">
        {awayTeamName}
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 100 50"
        className={`w-full border rounded-lg ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair'
        }`}
        style={{ aspectRatio: '2/1' }}
        onClick={handleClick}
      >
        {/* 피치 배경 */}
        <rect x="0" y="0" width="100" height="50" fill="#3d8b40" />

        {/* 피치 외곽선 */}
        <rect
          x="2"
          y="2"
          width="96"
          height="46"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* 중앙선 */}
        <line x1="50" y1="2" x2="50" y2="48" stroke="white" strokeWidth="0.3" />

        {/* 센터 서클 */}
        <circle
          cx="50"
          cy="25"
          r="8"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />
        <circle cx="50" cy="25" r="0.5" fill="white" />

        {/* 왼쪽 페널티 박스 */}
        <rect
          x="2"
          y="13"
          width="12"
          height="24"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />
        {/* 왼쪽 골 영역 */}
        <rect
          x="2"
          y="18"
          width="5"
          height="14"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />
        {/* 왼쪽 페널티 스팟 */}
        <circle cx="10" cy="25" r="0.5" fill="white" />
        {/* 왼쪽 골대 */}
        <rect x="0" y="20" width="2" height="10" fill="#555" opacity="0.5" />

        {/* 오른쪽 페널티 박스 */}
        <rect
          x="86"
          y="13"
          width="12"
          height="24"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />
        {/* 오른쪽 골 영역 */}
        <rect
          x="93"
          y="18"
          width="5"
          height="14"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />
        {/* 오른쪽 페널티 스팟 */}
        <circle cx="90" cy="25" r="0.5" fill="white" />
        {/* 오른쪽 골대 */}
        <rect x="98" y="20" width="2" height="10" fill="#555" opacity="0.5" />

        {/* 코너 아크 */}
        <path
          d="M 2 4 A 2 2 0 0 1 4 2"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />
        <path
          d="M 2 46 A 2 2 0 0 0 4 48"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />
        <path
          d="M 98 4 A 2 2 0 0 0 96 2"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />
        <path
          d="M 98 46 A 2 2 0 0 1 96 48"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* 최근 액션들 표시 (반투명) */}
        {recentActions.slice(-5).map((action, index) => (
          <g key={action.action_id} opacity={0.3 + index * 0.1}>
            {/* 시작점 */}
            <circle
              cx={toSvgX(action.start_x)}
              cy={toSvgY(action.start_y)}
              r="1"
              fill="white"
              stroke="gray"
              strokeWidth="0.2"
            />
            {/* 종료점이 있으면 선과 함께 표시 */}
            {action.end_x !== null && action.end_y !== null && (
              <>
                <line
                  x1={toSvgX(action.start_x)}
                  y1={toSvgY(action.start_y)}
                  x2={toSvgX(action.end_x)}
                  y2={toSvgY(action.end_y)}
                  stroke="white"
                  strokeWidth="0.2"
                  strokeDasharray="1"
                />
                <circle
                  cx={toSvgX(action.end_x)}
                  cy={toSvgY(action.end_y)}
                  r="0.8"
                  fill="yellow"
                  stroke="gray"
                  strokeWidth="0.2"
                />
              </>
            )}
          </g>
        ))}

        {/* 선택된 시작 좌표 */}
        {startCoordinate && (
          <g>
            <circle
              cx={toSvgX(startCoordinate.x)}
              cy={toSvgY(startCoordinate.y)}
              r="2"
              fill="blue"
              stroke="white"
              strokeWidth="0.3"
            />
            <text
              x={toSvgX(startCoordinate.x)}
              y={toSvgY(startCoordinate.y) - 3}
              fill="white"
              fontSize="2.5"
              textAnchor="middle"
            >
              시작
            </text>
          </g>
        )}

        {/* 선택된 종료 좌표 */}
        {showEndCoordinate && endCoordinate && (
          <g>
            {/* 시작-종료 연결선 */}
            {startCoordinate && (
              <line
                x1={toSvgX(startCoordinate.x)}
                y1={toSvgY(startCoordinate.y)}
                x2={toSvgX(endCoordinate.x)}
                y2={toSvgY(endCoordinate.y)}
                stroke="yellow"
                strokeWidth="0.4"
              />
            )}
            <circle
              cx={toSvgX(endCoordinate.x)}
              cy={toSvgY(endCoordinate.y)}
              r="2"
              fill="yellow"
              stroke="white"
              strokeWidth="0.3"
            />
            <text
              x={toSvgX(endCoordinate.x)}
              y={toSvgY(endCoordinate.y) - 3}
              fill="white"
              fontSize="2.5"
              textAnchor="middle"
            >
              종료
            </text>
          </g>
        )}

        {/* 안내 메시지 */}
        {!disabled && !startCoordinate && (
          <text
            x="50"
            y="25"
            fill="white"
            fontSize="3"
            textAnchor="middle"
            opacity="0.7"
          >
            피치를 터치하여 위치 선택
          </text>
        )}
      </svg>

      {/* 좌표 표시 */}
      {startCoordinate && (
        <div className="mt-1 text-xs text-gray-600 flex gap-4">
          <span>
            시작: ({startCoordinate.x.toFixed(1)},{' '}
            {startCoordinate.y.toFixed(1)})
          </span>
          {showEndCoordinate && endCoordinate && (
            <span>
              종료: ({endCoordinate.x.toFixed(1)}, {endCoordinate.y.toFixed(1)})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
