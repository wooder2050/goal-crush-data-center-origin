import { Users } from 'lucide-react';
import { Metadata } from 'next';

import { PlayerVsTeamPageContent } from '@/features/stats/components/PlayerVsTeamPageContent';

export const metadata: Metadata = {
  title: '선수 vs 팀 통계',
  description: '개별 선수의 팀별 상대 기록 - 골때리는 그녀들',
};

export default function PlayerVsTeamPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              선수 vs 팀 통계
            </h1>
          </div>
          <p className="text-base sm:text-lg text-gray-600">
            개별 선수가 특정 팀을 상대로 한 기록을 확인하세요
          </p>
        </div>
      </div>

      <PlayerVsTeamPageContent />
    </div>
  );
}
