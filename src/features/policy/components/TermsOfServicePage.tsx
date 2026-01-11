'use client';

import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  FileText,
  Gavel,
  Shield,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

import { Badge, Button, Card, CardContent, H1, Section } from '@/components/ui';

export default function TermsOfServicePage() {
  const lastUpdated = '2024년 12월 26일';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Section padding="sm" className="pt-16 pb-12">
        <div className="text-center mb-12">
          <Badge variant="emphasisOutline" className="w-fit mb-6 text-sm">
            📋 Terms of Service
          </Badge>
          <H1 className="mb-6 text-4xl sm:text-6xl font-bold leading-tight">
            서비스
            <br />
            <span className="text-[#ff4800]/80">이용약관</span>
          </H1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            골크러쉬 데이터센터 서비스를 이용하시기 전에 다음 약관을 반드시
            확인해주시기 바랍니다.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>최종 업데이트: {lastUpdated}</span>
          </div>
        </div>
      </Section>

      {/* 약관 내용 */}
      <Section padding="sm" className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 제1조 목적 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-[#ff4800] flex items-center gap-3">
                <FileText className="h-7 w-7" />
                제1조. 목적
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  이 약관은 골크러쉬 데이터센터(이하 &ldquo;회사&rdquo;)가
                  제공하는 &ldquo;골 때리는 그녀들&rdquo; 관련 데이터
                  서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여 회사와
                  이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을
                  규정함을 목적으로 합니다.
                </p>
                <div className="bg-[#ff4800]/5 rounded-lg p-4 border-l-4 border-[#ff4800]">
                  <p className="text-sm font-medium text-[#ff4800]">
                    본 서비스는 &ldquo;골 때리는 그녀들&rdquo; 방송 관련 축구
                    데이터를 체계적으로 제공하는 정보 서비스입니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제2조 정의 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-blue-600 flex items-center gap-3">
                <CheckCircle className="h-7 w-7" />
                제2조. 정의
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed mb-4">
                  이 약관에서 사용하는 용어의 정의는 다음과 같습니다.
                </p>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">
                      1. &ldquo;서비스&rdquo;
                    </h4>
                    <p className="text-sm">
                      회사가 제공하는 골크러쉬 데이터센터 웹사이트 및 관련
                      서비스 일체
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">
                      2. &ldquo;회원&rdquo;
                    </h4>
                    <p className="text-sm">
                      회사와 서비스 이용계약을 체결하고 이용자 아이디(ID)를
                      부여받은 자
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">
                      3. &ldquo;비회원&rdquo;
                    </h4>
                    <p className="text-sm">
                      회원가입을 하지 않고 회사가 제공하는 서비스를 이용하는 자
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">
                      4. &ldquo;게시물&rdquo;
                    </h4>
                    <p className="text-sm">
                      회원이 서비스에 게시한 문자, 이미지, 영상 등의 모든 정보
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제3조 약관의 효력 및 변경 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-green-600 flex items-center gap-3">
                <Gavel className="h-7 w-7" />
                제3조. 약관의 효력 및 변경
              </h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h4 className="font-semibold mb-2">1. 약관의 효력</h4>
                  <p className="text-sm leading-relaxed">
                    이 약관은 서비스 화면에 게시하거나 기타의 방법으로
                    공지함으로써 효력이 발생합니다.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">2. 약관의 변경</h4>
                  <p className="text-sm leading-relaxed">
                    회사는 관련 법률에 위배되지 않는 범위에서 이 약관을 개정할
                    수 있으며, 개정된 약관은 시행일 7일 전부터 공지합니다.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">3. 회원의 동의</h4>
                  <p className="text-sm leading-relaxed">
                    변경된 약관에 동의하지 않는 회원은 서비스 이용을 중단하고
                    탈퇴할 수 있습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제4조 서비스의 제공 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-purple-600 flex items-center gap-3">
                <Shield className="h-7 w-7" />
                제4조. 서비스의 제공
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  회사는 다음과 같은 서비스를 제공합니다.
                </p>
                <ul className="space-y-2 pl-6">
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>축구 경기 데이터 및 통계 정보 제공</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>선수 및 팀 정보 제공</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>커뮤니티 기능 (게시글, 댓글, 평가 등)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>기타 회사가 정하는 서비스</span>
                  </li>
                </ul>
                <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500 mt-4">
                  <p className="text-sm text-purple-700">
                    <strong>서비스 이용시간:</strong> 연중무휴 24시간 제공을
                    원칙으로 하나, 시스템 점검 등의 사유로 서비스가 일시 중단될
                    수 있습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제5조 회원가입 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-orange-600 flex items-center gap-3">
                <Users className="h-7 w-7" />
                제5조. 회원가입
              </h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h4 className="font-semibold mb-2">1. 가입신청</h4>
                  <p className="text-sm leading-relaxed">
                    서비스 이용을 희망하는 자는 회사가 정한 가입 양식에 따라
                    회원정보를 기입한 후 이 약관에 동의한다는 의사표시를
                    함으로써 회원가입을 신청합니다.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">2. 가입승낙</h4>
                  <p className="text-sm leading-relaxed">
                    회사는 제1항과 같이 회원으로 가입할 것을 신청한 자가 다음 각
                    호에 해당하지 않는 한 회원으로 등록합니다.
                  </p>
                  <ul className="text-sm mt-2 space-y-1 pl-4">
                    <li>• 등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                    <li>• 미성년자가 법정대리인의 동의를 얻지 않은 경우</li>
                    <li>
                      • 기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이
                      있다고 판단되는 경우
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제6조 회원의 의무 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-red-600 flex items-center gap-3">
                <AlertTriangle className="h-7 w-7" />
                제6조. 회원의 의무
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  회원은 다음 행위를 하여서는 안 됩니다.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                    <h4 className="font-semibold text-red-800 mb-2">
                      금지행위
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• 허위 정보 등록</li>
                      <li>• 타인의 정보 도용</li>
                      <li>• 회사의 서비스 정보 변경</li>
                      <li>• 음란, 폭력적 내용 게시</li>
                      <li>• 스팸, 광고성 정보 전송</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                    <h4 className="font-semibold text-yellow-800 mb-2">
                      준수사항
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• 관련 법령 준수</li>
                      <li>• 서비스 이용규칙 준수</li>
                      <li>• 타인의 권리 존중</li>
                      <li>• 커뮤니티 가이드라인 준수</li>
                      <li>• 개인정보 보호</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제7조 서비스 이용제한 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-700 flex items-center gap-3">
                <XCircle className="h-7 w-7" />
                제7조. 서비스 이용제한
              </h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h4 className="font-semibold mb-2">1. 이용제한 사유</h4>
                  <p className="text-sm leading-relaxed mb-2">
                    회사는 회원이 다음 각 호에 해당하는 경우 서비스 이용을
                    제한할 수 있습니다.
                  </p>
                  <ul className="text-sm space-y-1 pl-4">
                    <li>• 이 약관을 위반한 경우</li>
                    <li>• 서비스의 정상적인 운영을 방해한 경우</li>
                    <li>• 타 이용자의 서비스 이용을 현저히 침해한 경우</li>
                    <li>• 관련 법령을 위반한 경우</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">2. 이용제한 절차</h4>
                  <p className="text-sm leading-relaxed">
                    서비스 이용제한 시 사전 통지를 원칙으로 하며, 긴급한 경우
                    사후 통지할 수 있습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제8조 면책조항 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-[#ff4800] flex items-center gap-3">
                <Shield className="h-7 w-7" />
                제8조. 면책조항
              </h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h4 className="font-semibold mb-2">1. 서비스 이용</h4>
                  <p className="text-sm leading-relaxed">
                    회사는 천재지변 또는 이에 준하는 불가항력으로 인하여
                    서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이
                    면제됩니다.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">2. 데이터 정확성</h4>
                  <p className="text-sm leading-relaxed">
                    회사는 서비스에 게재된 정보의 정확성, 신뢰성에 대해 최선을
                    다하나, 이에 대한 법적 책임을 지지 않습니다.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">3. 회원 간 거래</h4>
                  <p className="text-sm leading-relaxed">
                    회사는 회원 간 또는 회원과 제3자 간의 거래에 대해서는 책임을
                    지지 않습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제9조 분쟁해결 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-blue-700 flex items-center gap-3">
                <Gavel className="h-7 w-7" />
                제9조. 분쟁해결
              </h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h4 className="font-semibold mb-2">1. 준거법</h4>
                  <p className="text-sm leading-relaxed">
                    이 약관의 해석 및 회사와 회원 간의 분쟁에 대하여는
                    대한민국의 법을 적용합니다.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">2. 관할법원</h4>
                  <p className="text-sm leading-relaxed">
                    서비스 이용으로 발생한 분쟁에 대한 소송은 민사소송법상의
                    관할법원에 제기합니다.
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="text-sm text-blue-700">
                    <strong>부칙:</strong> 이 약관은 {lastUpdated}부터
                    시행됩니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* CTA Section */}
      <Section padding="sm" className="py-16 bg-white">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            서비스 이용에 문의사항이 있으신가요?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            이용약관과 관련하여 궁금한 점이 있으시면 언제든지 문의해주세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/community">
              <Button size="lg" className="px-8 py-4">
                커뮤니티에서 문의하기
              </Button>
            </Link>
            <Link href="/privacy">
              <Button variant="outline" size="lg" className="px-8 py-4">
                개인정보처리방침 보기
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="px-8 py-4">
                사이트 소개 보기
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
