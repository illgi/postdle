'use client';

import React from 'react';
import MdEditor from './editor/MdEditor';
import { EditorAdapterContext, type EditorAdapter } from './editor/adapter';

export type PostEditorProps = {
  /** HTML 문자열 (pagedle과 동일하게 HTML 저장) */
  value: string;
  /** 변경 시 HTML 반환 */
  onChange?: (html: string) => void;
  editable?: boolean;
  placeholder?: string;
  /** 이미지 업로드 어댑터 — 파일을 받아 접근 가능한 URL 반환 (앱이 주입) */
  onImageUpload?: (file: File) => Promise<string>;
  className?: string;
};

/**
 * pagedle의 실제 MdEditor를 그대로 렌더링하는 얇은 래퍼.
 * 공개 API(props)는 이전과 동일하게 유지하여 postdle 작성 페이지는 변경이 필요 없다.
 *
 * - onChange     -> MdEditor.setContent
 * - editable     -> MdEditor.isEdit (기본 true)
 * - placeholder  -> MdEditor.placeholder (전달 시 i18n 기본 문구 대체)
 * - onImageUpload-> EditorAdapterContext 로 주입
 *
 * postdle에서는 listForms/onAutoSave 를 주입하지 않으므로:
 *   - Form-link 툴바 버튼/모달 숨김
 *   - AutoSave 비활성(렌더링 없음)
 */
export function PostEditor({
  value = '',
  onChange,
  editable = true,
  placeholder,
  onImageUpload,
  className,
}: PostEditorProps) {
  const adapter = React.useMemo<EditorAdapter>(
    () => ({ onImageUpload }),
    [onImageUpload],
  );

  return (
    <EditorAdapterContext.Provider value={adapter}>
      <div className={className}>
        <MdEditor
          value={value}
          setContent={onChange}
          isEdit={editable}
          isPost
          placeholder={placeholder}
        />
      </div>
    </EditorAdapterContext.Provider>
  );
}

export default PostEditor;
