'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useMemo } from 'react';

interface PlayerPosition {
  player_id: number;
  player_name: string;
  jersey_number: number;
  profile_image_url?: string | null;
  avg_x: number;
  avg_y: number;
  total_passes: number;
  success_passes: number;
  position?: string;
  participation_status?: string;
  goals?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
  card_type?: 'none' | 'yellow' | 'red_direct' | 'red_accumulated';
}

interface LineupPitchViewProps {
  homePlayers: PlayerPosition[];
  awayPlayers: PlayerPosition[];
  homeSubstitutes?: PlayerPosition[];
  awaySubstitutes?: PlayerPosition[];
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
  homeTeamPrimaryColor?: string;
  homeTeamSecondaryColor?: string;
  awayTeamPrimaryColor?: string;
  awayTeamSecondaryColor?: string;
  homeBestPlayerId?: number | null;
  awayBestPlayerId?: number | null;
  playerRatings?: Map<number, number>;
}

// 포지션별 X 위치 (가로형 피치)
// 홈팀: 왼쪽 하프 (GK=왼쪽 끝, FW=중앙선에서 충분히 떨어짐)
// 원정팀: 오른쪽 하프 (GK=오른쪽 끝, FW=중앙선에서 충분히 떨어짐)
const POSITION_X_HOME: Record<string, number> = {
  GK: 6,
  DF: 18,
  MF: 28,
  FW: 38,
};

const POSITION_X_AWAY: Record<string, number> = {
  GK: 94,
  DF: 82,
  MF: 72,
  FW: 62,
};

// 포메이션 계산 함수 (GK 제외한 필드 플레이어 기준)
const calculateFormation = (players: PlayerPosition[]): string => {
  const positionCounts = {
    DF: 0,
    MF: 0,
    FW: 0,
  };

  players.forEach((player) => {
    const pos = player.position || 'MF';
    if (pos === 'DF') positionCounts.DF++;
    else if (pos === 'MF') positionCounts.MF++;
    else if (pos === 'FW') positionCounts.FW++;
  });

  return `${positionCounts.DF}-${positionCounts.MF}-${positionCounts.FW}`;
};

