'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { matchFormSchema, type MatchFormValues } from '@/common/form/fields';
import { useGoalForm } from '@/common/form/useGoalForm';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { H1 } from '@/components/ui/typography';
import { useCreateMatchMutation } from '@/features/admin/hooks/useMatchMutation';
import { getAllSeasonsPrisma } from '@/features/seasons/api-prisma';
import { getTeamsPrisma } from '@/features/teams/api-prisma';
import { useGoalQuery } from '@/hooks/useGoalQuery';

// 실제 데이터를 가져오는 훅들
const useSeasons = () => useGoalQuery(getAllSeasonsPrisma, []);
const useTeams = () => useGoalQuery(getTeamsPrisma, []);

export const dynamic = 'force-dynamic';

export default function CreateMatchPage() {
  const router = useRouter();
  const createMatchMutation = useCreateMatchMutation();
  const isSubmitting = createMatchMutation.isPending;

  // 실제 데이터 로드
  const { data: seasons = [], isLoading: isLoadingSeasons } = useSeasons();
  const { data: teams = [], isLoading: isLoadingTeams } = useTeams();

  // 폼 초기화
  const form = useGoalForm({
    zodSchema: matchFormSchema,
    defaultValues: {
      season_id: '',
      home_team_id: '',
      away_team_id: '',
      match_date: new Date(),
      match_time: '19:00',
      location: '',
      description: '',
      tournament_stage: '',
      group_stage: '',
    },
  });

  // 폼 제출 처리
  async function onSubmit(values: MatchFormValues) {
    // ISO 형식으로 날짜와 시간 결합
    const [hours, minutes] = values.match_time.split(':').map(Number);
    const matchDateTime = new Date(values.match_date);
    matchDateTime.setHours(hours, minutes);

    // API 요청 데이터 구성
    const matchData = {
      season_id: parseInt(values.season_id),
      home_team_id: parseInt(values.home_team_id),
      away_team_id: parseInt(values.away_team_id),
      match_date: matchDateTime.toISOString(),
      location: values.location,
      description: values.description || null,
      tournament_stage: values.tournament_stage || null,
      group_stage: values.group_stage || null,
      status: 'scheduled',
    };

    // useGoalMutation을 사용하여 API 호출
    createMatchMutation.mutate(matchData, {
      onError: (error) => {
        console.error('경기 등록 실패:', error);
        alert('경기 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
        return true; // 에러 처리 완료
      },
      onSuccess: () => {
        alert('경기가 성공적으로 등록되었습니다.');
      },
    });
  }

  return (
    <Container className="py-8">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <H1>다가오는 경기 등록</H1>
          <div className="space-x-4">
            <Link href="/admin/seasons">
              <Button variant="outline">시즌 관리</Button>
            </Link>
          </div>
        </div>

        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* 시즌 선택 */}
                <FormField
                  control={form.control}
                  name="season_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>시즌</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="시즌을 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingSeasons ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              로딩 중...
                            </div>
                          ) : (
                            seasons.map((season) => (
                              <SelectItem
                                key={season.season_id}
                                value={season.season_id.toString()}
                              >
                                {season.season_name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 경기장 위치 */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>경기장 위치</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="경기장 위치를 입력하세요"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 홈팀 선택 */}
                <FormField
                  control={form.control}
                  name="home_team_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>홈팀</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="홈팀을 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingTeams ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              로딩 중...
                            </div>
                          ) : (
                            teams.map((team) => (
                              <SelectItem
                                key={team.team_id}
                                value={team.team_id.toString()}
                              >
                                {team.team_name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 원정팀 선택 */}
                <FormField
                  control={form.control}
                  name="away_team_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>원정팀</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="원정팀을 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingTeams ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              로딩 중...
                            </div>
                          ) : (
                            teams.map((team) => (
                              <SelectItem
                                key={team.team_id}
                                value={team.team_id.toString()}
                              >
                                {team.team_name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <FormDescription>
                        홈팀과 다른 팀을 선택해주세요.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* 경기 날짜 */}
                <FormField
                  control={form.control}
                  name="match_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>경기 날짜</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, 'yyyy-MM-dd')
                              ) : (
                                <span>날짜를 선택하세요</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 경기 시간 */}
                <FormField
                  control={form.control}
                  name="match_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>경기 시간</FormLabel>
                      <FormControl>
                        <Input placeholder="19:00" {...field} type="time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 토너먼트 스테이지 */}
                <FormField
                  control={form.control}
                  name="tournament_stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>토너먼트 스테이지 (선택사항)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="토너먼트 스테이지 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="group">조별리그</SelectItem>
                          <SelectItem value="round_of_16">16강</SelectItem>
                          <SelectItem value="quarter_final">8강</SelectItem>
                          <SelectItem value="semi_final">준결승</SelectItem>
                          <SelectItem value="final">결승</SelectItem>
                          <SelectItem value="last_place_match">
                            꼴찌 결정전
                          </SelectItem>
                          <SelectItem value="relegation">방출전</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 그룹 스테이지 */}
                <FormField
                  control={form.control}
                  name="group_stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>그룹 스테이지 (선택사항)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="그룹 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">A조</SelectItem>
                          <SelectItem value="B">B조</SelectItem>
                          <SelectItem value="C">C조</SelectItem>
                          <SelectItem value="D">D조</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 경기 설명 */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>경기 설명 (선택사항)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="경기에 대한 추가 설명을 입력하세요"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/matches')}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? '등록 중...' : '경기 등록'}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </Container>
  );
}
