'use client';

import { Mail, MessageCircle } from 'lucide-react';

import { Badge, Card, CardContent, H1, Section } from '@/components/ui';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Section padding="sm" className="pt-16 pb-12">
        <div className="text-center mb-12">
          <Badge variant="emphasisOutline" className="w-fit mb-6 text-sm">
            Support
          </Badge>
          <H1 className="mb-6 text-4xl sm:text-6xl font-bold leading-tight">
            고객
            <br />
            <span className="text-[#ff4800]/80">지원/문의</span>
          </H1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            골크러쉬 데이터센터 이용 중 궁금한 점이나 불편한 사항이 있으시면
            아래 방법으로 문의해주세요.
          </p>
        </div>
      </Section>

      {/* 문의 방법 */}
      <Section padding="sm" className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 이메일 문의 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-[#ff4800] flex items-center gap-3">
                <Mail className="h-6 w-6" />
                이메일 문의
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                서비스 이용 중 문제가 발생하거나, 건의사항이 있으시면 아래
                이메일로 문의해주세요. 영업일 기준 48시간 이내에 답변
                드리겠습니다.
              </p>
              <a
                href="mailto:gtndata.official@gmail.com"
                className="inline-flex items-center gap-2 text-lg font-semibold text-[#ff4800] hover:underline"
              >
                <Mail className="h-5 w-5" />
                gtndata.official@gmail.com
              </a>
            </CardContent>
          </Card>

          {/* 문의 유형 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-[#ff4800] flex items-center gap-3">
                <MessageCircle className="h-6 w-6" />
                문의 유형 안내
              </h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#ff4800] shrink-0" />
                  <div>
                    <strong>서비스 이용 문의</strong> - 앱 사용법, 기능 관련
                    질문
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#ff4800] shrink-0" />
                  <div>
                    <strong>계정 관련 문의</strong> - 로그인, 회원가입, 계정
                    삭제 등
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#ff4800] shrink-0" />
                  <div>
                    <strong>데이터 오류 신고</strong> - 경기 기록, 선수 정보 등
                    데이터 오류
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#ff4800] shrink-0" />
                  <div>
                    <strong>버그 및 오류 신고</strong> - 앱 오류, 버그 제보
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#ff4800] shrink-0" />
                  <div>
                    <strong>건의 및 제안</strong> - 새로운 기능 제안, 서비스
                    개선 의견
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  );
}
