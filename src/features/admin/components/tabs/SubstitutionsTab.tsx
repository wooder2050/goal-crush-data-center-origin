'use client';

import { Button } from '@/components/ui/button';
import { H2 } from '@/components/ui/typography';
import { Substitution } from '@/features/admin/api';
import { SubstitutionsTableSkeleton } from '@/features/admin/components/skeletons';

interface SubstitutionsTabProps {
  isLoadingPlayers: boolean;
  onAddSubstitution: () => void;
  // 실제 경기 교체 데이터 (DB에서 가져온 데이터)
  substitutions?: Substitution[];
  onRemoveSubstitution?: (substitutionId: number) => void;
  isDeleting?: boolean;
}

export default function SubstitutionsTab({
  isLoadingPlayers,
  onAddSubstitution,
  substitutions = [],
  onRemoveSubstitution,
  isDeleting = false,
}: SubstitutionsTabProps) {
  const hasSubstitutions = substitutions.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <H2 className="text-xl">교체 기록</H2>
        <Button onClick={onAddSubstitution}>교체 추가</Button>
      </div>

      {isLoadingPlayers ? (
        <SubstitutionsTableSkeleton />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">시간</th>
                <th className="text-left py-2 px-4">팀</th>
                <th className="text-left py-2 px-4">IN</th>
                <th className="text-left py-2 px-4">OUT</th>
                <th className="text-left py-2 px-4">설명</th>
                {onRemoveSubstitution && (
                  <th className="text-left py-2 px-4">액션</th>
                )}
              </tr>
            </thead>
            <tbody>
              {hasSubstitutions ? (
                substitutions.map((substitution) => (
                  <tr
                    key={substitution.substitution_id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-2 px-4">
                      {substitution.substitution_time}&apos;
                    </td>
                    <td className="py-2 px-4">
                      {substitution.team?.team_name || '-'}
                    </td>
                    <td className="py-2 px-4">
                      {substitution.player_in?.name || '-'}
                    </td>
                    <td className="py-2 px-4">
                      {substitution.player_out?.name || '-'}
                    </td>
                    <td className="py-2 px-4">
                      {substitution.substitution_reason || '-'}
                    </td>
                    {onRemoveSubstitution && (
                      <td className="py-2 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500"
                          onClick={() =>
                            onRemoveSubstitution(substitution.substitution_id)
                          }
                          disabled={isDeleting}
                        >
                          {isDeleting ? '삭제 중...' : '삭제'}
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr className="border-b">
                  <td
                    colSpan={onRemoveSubstitution ? 6 : 5}
                    className="py-4 text-center"
                  >
                    기록된 교체가 없습니다. 교체를 추가해주세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
