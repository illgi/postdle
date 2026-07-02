import DOMPurify from 'dompurify';

/** 에디터가 만든 HTML을 렌더 전에 살균 (XSS 방지). 브라우저(클라이언트)에서 호출. */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return '';
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'target'],
  });
}
