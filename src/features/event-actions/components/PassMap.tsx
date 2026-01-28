'use client';

import Image from 'next/image';
import React, { useMemo } from 'react';

import { PITCH_HEIGHT, PITCH_WIDTH } from '../constants';

interface PlayerPosition {
  player_id: number;
  player_name: string;
  jersey_number: number;
  profile_image_url?: string | null;
  avg_x: number;
  avg_y: number;
  total_passes: number;
  success_passes: number;
}

interface PassConnection {
  from_jersey: number;
  to_jersey: number;
  count: number;
}

interface PassMapProps {
  players: PlayerPosition[];
  connections: PassConnection[];
  teamId: number;
  teamName: string;
  totalPasses: number;
  successPasses: number;
  primaryColor?: string;
  secondaryColor?: string;
  isHomeTeam?: boolean; // 홈팀 여부 (원정팀은 좌우 반전)
}

// 구척장신 팀 ID (흰색 유니폼 팀)
const GUCHUKJANGSHIN_TEAM_ID = 20;

export function PassMap({
  players,
  connections,
  teamId,
  teamName,
  totalPasses,
  successPasses,
  primaryColor = '#3b82f6',
  secondaryColor = '#FFFFFF',
  isHomeTeam = true,
}: PassMapProps) {
  // 구척장신만 색상 교체 (흰색 유니폼이라 패스맵에서 안 보임)
  const isGuchukjangshin = teamId === GUCHUKJANGSHIN_TEAM_ID;
  const usePrimary = isGuchukjangshin ? secondaryColor : primaryColor;
  const useSecondary = isGuchukjangshin ? primaryColor : secondaryColor;

  // SVG viewBox 크기 (정사각형 50x50)
  const SVG_WIDTH = 50;
  const SVG_HEIGHT = 50;

  // 피치 좌표를 SVG 좌표로 변환 (90도 회전: 피치 x→SVG y, 피치 y→SVG x)
  // 피치 비율(40:20 = 2:1)을 정사각형(1:1)에 맞게 조정
  // 데이터 기준: 홈팀 왼쪽(x=0, 자기 진영/골키퍼), 원정팀 오른쪽(x=40, 자기 진영/골키퍼)
  // 세로형 피치에서: 두 팀 모두 아래→위 공격 (골대가 아래, 골키퍼가 아래)
  const toSvgX = (y: number) => {
    // 피치 y(0-20)를 SVG x(0-50)로 변환
    // 홈팀: y 그대로 (좌우 유지)
    // 원정팀: y 반전 (좌우 반전)
    const normalizedY = isHomeTeam ? y : PITCH_HEIGHT - y;
    return (normalizedY / PITCH_HEIGHT) * SVG_WIDTH;
  };
  const toSvgY = (x: number) => {
    // 피치 x(0-40)를 SVG y(0-50)로 변환 (압축됨)
    // 홈팀: x가 작을수록 아래로 (골키퍼 x≈0 → 아래, 반전 필요)
    // 원정팀: x가 클수록 아래로 (골키퍼 x≈40 → 아래, 그대로)
    const normalizedX = isHomeTeam ? PITCH_WIDTH - x : x;
    // 골키퍼 때문에 전체가 밑으로 치우치므로 약간 위로 보정 (0.85 비율)
    return (normalizedX / PITCH_WIDTH) * SVG_HEIGHT * 0.85 + 2;
  };

  // 선수 위치를 중심에서 바깥으로 퍼지도록 보정 + 겹침 방지
  const adjustedPlayers = useMemo(() => {
    if (players.length === 0) return [];

    // 피치 중심점 (전체 피치 기준)
    const centerX = PITCH_WIDTH / 2; // 20
    const centerY = PITCH_HEIGHT / 2; // 10

    // 보정 강도 (1.0 = 원래 위치, 값이 클수록 더 퍼짐)
    const spreadFactor = 1.5;

    // 1단계: 중심에서 퍼지도록 보정
    const spreadPlayers = players.map((player) => {
      const deltaX = player.avg_x - centerX;
      const deltaY = player.avg_y - centerY;
      let adjustedX = centerX + deltaX * spreadFactor;
      let adjustedY = centerY + deltaY * spreadFactor;

      // 피치 경계 내로 제한
      const margin = 2;
      adjustedX = Math.max(margin, Math.min(PITCH_WIDTH - margin, adjustedX));
      adjustedY = Math.max(margin, Math.min(PITCH_HEIGHT - margin, adjustedY));

      return { ...player, display_x: adjustedX, display_y: adjustedY };
    });

    // 2단계: 겹치는 선수들 위치 보정
    const minDistance = 3; // 최소 거리 (피치 좌표 기준)
    for (let i = 0; i < spreadPlayers.length; i++) {
      for (let j = i + 1; j < spreadPlayers.length; j++) {
        const p1 = spreadPlayers[i];
        const p2 = spreadPlayers[j];
        const dx = p2.display_x - p1.display_x;
        const dy = p2.display_y - p1.display_y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance && distance > 0) {
          // 겹치면 서로 반대 방향으로 밀어냄
          const overlap = (minDistance - distance) / 2;
          const angle = Math.atan2(dy, dx);
          p1.display_x -= Math.cos(angle) * overlap;
          p1.display_y -= Math.sin(angle) * overlap;
          p2.display_x += Math.cos(angle) * overlap;
          p2.display_y += Math.sin(angle) * overlap;
        } else if (distance === 0) {
          // 완전히 겹치면 약간 오프셋
          p2.display_x += 1.5;
          p2.display_y += 1;
        }
      }
    }

    return spreadPlayers;
  }, [players]);

  // 선수 위치를 등번호로 빠르게 찾기 위한 맵 (보정된 위치 포함)
  const playerPositionMap = useMemo(() => {
    const map = new Map<
      number,
      PlayerPosition & { display_x: number; display_y: number }
    >();
    adjustedPlayers.forEach((p) => map.set(p.jersey_number, p));
    return map;
  }, [adjustedPlayers]);

  // 최대 연결 횟수 (선 두께 계산용)
  const maxConnectionCount = useMemo(() => {
    return Math.max(...connections.map((c) => c.count), 1);
  }, [connections]);

  // 성공률 계산
  const successRate =
    totalPasses > 0 ? ((successPasses / totalPasses) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          {teamName} 패스 네트워크
        </h3>
        <div className="text-xs text-gray-500">
          패스 {totalPasses}회 (성공 {successPasses}) - {successRate}%
        </div>
      </div>

      {/* 피치 뷰 (반코트 배경 + 전체 피치 데이터 압축, 90도 회전하여 골대가 아래로) */}
      <div className="relative w-full">
        <svg
          viewBox="0 0 50 50"
          className="w-full border rounded-lg"
          style={{ aspectRatio: '1/1' }}
        >
          {/* 피치 배경 */}
          <rect x="0" y="0" width="50" height="50" fill="white" />

          {/* 피치 외곽선 (반코트) */}
          <rect
            x="1"
            y="1"
            width="48"
            height="48"
            fill="none"
            stroke="#333"
            strokeWidth="0.3"
          />

          {/* 하프라인 (위쪽 경계) */}
          <line x1="1" y1="1" x2="49" y2="1" stroke="#333" strokeWidth="0.3" />

          {/* 센터 서클 (반원만, 위쪽) */}
          <path
            d="M 17 1 A 8 8 0 0 0 33 1"
            fill="none"
            stroke="#333"
            strokeWidth="0.3"
          />
          <circle cx="25" cy="1" r="0.5" fill="#333" />

          {/* 페널티 박스 (아래쪽) */}
          <rect
            x="13"
            y="35"
            width="24"
            height="14"
            fill="none"
            stroke="#333"
            strokeWidth="0.3"
          />
          {/* 골 에어리어 */}
          <rect
            x="19"
            y="43"
            width="12"
            height="6"
            fill="none"
            stroke="#333"
            strokeWidth="0.3"
          />
          {/* 페널티 스팟 */}
          <circle cx="25" cy="38" r="0.5" fill="#333" />
          {/* 골대 */}
          <rect x="21" y="49" width="8" height="1" fill="#333" opacity="0.5" />

          {/* 패스 연결선 (선수 간 패스) */}
          {connections.map((connection, index) => {
            const fromPlayer = playerPositionMap.get(connection.from_jersey);
            const toPlayer = playerPositionMap.get(connection.to_jersey);

            if (!fromPlayer || !toPlayer) return null;

            // 선 두께: 최소 0.3, 최대 2.5 (패스 횟수에 비례)
            const strokeWidth =
              0.3 + (connection.count / maxConnectionCount) * 2.2;
            // 투명도: 패스 횟수가 많을수록 진하게
            const opacity = 0.3 + (connection.count / maxConnectionCount) * 0.5;

            return (
              <line
                key={`connection-${index}`}
                x1={toSvgX(fromPlayer.display_y)}
                y1={toSvgY(fromPlayer.display_x)}
                x2={toSvgX(toPlayer.display_y)}
                y2={toSvgY(toPlayer.display_x)}
                stroke={usePrimary}
                strokeWidth={strokeWidth}
                opacity={opacity}
                strokeLinecap="round"
              />
            );
          })}

          {/* 선수 평균 위치 (원) */}
          {adjustedPlayers.map((player) => {
            // 원 크기: 패스 시도 횟수에 비례 (최소 2, 최대 4)
            const maxPasses = Math.max(
              ...players.map((p) => p.total_passes),
              1
            );
            const radius = 2 + (player.total_passes / maxPasses) * 2;

            return (
              <g key={player.jersey_number}>
                {/* 외곽 원 (primary로 채우고 secondary로 테두리) */}
                <circle
                  cx={toSvgX(player.display_y)}
                  cy={toSvgY(player.display_x)}
                  r={radius}
                  fill={usePrimary}
                  fillOpacity={0.9}
                  stroke={useSecondary}
                  strokeWidth="0.6"
                />
                {/* 등번호 (secondary 색상) */}
                <text
                  x={toSvgX(player.display_y)}
                  y={toSvgY(player.display_x) + 0.8}
                  fill={useSecondary}
                  fontSize="2.2"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {player.jersey_number}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 선수별 패스 통계 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                선수
              </th>
              <th className="px-2 py-2 text-center font-medium text-gray-700 whitespace-nowrap">
                패스
              </th>
              <th className="px-2 py-2 text-center font-medium text-gray-700 whitespace-nowrap">
                성공
              </th>
              <th className="px-2 py-2 text-center font-medium text-gray-700 whitespace-nowrap">
                성공률
              </th>
            </tr>
          </thead>
          <tbody>
            {players
              .filter((p) => p.total_passes > 0)
              .sort((a, b) => b.total_passes - a.total_passes)
              .map((player) => {
                const rate =
                  player.total_passes > 0
                    ? (
                        (player.success_passes / player.total_passes) *
                        100
                      ).toFixed(0)
                    : 0;
                return (
                  <tr
                    key={player.jersey_number}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-2 sm:px-3 py-2">
                      <div className="flex items-center gap-1 sm:gap-2">
                        {player.profile_image_url ? (
                          <span className="relative h-6 w-6 overflow-hidden rounded-full flex-shrink-0 hidden sm:block">
                            <Image
                              src={player.profile_image_url}
                              alt="선수 이미지"
                              fill
                              sizes="24px"
                              className="object-cover"
                            />
                          </span>
                        ) : (
                          <span className="hidden sm:inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-700 flex-shrink-0">
                            {(player.player_name ?? '-').charAt(0)}
                          </span>
                        )}
                        <span className="text-gray-400 text-xs">
                          {player.jersey_number}
                        </span>
                        <span className="text-xs sm:text-sm font-medium truncate max-w-[100px]">
                          {player.player_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center tabular-nums">
                      {player.total_passes}
                    </td>
                    <td className="px-2 py-2 text-center tabular-nums text-green-600">
                      {player.success_passes}
                    </td>
                    <td className="px-2 py-2 text-center tabular-nums">
                      {rate}%
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* 주요 패스 연결 */}
      {connections.length > 0 && (
        <div className="text-xs">
          <h4 className="font-medium text-gray-600 mb-1">주요 패스 연결</h4>
          <div className="flex flex-wrap gap-2">
            {connections
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
              .map((conn, index) => {
                const fromPlayer = playerPositionMap.get(conn.from_jersey);
                const toPlayer = playerPositionMap.get(conn.to_jersey);
                return (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 rounded text-gray-700"
                  >
                    {fromPlayer?.jersey_number ?? conn.from_jersey} →{' '}
                    {toPlayer?.jersey_number ?? conn.to_jersey}:{' '}
                    <span className="font-medium">{conn.count}회</span>
                  </span>
                );
              })}
          </div>
        </div>
      )}

      {/* 안내 문구 */}
      <p className="text-[10px] text-gray-400 mt-2">
        * 이 데이터는 SPADL 이벤트 시퀀스 기반으로 집계되어 기존 상세 통계와
        다를 수 있습니다.
      </p>
    </div>
  );
}