function LineupPitchView({
  homePlayers,
  awayPlayers,
  homeSubstitutes = [],
  awaySubstitutes = [],
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  homeTeamPrimaryColor = '#3b82f6',
  homeTeamSecondaryColor = '#FFFFFF',
  awayTeamPrimaryColor = '#ef4444',
  awayTeamSecondaryColor = '#FFFFFF',
  homeBestPlayerId,
  awayBestPlayerId,
  playerRatings,
}: LineupPitchViewProps) {
  // SVG viewBox 크기 (가로형 + 교체선수 영역)
  const SVG_WIDTH = 100;
  const SVG_HEIGHT = 82; // 피치 70 + 교체선수 영역 12

  // 포메이션 계산
  const homeFormation = useMemo(
    () => calculateFormation(homePlayers),
    [homePlayers]
  );
  const awayFormation = useMemo(
    () => calculateFormation(awayPlayers),
    [awayPlayers]
  );

  // 선수 위치 계산 (X: 포지션 기반, Y: 일정한 위치에 균등 배치, 좌우 순서만 패스맵 avg_y 기준)
  const adjustPlayerPositions = (
    players: PlayerPosition[],
    isHomeTeam: boolean
  ) => {
    if (players.length === 0) return [];

    const positionX = isHomeTeam ? POSITION_X_HOME : POSITION_X_AWAY;

    // 포지션별로 선수 그룹화
    const playersByPosition: Record<string, PlayerPosition[]> = {
      GK: [],
      DF: [],
      MF: [],
      FW: [],
    };

    players.forEach((player) => {
      const pos = player.position || 'MF';
      if (playersByPosition[pos]) {
        playersByPosition[pos].push(player);
      } else {
        playersByPosition['MF'].push(player);
      }
    });

    const result: (PlayerPosition & {
      display_x: number;
      display_y: number;
    })[] = [];

    // 피치 Y 범위 (상단 6 ~ 하단 64로 확장)
    const pitchTop = 6;
    const pitchBottom = 64;
    const pitchCenter = 35;

    // 각 포지션별로 일정한 Y 위치에 균등 배치
    Object.entries(playersByPosition).forEach(([pos, posPlayers]) => {
      if (posPlayers.length === 0) return;

      // 패스맵 avg_y 기준으로 좌우 순서 정렬
      const sortedPlayers = [...posPlayers].sort((a, b) => a.avg_y - b.avg_y);
      const x = positionX[pos] || positionX['MF'];
      const playerCount = sortedPlayers.length;

      sortedPlayers.forEach((player, index) => {
        let y: number;

        if (playerCount === 1) {
          // 1명일 때 포지션별로 다른 Y 위치에 배치하여 겹침 방지
          // MF와 FW가 둘 다 1명이면 겹치므로 서로 다른 위치에 배치
          if (pos === 'FW') {
            y = pitchCenter - 8; // 공격수는 약간 위쪽
          } else if (pos === 'MF') {
            y = pitchCenter + 8; // 미드필더는 약간 아래쪽
          } else {
            y = pitchCenter; // GK, DF는 중앙
          }
        } else if (playerCount === 2) {
          // 2명이면 위아래로 충분히 떨어뜨림
          const positions = [pitchTop + 12, pitchBottom - 12];
          y = positions[index];
        } else {
          // 3명 이상이면 균등하게 분산 배치
          const spacing = (pitchBottom - pitchTop) / (playerCount + 1);
          y = pitchTop + spacing * (index + 1);
        }

        result.push({
          ...player,
          display_x: x,
          display_y: y,
        });
      });
    });

    return result;
  };

  const adjustedHomePlayers = useMemo(
    () => adjustPlayerPositions(homePlayers, true),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [homePlayers]
  );

  const adjustedAwayPlayers = useMemo(
    () => adjustPlayerPositions(awayPlayers, false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [awayPlayers]
  );

  // 선수 노드 렌더링 (큰 원형 프로필 + 등번호와 이름)
  const renderPlayer = (
    player: PlayerPosition & { display_x: number; display_y: number },
    primaryColor: string,
    secondaryColor: string,
    imageSize: number = 9,
    isBestPlayer: boolean = false
  ) => {
    const x = player.display_x;
    const y = player.display_y;
    const hasProfileImage = !!player.profile_image_url;

    return (
      <g key={player.player_id}>
        <Link href={`/players/${player.player_id}`}>
          <defs>
            <clipPath id={`clip-player-${player.player_id}`}>
              <circle cx={x} cy={y} r={imageSize / 2} />
            </clipPath>
          </defs>

          {hasProfileImage ? (
            <>
              <foreignObject
                x={x - imageSize / 2}
                y={y - imageSize / 2}
                width={imageSize}
                height={imageSize}
                className="cursor-pointer"
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={player.profile_image_url!}
                    alt={player.player_name}
                    width={36}
                    height={36}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'top',
                    }}
                  />
                </div>
              </foreignObject>
            </>
          ) : (
            <>
              <circle
                cx={x}
                cy={y}
                r={imageSize / 2}
                fill={primaryColor}
                className="cursor-pointer"
              />
              <text
                x={x}
                y={y + 1.2}
                fill={secondaryColor}
                fontSize={imageSize < 7 ? '2.5' : '4'}
                textAnchor="middle"
                fontWeight="bold"
                className="cursor-pointer"
              >
                {player.jersey_number}
              </text>
            </>
          )}

          {/* 골, 어시스트, 카드 아이콘 (프로필 이미지 오른쪽 하단) */}
          {renderPlayerStats(player, x, y, imageSize)}

          {/* 평점 배지 (프로필 이미지 오른쪽 상단) - 평점이 있으면 표시, 없으면 MVP 아이콘 */}
          {(() => {
            const rating = playerRatings?.get(player.player_id);
            const radius = imageSize / 2;
            const badgeX = x + radius * 0.9;
            const badgeY = y - radius * 0.9;

            if (rating && rating > 0) {
              // FotMob 스타일 평점 배지 색상
              const bgColor =
                rating >= 9.0
                  ? '#14A0FF'
                  : rating >= 7.0
                    ? '#33C771'
                    : '#FF963F';
              const textColor = '#ffffff';
              const badgeWidth = isBestPlayer
                ? imageSize < 7
                  ? 6.5
                  : 9
                : imageSize < 7
                  ? 5
                  : 7;
              const badgeHeight = imageSize < 7 ? 2.8 : 3.5;
              const fontSize = imageSize < 7 ? '2' : '2.5';
              const starScale = imageSize < 7 ? 0.15 : 0.2;
              const starOffsetX = imageSize < 7 ? 1.2 : 1.6;

              return (
                <g>
                  <rect
                    x={badgeX - badgeWidth / 2}
                    y={badgeY - badgeHeight / 2}
                    width={badgeWidth}
                    height={badgeHeight}
                    rx={badgeHeight / 2}
                    fill={bgColor}
                  />
                  <text
                    x={isBestPlayer ? badgeX - starOffsetX / 2 : badgeX}
                    y={badgeY + (imageSize < 7 ? 0.8 : 1)}
                    fill={textColor}
                    fontSize={fontSize}
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {rating.toFixed(1)}
                  </text>
                  {isBestPlayer && (
                    <g
                      transform={`translate(${badgeX + starOffsetX}, ${badgeY - badgeHeight * 0.25}) scale(${starScale})`}
                    >
                      <path
                        d="M4.633.453a.5.5 0 01.95 0l.908 2.81a.5.5 0 00.475.345h2.953a.5.5 0 01.294.904L7.824 6.26a.5.5 0 00-.181.559l.908 2.81a.5.5 0 01-.769.559l-2.389-1.748a.5.5 0 00-.588 0L2.416 10.19a.5.5 0 01-.77-.559l.909-2.81a.5.5 0 00-.182-.56L.984 4.513a.5.5 0 01.294-.904h2.953a.5.5 0 00.475-.345L4.633.453z"
                        fill={textColor}
                      />
                    </g>
                  )}
                </g>
              );
            }

            if (isBestPlayer) {
              // MVP 아이콘 (평점이 없을 때만)
              const scale = imageSize < 7 ? 0.12 : 0.16;
              return (
                <g
                  transform={`translate(${badgeX - 1}, ${badgeY - 1}) scale(${scale})`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    overflow="visible"
                  >
                    <circle
                      cx="10"
                      cy="10"
                      r="9"
                      fill="white"
                      stroke="#ff4800"
                      strokeWidth="1.5"
                    />
                    <text
                      x="10"
                      y="14"
                      fill="#ff4800"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ★
                    </text>
                  </svg>
                </g>
              );
            }

            return null;
          })()}

          {/* 등번호 + 선수 이름 (이미지 아래) */}
          <text
            x={x}
            y={y + imageSize / 2 + (imageSize < 7 ? 2 : 3)}
            fill="#333"
            fontSize={imageSize < 7 ? '1.6' : '2.2'}
            textAnchor="middle"
            fontWeight="600"
            className="cursor-pointer"
          >
            {player.jersey_number}.{' '}
            {player.player_name.length > 3
              ? player.player_name.slice(0, 3)
              : player.player_name}
          </text>
        </Link>
      </g>
    );
  };

  // 선수 기록 아이콘 렌더링 (프로필 이미지 주변에 배치 - FotMob 스타일)
  const renderPlayerStats = (
    player: PlayerPosition,
    centerX: number,
    centerY: number,
    imageSize: number
  ) => {
    const stats: { type: string; count: number }[] = [];

    if (player.goals && player.goals > 0) {
      stats.push({ type: 'goal', count: player.goals });
    }
    if (player.assists && player.assists > 0) {
      stats.push({ type: 'assist', count: player.assists });
    }
    if (
      player.card_type === 'yellow' ||
      (player.yellow_cards &&
        player.yellow_cards > 0 &&
        player.card_type !== 'red_accumulated')
    ) {
      stats.push({ type: 'yellow', count: 1 });
    }
    if (
      player.card_type === 'red_direct' ||
      player.card_type === 'red_accumulated' ||
      (player.red_cards && player.red_cards > 0)
    ) {
      stats.push({ type: 'red', count: 1 });
    }

    if (stats.length === 0) return null;

    const iconSize = imageSize < 7 ? 2.2 : 2.8;
    const radius = imageSize / 2;

    // 아이콘 위치 계산 (평점 배지가 오른쪽 상단이므로, 왼쪽과 하단에 배치)
    const positions = [
      { x: centerX - radius * 0.75, y: centerY + radius * 0.75 }, // 왼쪽 하단
      { x: centerX + radius * 0.75, y: centerY + radius * 0.75 }, // 오른쪽 하단
      { x: centerX - radius * 0.75, y: centerY - radius * 0.75 }, // 왼쪽 상단
      { x: centerX + radius * 0.75, y: centerY - radius * 0.75 }, // 오른쪽 상단 (4번째로 밀림)
    ];

    // 교체 선수는 더 작은 스케일 적용
    const isSubstitute = imageSize < 7;
    const scale = isSubstitute ? 0.12 : 0.16;

    return (
      <>
        {stats.map((stat, index) => {
          if (index >= positions.length) return null;
          const pos = positions[index];

          if (stat.type === 'goal') {
            // 축구공 아이콘 (svgrepo soccer ball - 흰색 배경 + 검정 보더)
            return (
              <g
                key={`stat-${player.player_id}-${stat.type}-${index}`}
                transform={`translate(${pos.x - iconSize / 2}, ${pos.y - iconSize / 2}) scale(${scale})`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  overflow="visible"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="9"
                    fill="white"
                    stroke="#333"
                    strokeWidth="1.5"
                  />
                  <g transform="translate(2, 2) scale(0.0168)">
                    <path
                      fill="#333"
                      d="M812.55,139.4c-43.7-43.7-94.6-78-151.3-102C602.55,12.6,540.25,0,475.95,0c-64.2,0.1-126.5,12.6-185.2,37.5c-56.7,24-107.6,58.3-151.3,102c-43.7,43.7-78,94.6-102,151.3c-24.8,58.7-37.4,121-37.4,185.3c0,64.201,12.6,126.6,37.4,185.301c24,56.699,58.3,107.6,102,151.299c43.7,43.701,94.6,78,151.3,102c58.7,24.801,121,37.4,185.3,37.4c64.2,0,126.601-12.6,185.3-37.4c56.7-24,107.601-58.299,151.301-102c43.699-43.699,78-94.6,102-151.299c24.8-58.701,37.399-121,37.399-185.301c0-64.2-12.6-126.6-37.399-185.3C890.55,234,856.25,183.2,812.55,139.4z M212.55,107.5c4.3-3.3,8.5-6.8,12.9-9.9c23.1-16.2,48.7-29.3,74.7-40.2C355.55,34.2,415.75,22,475.95,22c40.1,0,81.2,5.4,119.899,16c-15.3,6.2-34,18-65.399,44.8c-26.101-2.8-52.5-2.9-79-0.4c-34.601,3.3-69.4,11-103.4,23c-30.7,10.8-55,23.1-71.4,32.5c-25.1-9-57.5-19.6-73.5-24.8C205.65,113.9,210.85,108.8,212.55,107.5z M646.15,226.5l-81.4,222.2l-195.3,37.5L208.05,319.5c10.9-75.6,62.7-142.6,62.7-142.6c0.3-0.2,34.1-24.6,88.3-43.5c31.601-11.1,63.8-18.2,95.9-21.2c26.2-2.4,52.3-2,78.1,1.1L646.15,226.5z M39.35,460.2c-5,32.3-6.1,65.8-3.5,99.5c-3.9-7.799-7-14.398-9.3-19.699c-3-20.9-4.5-42.301-4.5-64.1c0-67,14.5-130.7,40.6-188c-2.9,30-1.5,61.1,0.6,84.7C52.05,400.7,44.05,430,39.35,460.2z M78.85,633.301c-4.6-16.9-10-41.5-12.7-71c-3-33.301-2.1-66.4,2.9-98.101c3.8-24.3,9.9-47.899,18.3-70.6c32.9-27.8,76.5-44.1,100.6-51.6L346.35,505.6L329.75,684.9L174.95,736.6C135.55,707.6,103.35,669.199,78.85,633.301z M549.25,892.9c-34.5,22.6-121.7,28-157.1,29.299c-39-7.299-76.9-19.799-112.601-37c-31.2-15-60.8-33.6-87.8-55.398c0.5-0.9-4.2-48.602-4-66l156.4-52.201l180.5,78.1l24.899,102.9C549.35,892.801,549.25,892.9,549.25,892.9z M849.15,734.6C822.25,773.4,790.05,809.5,751.35,836.9c-36.3,25.6-84.899,34.4-128.1,41.5c-3.3,0.5-44.6,7.299-44.9,5.9l-24.899-103L680.55,649l168.3-15.5c2.601,26.801,6,65.9,8,89.801C854.25,727.1,851.75,730.9,849.15,734.6z M851.75,600c-0.6,1-1.2,2.1-1.8,3.301L682.35,618.699L592.15,460.9l81.6-222.7l115.2,7.3c24.5,20.5,46.2,43.3,64.6,67.9c23,30.9,40.9,64.8,53.101,100.7C893.85,525.301,864.35,580.699,851.75,600z M911.85,349.8c-9.899-19.1-21.5-37.5-34.6-55c-20.7-27.7-45.3-53.2-73.2-75.9c-5.1-25.3-19.1-65.1-56.7-106.9c0.7,0.5,1.4,1.1,2.101,1.6c2.3,1.7,4.5,3.5,6.8,5.2c25.9,20.4,49.5,43.5,70.4,68.9c38.8,47.3,68.1,102.2,85.3,161.1C911.85,349.2,911.85,349.5,911.85,349.8z"
                    />
                  </g>
                </svg>
                {stat.count > 1 && (
                  <text
                    x="22"
                    y="14"
                    fill="#333"
                    fontSize="8"
                    fontWeight="bold"
                  >
                    {stat.count}
                  </text>
                )}
              </g>
            );
          } else if (stat.type === 'assist') {
            // 축구화 아이콘 (svgrepo soccer shoe - 흰색 배경 + 검정 보더 + 45도 회전)
            return (
              <g
                key={`stat-${player.player_id}-${stat.type}-${index}`}
                transform={`translate(${pos.x - iconSize / 2}, ${pos.y - iconSize / 2}) scale(${scale})`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  overflow="visible"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="9"
                    fill="white"
                    stroke="#333"
                    strokeWidth="1.5"
                  />
                  <g transform="translate(10, 10) rotate(-45) translate(-8, -8) scale(0.033)">
                    <path
                      fill="#333"
                      d="M432.7,341.222c-4-0.1-8-0.1-12.4-0.1c-6.5,0-12.199,0.1-17.8,0.4l5.7,31.299c0.2,1.301,1.4,2.201,2.7,2.201h27.7c1.3,0,2.399-0.9,2.699-2.201l6.5-31.6c-1.699,0-3.3,0-5,0C439.601,341.321,436.3,341.321,432.7,341.222z"
                    />
                    <path
                      fill="#333"
                      d="M334.3,373.321c0.2,1.301,1.4,2.201,2.7,2.201h27.7c1.3,0,2.4-0.9,2.7-2.201l6.2-30.6c-12.301,0.5-27.601,1-44.5,1.5L334.3,373.321z"
                    />
                    <path
                      fill="#333"
                      d="M119.4,377.622c0.2,1.3,1.4,2.199,2.7,2.199h27.7c1.3,0,2.4-0.899,2.7-2.199l5.8-28.5c-17.5,0.4-32.6,0.699-43.9,0.9L119.4,377.622z"
                    />
                    <path
                      fill="#333"
                      d="M49.8,343.722l6.2,33.9c0.2,1.3,1.4,2.199,2.7,2.199h27.7c1.3,0,2.4-0.899,2.7-2.199l5.7-27.7c-14.8-0.7-30.2-3.601-44.4-8.3C49.9,342.321,49.7,343.022,49.8,343.722z"
                    />
                    <path
                      fill="#333"
                      d="M437.7,145.422c-10.7,0-9.7,32.4-32.5,40.7c-11,4-21.6,5.6-30.9,5.6c-16.6,0-29.3-4.9-34-9.5c-7.399-7.2,59.801-29.9,45.4-49.4l-22-29.5c-1.5-2-3.8-3.1-6.1-3.1c-1.5,0-3,0.5-4.4,1.5l-73.8,54.2c0,0-28.2,0-33.1,16.5c0,0-0.801-0.1-2.201-0.1c-6.1,0-22.699,1.3-27.199,15.2c0,0-69.9,13.8-111.6,36.2c-41.6,22.301-105.3,21-105.3,56.5s56.4,59.2,101.1,59.2c44.7,0,269-6.8,300.4-8.601c6.7-0.399,13-0.5,18.9-0.5c8.399,0,15.899,0.201,22.5,0.201c23.8,0,36.1-3,36.5-30.301c0.6-40.199,5.5-102.4-25.101-141.3C446.4,149.222,441.3,145.422,437.7,145.422z M292.2,302.222h-37c-0.7,0-1.3-0.3-1.8-0.699l-80.3-73.5c-1.6-1.5-0.9-4.1,1.1-4.6l28-7.5c0.9-0.2,1.9,0,2.5,0.6l89.399,81C295.9,299.122,294.7,302.222,292.2,302.222z M366.9,302.122l-39-0.5c-0.7,0-1.3-0.301-1.8-0.7l-99.601-90.3c-1.6-1.5-1-4.1,1.1-4.7l27.9-7.5c0.9-0.2,1.801,0,2.5,0.6l110.8,98.299C370.601,299.022,369.4,302.122,366.9,302.122z"
                    />
                  </g>
                </svg>
                {stat.count > 1 && (
                  <text
                    x="22"
                    y="14"
                    fill="#333"
                    fontSize="8"
                    fontWeight="bold"
                  >
                    {stat.count}
                  </text>
                )}
              </g>
            );
          } else if (stat.type === 'yellow') {
            // 옐로카드 아이콘 (검정 보더)
            return (
              <g
                key={`stat-${player.player_id}-${stat.type}-${index}`}
                transform={`translate(${pos.x - iconSize / 2}, ${pos.y - iconSize / 2}) scale(${scale})`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  overflow="visible"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="9"
                    fill="none"
                    stroke="#333"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="6"
                    y="4"
                    width="8"
                    height="12"
                    rx="1"
                    fill="#FFCC00"
                    stroke="#333"
                    strokeWidth="1"
                  />
                </svg>
              </g>
            );
          } else if (stat.type === 'red') {
            // 레드카드 아이콘 (검정 보더)
            return (
              <g
                key={`stat-${player.player_id}-${stat.type}-${index}`}
                transform={`translate(${pos.x - iconSize / 2}, ${pos.y - iconSize / 2}) scale(${scale})`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  overflow="visible"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="9"
                    fill="none"
                    stroke="#333"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="6"
                    y="4"
                    width="8"
                    height="12"
                    rx="1"
                    fill="#E53935"
                    stroke="#333"
                    strokeWidth="1"
                  />
                </svg>
              </g>
            );
          }
          return null;
        })}
      </>
    );
  };

  // 교체 선수 렌더링 (피치 밖 아래, 중앙 정렬)
  const renderSubstitutes = (
    allSubstitutes: PlayerPosition[],
    homePrimaryColor: string,
    homeSecondaryColor: string,
    awayPrimaryColor: string,
    awaySecondaryColor: string,
    homeSubCount: number
  ) => {
    if (allSubstitutes.length === 0) return null;

    const baseY = 74;
    const spacing = 16;
    const totalWidth = (allSubstitutes.length - 1) * spacing;
    const startX = 50 - totalWidth / 2;

    return allSubstitutes.map((player, index) => {
      const x = startX + index * spacing;
      const displayPlayer = {
        ...player,
        display_x: x,
        display_y: baseY,
      };

      // 홈팀 선수인지 원정팀 선수인지 구분
      const isHomePlayer = index < homeSubCount;
      const primaryColor = isHomePlayer ? homePrimaryColor : awayPrimaryColor;
      const secondaryColor = isHomePlayer
        ? homeSecondaryColor
        : awaySecondaryColor;
      const isBest = isHomePlayer
        ? player.player_id === homeBestPlayerId
        : player.player_id === awayBestPlayerId;

      return renderPlayer(
        displayPlayer,
        primaryColor,
        secondaryColor,
        5,
        isBest
      );
    });
  };

  return (
    <div className="w-full">
      {/* 팀 레이블 (피치 위) - 로고 + 팀명 + 포메이션 */}
      <div className="flex justify-between mb-2 text-xs font-semibold px-2">
        <div className="flex items-center gap-1.5">
          {homeTeamLogo && (
            <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={homeTeamLogo}
                alt={homeTeamName}
                width={20}
                height={20}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <span className="text-gray-900">{homeTeamName}</span>
          <span className="text-gray-500 font-normal">({homeFormation})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-normal">({awayFormation})</span>
          <span className="text-gray-900">{awayTeamName}</span>
          {awayTeamLogo && (
            <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={awayTeamLogo}
                alt={awayTeamName}
                width={20}
                height={20}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* 피치 SVG */}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full border rounded-lg"
        style={{ aspectRatio: '100/90' }}
      >
        {/* 전체 배경 */}
        <rect
          x="0"
          y="0"
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          fill="#f9fafb"
        />

        {/* 피치 배경 (흰색) */}
        <rect x="2" y="3" width="96" height="64" fill="white" />

        {/* 피치 외곽선 */}
        <rect
          x="2"
          y="3"
          width="96"
          height="64"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="0.3"
        />

        {/* 중앙선 */}
        <line
          x1="50"
          y1="3"
          x2="50"
          y2="67"
          stroke="#d1d5db"
          strokeWidth="0.3"
        />

        {/* 센터 서클 */}
        <circle
          cx="50"
          cy="35"
          r="9"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="0.3"
        />
        <circle cx="50" cy="35" r="0.5" fill="#d1d5db" />

        {/* 왼쪽 페널티 박스 (홈팀) */}
        <rect
          x="2"
          y="18"
          width="14"
          height="34"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="0.3"
        />
        <rect
          x="2"
          y="25"
          width="6"
          height="20"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="0.3"
        />
        <circle cx="12" cy="35" r="0.5" fill="#d1d5db" />
        <rect x="0" y="29" width="2" height="12" fill="#d1d5db" opacity="0.5" />

        {/* 오른쪽 페널티 박스 (원정팀) */}
        <rect
          x="84"
          y="18"
          width="14"
          height="34"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="0.3"
        />
        <rect
          x="92"
          y="25"
          width="6"
          height="20"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="0.3"
        />
        <circle cx="88" cy="35" r="0.5" fill="#d1d5db" />
        <rect
          x="98"
          y="29"
          width="2"
          height="12"
          fill="#d1d5db"
          opacity="0.5"
        />

        {/* 홈팀 선수들 (왼쪽 하프) */}
        {adjustedHomePlayers.map((player) =>
          renderPlayer(
            player,
            homeTeamPrimaryColor,
            homeTeamSecondaryColor,
            9,
            player.player_id === homeBestPlayerId
          )
        )}

        {/* 원정팀 선수들 (오른쪽 하프) */}
        {adjustedAwayPlayers.map((player) =>
          renderPlayer(
            player,
            awayTeamPrimaryColor,
            awayTeamSecondaryColor,
            9,
            player.player_id === awayBestPlayerId
          )
        )}

        {/* 교체 선수들 (중앙 정렬) */}
        {renderSubstitutes(
          [...homeSubstitutes, ...awaySubstitutes],
          homeTeamPrimaryColor,
          homeTeamSecondaryColor,
          awayTeamPrimaryColor,
          awayTeamSecondaryColor,
          homeSubstitutes.length
        )}
      </svg>

      {/* 안내 문구 */}
      <p className="text-[10px] text-gray-400 mt-2 text-center">
        * 선수 위치는 경기 중 평균 위치 기반입니다
      </p>
    </div>
  );
}

export default LineupPitchView;
