'use client';

import React from 'react';

import { Button } from '@/components/ui/button';

import {
  ACTION_RESULT_INFO,
  ACTION_TYPE_INFO,
  formatTime,
  PERIOD_LABELS,
} from '../constants';
import { MatchAction } from '../types';

interface ActionHistoryProps {
  actions: MatchAction[];
  onUndo: () => void;
  onDelete?: (actionId: number) => void;
  canUndo: boolean;
  isLoading?: boolean;
}

export function ActionHistory({
  actions,
  onUndo,
  onDelete,
  canUndo,
  isLoading = false,
}: ActionHistoryProps) {
  // 최근 10개만 표시 (역순)
  const recentActions = [...actions].reverse().slice(0, 10);

  if (isLoading) {
    return (
      <div className="text-sm text-gray-400 py-2 text-center">로딩 중...</div>
    );
  }

  return (
    <div className="space-y-2">
      {/* 헤더 + Undo 버튼 */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-600">
          최근 기록 ({actions.length}개)
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="h-7 px-2 text-xs"
        >
          Undo
        </Button>
      </div>

      {/* 액션 목록 */}
      {recentActions.length === 0 ? (
        <div className="text-xs text-gray-400 py-2 text-center">
          기록된 이벤트가 없습니다
        </div>
      ) : (
        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          {recentActions.map((action, index) => {
            const actionInfo = ACTION_TYPE_INFO[action.action_type];
            const resultInfo = ACTION_RESULT_INFO[action.result];
            const isLatest = index === 0;

            return (
              <div
                key={action.action_id}
                className={`flex items-center gap-2 p-2 rounded text-xs ${
                  isLatest
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-gray-50'
                }`}
              >
                {/* 시간 */}
                <span className="text-gray-500 font-mono w-12">
                  {PERIOD_LABELS[action.period_id] || action.period_id}{' '}
                  {formatTime(action.time_seconds)}
                </span>

                {/* 선수 */}
                <span className="font-medium min-w-[60px]">
                  {action.player?.jersey_number && (
                    <span className="text-gray-400 mr-1">
                      {action.player.jersey_number}
                    </span>
                  )}
                  {action.player?.name?.split(' ').pop() || '?'}
                </span>

                {/* 액션 타입 */}
                <span className="flex items-center gap-1">
                  <span>{actionInfo.icon}</span>
                  <span>{actionInfo.shortLabel}</span>
                </span>

                {/* 결과 */}
                <span
                  className={`px-1.5 py-0.5 rounded ${resultInfo.bgColor} ${resultInfo.color}`}
                >
                  {resultInfo.shortLabel}
                </span>

                {/* 좌표 */}
                <span className="text-gray-400 text-[10px] flex-1 text-right">
                  <span className="text-blue-500">
                    시작({action.start_x.toFixed(1)},{' '}
                    {action.start_y.toFixed(1)})
                  </span>
                  {action.end_x !== null && action.end_y !== null && (
                    <>
                      {' → '}
                      <span className="text-yellow-600">
                        종료({action.end_x.toFixed(1)},{' '}
                        {action.end_y.toFixed(1)})
                      </span>
                    </>
                  )}
                </span>

                {/* 삭제 버튼 (최신 항목만) */}
                {isLatest && onDelete && (
                  <button
                    onClick={() => onDelete(action.action_id)}
                    className="text-red-400 hover:text-red-600 ml-1"
                    title="삭제"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
