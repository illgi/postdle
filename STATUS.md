# Postdle · Pagedle 통합 — 총점검 (2026-07-02)

전체 상태를 한곳에 정리한 문서. 다음 세션은 이 문서만 보면 이어갈 수 있음.

---

## 0. 한 줄 요약
- **postdle**: pagedle 계정·DB 공유, `category='postdle'` 글 발행 독립 앱. **완성·빌드 검증됨.**
- **에디터 통일**: 모노레포 + 공유 `@repo/post-editor`(TipTap 리치 에디터) 만들고 **postdle이 사용 중(빌드 통과)**. pagesite 컷오버만 남음.
- **미배포**: postdle GitHub 푸시·AWS·DNS는 아직. pagesite 백엔드 필터는 커밋됐으나 main 반영·배포 필요.

---

## 1. 디렉터리 / 위치
```
~/Downloads/work/
  monorepo/                     ← 통합 모노레포 (에디터 공유)
    package.json, pnpm-workspace.yaml
    packages/post-editor/       @repo/post-editor — 공유 TipTap 에디터 (디커플)
      src/PostEditor.tsx  src/sanitize.ts  src/editor.css  src/index.ts
    apps/postdle/               postdle.com 앱 (App Router). @repo/post-editor 사용
      (.git → 원격 illgi/postdle)
  pagedle/pagesite/             pagedle.com (라이브). 원격 illgi/pagesite
```

## 2. 아키텍처 (확정)
- **회원·인증·DB·기능**: `api.pagedle.com` 공유. 백엔드 로직 수정은 양쪽 즉시 반영.
- **postdle 콘텐츠**: pagedle `pages` 테이블에 `category='postdle'` 하위 페이지로 저장. 글=메인페이지 아래 하위페이지, 발행(publish)해야 공개.
- **글쓰기 에디터**: `@repo/post-editor` 하나로 통일 예정 → 한쪽 수정이 양쪽 반영. (현재 postdle 적용 완료, pagesite 미적용)

## 3. postdle 앱 (완성, 빌드 검증됨)
- 랜딩: 헤더(로고+검색+로그인상태), 오늘의 문장/추천 문장(검증된 공유 인용 70개), 사용자 글 피드(예시 폴백), 반응(♥/👍/🙂)
- 인증: 가입/로그인/로그아웃/me (pagedle 계정 공유), 유저명 온보딩(공유 member.name)
- 글쓰기: `@repo/post-editor` 리치 에디터 + 이미지 업로드(`/api/upload`→pagedle `/file/uploads`) + 공개/비공개 선택, HTML 저장
- 상세: HTML은 SafeHtml(DOMPurify) 살균 렌더 / 예시는 마크다운
- 프로필 `/u/[username]`, 서브도메인 `유저명.postdle.com`→`/u/유저명`(middleware)
- 검증: `pnpm --filter postdle build` → **BUILD EXIT=0** (16 라우트)

## 4. 공유 에디터 `@repo/post-editor`
- TipTap 3 + StarterKit/Underline/Link/Image/TextAlign/Color/Highlight/Sub·Sup/Table/TaskList/Youtube/Markdown
- props: value(HTML)/onChange/editable/placeholder/onImageUpload(어댑터)/className — 앱 내부 의존성 없음
- 툴바: 실행취소·굵게·기울임·밑줄·취소선·H1~3·인용·목록·정렬·링크·이미지·표·유튜브·형광펜·첨자·구분선
- `sanitizeHtml()` export (렌더 살균)
- 검증: 실제 TipTap 3 설치 후 `tsc --noEmit` → **EXIT=0**

## 5. git 상태 (저장소별)
- **apps/postdle** (원격 illgi/postdle): 5커밋, 최신 `abed67f`(공유 에디터). 작업트리 clean. **아직 GitHub에 푸시 안 됨.**
- **pagedle/pagesite** (원격 illgi/pagesite):
  - `main` = `597f96db` (프로덕션, 무손상)
  - `feature/postdle-domain-split`: 폐기된 도메인분기 방식 + **백엔드 category 필터 커밋 `b6df3d16`(유효, 필요)**
  - `backup/staged-wip-20260701`, 태그 `backup/full-state-*`: 이전 정리 때 백업
  - 남은 미커밋(폐기 브랜치 잔재): `MainContainer.tsx` 수정, untracked `editPage/`
- **monorepo 루트 + packages/post-editor**: 아직 버전관리 밖(모노레포 git 미초기화)

## 6. 남은 일 (우선순위)
1. **pagesite 백엔드 필터를 main으로 + 배포** — postdle 피드가 `?category=postdle`에 의존. `b6df3d16`을 main에 cherry-pick 후 배포.
2. **pagesite 에디터 컷오버(3단계)** — MdEditor를 `@repo/post-editor`로 교체(프로덕션, 신중히). 완료 시 양방향 통일 완성.
3. **모노레포 git 통합** — Mac에서 모노레포 루트에 git init, apps/postdle의 nested .git 정리, 공유 패키지 버전관리.
4. **배포** — postdle: GitHub 푸시(`git push -u origin master:main`, Mac에서) → ECR/ECS → Cloudflare. `*.postdle.com` 와일드카드 DNS는 postdle.com 도메인 세션 쪽.

## 7. 외부 참조 (우리 백엔드 외)
- 에디터: YouTube 임베드(youtube-nocookie, 선택), 이미지 저장 도메인(`NEXT_PUBLIC_IMAGE_HOST`, 업로드는 우리 백엔드 경유)
- 앱 전반: 번역 API(googleapis/mymemory), 사업자번호(api.odcloud.kr), 소셜공유(fb/twitter/kakao/maps), 폰트 CDN(cdnjs), 예시 이미지(picsum/placeholder)

## 8. 알려진 이슈 / 메모
- **샌드박스 git 잠금**: 이 마운트는 파일 unlink 불가 → `.git/*.lock`·`junk_*` 잔재 누적. Mac에서 `rm -f .git/*.lock .git/junk_*` 정리 권장.
- **피드 노출**: 공개 글은 발행 시 회원 `uploadListDisplayYn=true`로 켜 랜딩 피드에 노출(안전, null-guard). 비공개는 미발행.
- **제목 예약어**: 하위페이지 제목이 예약어(login/api…)면 백엔드가 거부 — 드문 엣지.
- **로컬 실행**: `cd ~/Downloads/work/monorepo && pnpm install && pnpm --filter postdle dev`
