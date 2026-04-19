'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  Container,
  H1,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';

import ViewershipRatingsChart from './ViewershipRatingsChart';

interface RatingData {
  match_id: number;
  match_date: string;
  label: string;
  rating_nationwide: number | null;
  rating_metropolitan: number | null;
  season: { season_id: number; season_name: string } | null;
}

async function fetchAllRatings(): Promise<RatingData[]> {
  const res = await fetch(apiUrl('/api/stats/viewership-ratings'));
  if (!res.ok) throw new Error('Failed to fetch ratings');
  return res.json();
}

const PAGE_SIZE = 20;

export default function ViewershipRatingsPageContent() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, error } = useGoalQuery(fetchAllRatings, [], {
    staleTime: 10 * 60 * 1000,
  });

  const seasons = useMemo(() => {
    if (!data) return [];
    const map = new Map<number, string>();
    data.forEach((d) => {
      if (d.season) map.set(d.season.season_id, d.season.season_name);
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ season_id: id, season_name: name }))
      .sort((a, b) => b.season_id - a.season_id);
  }, [data]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (selectedSeasonId === 'all') return data;
    const sid = parseInt(selectedSeasonId, 10);
    return data.filter((d) => d.season?.season_id === sid);
  }, [data, selectedSeasonId]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = useMemo(
    () =>
      filteredData.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [filteredData, currentPage]
  );

  const handleSeasonChange = (value: string) => {
    setSelectedSeasonId(value);
    setCurrentPage(1);
  };

  const topMatches = useMemo(() => {
    if (!data) return [];
    return [...data]
      .filter((d) => d.rating_nationwide != null)
      .sort((a, b) => (b.rating_nationwide ?? 0) - (a.rating_nationwide ?? 0))
      .slice(0, 10);
  }, [data]);

  const seasonStats = useMemo(() => {
    if (!data) return [];
    const map = new Map<
      number,
      { name: string; ratings: number[]; count: number }
    >();
    data.forEach((d) => {
      if (!d.season || d.rating_nationwide == null) return;
      const entry = map.get(d.season.season_id) ?? {
        name: d.season.season_name,
        ratings: [],
        count: 0,
      };
      entry.ratings.push(d.rating_nationwide);
      entry.count++;
      map.set(d.season.season_id, entry);
    });
    return Array.from(map.entries())
      .map(([id, { name, ratings }]) => ({
        season_id: id,
        season_name: name,
        avg: (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1),
        max: Math.max(...ratings).toFixed(1),
        min: Math.min(...ratings).toFixed(1),
        count: ratings.length,
      }))
      .sort((a, b) => b.season_id - a.season_id);
  }, [data]);

  if (isLoading) {
    return (
      <Container className="py-8">
        <div className="space-y-4">
          <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-[300px] bg-gray-50 rounded-xl animate-pulse" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-8">
        <Section>
          <H1>시청률 통계</H1>
          <p className="mt-4 text-red-500">
            데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
        </Section>
      </Container>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Container className="py-8">
        <Section>
          <H1>시청률 통계</H1>
          <p className="mt-4 text-gray-500">
            아직 시청률 데이터가 입력되지 않았습니다.
          </p>
        </Section>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <Section>
        <H1>시청률 통계</H1>
        <p className="mt-2 text-gray-500">
          골 때리는 그녀들 역대 시청률 추이와 시청률 TOP 경기
        </p>
      </Section>

      <div className="mt-8 space-y-8">
        {/* 시청률 추이 차트 */}
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">시청률 추이</h2>
            <Select value={selectedSeasonId} onValueChange={handleSeasonChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 시즌</SelectItem>
                {seasons.map((s) => (
                  <SelectItem key={s.season_id} value={String(s.season_id)}>
                    {s.season_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ViewershipRatingsChart data={filteredData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 시청률 TOP 10 */}
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              시청률 TOP 10
            </h2>
            <div className="space-y-1">
              {topMatches.map((match, i) => (
                <Link
                  key={match.match_id}
                  href={`/matches/${match.match_id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span
                    className={`w-5 text-center text-sm font-bold ${
                      i < 3 ? 'text-[#ff4800]' : 'text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {match.label.replace(/FC /g, '')}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {format(new Date(match.match_date), 'yyyy.M.d', {
                        locale: ko,
                      })}
                      {match.season && ` | ${match.season.season_name}`}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {match.rating_nationwide}%
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* 시즌별 요약 */}
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              시즌별 시청률
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">
                      시즌
                    </th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">
                      경기수
                    </th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">
                      평균
                    </th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">
                      최고
                    </th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">
                      최저
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {seasonStats.map((s) => (
                    <tr
                      key={s.season_id}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="py-2.5 px-2 font-medium text-gray-900">
                        {s.season_name}
                      </td>
                      <td className="py-2.5 px-2 text-center text-gray-600">
                        {s.count}
                      </td>
                      <td className="py-2.5 px-2 text-center font-semibold text-gray-900">
                        {s.avg}%
                      </td>
                      <td className="py-2.5 px-2 text-center text-[#ff4800]">
                        {s.max}%
                      </td>
                      <td className="py-2.5 px-2 text-center text-gray-400">
                        {s.min}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 전체 경기별 시청률 */}
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              경기별 시청률 전체 기록
            </h2>
            <span className="text-xs text-gray-400">
              {filteredData.length}경기 | 출처: 닐슨코리아
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">
                    날짜
                  </th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">
                    경기
                  </th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium hidden sm:table-cell">
                    시즌
                  </th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">
                    전국
                  </th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">
                    수도권
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((match) => (
                  <tr
                    key={match.match_id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                  >
                    <td className="py-2 px-2 text-gray-500 whitespace-nowrap">
                      {format(new Date(match.match_date), 'yy.M.d', {
                        locale: ko,
                      })}
                    </td>
                    <td className="py-2 px-2">
                      <Link
                        href={`/matches/${match.match_id}`}
                        className="text-gray-900 hover:text-[#ff4800] transition-colors truncate block max-w-[200px] sm:max-w-none"
                      >
                        {match.label.replace(/FC /g, '')}
                      </Link>
                    </td>
                    <td className="py-2 px-2 text-gray-400 text-xs hidden sm:table-cell truncate max-w-[150px]">
                      {match.season?.season_name}
                    </td>
                    <td className="py-2 px-2 text-center font-semibold text-gray-900">
                      {match.rating_nationwide != null
                        ? `${match.rating_nationwide}%`
                        : '-'}
                    </td>
                    <td className="py-2 px-2 text-center text-[#3b82f6]">
                      {match.rating_metropolitan != null
                        ? `${match.rating_metropolitan}%`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-50">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <span className="text-sm text-gray-500">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
