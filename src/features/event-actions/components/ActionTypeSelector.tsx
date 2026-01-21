'use client';

import React from 'react';

import { Button } from '@/components/ui/button';

import { ACTION_CATEGORIES, ACTION_TYPE_INFO } from '../constants';
import { ActionType } from '../types';

// 액션 타입별 키보드 단축키
const ACTION_SHORTCUTS: Partial<Record<ActionType, string>> = {
  PASS: 'P',
  SHOT: 'S',
  RECEIVE: 'R',
  KEEPER_SAVE: 'V',
  DRIBBLE: 'D',
  TACKLE: 'T',
  INTERCEPTION: 'I',
  FOUL: 'F',
};

interface ActionTypeSelectorProps {
  selectedActionType: ActionType | null;
  onSelect: (actionType: ActionType) => void;
  disabled?: boolean;
}

export function ActionTypeSelector({
  selectedActionType,
  onSelect,
  disabled = false,
}: ActionTypeSelectorProps) {
  const renderActionButton = (actionType: ActionType) => {
    const info = ACTION_TYPE_INFO[actionType];
    const isSelected = selectedActionType === actionType;
    const shortcut = ACTION_SHORTCUTS[actionType];

    return (
      <Button
        key={actionType}
        variant={isSelected ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelect(actionType)}
        disabled={disabled}
        className={`h-9 px-2 text-xs ${
          isSelected ? 'bg-green-600 hover:bg-green-700' : ''
        }`}
        title={shortcut ? `단축키: ${shortcut}` : undefined}
      >
        <span className="mr-1">{info.icon}</span>
        <span>{info.shortLabel}</span>
        {shortcut && (
          <span className="ml-1 text-[10px] opacity-60 bg-gray-200 px-1 rounded">
            {shortcut}
          </span>
        )}
      </Button>
    );
  };

  return (
    <div className="space-y-2">
      {/* 카테고리별로 모든 액션 표시 */}
      {Object.entries(ACTION_CATEGORIES).map(([categoryKey, category]) => (
        <div key={categoryKey} className="flex flex-wrap items-center gap-1">
          <span className="text-xs font-medium text-gray-500 w-16 shrink-0">
            {category.label}
          </span>
          {category.actions.map((actionType) => renderActionButton(actionType))}
        </div>
      ))}
    </div>
  );
}
