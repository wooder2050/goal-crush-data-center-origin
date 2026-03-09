'use client';

import { useEffect, useState } from 'react';

import {
  createPostFormSchema,
  type CreatePostFormValues,
} from '@/common/form/fields';
import { useGoalForm } from '@/common/form/useGoalForm';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGoalMutation } from '@/hooks/useGoalMutation';
import { useGoalQuery } from '@/hooks/useGoalQuery';
import { apiUrl } from '@/lib/api-url';

// API 함수들
const getTeams = async (): Promise<{
  data: Array<{ team_id: number; team_name: string }>;
}> => {
  const response = await fetch(apiUrl('/api/teams'));

  if (!response.ok) {
    throw new Error('팀 목록을 불러오는데 실패했습니다.');
  }

  const result = await response.json();
  return result;
};

const createPost = async (data: {
  title: string;
  content: string;
  category: string;
  team_id?: number;
  match_id?: number;
}): Promise<{ success: boolean; data: { post_id: string } }> => {
  const response = await fetch(apiUrl('/api/community/posts'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '게시글 작성에 실패했습니다.');
  }

  const result = await response.json();
  return result;
};

const getSeasons = async (): Promise<{
  data: Array<{ season_id: number; season_name: string; year: number }>;
}> => {
  const response = await fetch(apiUrl('/api/seasons/simple'));

  if (!response.ok) {
    throw new Error('시즌 목록을 불러오는데 실패했습니다.');
  }

  const result = await response.json();
  return result;
};

const getCompletedMatches = async (
  seasonId: number
): Promise<{
  data: Array<{
    match_id: number;
    home_team: { team_name: string };
    away_team: { team_name: string };
    match_date: string;
    home_score?: number;
    away_score?: number;
  }>;
}> => {
  if (!seasonId || seasonId <= 0) {
    throw new Error('유효한 시즌 ID가 필요합니다.');
  }

  const response = await fetch(apiUrl(`/api/matches/season/${seasonId}`));

  if (!response.ok) {
    throw new Error('완료된 경기 목록을 불러오는데 실패했습니다.');
  }

  const result = await response.json();

  // 완료된 경기만 필터링
  const completedMatches = result.filter(
    (match: { status: string }) => match.status === 'completed'
  );

  return {
    data: completedMatches,
  };
};

// 고유한 쿼리 키 설정
getCompletedMatches.queryKey = 'completed-matches';

const getUpcomingMatches = async (): Promise<{
  data: Array<{
    match_id: number;
    home_team: { team_name: string };
    away_team: { team_name: string };
    match_date: string;
  }>;
}> => {
  const response = await fetch(apiUrl('/api/matches/upcoming?limit=20'));

  if (!response.ok) {
    throw new Error('다가오는 경기 목록을 불러오는데 실패했습니다.');
  }

  const result = await response.json();

  // API 응답 구조에 맞게 데이터 변환
  const matches = result.matches || [];
  const transformedMatches = matches.map(
    (match: {
      match_id: number;
      home: { team_name: string };
      away: { team_name: string };
      match_date: string;
    }) => ({
      match_id: match.match_id,
      home_team: { team_name: match.home.team_name },
      away_team: { team_name: match.away.team_name },
      match_date: match.match_date,
    })
  );

  return {
    data: transformedMatches,
  };
};

// 고유한 쿼리 키 설정
getUpcomingMatches.queryKey = 'upcoming-matches';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  onSuccess?: () => void;
}

