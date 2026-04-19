import type { Metadata } from 'next';

import { Container, H1, Section } from '@/components/ui';

export const metadata: Metadata = {
  title: '사이트 소개',
  description:
    '골 때리는 그녀들 데이터센터는 SBS 예능 골때녀의 경기 결과, 선수 기록, 팀 순위를 기록하는 비공식 팬 아카이브입니다.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <Container className="py-10">
      <Section>
        <H1>사이트 소개</H1>

        <div className="mt-6 space-y-8 text-gray-700 leading-relaxed max-w-3xl">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              골때녀 데이터센터란?
            </h2>
            <p>
              골 때리는 그녀들 데이터센터(GTN 데이터센터)는 SBS 예능 프로그램
              &ldquo;골 때리는 그녀들&rdquo;의 경기 결과, 선수 기록, 팀 순위를
              체계적으로 기록하고 제공하는 팬 데이터 아카이브입니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              데이터 출처
            </h2>
            <p>
              모든 데이터는 SBS 방송 영상을 기반으로 직접 수집합니다. 경기 결과,
              득점 기록, 선수 교체, 라인업 등의 정보를 매 방송 후
              업데이트합니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              업데이트 원칙
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>방송 종료 후 24시간 이내 경기 기록 반영</li>
              <li>득점, 도움, 교체, 라인업 등 상세 이벤트 기록</li>
              <li>시즌별 순위표 실시간 갱신</li>
              <li>선수 통산 기록 자동 집계</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              비공식 팬사이트 고지
            </h2>
            <p>
              본 사이트는 SBS 및 &ldquo;골 때리는 그녀들&rdquo; 제작진과 무관한
              비공식 팬사이트입니다. 방송 콘텐츠의 저작권은 SBS에 있으며, 본
              사이트는 팬 활동 목적으로 경기 기록 데이터만을 제공합니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">문의</h2>
            <p>
              데이터 오류 제보, 기능 제안, 기타 문의는 아래 이메일로 보내주세요.
            </p>
            <p className="mt-2 font-medium text-gray-900">
              gtndatacenter@gmail.com
            </p>
          </div>
        </div>
      </Section>
    </Container>
  );
}
