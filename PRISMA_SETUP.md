# Prisma와 Supabase 연결 설정 방법

## 1. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase 연결 정보
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Prisma 데이터베이스 연결 URL (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[your_password]@db.[your_project_ref].supabase.co:5432/postgres?sslmode=require
```

## 2. Supabase에서 DATABASE_URL 가져오기

1. **Supabase Dashboard**에 로그인
2. **Settings** → **Database** 메뉴로 이동
3. **Connection string** 섹션에서 **URI** 탭 선택
4. 표시된 연결 문자열을 복사하고 `[YOUR-PASSWORD]` 부분을 실제 데이터베이스 비밀번호로 변경

## 3. Prisma 클라이언트 생성

터미널에서 다음 명령어를 실행하여 Prisma 클라이언트를 생성하세요:

```bash
# Prisma 클라이언트 생성
pnpm db:generate

# 또는 직접 실행
pnpm prisma generate
```

## 4. 데이터베이스 스키마 동기화 (선택사항)

기존 데이터베이스 스키마를 Prisma 스키마와 동기화하려면:

```bash
# 데이터베이스 스키마를 Prisma 스키마로 내성화
pnpm prisma db pull

# 또는 Prisma 스키마를 데이터베이스에 적용
pnpm prisma db push
```

## 5. 연결 테스트

Prisma 클라이언트가 정상적으로 연결되는지 확인하려면:

```bash
# Prisma Studio 실행하여 데이터베이스 확인
pnpm db:studio

# 또는 직접 실행
pnpm prisma studio
```

## 주의사항

- `.env.local` 파일은 Git에 커밋하지 마세요 (이미 .gitignore에 포함됨)
- 데이터베이스 비밀번호는 안전하게 관리하세요
- 프로덕션 환경에서는 환경변수를 적절히 설정하세요
