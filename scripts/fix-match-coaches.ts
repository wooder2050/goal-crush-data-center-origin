/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * matches 테이블의 home_coach_id/away_coach_id에서
 * match_coaches에 누락된 레코드를 보완하는 스크립트
 * 실행: npx tsx scripts/fix-match-coaches.ts
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // 완료된 경기 중 coach_id가 있는 것 모두 조회
  const matches = await prisma.match.findMany({
    where: { home_score: { not: null } },
    select: {
      match_id: true,
      home_team_id: true,
      away_team_id: true,
      home_coach_id: true,
      away_coach_id: true,
    },
  });

  // 기존 match_coaches 조회
  const existing = await prisma.matchCoach.findMany({
    select: { match_id: true, team_id: true, coach_id: true },
  });
  const existingSet = new Set(
    existing.map(
      (e: { match_id: number; team_id: number; coach_id: number }) =>
        `${e.match_id}-${e.team_id}-${e.coach_id}`
    )
  );

  const toInsert: Array<{
    match_id: number;
    team_id: number;
    coach_id: number;
    role: string;
  }> = [];

  for (const m of matches) {
    // 홈 감독
    if (m.home_coach_id && m.home_team_id) {
      const key = `${m.match_id}-${m.home_team_id}-${m.home_coach_id}`;
      if (!existingSet.has(key)) {
        toInsert.push({
          match_id: m.match_id,
          team_id: m.home_team_id,
          coach_id: m.home_coach_id,
          role: 'head',
        });
      }
    }
    // 어웨이 감독
    if (m.away_coach_id && m.away_team_id) {
      const key = `${m.match_id}-${m.away_team_id}-${m.away_coach_id}`;
      if (!existingSet.has(key)) {
        toInsert.push({
          match_id: m.match_id,
          team_id: m.away_team_id,
          coach_id: m.away_coach_id,
          role: 'head',
        });
      }
    }
  }

  if (toInsert.length === 0) {
    console.log('누락된 match_coaches 레코드가 없습니다.');
    return;
  }

  console.log(`${toInsert.length}건의 누락된 레코드를 추가합니다...\n`);

  for (const record of toInsert) {
    const coach = await prisma.coach.findUnique({
      where: { coach_id: record.coach_id },
      select: { name: true },
    });
    const team = await prisma.team.findUnique({
      where: { team_id: record.team_id },
      select: { team_name: true },
    });

    // 기존 레코드 삭제 후 재생성 (트리거 함수 인자 문제 우회)
    await prisma.matchCoach.deleteMany({
      where: {
        match_id: record.match_id,
        team_id: record.team_id,
        role: record.role,
      },
    });
    await prisma.matchCoach.create({ data: record });
    console.log(
      `✅ match_id=${record.match_id} | ${team?.team_name} | ${coach?.name}`
    );
  }

  console.log(`\n총 ${toInsert.length}건 추가 완료!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
