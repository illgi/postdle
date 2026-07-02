# Postdle — 아키텍처 & 개발 플랜

작성: 2026-07-01 · 방식: **geuldle-app 선례를 따른 독립 앱**

---

## 0. 한 줄 정의
postdle.com = **글/포스트 발행 서비스**. pagedle과 **회원·인증·DB를 공유**하되, **postdle 카테고리(`category:'postdle'`)만 독립된 별도 앱/도메인**으로 분리. UI는 geuldle처럼 새로 만들되 pagedle 디자인을 차용.

## 1. 공유 vs 독립 (범위)
| 항목 | 처리 |
|---|---|
| 회원가입/로그인 | **공유** — `api.pagedle.com/api/v1/members` 호출 (pagedle 계정 그대로) |
| 데이터베이스 | **공유** — 자체 DB 없음. pagedle 백엔드의 `/pages`·`/posts` API 사용 |
| 콘텐츠 스코프 | **독립** — `category:'postdle'` 페이지만 생성/조회 |
| 코드/레포/도메인/배포 | **독립** — `postdle-app` 새 레포, `postdle.com`, 자체 배포 |
| UI/UX | 새로 구현하되 pagedle 디자인 토큰/작성방식 차용 |

> geuldle과 차이: geuldle은 자체 Prisma/PostgreSQL DB를 뒀지만, **postdle은 DB도 공유**라 자체 DB가 없다. 즉 postdle-app은 pagedle 백엔드에 붙는 얇은 프론트+BFF.

## 2. 인증 흐름 (geuldle `src/lib/pagedle.ts` 패턴 그대로)
```
[postdle.com 로그인 폼] → POST /api/auth/login (postdle BFF)
   → pagedle: POST /api/v1/members/authorize {userId:email, userPw}
   → jwtAuthToken 수신 → httpOnly 쿠키(postdle_token, .postdle.com)에 저장
[이후 콘텐츠 호출] → 쿠키의 토큰을 Authorization: Bearer 로 api.pagedle.com 에 전달
```
- 가입: `POST /api/v1/members {userId, userPw}` → 토큰. (이름은 미수집 → 온보딩에서 `update-user-name`)
- 현재 유저: `GET /api/v1/members/me` (Bearer)
- **자체 JWT/bcrypt/Prisma 불필요** (geuldle보다 단순). 쿠키엔 pagedle 토큰을 그대로 보관.
- 크로스도메인 자동 SSO는 하지 않음 — postdle.com에서 같은 계정으로 로그인(계정·백엔드 공유). geuldle과 동일.

## 3. 콘텐츠 모델 매핑 (pagedle 페이지 API)
pagedle에서 "글"은 사용자 메인 페이지 아래의 **하위 페이지(sub-page)** 이고, 각 페이지에 `category` 필드가 있다.
- **글 작성**: `POST /api/v1/pages` — `{ content, type:'MARKDOWN'|'HTML', pageName, upperPageId:<메인페이지>, category:'postdle', completeness }`
- **내 글 목록**: `GET /api/v1/pages/sub-pages?memberName=` → `category==='postdle'` 필터
- **글 상세**: `GET /api/v1/pages/{id}` / 이름으로 `find-by-page-and-member-name`
- **수정/삭제**: `PUT`/`DELETE /api/v1/pages/{id}`
- **검색**: `GET /api/v1/members/main-search?keyword=`
- 요청/응답 타입: pagedle `frontend/src/request/apiType.ts`의 `TPageReq/TPageRes/TSubPageRes` 참조.

### 백엔드 갭 (확인·보완 필요)
- **공개 피드(전 유저 postdle 글)**: 현재 공개 목록 API에 category 필터가 없음. 초기엔 `upload-user-list`/`today-page`를 받아 클라이언트에서 category 필터로 근사 → 이후 백엔드에 `category` 파라미터 추가가 이상적.
- **가입 시 category 귀속**: 페이지 생성 시 category만 넣으면 되므로 회원 자체엔 영향 없음.

## 4. 앱 구조 (geuldle-app 미러)
```
postdle-app/
  package.json / tsconfig.json / next.config.mjs / .env.example / README.md
  middleware.ts               (선택) 유저 서브도메인 → /u/유저명
  src/lib/
    config.ts                 도메인/브랜드 상수
    http.ts                   라우트 핸들러 헬퍼(ok/fail/handle/HttpError)
    session.ts                httpOnly 쿠키(postdle_token) get/set/clear
    pagedle.ts                api.pagedle.com 연동 (members + pages, category=postdle)
  src/app/
    layout.tsx / globals.css
    page.tsx                  피드
    login/page.tsx            로그인/가입
    compose/page.tsx          글 작성
    u/[username]/[slug]/page.tsx  글 상세
    api/auth/{login,signup,logout,me}/route.ts
    api/posts/route.ts        GET 목록 / POST 작성 (category=postdle 고정)
```

## 5. 배포 (geuldle와 동일 스택 권장)
- Next.js standalone + Docker → AWS ECS Fargate, Cloudflare DNS(postdle.com), api.pagedle.com 그대로 사용.
- geuldle `docs/RESUME-handoff.md`의 ECS/Cloudflare 절차 재사용.
- **주의**: postdle은 자체 DB가 없으므로 RDS/Prisma 단계 불필요 → geuldle보다 인프라 단순.

## 6. 진행 순서
1. 스캐폴드(설정 + lib + 인증 API + 로그인 화면) — 현재 세션.
2. 글 작성/목록/상세 화면 — 다음.
3. 피드/탐색/프로필, 디자인 다듬기.
4. 빌드·배포(ECS/Cloudflare).

## 7. 폐기/보류
- pagesite의 `feature/postdle-domain-split` 브랜치(단일코드 도메인분기 방식)는 이 독립앱 방식으로 대체됨 → 병합하지 않고 보류(무해). 브랜드 유틸(`getBrandFromHost` 등)은 필요 시 참고용.
