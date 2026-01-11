'use client';

import { useState } from 'react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
} from '@/components/ui';
import type {
  CreateRatingRequest,
  PlayerAbilities,
} from '@/features/player-ratings/types';
import {
  ABILITY_CATEGORIES,
  ABILITY_METADATA,
} from '@/features/player-ratings/types';

interface PlayerRatingFormProps {
  playerId: number;
  seasonId?: number;
  onSubmit: (rating: CreateRatingRequest) => void;
  isLoading?: boolean;
}

interface AbilitySliderProps {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}

function AbilitySlider({
  label,
  description,
  value,
  onChange,
}: AbilitySliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm font-bold text-primary">{value}</span>
      </div>
      <input
        type="range"
        min="1"
        max="99"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

export function PlayerRatingForm({
  playerId,
  seasonId,
  onSubmit,
  isLoading = false,
}: PlayerRatingFormProps) {
  const [abilities, setAbilities] = useState<PlayerAbilities>({
    // 모든 능력치를 50으로 초기화
    finishing: 50,
    shot_power: 50,
    shot_accuracy: 50,
    heading: 50,
    short_passing: 50,
    long_passing: 50,
    vision: 50,
    crossing: 50,
    dribbling: 50,
    ball_control: 50,
    agility: 50,
    balance: 50,
    marking: 50,
    tackling: 50,
    interceptions: 50,
    defensive_heading: 50,
    speed: 50,
    acceleration: 50,
    stamina: 50,
    strength: 50,
    determination: 50,
    work_rate: 50,
    leadership: 50,
    composure: 50,
    reflexes: 50,
    diving: 50,
    handling: 50,
    kicking: 50,
  });

  const [overallRating, setOverallRating] = useState<number>(50);
  const [comment, setComment] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>(
    ABILITY_CATEGORIES.ATTACK
  );

  const handleAbilityChange = (key: keyof PlayerAbilities, value: number) => {
    setAbilities((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = () => {
    const ratingData: CreateRatingRequest = {
      player_id: playerId,
      season_id: seasonId,
      ...abilities,
      overall_rating: overallRating,
      comment: comment.trim() || undefined,
    };

    onSubmit(ratingData);
  };

  // 카테고리별 능력치 그룹화
  const abilityGroups = Object.entries(ABILITY_METADATA).reduce(
    (groups, [key, meta]) => {
      if (!groups[meta.category]) {
        groups[meta.category] = [];
      }
      groups[meta.category].push({
        key: key as keyof PlayerAbilities,
        ...meta,
      });
      return groups;
    },
    {} as Record<
      string,
      Array<
        {
          key: keyof PlayerAbilities;
        } & (typeof ABILITY_METADATA)[keyof typeof ABILITY_METADATA]
      >
    >
  );

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold">선수 능력치 평가</CardTitle>
        <p className="text-gray-600">각 능력치를 1-99점 척도로 평가해주세요.</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 카테고리 탭 */}
        <div className="flex flex-wrap gap-2 border-b">
          {Object.entries({
            [ABILITY_CATEGORIES.ATTACK]: '공격',
            [ABILITY_CATEGORIES.PASSING]: '패스',
            [ABILITY_CATEGORIES.DRIBBLING]: '드리블',
            [ABILITY_CATEGORIES.DEFENDING]: '수비',
            [ABILITY_CATEGORIES.PHYSICAL]: '피지컬',
            [ABILITY_CATEGORIES.MENTAL]: '멘탈',
            [ABILITY_CATEGORIES.GOALKEEPER]: '골키퍼',
          }).map(([category, name]) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeCategory === category
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* 능력치 슬라이더들 */}
        <div className="grid gap-4 md:grid-cols-2">
          {abilityGroups[activeCategory]?.map((ability) => (
            <AbilitySlider
              key={ability.key}
              label={ability.name}
              description={ability.description}
              value={abilities[ability.key] || 50}
              onChange={(value) => handleAbilityChange(ability.key, value)}
            />
          ))}
        </div>

        {/* 종합 평점 */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <AbilitySlider
              label="종합 평점"
              description="이 선수의 전체적인 능력을 종합적으로 평가"
              value={overallRating}
              onChange={setOverallRating}
            />
          </CardContent>
        </Card>

        {/* 코멘트 */}
        <div className="space-y-2">
          <label
            htmlFor="comment"
            className="text-sm font-medium text-gray-700"
          >
            평가 코멘트 (선택사항)
          </label>
          <textarea
            id="comment"
            placeholder="이 선수에 대한 평가 의견을 남겨보세요..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSubmit} disabled={isLoading} className="px-8">
            {isLoading ? '평가 제출 중...' : '평가 제출'}
          </Button>
        </div>
      </CardContent>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </Card>
  );
}
