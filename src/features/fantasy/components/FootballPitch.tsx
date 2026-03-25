'use client';

import { Shield } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FootballPitchProps,
  PlayerPosition,
  PlayerWithPosition,
  Position,
} from '@/types/fantasy';

// 포지션별 위치들 (골때리는 그녀들 5명 구성 - 한 줄씩 배치)
const POSITION_COORDINATES: Record<
  Position,
  Array<{ x: number; y: number; mobile_y?: number }>
> = {
  FW: [
    { x: 50, y: 10, mobile_y: 10 }, // 중앙 공격수 (1명일 때) - 최상단
    { x: 30, y: 10, mobile_y: 10 }, // 좌측 공격수 (2명일 때)
    { x: 70, y: 10, mobile_y: 10 }, // 우측 공격수 (2명일 때)
  ], // 공격수 라인
  MF: [
    { x: 50, y: 35, mobile_y: 32 }, // 중앙 미드필더 (1명일 때)
    { x: 30, y: 35, mobile_y: 32 }, // 좌측 미드필더 (2명일 때)
    { x: 70, y: 35, mobile_y: 32 }, // 우측 미드필더 (2명일 때)
  ], // 미드필더 라인
  DF: [
    { x: 50, y: 60, mobile_y: 60 }, // 중앙 수비수 (1명일 때)
    { x: 30, y: 60, mobile_y: 60 }, // 좌측 수비수 (2명일 때)
    { x: 70, y: 60, mobile_y: 60 }, // 우측 수비수 (2명일 때)
  ], // 수비수 라인
  GK: [{ x: 50, y: 85, mobile_y: 85 }], // 골키퍼 1명 (최하단)
};

// 기본 포메이션 (2-1-1-1: FW 2명 + MF 1명 + DF 1명 + GK 1명)
const DEFAULT_POSITIONS: Omit<PlayerPosition, 'player'>[] = [
  { position: 'FW', x: 30, y: 10 }, // 공격수 1 - 최상단
  { position: 'FW', x: 70, y: 15 }, // 공격수 2
  { position: 'MF', x: 30, y: 35 }, // 미드필더
  { position: 'DF', x: 30, y: 60 }, // 수비수
  { position: 'GK', x: 50, y: 85 }, // 골키퍼 - 최하단
];

// 모바일 기본 포메이션 (세로 간격 확대)
const MOBILE_DEFAULT_POSITIONS: Omit<PlayerPosition, 'player'>[] = [
  { position: 'FW', x: 30, y: 10 }, // 공격수 1 - 최상단
  { position: 'FW', x: 70, y: 10 }, // 공격수 2
  { position: 'MF', x: 30, y: 32 }, // 미드필더
  { position: 'DF', x: 30, y: 60 }, // 수비수
  { position: 'GK', x: 50, y: 85 }, // 골키퍼 - 최하단
];

const POSITION_COLORS = {
  GK: '#FFD700', // 골드 (골키퍼)
  DF: '#4285F4', // 블루 (수비수)
  MF: '#34A853', // 그린 (미드필더)
  FW: '#EA4335', // 레드 (공격수)
};

