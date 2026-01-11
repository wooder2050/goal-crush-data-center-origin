'use client';

import {
  Calendar,
  Database,
  Eye,
  Lock,
  Mail,
  Phone,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

import { Badge, Button, Card, CardContent, H1, Section } from '@/components/ui';

export default function PrivacyPolicyPage() {
  const lastUpdated = '2024년 12월 26일';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Section padding="sm" className="pt-16 pb-12">
        <div className="text-center mb-12">
          <Badge variant="emphasisOutline" className="w-fit mb-6 text-sm">
            🔒 Privacy Policy
          </Badge>
          <H1 className="mb-6 text-4xl sm:text-6xl font-bold leading-tight">
            개인정보
            <br />
            <span className="text-[#ff4800]/80">처리방침</span>
          </H1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            골크러쉬 데이터센터는 사용자의 개인정보를 소중히 여기며, 관련 법령에
            따라 개인정보를 보호하고 있습니다.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>최종 업데이트: {lastUpdated}</span>
          </div>
        </div>
      </Section>

      {/* 정책 내용 */}
      <Section padding="sm" className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 제1조 개인정보의 처리목적 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-[#ff4800] flex items-center gap-3">
                <Database className="h-7 w-7" />
                제1조. 개인정보의 처리목적
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  골크러쉬 데이터센터는 다음의 목적을 위하여 개인정보를 처리하고
                  있으며, 다음의 목적 이외의 용도로는 이용하지 않습니다.
                </p>
                <ul className="space-y-2 pl-6">
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-2 h-2 bg-[#ff4800] rounded-full mt-2 flex-shrink-0"></span>
                    <span>
                      회원가입 및 관리: 회원 식별, 서비스 이용의사 확인
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-2 h-2 bg-[#ff4800] rounded-full mt-2 flex-shrink-0"></span>
                    <span>
                      서비스 제공: 커뮤니티 기능, 선수 평가, 댓글 작성
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-2 h-2 bg-[#ff4800] rounded-full mt-2 flex-shrink-0"></span>
                    <span>서비스 개선: 이용 패턴 분석, 서비스 품질 향상</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-2 h-2 bg-[#ff4800] rounded-full mt-2 flex-shrink-0"></span>
                    <span>
                      마케팅 및 광고: 이벤트 정보 제공, 광고성 정보 전송
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 제2조 처리하는 개인정보의 항목 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-blue-600 flex items-center gap-3">
                <Eye className="h-7 w-7" />
                제2조. 처리하는 개인정보의 항목
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    필수항목 (Supabase 수집)
                  </h3>
                  <ul className="space-y-2 text-gray-700 pl-4">
                    <li>• 이메일 주소 (Supabase 인증)</li>
                    <li>• 닉네임 (서비스 내 표시명)</li>
                    <li>• 가입일시, 최종 로그인 시간</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    자동 수집 정보
                  </h3>
                  <ul className="space-y-2 text-gray-700 pl-4">
                    <li>• IP 주소, 쿠키, 방문기록</li>
                    <li>• 서비스 이용기록, 접속로그</li>
                    <li>• 기기정보 (브라우저, OS 등)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제3조 개인정보의 처리 및 보유기간 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-green-600 flex items-center gap-3">
                <Calendar className="h-7 w-7" />
                제3조. 개인정보의 처리 및 보유기간
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터
                  개인정보를 수집시에 동의받은 개인정보 보유·이용기간 내에서
                  개인정보를 처리·보유합니다.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">보유기간</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• 회원정보: 회원탈퇴 시까지</li>
                    <li>• 서비스 이용기록: 3년</li>
                    <li>• 쿠키: 브라우저 종료 시 또는 로그아웃 시</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제4조 개인정보의 제3자 제공 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-purple-600 flex items-center gap-3">
                <Shield className="h-7 w-7" />
                제4조. 개인정보의 제3자 제공
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  회사는 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법
                  제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게
                  제공합니다.
                </p>
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="font-semibold text-blue-800 mb-2">
                    제3자 제공 현황
                  </p>
                  <p className="text-blue-700 text-sm mb-3">
                    서비스 제공을 위해 다음과 같이 개인정보를 제3자에게 제공하고
                    있습니다.
                  </p>
                  <div className="bg-white rounded-lg p-3">
                    <p className="font-semibold text-blue-800 text-sm">
                      Supabase (사용자 인증)
                    </p>
                    <ul className="text-xs text-blue-700 mt-1 space-y-1">
                      <li>• 제공항목: 이메일, 닉네임, 로그인 기록</li>
                      <li>• 제공목적: 회원가입, 로그인 인증, 사용자 식별</li>
                      <li>• 보유기간: 회원 탈퇴 시까지</li>
                      <li>• 제공받는자: Supabase Inc. (미국)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제5조 개인정보 처리의 위탁 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-orange-600 flex items-center gap-3">
                <Lock className="h-7 w-7" />
                제5조. 개인정보 처리의 위탁
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보
                  처리업무를 위탁하고 있습니다.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                      <h4 className="font-semibold text-blue-800">
                        Supabase Inc. (사용자 인증 및 데이터베이스)
                      </h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>
                          <strong>위탁업무:</strong> 회원가입, 로그인 인증,
                          사용자 데이터 저장
                        </p>
                        <p>
                          <strong>개인정보 항목:</strong> 이메일, 닉네임, 로그인
                          기록, 서비스 이용 기록
                        </p>
                        <p>
                          <strong>보유기간:</strong> 회원 탈퇴 시까지 또는
                          위탁계약 종료시까지
                        </p>
                        <p>
                          <strong>처리국가:</strong> 미국 (SOC 2 Type II, ISO
                          27001 인증)
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                      <h4 className="font-semibold text-green-800">
                        Vercel Inc. (웹사이트 호스팅)
                      </h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>
                          <strong>위탁업무:</strong> 웹사이트 호스팅, CDN 서비스
                        </p>
                        <p>
                          <strong>개인정보 항목:</strong> IP 주소, 접속 로그,
                          쿠키
                        </p>
                        <p>
                          <strong>보유기간:</strong> 서비스 제공 기간 동안
                        </p>
                        <p>
                          <strong>처리국가:</strong> 미국
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
                      <h4 className="font-semibold text-orange-800">
                        Google LLC (웹사이트 분석)
                      </h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>
                          <strong>위탁업무:</strong> 웹사이트 이용 현황 분석
                        </p>
                        <p>
                          <strong>개인정보 항목:</strong> IP 주소(익명화), 방문
                          기록, 기기 정보
                        </p>
                        <p>
                          <strong>보유기간:</strong> 26개월 (Google Analytics
                          정책)
                        </p>
                        <p>
                          <strong>처리국가:</strong> 미국
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500 mt-4">
                  <p className="text-sm text-yellow-800">
                    <strong>해외 전송 관련:</strong> 위 업체들은 모두 적절한
                    보안 조치를 취하고 있으며, 개인정보보호법에 따른 해외 전송
                    요건을 충족합니다. 상세한 보안 정책은 각 업체의
                    개인정보처리방침을 참고하시기 바랍니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제6조 정보주체의 권리·의무 및 행사방법 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-red-600 flex items-center gap-3">
                <Phone className="h-7 w-7" />
                제6조. 정보주체의 권리·의무 및 행사방법
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호
                  관련 권리를 행사할 수 있습니다.
                </p>
                <ul className="space-y-2 pl-6">
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>개인정보 처리현황 통지요구</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>오류 등이 있을 경우 정정·삭제 요구</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>처리정지 요구</span>
                  </li>
                </ul>
                <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500 mt-4">
                  <p className="font-semibold text-red-800 mb-2">
                    권리 행사 방법
                  </p>
                  <p className="text-red-700 text-sm mb-2">
                    개인정보 보호 관련 문의는 아래 연락처로 해주시기 바랍니다.
                  </p>
                  <div className="space-y-1 text-sm text-red-700">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>이메일: privacy@gtndatacenter.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>문의: 커뮤니티 게시판을 통한 문의</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제7조 개인정보 보호책임자 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-[#ff4800] flex items-center gap-3">
                <Shield className="h-7 w-7" />
                제7조. 개인정보 보호책임자
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
                  처리와 관련한 정보주체의 불만처리 및 피해구제를 위하여 아래와
                  같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>
                <div className="bg-[#ff4800]/5 rounded-lg p-6 border border-[#ff4800]/20">
                  <h3 className="font-bold text-[#ff4800] mb-4">
                    개인정보 보호책임자
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>직책:</strong> 운영진
                    </p>
                    <p>
                      <strong>연락처:</strong> 커뮤니티 게시판 문의
                    </p>
                    <p>
                      <strong>이메일:</strong> privacy@gtndatacenter.com
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제8조 개인정보 처리방침 변경 */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-700 flex items-center gap-3">
                <Calendar className="h-7 w-7" />
                제8조. 개인정보 처리방침 변경
              </h2>
              <div className="space-y-4 text-gray-700">
                <p className="leading-relaxed">
                  이 개인정보 처리방침은 {lastUpdated}부터 적용됩니다.
                </p>
                <p className="leading-relaxed">
                  법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및
                  수정이 있을 시에는 변경사항의 시행 7일 전부터 공지사항을
                  통하여 고지할 것입니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* CTA Section */}
      <Section padding="sm" className="py-16 bg-white">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            추가 문의사항이 있으신가요?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            개인정보 보호와 관련하여 궁금한 점이 있으시면 언제든지 문의해주세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/community">
              <Button size="lg" className="px-8 py-4">
                커뮤니티에서 문의하기
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
