# Postdle 작업 노트 (2026-07-01 세션)

## 이번 세션에서 한 일
- `~/Downloads/work/pagedle/pagesite` 프로젝트 구조 파악
- "Pagedle site development" 세션 트랜스크립트 참고해서 최근 작업 이력 확인

## 프로젝트 위치
- 실제 코드: `~/Downloads/work/pagedle/pagesite`
- Git remote: `https://github.com/illgi/pagesite.git`
- 개발 지침 문서: `pagesite/CLAUDE.md` (필독 — CSS 스코프 격리, MUI 버튼 규칙, DB 마이그레이션 원칙 등)

## 프로젝트 구조 요약

### 1. frontend/ (Next.js 15, Pages Router)
- 스택: MUI + Emotion, Jotai, React Query, TipTap(리치 에디터), GrapesJS(블록 에디터)
- i18n: 8개 언어 (ko, ja, en, zh, es, de, fr, vi)
- 주요 라우트:
  - `/` 랜딩
  - `/[pageId]` 사용자 페이지 (서브: `[episodeSlug]`, `[postSlug]`)
  - `/guide`, `/pricing`, `/notice`
  - `/mypages` — `edit`, `add-post`, `add-store-item`, `domain-request`
  - `/forms/[formId]`, `/write`, `/edit`, `/try-editor`
- `src/container/`: MainContainer, folder, guide, myPages, pageId, pricing, notice, tryEditor, sample, test

### 2. backend/ (Spring Boot 3 + JPA/QueryDSL + Flyway, MariaDB on AWS RDS)
- 패키지 루트: `com.boiler.core.backend`
- 도메인 모듈 (`web/{도메인}/` 아래 controller/entity/service/repository/request/response):
  member, page, pageblock, post, folder, form, domainrequest, storeProduct, storeEvent,
  notice, auth, authHistory, bookmark, follow, reaction, accounting, admin, dns, file,
  mail, memberbusinessinfo, share, todo, archive, common, dev
- DB 마이그레이션: Flyway, `ddl-auto: update` (2026-06 확정, validate는 MariaDB 메타데이터 이슈로 부팅 깨짐 — CLAUDE.md 8-1 참고)

### 3. admin/ (Next.js App Router) — 초기 단계
- `src/app/`: layout, page(대시보드), login
- 아직 기능 적은 관리자 콘솔

## 최근 Git 히스토리 (pagesite, main 브랜치)
```
597f96db content(landing): new headline + remove getting-started guide section
ef112b9b content(guide/notice): 글->포스트 + remove unsupported social login + fix old tab names
68eaa514 content(notice+guide): announce Page-category revamp + sync guide to current structure
775454a0 fix(header): match header horizontal padding to body (.container) 20px so widths align at all widths
dbb483fb fix(landing): equal-width CTA buttons (grid) + guide button matches their total width
bc97bd30 fix(layout): unify content width to 1160 across header + all pages + guide, symmetric centering
a505029e fix(guide): width:100% on demo/tutorial/cta sections so all sections align at 960
19beebfa fix(guide): constrain HeroBanner to 960px so guide side widths are uniform
d6408bf8 fix(style): define --primary-blue (was undefined) + unify guide notice width
dad7d037 feat(guide/notice): top notice section on /guide + search→notice + fix mobile h-scroll
```

## 열려 있는 이슈 / 다음 세션에서 이어갈 것
- **브랜드명 미정**: "Pagedle site development" 세션이 "geuldle or postdle" (브랜드명을 geuldle로 할지 postdle로 할지 고민) 지점에서 끊김. 결정 필요.
  - 참고: 유사 프로젝트로 `~/Downloads/work/geuldle`, `~/Downloads/work/geuldle-app`, `~/Downloads/work/geuldle jp` 폴더도 존재.
- 랜딩페이지 카피 수정 작업이 진행 중이었음(헤드라인, 가이드 섹션 삭제, "글"→"포스트" 용어 통일). 후속 문구 다듬기 요청 여지 있음.

## 2026-07-01 (2) — postdle.com 도메인 분기 착수
**결정**: pagedle.com은 postdle 카테고리 유지. postdle 기능 전체 + 회원가입을 **별도 postdle.com**으로.
DB·기능·회원 계정은 pagedle과 완전 공유. 구축 방식 = **단일 코드베이스 + 도메인(hostname) 분기**.

**변경 파일 (frontend/)**
- `src/constants/site.ts` — 브랜드 인프라 추가: `BrandKey`, `BRANDS`, `getBrandFromHost`,
  `getBrandConfig`, `getBrandHomeUrl`, `isProductMainDomain`. postdle 도메인은 dev=test.postdle.com / prod=postdle.com.
- `src/pages/index.tsx` — 루트 라우팅에서 `isProductMainDomain(host)` 사용.
  (기존엔 postdle.com이 사용자 서브도메인으로 오인돼 404가 떴음 → 이제 메인 랜딩 렌더)
- `src/pages/_app.tsx` — `<title>`을 브랜드별로 분기 (BRAND_TITLE, getBrandFromHost(effectiveHost)).
- `src/components/layout/Header.tsx` — 로고 이미지/홈링크를 `getBrandConfig`/`getBrandHomeUrl`로 브랜드 분기.
- `src/container/MainContainer/MainContainer.tsx` — 히어로 로고·타이틀·서브·설명·기능칩을 postdle 전용으로 분기,
  CTA 이동 도메인을 브랜드 도메인으로.
- `src/utils/i18n.ts` — postdle 전용 카피 키 추가(8개국어): postdleHeroTitle/Subtitle/Desc,
  postdleFeatRecord/Calendar/Goal/Private.
- `public/postdle.png` — 로고 자리표시자(현재 pagedle.png 복사본). **실제 postdle 로고로 교체 필요**.

**검증**: `tsc --noEmit` → 변경 파일 신규 에러 0 (TS2688은 이 샌드박스 node_modules의 @types 누락 노이즈, 사전 존재).

**남은 작업 / 다음 세션**
- 인프라: postdle.com DNS·인증서, 서버(EC2/Cloudflare) 호스트 라우팅, 쿠키 도메인(SSO) — 현재 로그인 쿠키는 `getMainDomain()`(pagedle) 기준. **postdle.com 계정 공유 하려면 크로스도메인 세션 설계 필요.**
- 실제 postdle 로고/파비콘/OG 이미지 제작.
- postdle 랜딩 하위 섹션(MainContents)·가이드/가격/공지 페이지 브랜드 문구 점검.
- [pageId] 등 다른 라우트의 도메인 판정도 필요시 `isProductMainDomain`으로 통일.

## 참고했던 다른 세션
- `local_ba4d1238-4987-42c6-a27d-4f6f25427e65` — "Pagedle site development" (본 노트의 최근 작업 이력 출처)
- `local_a7db6791-18e3-4f72-82e0-ed506ad7c880` — "Geuldle or Postdle" (브랜드명 고민 세션)
- `local_d8ff1910-c5fc-4cd3-817a-aadc07f80edb` — "Geuldle-app development"
