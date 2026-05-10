# ⚽ 골 크러시 데이터 센터 (Goal Crush Data Center)

[![Live Site](https://img.shields.io/badge/🏆-골때리는%20그녀들%20데이터센터-ff4800?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTUuMDkgOC4yNkwyMiA5TDE3IDEzLjc0TDE4LjE4IDIyTDEyIDE4LjM1TDUuODIgMjJMNyAxMy43NEwyIDlMOC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K)](https://www.gtndatacenter.com/)
[![Storybook](https://img.shields.io/badge/🎨-디자인%20시스템-ff6900?style=for-the-badge&logo=storybook&logoColor=white)](https://storybook.gtndatacenter.com/)

SBS 예능 프로그램 '골때리는 그녀들'의 경기 데이터와 선수 통계를 관리하고 시각화하는 웹 애플리케이션입니다.

> **🌐 서비스 주소**: [https://www.gtndatacenter.com/](https://www.gtndatacenter.com/) (비공식 팬 아카이브)

## ✨ 프로젝트 소개

이 프로젝트는 '골때리는 그녀들' 방송 내용을 기반으로, 각 시즌의 경기 결과, 선수 정보, 팀 기록 등 파편화된 데이터를 한곳에 모아 체계적으로 관리하고 분석하기 위해 시작되었습니다. 데이터에 기반한 다양한 통계와 시각화를 제공하여 프로그램을 더 깊이 있게 즐길 수 있도록 돕는 것을 목표로 하는 프로젝트입니다.

### 🏆 골때리는 그녀들 비공식 팬 데이터센터

현재 **[골때리는 그녀들 데이터센터](https://www.gtndatacenter.com/)**로 운영 중인 팬 아카이브 사이트입니다. SBS 및 제작진과는 무관하게 팬이 자체 운영합니다.

**주요 서비스:**

- 📺 **방송 데이터 정리**: 매주 "골 때리는 그녀들" 방영 경기의 상세 데이터를 수집하여 업데이트
- 📊 **체계적 데이터**: 선수별 포지션, 득점, 어시스트부터 팀별 전적까지 모든 데이터를 구조화하여 관리
- ⭐ **선수 평점 시스템**: 스탯 기반 평점과 xT(Expected Threat) 기반 평점 두 가지 평점 체계 제공
- 🏅 **선수 순위**: 시즌별 득점, 도움, 평점, 통산 기록 등 다양한 순위 제공
- 📅 **다가오는 경기**: 곧 펼쳐질 흥미진진한 경기 일정 제공
- 🌐 **다국어 지원**: 한국어/영어 페이지 제공

## 🚀 주요 기능

### 시즌 & 경기

- **🏆 시즌별 기록**: 시즌별 순위표, 전체 경기 결과와 상세 스코어 조회
- **⚽ 경기 상세**: 경기별 라인업, 골·어시스트·교체 타임라인, 선수 평점
- **🔄 빠른 업데이트**: 방영된 경기 데이터를 빠르게 수집하여 업데이트

### 선수

- **👩‍⚽ 선수 프로필**: FotMob 스타일의 선수 상세 페이지 — 시즌별 통계, 경기 로그, 패스맵, 개인 특성, 트로피 등
- **🔀 선수 비교**: 두 선수의 스탯을 나란히 비교하는 비교 페이지
- **⭐ 선수 평점**: 스탯 평점과 xT 평점 두 가지 독립적 평점 체계 제공

### 팀 & 감독

- **🛡️ 팀 정보**: 팀 스쿼드, 시즌 성적, 우승 기록을 체계적으로 관리
- **👔 감독 정보**: 역대 감독의 전적, 승률, 우승 기록 비교

### 통계

- **📈 득점 랭킹**: 역대 득점왕, 도움왕, 공격포인트 순위
- **🧤 골키퍼 랭킹**: 골키퍼 선방률, 실점 통계
- **🏅 팀 랭킹**: 팀별 승률, 득실점 통계
- **⚔️ 맞대결 전적**: 팀 간 역대 상대 전적 분석
- **🎯 승부차기 기록**: 승부차기 성공률 통계
- **📊 선발 출전 승률**: 선수별 선발 출전 시 팀 승률 분석
- **👤 선수 vs 팀**: 특정 선수의 팀별 상대 기록

### 커뮤니티

- **💬 팬 게시판**: 인기글, 팀별 게시판
- **🗳️ MVP 투표**: 경기별 MVP 투표
- **🎯 판타지 리그**: 선수를 선택하여 드림팀을 구성하고 다른 팬들과 순위 경쟁

## 🛠️ 기술 스택

| 영역              | 기술                                              |
| ----------------- | ------------------------------------------------- |
| **Frontend**      | Next.js 14 (App Router), React 18, TypeScript     |
| **Styling**       | Tailwind CSS, shadcn-ui (Radix UI)                |
| **Design System** | [Storybook](https://storybook.gtndatacenter.com/) |
| **Backend & DB**  | Supabase (PostgreSQL), Prisma ORM                 |
| **상태 관리**     | TanStack Query (React Query)                      |
| **폼 & 검증**     | React Hook Form, Zod                              |
| **테스트**        | Vitest (Storybook 연동)                           |
| **코드 품질**     | ESLint, Prettier, Knip                            |
| **배포**          | Vercel                                            |
| **패키지 매니저** | pnpm                                              |

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── admin/             # 관리자 대시보드
│   ├── coaches/           # 감독 정보
│   ├── community/         # 커뮤니티 게시판
│   ├── en/                # 영문 페이지
│   ├── fantasy/           # 판타지 리그
│   ├── matches/           # 경기 상세
│   ├── players/           # 선수 프로필
│   ├── ratings/           # 선수 평점
│   ├── seasons/           # 시즌별 데이터
│   ├── stats/             # 통계 분석
│   │   ├── scoring/       # 득점 랭킹
│   │   ├── goalkeepers/   # 골키퍼 랭킹
│   │   ├── teams/         # 팀 랭킹
│   │   ├── head-to-head/  # 맞대결 전적
│   │   ├── player-compare/# 선수 비교
│   │   ├── player-vs-team/# 선수 vs 팀
│   │   ├── penalty-shootout/ # 승부차기
│   │   └── starter-win-rate/ # 선발 승률
│   └── teams/             # 팀 정보
├── features/              # 기능별 모듈
│   ├── admin/             # 관리자 기능
│   ├── coaches/           # 감독 관리
│   ├── community/         # 커뮤니티 기능
│   ├── event-actions/     # 이벤트 액션
│   ├── fantasy/           # 판타지 리그
│   ├── home/              # 홈페이지
│   ├── matches/           # 경기 데이터 및 평점 계산
│   ├── player-ratings/    # 선수 평점 시스템
│   ├── players/           # 선수 관리
│   ├── seasons/           # 시즌 관리
│   ├── stats/             # 통계 계산
│   └── teams/             # 팀 관리
├── components/ui/         # 공유 UI 컴포넌트 (shadcn-ui)
├── design-system/         # 디자인 토큰 및 시스템
├── hooks/                 # React Query 래퍼 등 커스텀 훅
├── lib/                   # 유틸리티 및 설정
├── types/                 # TypeScript 타입 정의
└── constants/             # 상수 정의
```

## 🏁 시작하기

프로젝트를 로컬 환경에서 실행하려면 다음 단계를 따르세요.

### **1. 프로젝트 복제 및 의존성 설치**

```bash
# 저장소 복제 (본인의 계정으로 포크한 주소를 사용하세요)
git clone https://github.com/your-username/goal-crush-data-center.git
cd goal-crush-data-center

# 의존성 설치 (pnpm 사용)
pnpm install
```

### **2. 환경 변수 설정**

프로젝트 루트에 `.env.local` 파일을 생성합니다.

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Prisma Database URL (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### **3. 데이터베이스 설정**

```bash
# Prisma 클라이언트 생성
pnpm db:generate

# 데이터베이스 스키마 동기화
pnpm db:push

# (선택) Prisma Studio로 데이터 확인
pnpm db:studio
```

### **4. 개발 서버 실행**

```bash
# 메인 애플리케이션 실행
pnpm dev

# Storybook 실행 (디자인 시스템)
pnpm storybook
```

- **메인 앱**: `http://localhost:3000`
- **Storybook**: `http://localhost:6006`

## 📜 개발 스크립트

| 명령어                 | 설명                      |
| ---------------------- | ------------------------- |
| `pnpm dev`             | 개발 서버 실행            |
| `pnpm build`           | 프로덕션 빌드             |
| `pnpm start`           | 프로덕션 서버 실행        |
| `pnpm lint`            | ESLint 검사               |
| `pnpm fix`             | ESLint 자동 수정          |
| `pnpm format`          | Prettier 포맷팅           |
| `pnpm format:check`    | Prettier 포맷 검사        |
| `pnpm knip`            | 미사용 코드 검출          |
| `pnpm db:generate`     | Prisma 클라이언트 생성    |
| `pnpm db:push`         | 스키마를 DB에 반영        |
| `pnpm db:migrate`      | 마이그레이션 생성 및 적용 |
| `pnpm db:studio`       | Prisma Studio 실행        |
| `pnpm storybook`       | Storybook 실행            |
| `pnpm build-storybook` | Storybook 빌드            |

## ⭐ 평점 시스템

이 프로젝트는 두 가지 독립적인 선수 평점 체계를 제공합니다.

### 스탯 평점

골, 어시스트, 패스, 슈팅, 수비 등 경기 스탯을 기반으로 산출한 평점입니다.

- 포지션별(GK, DF, MF, FW) 차별화된 계산 공식 적용
- 수비수/골키퍼의 수비 기여도를 반영한 공정한 평가

### xT 평점

패스, 드리블, 수비 등 볼 이동의 위협도(Expected Threat)를 기반으로 산출한 평점입니다.

- 포지션별 가중치 적용 (수비수는 수비 xT 비중 높음, 공격수는 공격 xT 비중 높음)
- 포지션 그룹별 정규화로 포지션 간 공정한 비교

## 🌐 배포

### 프로덕션 환경

- **🏆 서비스 사이트**: [https://www.gtndatacenter.com/](https://www.gtndatacenter.com/) (비공식 팬 아카이브)
- **🎨 디자인 시스템**: [https://storybook.gtndatacenter.com/](https://storybook.gtndatacenter.com/)

### 배포 플랫폼

- **호스팅**: Vercel
- **CDN**: Vercel Edge Network
- **SSL**: 자동 SSL 인증서

## 📝 라이선스 & 고지사항

이 프로젝트는 SBS 예능 프로그램 "골때리는 그녀들"의 팬 사이트로, **공식 사이트가 아닙니다**.

- 모든 경기 데이터와 선수 정보는 공개된 방송 내용을 기반으로 수집되었습니다.
- 상업적 목적이 아닌 팬 커뮤니티를 위한 비영리 프로젝트입니다.
- 저작권과 관련된 문제가 있을 경우 즉시 수정하겠습니다.

## 🤝 기여하기

프로젝트에 기여하고 싶으시다면:

1. 이 저장소를 포크합니다
2. 새로운 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📞 문의 및 지원

- **이슈 리포트**: [GitHub Issues](https://github.com/wooder2050/goal-crush-data-center/issues)
- **기능 제안**: [GitHub Discussions](https://github.com/wooder2050/goal-crush-data-center/discussions)

---

**골때리는 그녀들을 사랑하는 모든 팬들을 위해 만들어졌습니다** ⚽💙