export function CreatePostModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  onSuccess,
}: CreatePostModalProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState(0);

  // 인증 상태 확인
  const { user, loading } = useAuth();

  // 팀 커뮤니티에서 들어온 경우 카테고리와 팀 고정
  const isTeamCommunity = Boolean(teamId && teamName);

  // 폼 초기값 설정
  const defaultValues: CreatePostFormValues = {
    title: '',
    content: '',
    category: 'team',
    team_id: teamId ? parseInt(teamId) : undefined,
    match_id: undefined,
  };

  const form = useGoalForm({
    zodSchema: createPostFormSchema,
    defaultValues,
  });

  // 폼 값 추출
  const { category } = form.watch();

  // 드롭다운 열림 상태
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isSeasonOpen, setIsSeasonOpen] = useState(false);
  const [isMatchOpen, setIsMatchOpen] = useState(false);
  const [isUpcomingMatchOpen, setIsUpcomingMatchOpen] = useState(false);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setIsCategoryOpen(false);
        setIsTeamOpen(false);
        setIsSeasonOpen(false);
        setIsMatchOpen(false);
        setIsUpcomingMatchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: teamsResponse, isLoading: isLoadingTeams } = useGoalQuery(
    getTeams,
    [],
    { enabled: category === 'team' }
  );

  const { data: seasonsResponse, isLoading: isLoadingSeasons } = useGoalQuery(
    getSeasons,
    [],
    { enabled: category === 'match' }
  );

  const {
    data: completedMatchesResponse,
    isLoading: isLoadingCompletedMatches,
  } = useGoalQuery(getCompletedMatches, [selectedSeasonId], {
    enabled: category === 'match' && selectedSeasonId > 0,
    // 시즌이 변경될 때마다 새로운 쿼리 실행
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const { data: upcomingMatchesResponse, isLoading: isLoadingUpcomingMatches } =
    useGoalQuery(getUpcomingMatches, [], {
      enabled: category === 'prediction',
    });

  // 게시글 작성 mutation
  const createPostMutation = useGoalMutation(createPost, {
    onSuccess: (data) => {
      // 성공 시 모달 닫기 및 게시글 상세 페이지로 이동
      form.reset();
      setSelectedSeasonId(0);
      onSuccess?.();
      onClose();

      // 게시글 상세 페이지로 이동
      if (data?.data?.post_id) {
        window.location.href = `/community/posts/${data.data.post_id}`;
      }
    },
    onError: (error) => {
      console.error('게시글 작성 실패:', error);
    },
  });

  // 데이터 추출
  const teams = teamsResponse?.data || [];
  const seasons = seasonsResponse?.data || [];
  const completedMatches = completedMatchesResponse?.data || [];
  const upcomingMatches = upcomingMatchesResponse?.data || [];

  // 로딩 상태 통합
  const isLoadingData =
    isLoadingTeams ||
    isLoadingSeasons ||
    isLoadingCompletedMatches ||
    isLoadingUpcomingMatches;

  const handleSubmit = async (values: CreatePostFormValues) => {
    createPostMutation.mutate({
      title: values.title.trim(),
      content: values.content.trim(),
      category: values.category,
      team_id: values.team_id,
      match_id: values.match_id,
    });
  };

  const handleClose = () => {
    if (!createPostMutation.isPending) {
      form.reset();
      setSelectedSeasonId(0);
      onClose();
    }
  };

  // 로그인이 되지 않은 경우 로그인 모달 표시
  if (!loading && !user) {
    return (
      <AuthModal isOpen={isOpen} onClose={onClose} redirectUrl="/community" />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {category === 'team' && teamName
              ? `${teamName} 커뮤니티에 글 작성하기`
              : '게시글 작성하기'}
          </DialogTitle>
          <DialogDescription>
            {category === 'team'
              ? '팀원들과 소통하고 정보를 공유해보세요.'
              : '커뮤니티에 글을 작성해보세요.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제목</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="게시글 제목을 입력하세요"
                      className="mt-1"
                      maxLength={200}
                      {...field}
                    />
                  </FormControl>
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {field.value?.length || 0}/200
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 카테고리 선택 (팀 커뮤니티가 아닐 때만 표시) */}
            {!isTeamCommunity && (
              <div>
                <Label htmlFor="category">카테고리</Label>
                <div className="relative dropdown-container">
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer transition-all duration-200 hover:border-gray-400 hover:shadow-sm text-left flex items-center justify-between"
                  >
                    <span className="text-gray-900">
                      {category === 'team' && '팀'}
                      {category === 'match' && '경기'}
                      {category === 'general' && '일반'}
                      {category === 'prediction' && '예측'}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                        isCategoryOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {isCategoryOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {[
                        { value: 'team', label: '팀' },
                        { value: 'match', label: '경기' },
                        { value: 'general', label: '일반' },
                        { value: 'prediction', label: '예측' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            const newCategory = option.value;
                            form.setValue('category', newCategory);
                            setIsCategoryOpen(false);

                            // 카테고리 변경 시 선택된 값 초기화
                            if (newCategory === 'team') {
                              form.setValue('match_id', undefined);
                              setSelectedSeasonId(0);
                              form.setValue(
                                'team_id',
                                teamId ? parseInt(teamId) : undefined
                              );
                            } else if (newCategory === 'match') {
                              form.setValue('team_id', undefined);
                              form.setValue('match_id', undefined);
                              setSelectedSeasonId(0);
                            } else if (newCategory === 'prediction') {
                              form.setValue('team_id', undefined);
                              form.setValue('match_id', undefined);
                              setSelectedSeasonId(0);
                            } else {
                              // 일반 카테고리일 때는 모든 선택 값 초기화
                              form.setValue('team_id', undefined);
                              form.setValue('match_id', undefined);
                              setSelectedSeasonId(0);
                            }
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 ${
                            category === option.value
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:text-gray-900'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 팀 선택 (팀 카테고리일 때만 표시) */}
            {category === 'team' && (
              <FormField
                control={form.control}
                name="team_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>팀 선택</FormLabel>
                    {isTeamCommunity ? (
                      // 팀 커뮤니티에서 들어온 경우 고정된 팀 정보 표시
                      <div className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                        {teamName}
                      </div>
                    ) : (
                      // 일반적인 경우 팀 선택 드롭다운 표시
                      <>
                        {isLoadingData ? (
                          <div className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded"></div>
                          </div>
                        ) : (
                          <div className="relative dropdown-container">
                            <button
                              type="button"
                              onClick={() => setIsTeamOpen(!isTeamOpen)}
                              className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer transition-all duration-200 hover:border-gray-400 hover:shadow-sm text-left flex items-center justify-between"
                            >
                              <span className="text-gray-900">
                                {!field.value
                                  ? '팀을 선택해주세요'
                                  : teams.find((t) => t.team_id === field.value)
                                      ?.team_name || '팀을 선택해주세요'}
                              </span>
                              <svg
                                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                  isTeamOpen ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>

                            {isTeamOpen && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange(undefined);
                                    setIsTeamOpen(false);
                                  }}
                                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 ${
                                    !field.value
                                      ? 'bg-blue-100 text-blue-700 font-medium'
                                      : 'text-gray-700 hover:text-gray-900'
                                  }`}
                                >
                                  팀을 선택해주세요
                                </button>
                                {teams.map((team) => (
                                  <button
                                    key={team.team_id}
                                    type="button"
                                    onClick={() => {
                                      field.onChange(team.team_id);
                                      setIsTeamOpen(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 ${
                                      field.value === team.team_id
                                        ? 'bg-blue-100 text-blue-700 font-medium'
                                        : 'text-gray-700 hover:text-gray-900'
                                    }`}
                                  >
                                    {team.team_name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* 시즌 선택 (경기 카테고리일 때만 표시) */}
            {category === 'match' && (
              <div>
                <Label htmlFor="season">시즌 선택</Label>
                {isLoadingData ? (
                  <div className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => setIsSeasonOpen(!isSeasonOpen)}
                      className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer transition-all duration-200 hover:border-gray-400 hover:shadow-sm text-left flex items-center justify-between"
                    >
                      <span className="text-gray-900">
                        {selectedSeasonId === 0
                          ? '시즌을 선택해주세요'
                          : seasons.find(
                                (s) => s.season_id === selectedSeasonId
                              )
                            ? `${seasons.find((s) => s.season_id === selectedSeasonId)?.season_name} (${seasons.find((s) => s.season_id === selectedSeasonId)?.year})`
                            : '시즌을 선택해주세요'}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                          isSeasonOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isSeasonOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSeasonId(0);
                            form.setValue('match_id', undefined);
                            setIsSeasonOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 ${
                            selectedSeasonId === 0
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:text-gray-900'
                          }`}
                        >
                          시즌을 선택해주세요
                        </button>
                        {seasons.map((season) => (
                          <button
                            key={season.season_id}
                            type="button"
                            onClick={() => {
                              setSelectedSeasonId(season.season_id);
                              form.setValue('match_id', undefined);
                              setIsSeasonOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 ${
                              selectedSeasonId === season.season_id
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : 'text-gray-700 hover:text-gray-900'
                            }`}
                          >
                            {season.season_name} ({season.year})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 경기 선택 (경기 카테고리일 때만 표시) */}
            {category === 'match' && selectedSeasonId > 0 && (
              <FormField
                control={form.control}
                name="match_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>완료된 경기 선택</FormLabel>
                    {isLoadingData ? (
                      <div className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    ) : (
                      <div className="relative dropdown-container">
                        <button
                          type="button"
                          onClick={() => setIsMatchOpen(!isMatchOpen)}
                          className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer transition-all duration-200 hover:border-gray-400 hover:shadow-sm text-left flex items-center justify-between"
                        >
                          <span className="text-gray-900">
                            {!field.value
                              ? '경기를 선택해주세요'
                              : completedMatches.find(
                                    (m) => m.match_id === field.value
                                  )
                                ? `${completedMatches.find((m) => m.match_id === field.value)?.home_team.team_name} vs ${completedMatches.find((m) => m.match_id === field.value)?.away_team.team_name} (${new Date(completedMatches.find((m) => m.match_id === field.value)?.match_date || '').toLocaleDateString('ko-KR')})`
                                : '경기를 선택해주세요'}
                          </span>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                              isMatchOpen ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {isMatchOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                            <button
                              type="button"
                              onClick={() => {
                                field.onChange(undefined);
                                setIsMatchOpen(false);
                              }}
                              className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 ${
                                !field.value
                                  ? 'bg-blue-100 text-blue-700 font-medium'
                                  : 'text-gray-700 hover:text-gray-900'
                              }`}
                            >
                              경기를 선택해주세요
                            </button>
                            {completedMatches.map((match) => (
                              <button
                                key={match.match_id}
                                type="button"
                                onClick={() => {
                                  field.onChange(match.match_id);
                                  setIsMatchOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 ${
                                  field.value === match.match_id
                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                    : 'text-gray-700 hover:text-gray-900'
                                }`}
                              >
                                {match.home_team.team_name} vs{' '}
                                {match.away_team.team_name} (
                                {new Date(match.match_date).toLocaleDateString(
                                  'ko-KR'
                                )}
                                )
                                {match.home_score !== undefined &&
                                match.away_score !== undefined
                                  ? ` - ${match.home_score}:${match.away_score}`
                                  : ''}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* 다가오는 경기 선택 (예측 카테고리일 때만 표시) */}
            {category === 'prediction' && (
              <FormField
                control={form.control}
                name="match_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>다가오는 경기 선택</FormLabel>
                    {isLoadingData ? (
                      <div className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    ) : (
                      <div className="relative dropdown-container">
                        <button
                          type="button"
                          onClick={() =>
                            setIsUpcomingMatchOpen(!isUpcomingMatchOpen)
                          }
                          className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer transition-all duration-200 hover:border-gray-400 hover:shadow-sm text-left flex items-center justify-between"
                        >
                          <span className="text-gray-900">
                            {!field.value
                              ? '경기를 선택해주세요'
                              : upcomingMatches.find(
                                    (m) => m.match_id === field.value
                                  )
                                ? `${upcomingMatches.find((m) => m.match_id === field.value)?.home_team.team_name} vs ${upcomingMatches.find((m) => m.match_id === field.value)?.away_team.team_name} (${new Date(upcomingMatches.find((m) => m.match_id === field.value)?.match_date || '').toLocaleDateString('ko-KR')})`
                                : '경기를 선택해주세요'}
                          </span>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                              isUpcomingMatchOpen ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {isUpcomingMatchOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                            <button
                              type="button"
                              onClick={() => {
                                field.onChange(undefined);
                                setIsUpcomingMatchOpen(false);
                              }}
                              className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 ${
                                !field.value
                                  ? 'bg-blue-100 text-blue-700 font-medium'
                                  : 'text-gray-700 hover:text-gray-900'
                              }`}
                            >
                              경기를 선택해주세요
                            </button>
                            {upcomingMatches.map((match) => (
                              <button
                                key={match.match_id}
                                type="button"
                                onClick={() => {
                                  field.onChange(match.match_id);
                                  setIsUpcomingMatchOpen(false);
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 ${
                                  field.value === match.match_id
                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                    : 'text-gray-700 hover:text-gray-900'
                                }`}
                              >
                                {match.home_team.team_name} vs{' '}
                                {match.away_team.team_name} (
                                {new Date(match.match_date).toLocaleDateString(
                                  'ko-KR'
                                )}
                                )
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>내용</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="게시글 내용을 입력하세요"
                      className="mt-1 min-h-[200px] resize-none w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createPostMutation.isPending}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={createPostMutation.isPending}
                className="px-6"
              >
                {createPostMutation.isPending ? '작성 중...' : '게시글 작성'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
