import { layout } from './_shims/mixin';
import styled from '@emotion/styled';

export const PreviewButton = styled.button`
  width: 100%;
  font-size: 16px;
  color: var(--gray-5);
  background: transparent;
  margin-top: 12px;

  @media ${layout.$breakpointMobile} {
  }
`;

export const MdWrap = styled.div`
  width: 100%;
  border: 1px solid var(--gray-1);
  border-radius: 12px;
  overflow: hidden;

  max-height: 1000px;
  height: calc(100vh - 86px - 40px - 70px - 120px - 40px - 10px); // footer height 120 - 10은 버퍼 여백
  @supports (height: 100dvh) {
    height: calc(100dvh - 86px - 40px - 70px - 120px - 40px);
  }

  &.post {
    height: calc(100vh - 500px);
    min-height: 400px;
  }

  display: flex;
  flex-direction: column;

  &.view,
  &.edit-false {
    height: unset;
    max-height: unset;
  }

  /* ===== Pagedle word-processor mode ===== */
  &.pagedle-mode {
    border: none;
    border-radius: 0;
    background: #f0f0f0;

    .editor-content {
      background: #f0f0f0;
      padding: 32px 0;
      display: flex;
      justify-content: center;
    }

    .tiptap {
      background: #fff;
      max-width: 816px; /* A4-like width */
      width: 100%;
      min-height: 1056px; /* A4 aspect ratio */
      margin: 0 auto;
      padding: 60px 72px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      border-radius: 2px;
      font-family: 'Noto Sans KR', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.8;
      color: #1a1a1a;
      letter-spacing: -0.01em;

      h1 {
        font-size: 2rem;
        font-weight: 800;
        margin-top: 2.5rem;
        margin-bottom: 1rem;
        line-height: 1.3;
        color: #111;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.5rem;
      }

      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-top: 2rem;
        margin-bottom: 0.8rem;
        line-height: 1.35;
        color: #1a1a2e;
      }

      h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-top: 1.5rem;
        margin-bottom: 0.6rem;
        line-height: 1.4;
        color: #2d3748;
      }

      h4, h5, h6 {
        font-size: 1.1rem;
        font-weight: 600;
        color: #4a5568;
      }

      p {
        margin-bottom: 0.8em;
      }

      blockquote {
        border-left: 4px solid #3b82f6;
        background: #f8fafc;
        padding: 12px 20px;
        margin: 1.5em 0;
        border-radius: 0 8px 8px 0;
        color: #475569;
        font-style: italic;
      }

      hr {
        border-top: 1px solid #e2e8f0;
        margin: 2.5rem 0;
      }

      table {
        td, th {
          padding: 10px 14px;
          border-color: #e2e8f0;
        }
        th {
          background: #f1f5f9;
          font-weight: 600;
        }
      }

      ul, ol {
        margin: 0.8em 0 0.8em 0.4em;
        li p {
          margin-bottom: 0.3em;
        }
      }

      code {
        background: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.9em;
      }

      pre {
        background: #1e293b;
        border-radius: 8px;
        padding: 16px 20px;
        code {
          font-size: 0.85em;
        }
      }
    }

    .control-group {
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      padding: 8px 16px;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    @media ${layout.$breakpointMobile} {
      background: #fff;

      .editor-content {
        background: #fff;
        padding: 0;
      }

      .tiptap {
        box-shadow: none;
        padding: 20px 16px;
        min-height: 500px;
        font-size: 14px;

        h1 { font-size: 1.5rem; }
        h2 { font-size: 1.25rem; }
        h3 { font-size: 1.1rem; }
      }
    }
  }

  &.pagedle-mode.view {
    /* 미리보기: 편집 모드와 동일한 A4 레이아웃 유지 */
    .editor-content {
      background: #f0f0f0;
      padding: 32px 0;
      display: flex;
      justify-content: center;
    }

    .tiptap {
      background: #fff;
      max-width: 816px;
      width: 100%;
      margin: 0 auto;
      padding: 60px 72px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      min-height: unset;
    }
  }

  &.pagedle-mode.edit-false {
    background: #fff;

    .editor-content {
      background: #fff;
      padding: 0;
    }

    .tiptap {
      box-shadow: none;
      max-width: 100%;
      padding: 24px 0;
      min-height: unset;
    }
  }
  /* ===== End Pagedle word-processor mode ===== */

  menu,
  ol,
  ul {
    list-style: unset;
  }
  blockquote,
  q {
    quotes: unset;
  }
  blockquote:before,
  blockquote:after,
  q:before,
  q:after {
    content: '';
    content: unset;
  }
  table {
    border-collapse: unset;
    border-spacing: unset;
  }

  .editor-content {
    height: 100%;
    background: var(--white);
    overflow-y: auto;
    padding: 16px 0;
  }

  .ProseMirror {
    word-wrap: break-word;
    white-space: pre-wrap;
    white-space: break-spaces;
    -webkit-font-variant-ligatures: none;
    font-variant-ligatures: none;
    font-feature-settings: 'liga' 0;
  }

  /* placeholder 기본 스타일 */
  .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }

  /* Basic editor styles */
  .tiptap {
    caret-color: #000;
    margin: 1.5rem;

    :first-child {
      margin-top: 0;
    }

    /* List styles */
    ul,
    ol {
      padding: 0 1rem;
      margin: 1.25rem 1rem 1.25rem 0.4rem;

      li p {
        margin-top: 0.25em;
        margin-bottom: 0.25em;
      }
    }
    /* Task list specific styles */
    ul[data-type='taskList'] {
      list-style: none;
      margin-left: 0;
      padding: 0;

      li {
        align-items: center;
        display: flex;

        > label {
          flex: 0 0 auto;
          margin-right: 0.5rem;
          user-select: none;
        }

        > div {
          flex: 1 1 auto;
        }
      }

      input[type='checkbox'] {
        cursor: pointer;
      }
    }
    .task-item input[type='checkbox'] {
      pointer-events: auto;
    }

    /* Heading styles */
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      line-height: 1.1;
      margin-top: 2.5rem;
      text-wrap: pretty;
    }

    h1,
    h2 {
      margin-top: 3.5rem;
      margin-bottom: 1.5rem;
    }

    h1 {
      font-size: 1.4rem;
    }

    h2 {
      font-size: 1.2rem;
    }

    h3 {
      font-size: 1.1rem;
    }

    h4,
    h5,
    h6 {
      font-size: 1rem;
    }

    /* Code and preformatted text styles */
    code {
      background-color: var(--blue-light);
      border-radius: 0.4rem;
      color: var(--black);
      font-size: 0.85rem;
      padding: 0.25em 0.3em;
    }

    pre {
      background: var(--black);
      border-radius: 0.5rem;
      color: var(--white);
      font-family: 'JetBrainsMono', monospace;
      margin: 1.5rem 0;
      padding: 0.75rem 1rem;

      code {
        background: none;
        color: inherit;
        font-size: 0.8rem;
        padding: 0;
      }
    }

    blockquote {
      border-left: 3px solid var(--gray-3);
      margin: 1.5rem 0;
      padding-left: 1rem;
    }

    hr {
      border: none;
      border-top: 1px solid var(--gray-2);
      margin: 2rem 0;
    }
    a {
      color: var(--blue, #1a73e8);
      text-decoration: underline;
      cursor: pointer;
      &:hover {
        color: var(--blue-contrast, #1557b0);
      }
    }

    img {
      max-width: 100%;
    }
    iframe {
      max-width: 100%;
      height: 360px;
    }

    /* Table-specific styling */
    table {
      border-collapse: collapse;
      margin: 0;
      overflow: hidden;
      table-layout: fixed;
      width: 100%;

      td,
      th {
        border: 1px solid var(--gray-3);
        box-sizing: border-box;
        min-width: 1em;
        padding: 6px 8px;
        position: relative;
        vertical-align: top;

        > * {
          margin-bottom: 0;
        }
      }

      th {
        background-color: var(--gray-1);
        font-weight: bold;
        text-align: left;
      }

      .selectedCell:after {
        background: var(--gray-2);
        content: '';
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        pointer-events: none;
        position: absolute;
        z-index: 2;
      }

      .column-resize-handle {
        background-color: var(--purple);
        bottom: -2px;
        pointer-events: none;
        position: absolute;
        right: -2px;
        top: 0;
        width: 4px;
      }
    }

    .tableWrapper {
      margin: 1.5rem 0;
      overflow-x: auto;
    }

    &.resize-cursor {
      cursor: ew-resize;
      cursor: col-resize;
    }
  }

  *,
  *:before,
  *:after {
    box-sizing: border-box;
  }

  html {
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue,
      Arial, Noto Sans, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', Segoe UI Symbol, 'Noto Color Emoji';
    line-height: 1.5;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    min-height: 25rem;
    margin: 0;
  }

  :first-child {
    margin-top: 0;
  }

  .tiptap {
    caret-color: var(--blue);
    margin: 1.5rem;
  }

  .tiptap:focus {
    outline: none;
  }

  ::-webkit-scrollbar {
    height: 14px;
    width: 14px;
  }

  ::-webkit-scrollbar-track {
    background-clip: padding-box;
    background-color: transparent;
    border: 4px solid transparent;
    border-radius: 8px;
  }

  ::-webkit-scrollbar-thumb {
    background-clip: padding-box;
    background-color: #0000;
    border: 4px solid rgba(0, 0, 0, 0);
    border-radius: 8px;
  }

  :hover::-webkit-scrollbar-thumb {
    background-color: #0000001a;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: #00000026;
  }

  ::-webkit-scrollbar-button {
    display: none;
    height: 0;
    width: 0;
  }

  ::-webkit-scrollbar-corner {
    background-color: transparent;
  }

  /* 에디터 내부 네이티브 버튼만 스타일 적용 — MUI Button(.MuiButton*) 제외 */
  .control-group button:not([class*="MuiButton"]),
  .button-group button:not([class*="MuiButton"]),
  .switch-group button:not([class*="MuiButton"]) {
    background: var(--gray-2);
    border-radius: 0.5rem;
    border: none;
    color: var(--black);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.15;
    margin: unset;
    padding: 8px;
    transition: all 0.2s cubic-bezier(0.65, 0.05, 0.36, 1);
  }

  input,
  select,
  textarea {
    background: var(--gray-2);
    border-radius: 0.5rem;
    border: none;
    color: var(--black);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.15;
    margin: unset;
    padding: 8px;
    transition: all 0.2s cubic-bezier(0.65, 0.05, 0.36, 1);
  }

  .control-group button:not([class*="MuiButton"]):hover,
  .button-group button:not([class*="MuiButton"]):hover,
  .switch-group button:not([class*="MuiButton"]):hover {
    background-color: var(--gray-3);
    color: var(--black-contrast);
  }

  input:hover,
  select:hover,
  textarea:hover {
    background-color: var(--gray-3);
    color: var(--black-contrast);
  }

  .control-group button:not([class*="MuiButton"])[disabled],
  .button-group button:not([class*="MuiButton"])[disabled],
  .switch-group button:not([class*="MuiButton"])[disabled] {
    background: var(--gray-1);
    color: var(--gray-4);
  }

  input[disabled],
  select[disabled],
  textarea[disabled] {
    background: var(--gray-1);
    color: var(--gray-4);
  }

  button:checked,
  input:checked,
  select:checked,
  textarea:checked {
    accent-color: var(--blue);
  }

  .control-group button.primary:not([class*="MuiButton"]),
  .button-group button.primary:not([class*="MuiButton"]) {
    background: var(--black);
    color: var(--white);
  }

  .control-group button.primary:not([class*="MuiButton"]):hover,
  .button-group button.primary:not([class*="MuiButton"]):hover {
    background-color: var(--black-contrast);
  }

  .control-group button.primary:not([class*="MuiButton"])[disabled],
  .button-group button.primary:not([class*="MuiButton"])[disabled] {
    background: var(--gray-1);
    color: var(--gray-4);
  }

  .control-group button.is-active {
    background: var(--blue-light, #e8f0fe);
    color: var(--blue, #1a73e8);
  }

  .control-group button.is-active:hover {
    background-color: var(--blue-light, #d2e3fc);
    color: var(--blue-contrast, #1557b0);
  }

  [data-type='details'] {
    display: flex;
    gap: 0.25rem;
    margin: 1.5rem 0;
    border: 1px solid var(--gray-3);
    border-radius: 0.5rem;
    padding: 0.5rem;
  }

  [data-type='details'] summary {
    font-weight: 700;
  }

  [data-type='details'] > button {
    align-items: center;
    background: transparent;
    border-radius: 4px;
    display: flex;
    font-size: 0.625rem;
    height: 1.25rem;
    justify-content: center;
    line-height: 1;
    margin-top: 0.1rem;
    padding: 0;
    width: 1.25rem;
  }

  [data-type='details'] > button:hover {
    background-color: var(--gray-3);
  }

  [data-type='details'] > button:before {
    content: '▶';
  }

  [data-type='details'].is-open > button:before {
    transform: rotate(90deg);
  }

  [data-type='details'] > div {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  [data-type='details'] > div > [data-type='detailsContent'] > :last-child {
    margin-bottom: 0.5rem;
  }

  [data-type='details'] .details {
    margin: 0.5rem 0;
  }

  [data-type='taskList'] {
    list-style: none;
    padding: 0;
  }

  [data-type='taskList'] [data-type='taskList'] {
    padding-left: 1.5rem;
  }

  [data-type='taskList'] li {
    display: flex;
    align-items: flex-start;
    gap: 0.25rem;
  }

  [data-type='taskList'] > li > div > p:first-child {
    margin: 0;
  }

  [data-type='taskList'] > li:not(:first-child) {
    margin-top: 0.125rem;
  }

  [data-type='taskList'] > li:not(:last-child) {
    margin-bottom: 0.125rem;
  }

  [data-type='taskList'] [data-checked='true'] > div > p:first-child {
    text-decoration: line-through;
    color: var(--gray-4);
  }

  button:not([disabled]),
  select:not([disabled]) {
    cursor: pointer;
  }

  input[type='text'],
  textarea {
    background-color: unset;
    border: 1px solid var(--gray-3);
    border-radius: 0.5rem;
    color: var(--black);
  }

  input[type='text']::-moz-placeholder,
  textarea::-moz-placeholder {
    color: var(--gray-4);
  }

  input[type='text']::placeholder,
  textarea::placeholder {
    color: var(--gray-4);
  }

  input[type='text']:hover,
  textarea:hover {
    background-color: unset;
    border-color: var(--gray-4);
  }

  input[type='text']:focus-visible,
  input[type='text']:focus,
  textarea:focus-visible,
  textarea:focus {
    border-color: var(--blue);
    outline: none;
  }

  select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="Gray" d="M7 10l5 5 5-5z"/></svg>');
    background-repeat: no-repeat;
    background-position: right 0.1rem center;
    background-size: 1.25rem 1.25rem;
    padding-right: 1.25rem;
  }

  select:focus {
    outline: 0;
  }

  form {
    align-items: flex-start;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .hint {
    align-items: center;
    background-color: var(--yellow-light);
    border-radius: 0.5rem;
    border: 1px solid var(--gray-2);
    display: flex;
    flex-direction: row;
    font-size: 0.75rem;
    gap: 0.25rem;
    line-height: 1.15;
    padding: 0.3rem 0.5rem;
  }

  .hint.purple-spinner,
  .hint.error {
    justify-content: center;
    text-align: center;
    width: 100%;
  }

  .hint .badge {
    background-color: var(--gray-1);
    border: 1px solid var(--gray-3);
    border-radius: 2rem;
    color: var(--gray-5);
    font-size: 0.625rem;
    font-weight: 700;
    line-height: 1;
    padding: 0.25rem 0.5rem;
  }

  .hint.purple-spinner {
    background-color: var(--blue-light);
  }

  .hint.purple-spinner:after {
    content: '';
    background-image: url("data:image/svg+xml;utf8,<svg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='28px' height='30px' viewBox='0 0 24 30' style='enable-background:new 0 0 50 50;' xml:space='preserve'><rect x='0' y='10' width='6' height='10' fill='%236A00F5' rx='3' ry='3'><animateTransform attributeType='xml' attributeName='transform' type='translate' values='0 0; 0 5; 0 -5; 0 0' begin='0' dur='0.6s' repeatCount='indefinite'/></rect><rect x='10' y='10' width='6' height='10' fill='%236A00F5' rx='3' ry='3'><animateTransform attributeType='xml' attributeName='transform' type='translate' values='0 0; 0 5; 0 -5; 0 0' begin='0.2s' dur='0.6s' repeatCount='indefinite'/></rect><rect x='20' y='10' width='6' height='10' fill='%236A00F5' rx='3' ry='3'><animateTransform attributeType='xml' attributeName='transform' type='translate' values='0 0; 0 5; 0 -5; 0 0' begin='0.4s' dur='0.6s' repeatCount='indefinite'/></rect></svg>");
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    height: 1rem;
    width: 1rem;
  }

  .hint.error {
    background-color: var(--red-light);
  }

  .label,
  .label-small,
  .label-large {
    color: var(--black);
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.15;
  }

  .label-small {
    color: var(--gray-5);
    font-size: 0.75rem;
    font-weight: 400;
  }

  .label-large {
    font-size: 0.875rem;
    font-weight: 700;
  }

  hr {
    border: none;
    border-top: 1px solid var(--gray-3);
    margin: 0;
    width: 100%;
  }

  kbd {
    background-color: var(--gray-2);
    border: 1px solid var(--gray-2);
    border-radius: 0.25rem;
    font-size: 0.6rem;
    line-height: 1.15;
    padding: 0.1rem 0.25rem;
    text-transform: uppercase;
  }

  #app,
  .container {
    display: flex;
    flex-direction: column;
  }

  .toolbar-separator {
    width: 1px;
    height: 20px;
    background: var(--gray-2);
    margin: 0 2px;
    align-self: center;
    flex-shrink: 0;
  }

  .button-group {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    width: 100%;
    align-items: center;

    button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border-radius: 6px;
      background: transparent;
      border: none;
      color: var(--gray-6, #555);
      transition: all 0.15s ease;

      &:hover:not([disabled]) {
        background: var(--gray-1);
        color: var(--black);
      }

      &.is-active {
        background: var(--blue-light, #e8f0fe);
        color: var(--blue, #1a73e8);
      }

      &.is-active:hover {
        background: var(--blue-light, #d2e3fc);
        color: var(--blue-contrast, #1557b0);
      }

      &[disabled] {
        opacity: 0.3;
        cursor: not-allowed;
        background: transparent;
      }

      svg {
        font-size: 18px;
      }
    }
  }
  .bottom {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .control-group {
    align-items: flex-start;
    background-color: var(--white);
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--gray-2);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .control-group .sticky {
    position: sticky;
    top: 0;
  }

  [data-node-view-wrapper] > .control-group {
    padding: 0;
  }

  .flex-row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: space-between;
    width: 100%;
  }

  .switch-group {
    align-items: center;
    background: var(--gray-2);
    border-radius: 0.5rem;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    flex: 0 1 auto;
    justify-content: flex-start;
    padding: 0.125rem;
  }

  .switch-group label {
    align-items: center;
    border-radius: 0.375rem;
    color: var(--gray-5);
    cursor: pointer;
    display: flex;
    flex-direction: row;
    font-size: 0.75rem;
    font-weight: 500;
    gap: 0.25rem;
    line-height: 1.15;
    min-height: 1.5rem;
    padding: 0 0.375rem;
    transition: all 0.2s cubic-bezier(0.65, 0.05, 0.36, 1);
  }

  .switch-group label:has(input:checked) {
    background-color: var(--white);
    color: var(--black-contrast);
  }

  .switch-group label:hover {
    color: var(--black);
  }

  .switch-group label input {
    display: none;
    margin: unset;
  }

  .output-group {
    background-color: var(--gray-1);
    display: flex;
    flex-direction: column;
    font-family: JetBrainsMono, monospace;
    font-size: 0.75rem;
    gap: 1rem;
    margin-top: 2.5rem;
    padding: 1.5rem;
  }

  .output-group label {
    color: var(--black);
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1.15;
  }

  @media ${layout.$breakpointMobile} {
    &.fullwidth {
      width: calc(100% + 40px);
      margin-left: -20px;
    }

    .create-page-button {
      font-size: 16px;
    }

    .toolbar-separator {
      height: 16px;
      margin: 0 1px;
    }

    .button-group {
      justify-content: start;
      gap: 1px;

      &.end {
        justify-content: end;
      }
      button {
        width: 28px;
        height: 28px;
        font-size: 11px;
        padding: 0;
        svg {
          font-size: 15px;
        }
      }
    }

    .tiptap iframe {
      height: 280px;
    }
  }
`;
