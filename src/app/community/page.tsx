import { Container, H1, Section } from '@/components/ui';
import CommunityPageClient from '@/features/community/components/CommunityPageClient';

export default function CommunityPage() {
  return (
    <Section>
      <Container className="max-w-7xl">
        {/* 헤더 - 서버에서 렌더링되어 Googlebot이 볼 수 있음 */}
        <div className="text-center mb-8">
          <H1 className="mb-4">골때녀 커뮤니티</H1>
          <p className="text-lg text-gray-600 mb-6">
            팬들과 함께 축구에 대한 열정을 나누어보세요!
          </p>
        </div>

        <CommunityPageClient />
      </Container>
    </Section>
  );
}
