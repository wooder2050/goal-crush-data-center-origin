'use client';

import React from 'react';

import { Button } from '@/components/ui/button';

import { ACTION_RESULT_INFO } from '../constants';
import { ACTION_POSSIBLE_RESULTS, ActionResult, ActionType } from '../types';

interface ResultSelectorProps {
  actionType: ActionType | null;
  selectedResult: ActionResult | null;
  onSelect: (result: ActionResult) => void;
  disabled?: boolean;
}

export function ResultSelector({
  actionType,
  selectedResult,
  onSelect,
  disabled = false,
}: ResultSelectorProps) {
  if (!actionType) {
    return (
      <div className="text-xs text-gray-400 py-2">
        액션 타입을 먼저 선택하세요
      </div>
    );
  }

  const possibleResults = ACTION_POSSIBLE_RESULTS[actionType];

  return (
    <div className="flex flex-wrap gap-1">
      {possibleResults.map((result) => {
        const info = ACTION_RESULT_INFO[result];
        const isSelected = selectedResult === result;

        return (
          <Button
            key={result}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(result)}
            disabled={disabled}
            className={`h-9 px-3 text-xs ${
              isSelected
                ? result === 'SUCCESS' || result === 'GOAL'
                  ? 'bg-green-600 hover:bg-green-700'
                  : result === 'FAIL'
                    ? 'bg-red-600 hover:bg-red-700'
                    : result === 'YELLOW_CARD'
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : result === 'RED_CARD'
                        ? 'bg-red-700 hover:bg-red-800'
                        : 'bg-gray-600 hover:bg-gray-700'
                : `${info.bgColor} ${info.color} border-current`
            }`}
          >
            {info.label}
          </Button>
        );
      })}
    </div>
  );
}
