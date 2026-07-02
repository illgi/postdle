# 포스트들 (Postdle)

pagedle의 **회원·인증·데이터베이스를 공유**하면서, **postdle 카테고리(`category:'postdle'`) 글 발행**만 담당하는 독립 앱. (geuldle-app 선례를 따름)

## 스택
- **Next.js 15 (App Router) + TypeScript** — 프론트 + BFF 한 레포
- **인증 공유** — `api.pagedle.com/api/v1/members` (가입/로그인/me). pagedle 계정 그대로.
- **콘텐츠 공유** — `api.pagedle.com/api/v1/pages` 에 `category:'postdle'` 로 글 저장/조회. 자체 DB 없음.
- 세션 — pagedle jwtAuthToken 을 httpOnly 쿠키(`postdle_token`)에 보관, 콘텐츠 호출 시 Bearer 전달.

## 빠른 시작
```bash
cp .env.example .env    # PAGEDLE_API, NEXT_PUBLIC_ROOT_DOMAIN
npm install
npm run dev             # http://localhost:3000
```

## 디렉터리
```
src/lib/config.ts     도메인/브랜드/쿠키 도메인 상수
src/lib/http.ts       라우트 핸들러 헬퍼 (ok/fail/handle/HttpError)
src/lib/session.ts    httpOnly 쿠키(postdle_token) get/set/clear
src/lib/pagedle.ts    api.pagedle.com 연동 (members + pages, category=postdle)
src/app/api/auth/*    login / signup / logout / me
src/app/api/posts     GET 목록(memberName) / POST 작성(category=postdle 고정)
src/app/              page(랜딩) / login / compose
```

## 현재 범위 (MVP 스캐폴드)
- ✅ 가입/로그인/로그아웃/me (pagedle 공유 계정)
- ✅ 글 작성(POST /api/posts → category=postdle), 유저 글 목록(GET)
- ⏳ 피드/탐색/글 상세 화면, 온보딩(유저명 설정), 유저 서브도메인 라우팅 — 다음 단계
- ⚠️ **공개 피드**: pagedle 공개 목록 API에 category 필터가 아직 없음 → 백엔드에 `category` 파라미터 추가 권장 (플랜 문서 3장 참고)

## 배포
geuldle-app 과 동일하게 Docker(standalone) → AWS ECS Fargate + Cloudflare(postdle.com). 자체 DB가 없어 RDS/마이그레이션 단계는 불필요.

자세한 설계: `../postdle/POSTDLE-PLAN.md`
