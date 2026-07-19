import { ImageResponse } from 'next/og';

import { prisma } from '@/lib/prisma';

export const revalidate = 3600;

export const alt = '골때녀 경기 결과';
export const contentType = 'image/png';
export const size = {
  width: 1200,
  height: 630,
};

function fallbackImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1a1a2e',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '48px',
        }}
      >
        골때녀 데이터센터
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const matchIdNum = parseInt(matchId);
  if (isNaN(matchIdNum)) {
    return fallbackImage();
  }

  const match = await prisma.match.findUnique({
    where: { match_id: matchIdNum },
    include: {
      home_team: true,
      away_team: true,
      season: true,
    },
  });

  if (!match) {
    return fallbackImage();
  }

  const homeTeam = match.home_team?.team_name || '홈팀';
  const awayTeam = match.away_team?.team_name || '원정팀';
  const seasonName = match.season?.season_name || '';
  const hasScore = match.home_score !== null && match.away_score !== null;
  const matchDate = match.match_date
    ? new Date(match.match_date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const homeColor = match.home_team?.primary_color || '#3b82f6';
  const awayColor = match.away_team?.primary_color || '#ef4444';

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* 상단 시즌 & 날짜 */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: '24px' }}>{seasonName}</div>
          <div style={{ color: '#64748b', fontSize: '20px' }}>{matchDate}</div>
        </div>

        {/* 중앙 스코어보드 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '60px',
          }}
        >
          {/* 홈팀 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: homeColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '32px',
                fontWeight: 'bold',
              }}
            >
              {homeTeam.charAt(0)}
            </div>
            <div
              style={{
                color: 'white',
                fontSize: '28px',
                fontWeight: 'bold',
                maxWidth: '250px',
                textAlign: 'center',
              }}
            >
              {homeTeam}
            </div>
          </div>

          {/* 스코어 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            {hasScore ? (
              /* 주의: 스코어는 반드시 String()으로 — satori가 숫자 자식을
                 텍스트로 변환하지 못해 실경기 OG가 전부 500이던 원인 */
              <>
                <div
                  style={{
                    color: 'white',
                    fontSize: '96px',
                    fontWeight: 'bold',
                  }}
                >
                  {String(match.home_score)}
                </div>
                <div
                  style={{
                    color: '#475569',
                    fontSize: '64px',
                    fontWeight: 300,
                  }}
                >
                  :
                </div>
                <div
                  style={{
                    color: 'white',
                    fontSize: '96px',
                    fontWeight: 'bold',
                  }}
                >
                  {String(match.away_score)}
                </div>
              </>
            ) : (
              <div
                style={{
                  color: '#94a3b8',
                  fontSize: '36px',
                }}
              >
                VS
              </div>
            )}
          </div>

          {/* 원정팀 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: awayColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '32px',
                fontWeight: 'bold',
              }}
            >
              {awayTeam.charAt(0)}
            </div>
            <div
              style={{
                color: 'white',
                fontSize: '28px',
                fontWeight: 'bold',
                maxWidth: '250px',
                textAlign: 'center',
              }}
            >
              {awayTeam}
            </div>
          </div>
        </div>

        {/* 하단 브랜딩 */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ color: '#64748b', fontSize: '20px' }}>
            골때녀 데이터센터
          </div>
          <div style={{ color: '#475569', fontSize: '18px' }}>
            gtndatacenter.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
