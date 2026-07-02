# 크로스도메인 SSO 설계 — pagedle.com ↔ postdle.com

작성일: 2026-07-01 · 대상 저장소: `pagedle/pagesite` (frontend)

---

## 1. 목표와 제약

- **목표**: postdle.com에 처음 방문한 사용자가 이미 pagedle.com에 로그인돼 있으면 **자동으로 로그인 상태**가 되도록. (반대 방향도 동일)
- **제약**:
  - 백엔드·회원 DB·기능은 pagedle과 완전 공유 (같은 계정).
  - 가능하면 백엔드 변경을 최소화 (MVP), 이후 보안 강화 단계에서만 백엔드 추가.
  - pagedle 기존 동작에 영향 없을 것.

---

## 2. 현재 인증 구조 (as-is)

로그인 성공 시 (`components/modal/AuthImprovements.tsx`):

```
백엔드 응답 → { jwtAuthToken, member: { id, name, ... } }
    ↓ 클라이언트가 쿠키 3개를 직접 세팅 (JS, httpOnly 아님)
setCookie('accessToken', jwtAuthToken, getMainDomain(), 7|30)
setCookie('memberId',   memberId,     getMainDomain(), 7|30)
setCookie('memberName', memberName,   getMainDomain(), 7|30)
```

- `getMainDomain()` (`utils/cookie.ts`) → 현재 호스트 기준 `.pagedle.com` (또는 `.postdle.com`) 반환.
- 쿠키 속성: `secure; SameSite=Strict`, 만료 7일(로그인 유지 시 30일).
- 페이지 로드 시(`layout/Header.tsx`) 이 쿠키 3개를 읽어 `memberInfoStore`를 복원 → 이게 곧 로그인 상태.
- API 호출은 `axiosInstance`가 `accessToken` 쿠키를 읽어 `Authorization: Bearer <jwt>` 헤더로 전송.

**요점**: 세션의 실체 = JS로 읽을 수 있는 값 3개. httpOnly 세션도, 서버측 세션 저장소도 없음. → 이 3개만 postdle.com으로 넘겨 `.postdle.com` 쿠키로 심으면 로그인 상태가 그대로 재현됨.

---

## 3. 왜 지금 그대로는 안 되는가

쿠키는 **등록가능 도메인(eTLD+1) 경계**를 못 넘는다.

- `.pagedle.com` 쿠키는 `*.pagedle.com` 전 서브도메인이 공유하지만,
- `postdle.com`은 **다른 등록 도메인**이라 `.pagedle.com` 쿠키를 절대 읽지 못함.
- 따라서 postdle.com에서 `getCookie('accessToken')` → `null` → 비로그인으로 뜸.

→ **도메인 간 자격증명 핸드오프(handoff)** 절차가 반드시 필요.

---

## 4. 방식 비교

| 방식 | 내용 | 백엔드 변경 | 보안 | 평가 |
|---|---|---|---|---|
| **A. 리다이렉트 토큰 핸드오프** | postdle→pagedle 브리지 페이지로 이동, pagedle이 자기 쿠키 읽어 토큰을 postdle 콜백으로 되돌려줌 | **불필요(MVP)** | 중(프래그먼트) → 상(1회용 코드) | **추천** |
| B. 공통 부모 도메인 | 두 서비스를 `*.miraepa.com` 아래로 → `.miraepa.com` 쿠키 공유 | 도메인/인프라 재편 | 상 | 브랜드 도메인(pagedle.com/postdle.com) 유지 요건과 충돌 → 제외 |
| C. 별도 로그인 | postdle.com에서 같은 계정으로 각자 로그인 | 불필요 | 상 | "자동 로그인" 요건 불충족 → 보조 수단으로만 |
| D. 3rd-party 쿠키/iframe | 숨은 iframe + postMessage로 토큰 공유 | 불필요 | 하 | 최신 브라우저 3rd-party 쿠키 차단으로 취약·불안정 → 제외 |

→ **방식 A 채택.** 현재 구조가 이미 JWT를 JS에 노출하므로 A와 궁합이 좋음.

---

## 5. 추천 방식 상세 플로우 (방식 A)

```
[사용자가 postdle.com 진입]
        │
        ▼
postdle.com: .postdle.com accessToken 쿠키 있나?
   ├─ 있음 → 로그인 상태로 진행 (끝)
   └─ 없음 & SSO 미시도(sso_tried 플래그 없음)
            │  sso_tried=1 세팅(sessionStorage) — 루프 방지
            ▼
     top-level 리다이렉트:
     https://pagedle.com/sso?redirect=https://postdle.com/sso-callback
            │
            ▼
pagedle.com/sso (브리지): .pagedle.com accessToken 쿠키 읽기
   ├─ redirect 파라미터가 allowlist(postdle.com/pagedle.com)인지 검증  ← 필수
   ├─ 로그인됨 → 리다이렉트:
   │     https://postdle.com/sso-callback#at=<jwt>&mid=<id>&mn=<name>
   │     (토큰은 URL 프래그먼트(#) — 서버로 전송/로깅되지 않음)
   └─ 비로그인 → 리다이렉트: https://postdle.com/sso-callback (토큰 없음)
            │
            ▼
postdle.com/sso-callback:
   ├─ 프래그먼트에서 at/mid/mn 파싱
   ├─ 있으면 setCookie(...,'.postdle.com',...) 3개 심기 → 로그인 완료
   ├─ history.replaceState로 URL의 # 제거 (토큰 흔적 삭제)
   └─ 원래 목적지로 이동(기본 '/')
```

