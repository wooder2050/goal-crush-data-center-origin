import { NextRequest, NextResponse } from 'next/server';

import { requireAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { inferLeague } from '@/lib/utils';

// Season 타입 정의
type SeasonWithMatchCount = {
  season_id: number;
  season_name: string;
  year: number;
  start_date: Date | null;
  end_date: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
  _count: {
    matches: number;
  };
  match_count: number;
  champion_team_id?: number | null;
  champion_team_name?: string | null;
  champion_team_logo?: string | null;
  champion_label?: '우승팀' | '승격팀' | '1위' | '현재 1위' | null;
  champion_teams?: Array<{
    team_id: number | null;
    team_name: string | null;
    logo: string | null;
  }>;
};

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// POST /api/seasons - 새 시즌 생성
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();

    const body = await request.json();
    const { season_name, year, category, start_date, end_date } = body;

    // 필수 필드 검증
    if (!season_name || !year) {
      return NextResponse.json(
        { error: '시즌명과 연도는 필수입니다.' },
        { status: 400 }
      );
    }

    // 시즌명 길이 및 형식 검증
    if (season_name.length < 3 || season_name.length > 100) {
      return NextResponse.json(
        { error: '시즌명은 3자 이상 100자 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 연도 유효성 검증
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      return NextResponse.json(
        { error: '연도는 2020년에서 2030년 사이여야 합니다.' },
        { status: 400 }
      );
    }

    // 시즌명 중복 검증
    const existingSeason = await prisma.season.findFirst({
      where: { season_name },
    });

    if (existingSeason) {
      return NextResponse.json(
        { error: '동일한 시즌명이 이미 존재합니다.' },
        { status: 400 }
      );
    }

    // 날짜 유효성 검증
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);

      if (start >= end) {
        return NextResponse.json(
          { error: '시작일은 종료일보다 이전이어야 합니다.' },
          { status: 400 }
        );
      }
    }

    // 카테고리 유효성 검증
    const validCategories = [
      'SUPER_LEAGUE',
      'CHALLENGE_LEAGUE',
      'G_LEAGUE',
      'PLAYOFF',
      'SBS_CUP',
      'CHAMPION_MATCH',
      'GIFA_CUP',
      'OTHER',
    ];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리입니다.' },
        { status: 400 }
      );
    }

    // 새 시즌 생성
    const newSeason = await prisma.season.create({
      data: {
        season_name,
        year: yearNum,
        category: category || null,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      },
    });

    return NextResponse.json(
      {
        message: '시즌이 성공적으로 생성되었습니다.',
        season: newSeason,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === '인증이 필요합니다' ||
        error.message === '관리자 권한이 필요합니다')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '인증이 필요합니다' ? 401 : 403 }
      );
    }

    console.error('Error creating season:', error);
    return NextResponse.json(
      {
        error: 'Failed to create season',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/seasons - 시즌 삭제
export async function DELETE(request: NextRequest) {
  try {
    await requireAdminAuth();

    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('id');

    if (!seasonId) {
      return NextResponse.json(
        { error: '시즌 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const seasonIdNum = parseInt(seasonId);
    if (isNaN(seasonIdNum)) {
      return NextResponse.json(
        { error: '유효하지 않은 시즌 ID입니다.' },
        { status: 400 }
      );
    }

    // 시즌 존재 여부 확인
    const existingSeason = await prisma.season.findUnique({
      where: { season_id: seasonIdNum },
    });

    if (!existingSeason) {
      return NextResponse.json(
        { error: '존재하지 않는 시즌입니다.' },
        { status: 404 }
      );
    }

    // 시즌에 경기가 있는지 확인
    const matchCount = await prisma.match.count({
      where: { season_id: seasonIdNum },
    });

    if (matchCount > 0) {
      return NextResponse.json(
        {
          error: '경기가 있는 시즌은 삭제할 수 없습니다.',
          matchCount,
          seasonName: existingSeason.season_name,
        },
        { status: 400 }
      );
    }

    // 시즌에 관련된 다른 데이터가 있는지 확인
    const relatedDataCount = await prisma.standing.count({
      where: { season_id: seasonIdNum },
    });

    if (relatedDataCount > 0) {
      return NextResponse.json(
        {
          error: '순위 데이터가 있는 시즌은 삭제할 수 없습니다.',
          relatedDataCount,
          seasonName: existingSeason.season_name,
        },
        { status: 400 }
      );
    }

    // 시즌 삭제
    await prisma.season.delete({
      where: { season_id: seasonIdNum },
    });

    return NextResponse.json({
      message: '시즌이 삭제되었습니다.',
      deletedSeason: {
        id: seasonIdNum,
        name: existingSeason.season_name,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === '인증이 필요합니다' ||
        error.message === '관리자 권한이 필요합니다')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === '인증이 필요합니다' ? 401 : 403 }
      );
    }

    console.error('Error deleting season:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete season',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/seasons - 모든 시즌 조회 (페이지네이션 지원)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const year = searchParams.get('year');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    // 페이지네이션 파라미터 처리
    const pageNum = page ? parseInt(page) : undefined;
    const limitNum = limit ? parseInt(limit) : undefined;
    const isPaginated = pageNum && limitNum;

    const whereClause = {
      ...(name && {
        season_name: {
          contains: name,
          mode: 'insensitive' as const,
        },
      }),
      ...(year &&
        !isNaN(parseInt(year)) && {
          year: parseInt(year),
        }),
    };

    // 페이지네이션이 요청된 경우 총 개수도 조회
    const [seasons, totalCount] = await Promise.all([
      prisma.season.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              matches: true,
            },
          },
        },
        orderBy: {
          season_id: 'desc',
        },
        ...(isPaginated && {
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
      }),
      isPaginated
        ? prisma.season.count({ where: whereClause })
        : Promise.resolve(0),
    ]);

    // match_count 필드를 추가하여 응답 형식 통일
    const seasonIds = seasons.map((s) => s.season_id);
    const winners = await prisma.standing.findMany({
      where: { season_id: { in: seasonIds }, position: 1 },
      select: {
        season_id: true,
        team: { select: { team_id: true, team_name: true, logo: true } },
      },
    });

    // 시즌별 팀 이름 조회
    const teamSeasonNames = await prisma.teamSeasonName.findMany({
      where: { season_id: { in: seasonIds } },
      select: {
        team_id: true,
        season_id: true,
        team_name: true,
      },
    });

    // 시즌+팀 조합으로 시즌별 팀 이름 매핑
    const teamSeasonNameMap = new Map<string, string>();
    for (const tsn of teamSeasonNames) {
      teamSeasonNameMap.set(`${tsn.season_id}-${tsn.team_id}`, tsn.team_name);
    }

    const winnersBySeason = new Map<
      number,
      Array<{ id: number | null; name: string | null; logo: string | null }>
    >();
    for (const w of winners) {
      if (w.season_id == null) continue;
      const arr = winnersBySeason.get(w.season_id) ?? [];
      // 시즌별 팀 이름 우선 사용, 없으면 기본 팀 이름 사용
      const seasonTeamName =
        w.team?.team_id != null
          ? (teamSeasonNameMap.get(`${w.season_id}-${w.team.team_id}`) ??
            w.team?.team_name)
          : w.team?.team_name;
      arr.push({
        id: w.team?.team_id ?? null,
        name: seasonTeamName ?? null,
        logo: w.team?.logo ?? null,
      });
      winnersBySeason.set(w.season_id, arr);
    }

    const seasonsWithMatchCount: SeasonWithMatchCount[] = seasons.map(
      (season) => {
        const league = inferLeague(season.season_name);
        const pilotSeason =
          season.season_id === 1 || /파일럿|pilot/i.test(season.season_name);
        const firstSeason = season.season_id === 2;
        const secondSeason = season.season_id === 3;
        const isCompleted = Boolean(season.end_date);

        let label: SeasonWithMatchCount['champion_label'] = null;
        let teams: SeasonWithMatchCount['champion_teams'] = [];

        if (isCompleted) {
          if (
            league === 'super' ||
            league === 'cup' ||
            league === 'g-league' ||
            pilotSeason ||
            firstSeason
          ) {
            const arr = winnersBySeason.get(season.season_id) ?? [];
            const w = arr[0] ?? null;
            label = '우승팀';
            teams = w
              ? [{ team_id: w.id, team_name: w.name, logo: w.logo }]
              : [];
          } else if (league === 'challenge' || league === 'playoff') {
            const arr = winnersBySeason.get(season.season_id) ?? [];
            const w = arr[0] ?? null;
            label = '승격팀';
            teams = w
              ? [{ team_id: w.id, team_name: w.name, logo: w.logo }]
              : [];
          } else if (secondSeason) {
            const arr = winnersBySeason.get(season.season_id) ?? [];
            // 조별리그: 각 조 1위 모두 노출 (standings 기준 여러 팀 가능)
            label = '1위';
            teams = arr.map((t) => ({
              team_id: t.id,
              team_name: t.name,
              logo: t.logo,
            }));
          }
        } else {
          // 진행중 시즌: standings 기준 현재 1위 (리그 구분 없이 공통 처리)
          if (
            league === 'super' ||
            league === 'cup' ||
            pilotSeason ||
            firstSeason
          ) {
            const arr = winnersBySeason.get(season.season_id) ?? [];
            const w = arr[0] ?? null;
            label = '1위';
            teams = w
              ? [{ team_id: w.id, team_name: w.name, logo: w.logo }]
              : [];
          } else if (league === 'g-league' || secondSeason) {
            const arr = winnersBySeason.get(season.season_id) ?? [];
            label = arr.length > 0 ? '현재 1위' : null;
            teams = arr.map((t) => ({
              team_id: t.id,
              team_name: t.name,
              logo: t.logo,
            }));
          } else {
            const arr = winnersBySeason.get(season.season_id) ?? [];
            const w = arr[0] ?? null;
            label = w ? '현재 1위' : null;
            teams = w
              ? [{ team_id: w.id, team_name: w.name, logo: w.logo }]
              : [];
          }
        }

        const first = teams && teams.length > 0 ? teams[0] : null;
        return {
          ...season,
          match_count: season._count.matches,
          champion_team_id: first?.team_id ?? null,
          champion_team_name: first?.team_name ?? null,
          champion_team_logo: first?.logo ?? null,
          champion_label: label,
          champion_teams: teams,
        };
      }
    );

    // 페이지네이션 응답 또는 일반 응답
    if (isPaginated) {
      const totalPages = Math.ceil(totalCount / limitNum);
      const hasNextPage = pageNum < totalPages;
      const nextPage = hasNextPage ? pageNum + 1 : null;

      return NextResponse.json({
        items: seasonsWithMatchCount,
        totalCount,
        totalPages,
        currentPage: pageNum,
        hasNextPage,
        nextPage,
      });
    } else {
      return NextResponse.json(seasonsWithMatchCount);
    }
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch seasons',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
