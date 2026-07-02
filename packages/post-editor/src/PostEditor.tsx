'use client';

import React, { useEffect } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { TableKit } from '@tiptap/extension-table';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import { Markdown } from 'tiptap-markdown';

export type PostEditorProps = {
  /** HTML 문자열 (pagedle과 동일하게 HTML 저장) */
  value?: string;
  /** 변경 시 HTML 반환 */
  onChange?: (html: string) => void;
  editable?: boolean;
  placeholder?: string;
  /** 이미지 업로드 어댑터 — 파일을 받아 접근 가능한 URL 반환 (앱이 주입) */
  onImageUpload?: (file: File) => Promise<string>;
  className?: string;
};

const extensions = (placeholder: string) => [
  StarterKit,
  Underline,
  Link.configure({ openOnClick: false, autolink: true }),
  Image,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TextStyleKit,
  Color,
  Highlight.configure({ multicolor: true }),
  Subscript,
  Superscript,
  TableKit.configure({ table: { resizable: true } }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Placeholder.configure({ placeholder }),
  Youtube.configure({ controls: true, nocookie: true }),
  Markdown.configure({ html: true, transformPastedText: true }),
];

export function PostEditor({
  value = '',
  onChange,
  editable = true,
  placeholder = '내용을 입력하세요…',
  onImageUpload,
  className,
}: PostEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: extensions(placeholder),
    content: value,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  // 외부 value 변경 동기화 (비어질 때)
  useEffect(() => {
    if (editor && !value) editor.commands.setContent('');
  }, [value, editor]);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            underline: e.isActive('underline'),
            strike: e.isActive('strike'),
            h1: e.isActive('heading', { level: 1 }),
            h2: e.isActive('heading', { level: 2 }),
            h3: e.isActive('heading', { level: 3 }),
            quote: e.isActive('blockquote'),
            bullet: e.isActive('bulletList'),
            ordered: e.isActive('orderedList'),
            task: e.isActive('taskList'),
            link: e.isActive('link'),
            highlight: e.isActive('highlight'),
            sub: e.isActive('subscript'),
            sup: e.isActive('superscript'),
            alignL: e.isActive({ textAlign: 'left' }),
            alignC: e.isActive({ textAlign: 'center' }),
            alignR: e.isActive({ textAlign: 'right' }),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });

  if (!editor) return <div className={`pe-loading ${className ?? ''}`} />;

  const s = state ?? ({} as Record<string, boolean>);
  const cmd = () => editor.chain().focus();

  const addLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('링크 URL', prev || 'https://');
    if (url === null) return;
    if (url === '') return cmd().unsetLink().run();
    cmd().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = async () => {
    if (onImageUpload) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const src = await onImageUpload(file);
          if (src) cmd().setImage({ src }).run();
        } catch {
          /* 업로드 실패 무시 */
        }
      };
      input.click();
    } else {
      const url = window.prompt('이미지 URL', 'https://');
      if (url) cmd().setImage({ src: url }).run();
    }
  };

  const addYoutube = () => {
    const url = window.prompt('YouTube URL');
    if (url) editor.commands.setYoutubeVideo({ src: url });
  };

  const B = ({ on, title, onClick, children }: { on?: boolean; title: string; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" className={`pe-btn${on ? ' is-on' : ''}`} title={title} aria-label={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
      {children}
    </button>
  );

  return (
    <div className={`pe-root ${className ?? ''}`}>
      {editable && (
        <div className="pe-toolbar">
          <B title="실행취소" onClick={() => cmd().undo().run()}>↶</B>
          <B title="다시실행" onClick={() => cmd().redo().run()}>↷</B>
          <span className="pe-sep" />
          <B title="굵게" on={s.bold} onClick={() => cmd().toggleBold().run()}><b>B</b></B>
          <B title="기울임" on={s.italic} onClick={() => cmd().toggleItalic().run()}><i>I</i></B>
          <B title="밑줄" on={s.underline} onClick={() => cmd().toggleUnderline().run()}><u>U</u></B>
          <B title="취소선" on={s.strike} onClick={() => cmd().toggleStrike().run()}><s>S</s></B>
          <span className="pe-sep" />
          <B title="제목1" on={s.h1} onClick={() => cmd().toggleHeading({ level: 1 }).run()}>H1</B>
          <B title="제목2" on={s.h2} onClick={() => cmd().toggleHeading({ level: 2 }).run()}>H2</B>
          <B title="제목3" on={s.h3} onClick={() => cmd().toggleHeading({ level: 3 }).run()}>H3</B>
          <B title="인용" on={s.quote} onClick={() => cmd().toggleBlockquote().run()}>❝</B>
          <span className="pe-sep" />
          <B title="글머리목록" on={s.bullet} onClick={() => cmd().toggleBulletList().run()}>•</B>
          <B title="번호목록" on={s.ordered} onClick={() => cmd().toggleOrderedList().run()}>1.</B>
          <B title="체크목록" on={s.task} onClick={() => cmd().toggleTaskList().run()}>☑</B>
          <span className="pe-sep" />
          <B title="왼쪽정렬" on={s.alignL} onClick={() => cmd().setTextAlign('left').run()}>⯇</B>
          <B title="가운데정렬" on={s.alignC} onClick={() => cmd().setTextAlign('center').run()}>≡</B>
          <B title="오른쪽정렬" on={s.alignR} onClick={() => cmd().setTextAlign('right').run()}>⯈</B>
          <span className="pe-sep" />
          <B title="링크" on={s.link} onClick={addLink}>🔗</B>
          <B title="이미지" onClick={addImage}>🖼</B>
          <B title="표" onClick={() => cmd().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>▦</B>
          <B title="유튜브" onClick={addYoutube}>▷</B>
          <span className="pe-sep" />
          <B title="형광펜" on={s.highlight} onClick={() => cmd().toggleHighlight().run()}>🖍</B>
          <B title="위첨자" on={s.sup} onClick={() => cmd().toggleSuperscript().run()}>x²</B>
          <B title="아래첨자" on={s.sub} onClick={() => cmd().toggleSubscript().run()}>x₂</B>
          <B title="구분선" onClick={() => cmd().setHorizontalRule().run()}>──</B>
        </div>
      )}
      <EditorContent editor={editor} className="pe-content" />
    </div>
  );
}

export default PostEditor;
