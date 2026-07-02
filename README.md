# miraepa 모노레포

pagedle(`pagesite`)과 postdle을 한 저장소로 통합하고, **글쓰기 에디터를 공유 패키지 `@repo/post-editor`로 일원화**한다.
한쪽에서 에디터를 고치면 양쪽에 반영된다.

## 구조
```
apps/
  postdle/        postdle.com (App Router) — @repo/post-editor 사용
  pagesite/       pagedle.com (이관 예정 — 3단계)
packages/
  post-editor/    공유 TipTap 리치 에디터 (pagedle 내부 의존성 없이 props/어댑터로 분리)
```

## 왜 공유 패키지인가
- 백엔드(`api.pagedle.com`)·DB는 이미 공유 → 기능 수정은 양쪽 반영됨.
- 프론트 글쓰기 에디터만 중복이었음 → `@repo/post-editor` 하나로 통일.

## 진행 단계
1. ✅ 모노레포 뼈대 + `@repo/post-editor` (디커플된 에디터)
2. ⏳ postdle을 공유 에디터로 전환 (검증)
3. ⏳ pagesite를 공유 에디터로 컷오버 (프로덕션 — 신중히)

## 로컬
```bash
pnpm install
pnpm --filter postdle dev
```
