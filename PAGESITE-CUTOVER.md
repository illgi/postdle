# 3단계 — pagesite 에디터 공유 (Option B: submodule)

**pagesite 저장소·배포는 그대로 두고**, 공유 에디터를 git submodule로 끌어다 쓴다.
pagesite엔 이미 TipTap·DOMPurify가 설치돼 있어 **새 npm 의존성 불필요** — 에디터 "소스"만 참조.
에디터를 모노레포에서 고치고 push → pagesite에서 `submodule update` 하면 반영 = 양방향 통일.

> 라이브라 아래는 **Mac에서 실행 + 로컬 빌드/스테이징 검증 후 배포**. 원본 `MdEditor`는 그대로 두고 import만 바꿔 점진 적용(롤백=원복).

## 1) 공유 에디터를 submodule 로
pagesite 저장소 루트에서:
```
cd ~/Downloads/work/pagedle/pagesite
git submodule add https://github.com/illgi/postdle.git frontend/shared-monorepo
git commit -m "chore: add shared editor submodule (illgi/postdle)"
```
→ 에디터 소스 경로: `frontend/shared-monorepo/packages/post-editor/src/`

## 2) 경로 별칭 (pagesite/frontend/tsconfig.json 의 paths 에 추가)
```json
"@shared-editor": ["./shared-monorepo/packages/post-editor/src/index.ts"],
"@shared-editor/style.css": ["./shared-monorepo/packages/post-editor/src/editor.css"]
```
(기존 `"@/*": ["./src/*"]` 옆에 추가. `baseUrl`은 기존 설정 그대로.)

## 3) 어댑터 — `frontend/src/components/editor/MdEditorShared.tsx`
```tsx
'use client';
import { PostEditor } from '@shared-editor';
import '@shared-editor/style.css';
import { uploadFileApi } from '@/request/uploadApi';

type Props = {
  value: string;
  setContent?: (v: string) => void;
  isEdit?: boolean;
  isDisable?: boolean;
  // 기존 MdEditor 의 나머지 props 는 받되 무시 (드롭인 호환)
  [k: string]: unknown;
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

## 4) post 작성기만 교체 (targeted)
`frontend/src/container/pageId/parts/PostEditor.tsx`:
```diff
- import MdEditor from '@/components/editor/MdEditor';
+ import MdEditor from '@/components/editor/MdEditorShared';
```
(나머지 9곳은 그대로 → 영향 최소. 검증 후 순차 확대.)

## 5) 빌드·검증·배포
```
cd ~/Downloads/work/pagedle/pagesite/frontend
npm install        # 새 의존성 없음(제로일 수 있음). 확인용.
npm run build      # 로컬 빌드 통과 확인
```
로컬에서 글쓰기(툴바/이미지/저장/발행) 확인 → 스테이징/카나리 → 프로덕션(기존 pagesite 파이프라인 그대로).

## 6) 에디터 수정 반영 (양방향)
- 모노레포에서 `packages/post-editor` 수정 → commit → `git push`(illgi/postdle)
- pagesite에서:
```
cd ~/Downloads/work/pagedle/pagesite
git submodule update --remote frontend/shared-monorepo
git commit -am "chore: bump shared editor"
```
→ 다음 배포에 반영. (postdle은 워크스페이스라 자동 반영)

## 7) 롤백
import 를 `@/components/editor/MdEditor` 로 원복 → 즉시 기존 에디터.

## 주의
- submodule 은 특정 커밋에 고정 → 의도적으로 `update --remote` 할 때만 바뀜(안정적).
- 어댑터가 매핑 안 하는 pagedle 전용 기능(폰트크기/색상 메뉴 등)이 필요하면 `packages/post-editor` 툴바에 추가 → 양쪽 반영.
- pagesite 는 라이브: **로컬 빌드 + 스테이징 검증 후** 프로덕션.
