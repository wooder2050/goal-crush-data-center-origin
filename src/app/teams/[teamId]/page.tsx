import type { Metadata } from 'next';

import { prisma } from '@/lib/prisma';

import TeamDetailPageContent from './TeamDetailPageContent';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ teamId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { teamId } = await params;
  const id = parseInt(teamId, 10);

  if (isNaN(id)) {
    return {
      title: '팀을 찾을 수 없습니다',
    };
  }

  const team = await prisma.team.findUnique({
    where: { team_id: id },
  });

  if (!team) {
    return {
      title: '팀을 찾을 수 없습니다',
    };
  }

  const teamName = team.team_name;
  const title = `${teamName} - 골때녀 팀 정보`;
  const description = `골 때리는 그녀들 ${teamName}의 선수 명단, 시즌별 성적, 경기 일정 및 결과를 확인하세요.`;

  return {
    title,
    description,
    keywords: [
      teamName,
      `${teamName} 골때녀`,
      `골때녀 ${teamName}`,
      '골때녀 팀',
      '골때리는 그녀들 팀',
      '골 때리는 그녀들 팀 정보',
      '골때녀 팀 정보',
      '골때녀 팀 선수',
      '골때녀 팀 성적',
    ],
    alternates: { canonical: `/teams/${teamId}` },
    openGraph: {
      title,
      description,
      url: `https://www.gtndatacenter.com/teams/${teamId}`,
      images: team.logo
        ? [
            {
              url: team.logo,
              width: 400,
              height: 400,
              alt: `${teamName} 로고`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: team.logo ? [team.logo] : undefined,
    },
  };
}

export default async function Page({ params }: Props) {
  const { teamId } = await params;
  return <TeamDetailPageContent teamId={teamId} />;
}
