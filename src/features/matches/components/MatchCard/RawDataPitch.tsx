'use client';

import { useState } from 'react';

import { type RawMatchAction } from '../../api-prisma';

const PITCH_WIDTH = 40;
const PITCH_HEIGHT = 20;

const ACTION_TYPE_COLORS: Record<string, string> = {
  PASS: '#3b82f6',
  RECEIVE: '#22c55e',
  SHOT: '#ef4444',
  DRIBBLE: '#f59e0b',
  TACKLE: '#8b5cf6',
  INTERCEPTION: '#06b6d4',
  FOUL: '#ec4899',
  KEEPER_SAVE: '#14b8a6',
  CLEARANCE: '#6366f1',
  CROSS: '#0ea5e9',
  FREE_KICK: '#a855f7',
  CORNER_KICK: '#d946ef',
  GOAL_KICK: '#84cc16',
  KICK_IN: '#eab308',
  BALL_LOST: '#64748b',
  CARD: '#facc15',
  CATCH: '#10b981',
  PUNCH: '#f97316',
  THROW: '#0284c7',
  KEEPER_THROW: '#0284c7',
  KEEPER_CLAIM: '#10b981',
  KEEPER_PUNCH: '#f97316',
  PENALTY_KICK: '#dc2626',
  BAD_TOUCH: '#64748b',
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  PASS: '패스',
  RECEIVE: '리시브',
  SHOT: '슛',
  DRIBBLE: '드리블',
  TACKLE: '태클',
  INTERCEPTION: '인터셉트',
  FOUL: '파울',
  KEEPER_SAVE: '세이브',
  CLEARANCE: '클리어',
  CROSS: '크로스',
  FREE_KICK: '프리킥',
  CORNER_KICK: '코너킥',
  GOAL_KICK: '골킥',
  KICK_IN: '킥인',
  BALL_LOST: '볼로스트',
  CARD: '카드',
  CATCH: '캐치',
  PUNCH: '펀칭',
  THROW: '스로',
  KEEPER_THROW: 'GK 스로',
  KEEPER_CLAIM: 'GK 캐치',
  KEEPER_PUNCH: 'GK 펀칭',
  PENALTY_KICK: '페널티킥',
  BAD_TOUCH: '볼로스트',
};

export default function RawDataPitch({
  actions,
  homeTeamName,
  awayTeamName,
  isSecondHalf = false,
}: {
  actions: RawMatchAction[];
  homeTeamName: string;
  awayTeamName: string;
  isSecondHalf?: boolean;
}) {
  const leftTeamName = isSecondHalf ? awayTeamName : homeTeamName;
  const rightTeamName = isSecondHalf ? homeTeamName : awayTeamName;
  const [selectedActionType, setSelectedActionType] = useState<string | null>(
    null
  );

  const SVG_WIDTH = 100;
  const SVG_HEIGHT = 50;

  const toSvgX = (x: number) => (x / PITCH_WIDTH) * SVG_WIDTH;
  const toSvgY = (y: number) => (y / PITCH_HEIGHT) * SVG_HEIGHT;

  const getActionColor = (actionType: string) => {
    return ACTION_TYPE_COLORS[actionType] || '#9ca3af';
  };

  if (actions.length === 0) {
    return (
      <div className="rounded border py-4 text-center text-xs text-gray-400">
        데이터 없음
      </div>
    );
  }

  const actionCounts = actions.reduce(
    (acc, action) => {
      acc[action.action_type] = (acc[action.action_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const filteredActions = selectedActionType
    ? actions.filter((a) => a.action_type === selectedActionType)
    : actions;

  return (
    <div className="relative w-full">
      <div className="mb-2 flex flex-wrap gap-1">
        <button
          onClick={() => setSelectedActionType(null)}
          className={`rounded border px-2 py-1 text-[10px] ${
            selectedActionType === null
              ? 'border-gray-800 bg-gray-800 text-white'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          전체 ({actions.length})
        </button>
        {Object.entries(actionCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => (
            <button
              key={type}
              onClick={() =>
                setSelectedActionType(selectedActionType === type ? null : type)
              }
              className={`flex items-center gap-1 rounded border px-2 py-1 text-[10px] ${
                selectedActionType === type
                  ? 'border-transparent text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
              }`}
              style={
                selectedActionType === type
                  ? { backgroundColor: getActionColor(type) }
                  : {}
              }
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    selectedActionType === type
                      ? 'white'
                      : getActionColor(type),
                }}
              />
              {ACTION_TYPE_LABELS[type] || type} ({count})
            </button>
          ))}
      </div>

      <div className="mb-1 flex justify-between text-xs font-medium">
        <span className={isSecondHalf ? 'text-red-600' : 'text-blue-600'}>
          {leftTeamName}
        </span>
        <span className={isSecondHalf ? 'text-blue-600' : 'text-red-600'}>
          {rightTeamName}
        </span>
      </div>

      <svg
        viewBox="0 0 100 50"
        className="w-full rounded-lg border"
        style={{ aspectRatio: '2/1' }}
      >
        <rect x="0" y="0" width="100" height="50" fill="#3d8b40" />
        <rect
          x="2"
          y="2"
          width="96"
          height="46"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />
        <line x1="50" y1="2" x2="50" y2="48" stroke="white" strokeWidth="0.3" />
        <circle
          cx="50"
          cy="25"
          r="8"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />
        <rect
          x="2"
          y="13"
          width="12"
          height="24"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />
        <rect
          x="86"
          y="13"
          width="12"
          height="24"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />
        <rect x="0" y="20" width="2" height="10" fill="#555" opacity="0.5" />
        <rect x="98" y="20" width="2" height="10" fill="#555" opacity="0.5" />

        {filteredActions.map((action) => (
          <g key={action.action_id}>
            <circle
              cx={toSvgX(action.start_x)}
              cy={toSvgY(action.start_y)}
              r="1.5"
              fill={getActionColor(action.action_type)}
              stroke="white"
              strokeWidth="0.3"
              opacity={0.9}
            />
            {action.player && (
              <text
                x={toSvgX(action.start_x)}
                y={toSvgY(action.start_y) - 2}
                fill="white"
                fontSize="1.8"
                textAnchor="middle"
              >
                {action.player.jersey_number
                  ? `${action.player.jersey_number}. ${action.player.name}`
                  : action.player.name}
              </text>
            )}
          </g>
        ))}
      </svg>

      <div className="mt-1 text-xs text-gray-500">
        {selectedActionType
          ? `${ACTION_TYPE_LABELS[selectedActionType] || selectedActionType}: ${filteredActions.length}개`
          : `총 ${actions.length}개 액션`}
      </div>
    </div>
  );
}
