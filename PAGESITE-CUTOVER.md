# 3단계 — pagesite 에디터 컷오버 (공유 에디터로 통일)

pagesite(라이브)의 글쓰기 에디터를 `@repo/post-editor`로 교체해 **양방향 통일**을 완성한다.
`MdEditor`는 pagesite 10곳+에서 쓰이고 프로덕션이라, **먼저 post 카테고리 작성기(PostEditor)만** 교체하고 검증 후 확대한다.
이 샌드박스는 pagesite 전체 빌드를 검증할 수 없어, 아래 절차는 **Mac에서 실행·빌드·배포 검증**한다.

## 왜 안전한가
- 어댑터가 기존 `MdEditor`와 **동일한 default export + prop 시그니처**라 드롭인 교체.
- 원본 `MdEditor.tsx`는 그대로 두고, **import 만 바꿔** 점진 적용(롤백=import 원복).

## 절차

### 1) pagesite를 모노레포로
```bash
mv ~/Downloads/work/pagedle/pagesite ~/Downloads/work/monorepo/apps/pagesite
```
`monorepo/pnpm-workspace.yaml` 에 프론트/어드민 경로 추가:
```yaml
packages:
  - "apps/*"
  - "apps/pagesite/frontend"
  - "apps/pagesite/admin"
  - "packages/*"
```
`apps/pagesite/frontend/package.json` dependencies 에 추가:
```json
"@repo/post-editor": "workspace:*"
```

### 2) 어댑터 추가 — `apps/pagesite/frontend/src/components/editor/MdEditorShared.tsx`
```tsx
'use client';
import { PostEditor } from '@repo/post-editor';
import '@repo/post-editor/style.css';
import { uploadFileApi } from '@/request/uploadApi';
import { TPageContentType } from '@/types/commonCode';

type Props = {
  value: string;
  setContent?: (v: string) => void;
  isEdit?: boolean;
  isDisable?: boolean;
  // 기존 MdEditor의 나머지 props(pageId/postId/isPost/category/pageType…)는
  // 공유 에디터에 불필요 → 받되 무시 (드롭인 호환)
  isLightTool?: boolean;
  pageId?: string;
  pageType?: TPageContentType;
  postId?: string;
  postTitle?: string;
  isPost?: boolean;
  isFullWidth?: boolean;
  category?: string;
};

export default function MdEditorShared({ value, setContent, isEdit = true, isDisable = false }: Props) {
  const onImageUpload = async (file: File) => uploadFileApi({ file, type: 'IMAGE' });
  return (
    <PostEditor
      value={value}
      onChange={setContent}
      editable={isEdit && !isDisable}
      onImageUpload={onImageUpload}
    />
  );
}
```

### 3) post 작성기만 교체 (targeted)
`apps/pagesite/frontend/src/container/pageId/parts/PostEditor.tsx` 에서 import 만 교체:
```diff
- import MdEditor from '@/components/editor/MdEditor';
+ import MdEditor from '@/components/editor/MdEditorShared';
```
(다른 9곳은 그대로 → 영향 최소. 검증 후 순차 확대.)

### 4) 설치·빌드·검증
```bash
cd ~/Downloads/work/monorepo
pnpm install
pnpm --filter @pagesite/frontend build    # (프론트 package.json name 기준)
pnpm --filter postdle build               # 회귀 없는지 함께
```
로컬에서 글쓰기(툴바/이미지/저장/발행) 확인 → 스테이징/카나리 배포 → 프로덕션.

### 5) 롤백
import 를 `@/components/editor/MdEditor` 로 원복하면 즉시 기존 에디터로 복귀.

## 확대(선택)
검증되면 나머지 사용처(AddPage, PageBlocks, Series, Popup 등)도 순차로 `MdEditorShared` 로 교체.
공유 에디터에 빠진 기능(폰트크기/색상 메뉴 등)이 필요하면 `@repo/post-editor` 툴바에 추가 → 양쪽 반영.

## 주의
- pagesite는 라이브. **반드시 로컬 빌드+스테이징 검증 후** 프로덕션 배포.
- 공유 에디터는 HTML 저장(`getHTML`) — pagesite도 HTML 저장이라 호환. 상세/렌더는 기존 pagedle 방식(DOMPurify) 유지.