export default function FootballPitch({
  players,
  onPlayerClick,
  onPositionChange,
  allowPositionChange = false,
  className = '',
}: FootballPitchProps) {
  const [selectedPlayer, setSelectedPlayer] =
    useState<PlayerWithPosition | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm 브레이크포인트
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 포지션별로 선수들을 그룹화하고 배치
  const getPlayerPosition = (player: PlayerWithPosition, index: number) => {
    const assignedPosition =
      player.position || DEFAULT_POSITIONS[index]?.position || 'MF';
    const positionPlayers = players.filter(
      (p) =>
        (p.position || DEFAULT_POSITIONS[players.indexOf(p)]?.position) ===
        assignedPosition
    );
    const playerIndexInPosition = positionPlayers.indexOf(player);

    // 포지션별 좌표 결정 (1명일 때 중앙, 2명일 때 좌우)
    let coords = { x: 50, y: 50 };
    const positionCount = positionPlayers.length;

    // 안전한 좌표 접근을 위한 헬퍼 함수
    const getPositionCoords = (position: Position, coordIndex: number) => {
      const positionCoords = POSITION_COORDINATES[position];
      if (!positionCoords || positionCoords.length === 0) {
        // 기본 포지션이 정의되지 않은 경우 기본값 반환
        return { x: 50, y: 50 };
      }
      const coord = positionCoords[coordIndex] || positionCoords[0];
      return {
        x: coord.x,
        y: isMobile && coord.mobile_y ? coord.mobile_y : coord.y,
      };
    };

    if (assignedPosition === 'GK') {
      coords = getPositionCoords(assignedPosition, 0);
    } else {
      if (positionCount === 1) {
        // 1명일 때는 중앙 (첫 번째 좌표)
        coords = getPositionCoords(assignedPosition, 0);
      } else if (positionCount === 2) {
        // 2명일 때는 좌우 (두 번째, 세 번째 좌표)
        coords = getPositionCoords(assignedPosition, playerIndexInPosition + 1);
      } else {
        // 3명 이상일 때는 인덱스에 따라 배치
        coords = getPositionCoords(assignedPosition, playerIndexInPosition);
      }
    }

    return {
      position: assignedPosition,
      x: coords.x,
      y: coords.y,
    };
  };

  const positionedPlayers = players.slice(0, 5).map((player, index) => ({
    player,
    ...getPlayerPosition(player, index),
  }));

  const handlePlayerClick = (player: PlayerWithPosition) => {
    if (allowPositionChange) {
      setSelectedPlayer(
        selectedPlayer?.player_id === player.player_id ? null : player
      );
    } else {
      onPlayerClick?.(player);
    }
  };

  const handlePositionChange = (newPosition: Position) => {
    if (selectedPlayer && onPositionChange) {
      onPositionChange(selectedPlayer.player_id, newPosition);
      setSelectedPlayer(null);
    }
  };

  return (
    <div
      className={`relative w-full max-w-lg mx-auto px-2 sm:px-0 ${className}`}
    >
      {/* 축구장 배경 */}
      <div
        className="relative w-full rounded-lg shadow-lg overflow-hidden border-2 border-white"
        style={{
          aspectRatio: '3/5', // 더 세로가 긴 직사각형 비율로 조정
          maxHeight: '60vh', // 뷰포트 높이의 60%로 제한
          backgroundColor: '#228B22', // 단순한 잔디 녹색
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              rgba(255,255,255,0.03) 0px,
              rgba(255,255,255,0.03) 1px,
              transparent 1px,
              transparent 8px
            ),
            repeating-linear-gradient(
              0deg,
              rgba(255,255,255,0.02) 0px,
              rgba(255,255,255,0.02) 1px,
              transparent 1px,
              transparent 12px
            )
          `,
        }}
      >
        {/* 축구장 마킹 */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 300 400"
          preserveAspectRatio="none"
        >
          {/* 아웃라인 */}
          <rect
            x="10"
            y="10"
            width="280"
            height="380"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="3"
          />

          {/* 센터 서클 */}
          <circle
            cx="150"
            cy="200"
            r="35"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="3"
          />
          <circle cx="150" cy="200" r="3" fill="rgba(255,255,255,0.9)" />

          {/* 센터 라인 */}
          <line
            x1="10"
            y1="200"
            x2="290"
            y2="200"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="3"
          />

          {/* 페널티 박스 (상단) */}
          <rect
            x="85"
            y="10"
            width="130"
            height="50"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="3"
          />

          {/* 골 박스 (상단) */}
          <rect
            x="120"
            y="10"
            width="60"
            height="18"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="3"
          />

          {/* 골대 (상단) */}
          <rect
            x="135"
            y="10"
            width="30"
            height="3"
            fill="rgba(255,255,255,0.9)"
          />

          {/* 페널티 박스 (하단) */}
          <rect
            x="85"
            y="340"
            width="130"
            height="50"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="3"
          />

          {/* 골 박스 (하단) */}
          <rect
            x="120"
            y="372"
            width="60"
            height="18"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="3"
          />

          {/* 골대 (하단) */}
          <rect
            x="135"
            y="387"
            width="30"
            height="3"
            fill="rgba(255,255,255,0.9)"
          />
        </svg>

        {/* 선수들 배치 */}
        {positionedPlayers.map(({ player, position, x, y }) => (
          <div
            key={player.player_id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              left: `${x}%`,
              top: `${y}%`,
            }}
            onClick={() => handlePlayerClick(player)}
          >
            {/* 선수 아바타 */}
            <div className="relative">
              {/* 포지션 배경 */}
              <div
                className={`w-10 h-12 sm:w-12 sm:h-16 md:w-16 md:h-20 lg:w-18 lg:h-22 rounded-lg border-2 shadow-lg overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl ${
                  selectedPlayer?.player_id === player.player_id
                    ? 'border-yellow-400 ring-2 ring-yellow-400 ring-opacity-50 scale-105'
                    : 'border-white'
                }`}
                style={{ backgroundColor: POSITION_COLORS[position] }}
              >
                {player.profile_image_url ? (
                  <Image
                    src={player.profile_image_url}
                    alt={player.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 40px, (max-width: 768px) 48px, (max-width: 1024px) 64px, 72px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 lg:w-8 lg:h-8" />
                  </div>
                )}
              </div>

              {/* 등번호 */}
              {player.jersey_number != null && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-white text-black text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 flex items-center justify-center shadow-md border border-gray-300">
                  {player.jersey_number}
                </div>
              )}
            </div>

            {/* 선수 이름 */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-0.5 text-white text-xs font-bold text-center whitespace-nowrap bg-black bg-opacity-70 px-1 py-0.5 rounded shadow-lg">
              {player.name}
            </div>

            {/* 포지션 라벨 */}
            <div
              className="absolute -top-2 -left-3 text-xs sm:text-xs font-bold text-white bg-opacity-90 px-0.5 py-0.5 sm:px-1 sm:py-0.5 rounded shadow-lg border border-white border-opacity-30 scale-75 sm:scale-100"
              style={{ backgroundColor: POSITION_COLORS[position] }}
            >
              {position}
            </div>
          </div>
        ))}

        {/* 빈 포지션들 (5명 미만일 때) */}
        {players.length < 5 &&
          (isMobile ? MOBILE_DEFAULT_POSITIONS : DEFAULT_POSITIONS)
            .slice(players.length, 5)
            .map((pos, index) => (
              <div
                key={`empty-${index}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                }}
              >
                <div className="w-10 h-12 sm:w-12 sm:h-16 md:w-16 md:h-20 rounded-lg border-2 border-white border-dashed bg-white bg-opacity-20 flex items-center justify-center shadow-lg">
                  <div
                    className="text-xs font-bold text-white bg-opacity-90 px-1 py-0.5 rounded"
                    style={{ backgroundColor: POSITION_COLORS[pos.position] }}
                  >
                    {pos.position}
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* 포지션 선택 UI */}
      {selectedPlayer && allowPositionChange && (
        <div className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative w-6 h-8 sm:w-8 sm:h-10 rounded-lg overflow-hidden bg-gray-100">
                    {selectedPlayer.profile_image_url ? (
                      <Image
                        src={selectedPlayer.profile_image_url}
                        alt={selectedPlayer.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 24px, 32px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedPlayer.name}</p>
                    <p className="text-sm text-gray-600">포지션 변경</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Select
                    value={selectedPlayer.position || 'MF'}
                    onValueChange={handlePositionChange}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GK">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: POSITION_COLORS.GK }}
                          />
                          <span>골키퍼</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="DF">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: POSITION_COLORS.DF }}
                          />
                          <span>수비수</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="MF">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: POSITION_COLORS.MF }}
                          />
                          <span>미드필더</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="FW">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: POSITION_COLORS.FW }}
                          />
                          <span>공격수</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPlayer(null)}
                  >
                    취소
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
