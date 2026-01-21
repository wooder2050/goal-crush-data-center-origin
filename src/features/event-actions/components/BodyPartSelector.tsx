'use client';

import React from 'react';

import { Button } from '@/components/ui/button';

import { BODY_PART_INFO } from '../constants';
import { BodyPart } from '../types';

interface BodyPartSelectorProps {
  selectedBodyPart: BodyPart | null;
  onSelect: (bodyPart: BodyPart) => void;
  disabled?: boolean;
}

const BODY_PARTS: BodyPart[] = ['FOOT', 'HEAD', 'OTHER'];

export function BodyPartSelector({
  selectedBodyPart,
  onSelect,
  disabled = false,
}: BodyPartSelectorProps) {
  return (
    <div className="flex gap-1">
      {BODY_PARTS.map((part) => {
        const info = BODY_PART_INFO[part];
        const isSelected = selectedBodyPart === part;

        return (
          <Button
            key={part}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(part)}
            disabled={disabled}
            className={`h-8 px-2 text-xs ${
              isSelected ? 'bg-purple-600 hover:bg-purple-700' : ''
            }`}
          >
            <span className="mr-1">{info.icon}</span>
            <span>{info.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
