// 최소 마크다운 렌더러 — XSS 방지를 위해 먼저 HTML 이스케이프 후 제한된 문법만 변환.
// (원문이 HTML 타입이어도 이스케이프되어 스크립트 실행 불가)

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 인라인: 굵게/기울임/코드/링크 (링크는 http(s)만 허용)
function inline(s: string): string {
  let out = escapeHtml(s);
  // 코드 `x`
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  // 굵게 **x**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // 기울임 *x* (굵게 처리 후)
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // 링크 [text](http...) — 안전한 스킴만
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer nofollow">$1</a>');
  return out;
}

/** 마크다운 문자열 → 안전한 HTML 문자열 */
export function renderMarkdown(src: string): string {
  const lines = (src || '').replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      closeList();
      const level = h[1].length;
      html.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }
    const li = /^[-*]\s+(.*)$/.exec(line);
    if (li) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${inline(li[1])}</li>`);
      continue;
    }
    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      closeList();
      html.push(`<blockquote>${inline(quote[1])}</blockquote>`);
      continue;
    }
    closeList();
    html.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return html.join('\n');
}

/** 목록 미리보기용 순수 텍스트 (마크다운 기호 제거) */
export function plainPreview(src: string, max = 120): string {
  const text = (src || '')
    .replace(/[#>*`_\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? text.slice(0, max) + '…' : text;
}
