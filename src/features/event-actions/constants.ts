'use client';

import { ActionResult, ActionType, BodyPart } from './types';

// 피치 크기 (골때녀 풋살 규격)
export const PITCH_WIDTH = 40; // 가로 40m
export const PITCH_HEIGHT = 20; // 세로 20m

// 피리어드 설정
export const PERIOD_DURATION_MINUTES = 10; // 각 피리어드 10분
export const TOTAL_PERIODS = 2; // 전반, 후반

// 액션 타입 한글명 및 아이콘
export const ACTION_TYPE_INFO: Record<
  ActionType,
  {
    label: string;
    shortLabel: string;
    icon: string;
    category: 'pass' | 'shot' | 'defense' | 'setpiece' | 'keeper' | 'other';
  }
> = {
  PASS: {
    label: '패스',
    shortLabel: '패스',
    icon: '➡️',
    category: 'pass',
  },
  CROSS: {
    label: '크로스',
    shortLabel: '크로스',
    icon: '↗️',
    category: 'pass',
  },
  KICK_IN: {
    label: '킥인',
    shortLabel: '킥인',
    icon: '🦶',
    category: 'setpiece',
  },
  CORNER_KICK: {
    label: '코너킥',
    shortLabel: '코너',
    icon: '🚩',
    category: 'setpiece',
  },
  FREE_KICK: {
    label: '프리킥',
    shortLabel: '프리킥',
    icon: '⚽',
    category: 'setpiece',
  },
  GOAL_KICK: {
    label: '골킥',
    shortLabel: '골킥',
    icon: '🥅',
    category: 'setpiece',
  },
  SHOT: {
    label: '슈팅',
    shortLabel: '슛',
    icon: '🎯',
    category: 'shot',
  },
  DRIBBLE: {
    label: '드리블',
    shortLabel: '드리블',
    icon: '🏃',
    category: 'pass',
  },
  RECEIVE: {
    label: '리시브',
    shortLabel: '리시브',
    icon: '📥',
    category: 'pass',
  },
  TACKLE: {
    label: '태클',
    shortLabel: '태클',
    icon: '🦵',
    category: 'defense',
  },
  INTERCEPTION: {
    label: '인터셉트',
    shortLabel: '인터셉트',
    icon: '✋',
    category: 'defense',
  },
  CLEARANCE: {
    label: '클리어런스',
    shortLabel: '클리어',
    icon: '🧹',
    category: 'defense',
  },
  FOUL: {
    label: '파울',
    shortLabel: '파울',
    icon: '🚫',
    category: 'other',
  },
  KEEPER_SAVE: {
    label: '골키퍼 세이브',
    shortLabel: '세이브',
    icon: '🧤',
    category: 'keeper',
  },
  KEEPER_CLAIM: {
    label: '골키퍼 캐치',
    shortLabel: '캐치',
    icon: '🤲',
    category: 'keeper',
  },
  KEEPER_PUNCH: {
    label: '골키퍼 펀칭',
    shortLabel: '펀칭',
    icon: '👊',
    category: 'keeper',
  },
  KEEPER_THROW: {
    label: '골키퍼 스로',
    shortLabel: '스로',
    icon: '🤾',
    category: 'keeper',
  },
  PENALTY_KICK: {
    label: '페널티킥',
    shortLabel: 'PK',
    icon: '🎯',
    category: 'setpiece',
  },
  BAD_TOUCH: {
    label: '볼 로스트',
    shortLabel: '로스트',
    icon: '❌',
    category: 'other',
  },
  CARD: {
    label: '경고/퇴장',
    shortLabel: '카드',
    icon: '🟨',
    category: 'other',
  },
};

// 결과 한글명 및 스타일
export const ACTION_RESULT_INFO: Record<
  ActionResult,
  {
    label: string;
    shortLabel: string;
    color: string;
    bgColor: string;
  }
> = {
  SUCCESS: {
    label: '성공',
    shortLabel: '성공',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  FAIL: {
    label: '실패',
    shortLabel: '실패',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  OFFSIDE: {
    label: '오프사이드',
    shortLabel: '오프사이드',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  OWN_GOAL: {
    label: '자책골',
    shortLabel: '자책골',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  YELLOW_CARD: {
    label: '경고',
    shortLabel: '경고',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  RED_CARD: {
    label: '퇴장',
    shortLabel: '퇴장',
    color: 'text-red-700',
    bgColor: 'bg-red-200',
  },
  GOAL: {
    label: '골',
    shortLabel: '골',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
};

// 신체 부위 한글명
export const BODY_PART_INFO: Record<
  BodyPart,
  {
    label: string;
    icon: string;
  }
> = {
  FOOT: {
    label: '발',
    icon: '🦶',
  },
  HEAD: {
    label: '머리',
    icon: '🗣️',
  },
  OTHER: {
    label: '기타',
    icon: '👤',
  },
};

// 피리어드 한글명
export const PERIOD_LABELS: Record<number, string> = {
  1: '전반',
  2: '후반',
  3: '연장 전반',
  4: '연장 후반',
};

// 카테고리별 액션 그룹
export const ACTION_CATEGORIES = {
  pass: {
    label: '패스/드리블',
    actions: ['PASS', 'CROSS', 'DRIBBLE', 'RECEIVE'] as ActionType[],
  },
  shot: {
    label: '슈팅',
    actions: ['SHOT'] as ActionType[],
  },
  defense: {
    label: '수비',
    actions: ['TACKLE', 'INTERCEPTION', 'CLEARANCE'] as ActionType[],
  },
  setpiece: {
    label: '세트피스',
    actions: [
      'KICK_IN',
      'CORNER_KICK',
      'FREE_KICK',
      'GOAL_KICK',
      'PENALTY_KICK',
    ] as ActionType[],
  },
  keeper: {
    label: '골키퍼',
    actions: [
      'KEEPER_SAVE',
      'KEEPER_CLAIM',
      'KEEPER_PUNCH',
      'KEEPER_THROW',
    ] as ActionType[],
  },
  other: {
    label: '기타',
    actions: ['FOUL', 'BAD_TOUCH', 'CARD'] as ActionType[],
  },
};

// 자주 사용하는 액션 (빠른 선택용)
export const FREQUENT_ACTIONS: ActionType[] = [
  'PASS',
  'SHOT',
  'DRIBBLE',
  'TACKLE',
  'INTERCEPTION',
  'FOUL',
];

// 시간 포맷 함수
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 좌표 포맷 함수
export function formatCoordinate(x: number, y: number): string {
  return `(${x.toFixed(1)}, ${y.toFixed(1)})`;
}

// 액션 요약 문자열 생성
export function formatActionSummary(
  time: number,
  playerName: string,
  actionType: ActionType,
  result: ActionResult,
  startX: number,
  startY: number,
  endX?: number | null,
  endY?: number | null
): string {
  const timeStr = formatTime(time);
  const actionLabel = ACTION_TYPE_INFO[actionType].label;
  const resultLabel = ACTION_RESULT_INFO[result].shortLabel;
  const startCoord = formatCoordinate(startX, startY);

  let summary = `${timeStr} ${playerName} ${actionLabel} → ${resultLabel} ${startCoord}`;

  if (
    endX !== null &&
    endX !== undefined &&
    endY !== null &&
    endY !== undefined
  ) {
    summary += ` → ${formatCoordinate(endX, endY)}`;
  }

  return summary;
}
