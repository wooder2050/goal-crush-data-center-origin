'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { H2 } from '@/components/ui/typography';
import { authFetch } from '@/lib/auth-fetch';

interface SummaryEditTabProps {
  matchId: number;
  initialSummary: string | null;
}

/**
 * AI 경기 요약 저장. 관리자 경기 수정 API를 거치므로 저장 즉시
 * 홈·경기 상세 캐시가 무효화된다(SQL Editor 직접 수정은 캐시가 남음).
 */
export default function SummaryEditTab({
  matchId,
  initialSummary,
}: SummaryEditTabProps) {
  const [summary, setSummary] = useState(initialSummary ?? '');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const trimmed = summary.trim();
      const response = await authFetch(`/api/admin/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: trimmed === '' ? null : trimmed }),
      });
      if (!response.ok) throw new Error('요약 저장에 실패했습니다.');
      setSavedAt(new Date().toLocaleTimeString('ko-KR'));
    } catch (error) {
      console.error('요약 저장 실패:', error);
      alert('요약 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <H2 className="text-lg">경기 요약</H2>
      <p className="text-sm text-gray-500">
        경기 상세 요약 탭에 그대로 표시됩니다. 비우고 저장하면 요약이
        삭제됩니다.
      </p>
      <Textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={10}
        placeholder="검수를 마친 경기 요약을 붙여넣으세요."
      />
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '저장 중…' : '요약 저장'}
        </Button>
        {savedAt && (
          <span className="text-sm text-gray-500">{savedAt} 저장됨</span>
        )}
      </div>
    </div>
  );
}
