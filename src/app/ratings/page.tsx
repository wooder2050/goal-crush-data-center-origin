import { Section } from '@/components/ui';
import RatingsClientShell from '@/features/player-ratings/components/RatingsClientShell';

export default function RatingsPage() {
  return (
    <Section padding="sm" className="min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">선수 평가 모음</h1>
        <p className="text-gray-600 mt-2">
          모든 선수들의 능력치 평가를 확인해보세요
        </p>
      </div>

      <RatingsClientShell />
    </Section>
  );
}
