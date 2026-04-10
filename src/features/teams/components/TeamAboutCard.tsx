'use client';

import { useState } from 'react';

interface TeamAboutCardProps {
  about: string | null | undefined;
}

const COLLAPSED_LINES = 6;

export default function TeamAboutCard({ about }: TeamAboutCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!about) return null;

  const lines = about.split('\n');
  const isLong = lines.length > COLLAPSED_LINES;
  const displayText = expanded
    ? about
    : lines.slice(0, COLLAPSED_LINES).join('\n');

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white">
      <div className="border-b border-gray-100 py-4">
        <p className="text-center text-[16px] font-semibold text-gray-900">
          About
        </p>
      </div>

      <div className="px-6 py-5">
        <p className="whitespace-pre-line text-[14px] leading-[1.8] text-gray-600">
          {displayText}
        </p>
      </div>

      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full border-t border-gray-100 py-3 text-center text-[14px] font-medium text-green-600 transition-colors hover:bg-gray-50"
        >
          {expanded ? '축소' : '확장'}
        </button>
      )}
    </div>
  );
}
