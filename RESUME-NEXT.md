# 이어서 할 작업 (2026-07-03, 14:30 이후 재개)

목표: postdle 글쓰기를 **pagedle의 PostEditor 컨테이너와 100% 동일**하게 —
**완성도(completeness) 표시 포함**. "PostEditor 기반으로, 완성도까지 그대로."

---

## 0. 지금까지 완료 (커밋/배포됨)
- 에디터 **엔진(MdEditor)** 공유 포팅 → postdle.com/compose 이미 라이브(하드 새로고침 필요).
- 푸터·이용약관/개인정보 페이지·회원가입 양식 정렬·피드 postdle 카테고리 필터.
- 추천 문장 가로 캐러셀 + 랜딩 컴팩트 + 푸터 "운영사" 제거.
- 제목 기반 2-depth 주소(`/u/유저명/제목`) + 작성 시 주소 미리보기.
- 마지막 커밋: `78c3c5a` (푸시하면 App Runner 자동배포). git author = `illgi <illgi@users.noreply.github.com>` 로 고정할 것(GH007 회피).
- 커밋/푸시 시 샌드박스 `.git/*.lock`을 `mv`로 치우고 진행. push는 Mac에서 `cd ~/Downloads/work/monorepo && git push origin HEAD:main`.

## 1. [빠름] 쓰는 영역 "색상 구분 안됨" 버그 — CSS 변수 누락
원인: 포팅한 에디터의 emotion 스타일이 `var(--gray-1..6, --black, --black-contrast,
--white, --blue, --blue-light, --blue-contrast, --yellow-light, --red-light, --purple,
--pe-border)`를 참조하는데 **postdle globals.css에 이 변수들이 정의돼 있지 않음** →
테두리/배경/글자색이 안 먹어 편집영역이 배경과 구분 안 됨.
해결: pagedle `pagesite/frontend/src/styles/service.scss`의 `:root` 블록(대략 1~25행)을
그대로 postdle `apps/postdle/src/app/globals.css` `:root`에 추가(또는
`packages/post-editor/src/editor.css`에 `:root`로).
확인한 값:
```
--white:#fff; --black:#2e2b29; --black-contrast:#110f0e;
--blue:#0056b3; --blue-contrast:#00408f; --blue-light:rgba(0,86,179,0.05);
--gray-1:rgba(61,37,20,0.05); --gray-2:rgba(61,37,20,0.08); --gray-3:rgba(61,37,20,0.12);
--gray-4:rgba(53,38,28,0.3); --gray-5:rgba(28,25,23,0.6); --gray-6:(service.scss에서 확인);
--yellow:#f59e0b; --yellow-light:#fffae5; --red-light:#ffebe5; --purple:(확인);
--pe-border:(post-editor editor.css 확인).
```
(→ service.scss `:root` 전체를 복사하는 게 안전.)

## 2. [본작업] pagedle PostEditor 컨테이너 포팅 (완성도 포함)
원본: `pagesite/frontend/src/container/pageId/parts/PostEditor.tsx`
핵심 파악(중요):
- **완성도(completeness)**: `CompletenessLevel '10'~'100'` 슬라이더. 색상: <40 회색,
  <80 주황(#e8a33d), ≥80 초록(#0f9d6b). 저장/발행 시 페이지의 `completeness` 필드로
  백엔드 전송(postdle는 이미 `pdCreatePost`에 completeness 인자 있음).
- **임시저장/자동저장/버전관리 = 전부 localStorage 기반**(백엔드 아님):
  - draftKey: `post_draft_new` / `post_draft_edit_${pageId}` — 입력 바뀔 때마다 저장.
  - versionKey: `post_versions_new` / `post_versions_edit_${id}` — 30초마다 버전 스냅샷,
    최대 `MAX_VERSIONS`개, VersionPanel(HistoryOutlined/Restore)로 복원.
  - → postdle는 실제 앱이라 localStorage 사용 OK (아티팩트 아님).
- 저장/발행: react-query `usePostPageMutation/useUpdatePageMutation/usePublishMutation/
  useUnpublishMutation` → postdle에선 `/api/posts`(생성+발행) + **신규 update/publish 경로**로 대체.
- 드롭할 pagedle 전용: 인증 모달(Join/Login), DownloadGateModal(트라이얼 게이트),
  memberInfoStore(→ /api/auth/me), react-query(→ fetch).

포팅 방식: `packages/post-editor`에 `PostContainer.tsx`로 추가하거나 postdle
`compose/page.tsx`를 이 컨테이너로 교체. MdEditor는 이미 공유 패키지에 있으므로 그걸 사용.
어댑터로 저장/발행/자동저장 콜백 주입.

## 3. [요청] 임시저장 + 그 글들의 "목록" 표시
- 컨테이너의 localStorage 초안 복구 + **서버측 미발행 글 목록**을 함께 제공 권장:
  - 서버 초안 = `pdMyList(token)`에서 `category='postdle'` && `published !== true`.
  - compose 상단 또는 `/drafts` 라우트에 "내 임시저장" 목록 → 클릭 시 편집 로드.
- update(수정 저장) 경로 필요: 백엔드 `PUT /api/v1/pages/{id}` (pagedle useUpdatePageMutation과 동일).
  postdle `lib/pagedle.ts`에 `pdUpdatePost`, `/api/posts` PATCH 또는 `/api/drafts` 추가.

## 4. 마무리
- 빌드: 마운트가 unlink 거부 → ext4로 복사 후 `corepack prepare pnpm@9.0.0 --activate &&
  corepack pnpm install --no-frozen-lockfile && corepack pnpm --filter postdle build`.
  단, 소스 편집은 반드시 마운트(monorepo)에 기록. `pnpm --filter postdle build` EXIT 0까지.
- 커밋(author=illgi noreply) → Mac에서 push → App Runner 자동배포 → postdle.com에서
  완성도 슬라이더·임시저장·목록·색상 구분 확인.

## 참고: 보류(사용자 미지시)
- pagedle.com 쪽 에디터 컷오버(양방향 통일) — 라이브 프로덕션이라 스테이징 검증 후 별도.
- pagesite 백엔드 category 필터 프로덕션 배포(ghcr denied) — postdle는 클라이언트 필터로 우회됨.
