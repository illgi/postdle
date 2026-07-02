'use client';

import { useMemo } from 'react';
import { sanitizeHtml } from '@repo/post-editor';

/** 에디터 HTML을 살균해 렌더 (XSS 방지). */
export default function SafeHtml({ html, className }: { html: string; className?: string }) {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