로그인이 안 돼 있으면 한 번만 시도하고 조용히 비로그인으로 둔다(무한 왕복 없음).

---

## 6. 보안 설계 (중요)

1. **redirect allowlist (오픈 리다이렉트/토큰 탈취 방지)** — `/sso` 브리지는 `redirect` 대상이 **정확히** `https://postdle.com/...` 또는 `https://pagedle.com/...`(+ dev: test.*/localhost)일 때만 토큰을 되돌려준다. 이 검증이 없으면 공격자가 `?redirect=evil.com`으로 토큰을 빼갈 수 있음. **절대 생략 불가.**
2. **프래그먼트 사용** — 토큰을 쿼리스트링(`?`)이 아니라 프래그먼트(`#`)로 전달 → 서버 액세스로그·리퍼러에 안 남음. 콜백에서 즉시 `replaceState`로 제거.
3. **SameSite** — `/sso` 브리지는 pagedle **자기 도메인 페이지에서 자기 쿠키를 읽는 것**이라 `SameSite=Strict`여도 정상 동작(문제 없음). postdle 콜백도 자기 쿠키를 심는 것이라 무관.
4. **HTTPS 전용** — 기존과 동일하게 `secure` 유지.
5. **(권장) 하드닝: 1회용 코드 방식** — 장기 JWT를 URL에 실지 않도록, pagedle이 **단기(30~60초)·1회용 코드**를 발급하고 postdle이 백엔드로 코드를 교환해 새 JWT를 받는 방식. 백엔드 엔드포인트 2개 필요:
   - `POST /auth/sso/issue` — 로그인 세션 기준으로 1회용 코드 발급
   - `POST /auth/sso/exchange` — 코드 검증 후 JWT 재발급
   - MVP(프래그먼트) 대비 URL 히스토리 노출까지 제거. **프로덕션 목표안.**

> 현재도 JWT가 이미 JS에 노출돼 있어 MVP의 추가 위험은 "URL 히스토리에 잠깐 남는 것" 정도로 제한적. 우선 MVP로 붙이고, 결제/민감기능 확장 시점에 1회용 코드로 승격 권장.

---

## 7. 구현 계획 (방식 A · MVP, 백엔드 무변경)

기존 도메인 분기 유틸(`constants/site.ts`, 이미 추가된 `getBrandFromHost` 등)을 재사용.

**추가 파일**
- `frontend/src/pages/sso.tsx` — 브리지. pagedle/postdle 공용(같은 코드). `redirect` allowlist 검증 → 자기 쿠키 읽어 콜백으로 토큰 or 빈값 반환.
- `frontend/src/pages/sso-callback.tsx` — 콜백. 프래그먼트 파싱 → `setCookie(..., getMainDomain(), ...)` → `replaceState` → 목적지 이동.
- `frontend/src/utils/sso.ts` — allowlist 검증, 프래그먼트 파싱/조립 헬퍼.

**변경 파일**
- `frontend/src/pages/_app.tsx`(또는 진입 훅) — 최초 로드시 "쿠키 없음 + sso_tried 없음 + 제품 메인 도메인"이면 `/sso` 브리지로 1회 유도. (postdle 진입 자동 SSO 트리거)
- `frontend/src/utils/cookie.ts` — `getMainDomain()`은 이미 호스트 기준으로 동작하므로 그대로 사용 가능(수정 불필요 예상).

**allowlist 상수** (`utils/sso.ts`)
```
prod: ['pagedle.com', 'postdle.com']
dev:  ['test.pagedle.com', 'test.postdle.com', 'localhost']
```

---

## 8. 로그아웃 전파 (Single Logout)

현재 로그아웃(`Header.handleClickLogout`)은 자기 도메인 쿠키만 지움. postdle/pagedle 한쪽만 로그아웃되는 불일치가 생김.

- **MVP**: 각자 도메인에서만 로그아웃(양쪽 동시 로그아웃 아님) — 수용 가능. 문서에 명시.
- **개선**: 로그아웃 시 상대 도메인의 `/sso-logout`을 숨은 이미지/리다이렉트로 호출해 상대 쿠키도 만료. (2단계)

---

## 9. 단계별 롤아웃

1. **MVP** (프론트만): `/sso` + `/sso-callback` + `_app` 자동 트리거 + allowlist. → postdle.com 자동 로그인 동작.
2. **하드닝**: 백엔드 1회용 코드(`/auth/sso/issue`·`/exchange`)로 승격, URL 토큰 제거.
3. **Single Logout**: 양방향 로그아웃 전파.

---

## 10. 결정 필요 사항

- MVP(프래그먼트, 백엔드 무변경)로 먼저 붙일지 / 처음부터 1회용 코드(백엔드 포함)로 갈지.
- postdle 진입 시 **자동 SSO**(무조건 1회 브리지 왕복)로 할지, 아니면 **"pagedle 계정으로 로그인" 버튼 클릭 시에만** 브리지로 보낼지. (자동은 매끄럽지만 첫 진입에 리다이렉트 1회 발생. 버튼식은 리다이렉트 없지만 클릭 필요.)
