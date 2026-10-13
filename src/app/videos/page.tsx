import type { Metadata } from 'next';

import { Container, H1, Section } from '@/components/ui';
import { ChannelVideosList } from '@/features/channel-videos';
import { YOUTUBE_CHANNEL_NAME, YOUTUBE_CHANNEL_URL } from '@/lib/youtube';

const description =
  '골때녀 데이터센터가 만드는 유튜브 채널 골때녀 기록실의 경기 프리뷰 영상과 쇼츠. 맞대결·선수 기록을 데이터로 미리 봅니다.';

export const metadata: Metadata = {
  title: '골때녀 기록실 영상',
  description,
  alternates: { canonical: '/videos' },
  openGraph: {
    title: '골때녀 기록실 영상 | 골때녀 데이터센터',
    description,
    url: 'https://www.gtndatacenter.com/videos',
  },
};

// 영상 목록은 클라이언트에서 /api/channel-videos 로 읽는다 — DB 행만 바꾸면 배포 없이 반영
export default function VideosPage() {
  return (
    <Container className="py-8">
      <Section>
        <H1>골때녀 기록실 영상</H1>
        <p className="mt-2 text-sm text-gray-600">
          유튜브 채널{' '}
          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#ff4800] hover:underline"
          >
            {YOUTUBE_CHANNEL_NAME}
          </a>
          의 경기 프리뷰와 쇼츠입니다. 방송 화면 없이 기록과 그래픽으로
          만듭니다.
        </p>
        <ChannelVideosList />
      </Section>
    </Container>
  );
}
