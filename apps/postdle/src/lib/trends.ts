// Google Trends(대한민국) 실시간 인기 검색어 — 서버에서만 호출.
// RSS(xml)를 정규식으로 파싱(별도 xml 라이브러리 없이). 실패/빈값이면 [] 반환.

const TRENDS_URL = 'https://trends.google.com/trending/rss?geo=KR';

// 스포츠 대진("롯데 대 kt", "nc 대 kia" 등) — ' 대 ' 패턴은 화두로 부적절하므로 제외.
const SPORTS_MATCHUP = /\s대\s/;

/** Google Trends(KR) 인기 검색어 목록. 실패/빈값이면 []. */
export async function getTrendingTopics(): Promise<string[]> {
  try {
    const res = await fetch(TRENDS_URL, {
      // 1시간 캐시(ISR). 서버 컴포넌트에서 호출.
      next: { revalidate: 3600 },
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; postdle/1.0)' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    if (!xml) return [];

    const out: string[] = [];
    const seen = new Set<string>();
    // <item> … <title>…</title> … </item> 안의 title 만 추출(채널 title 제외).
    const itemRe = /<item\b[\s\S]*?<\/item>/gi;
    const titleRe = /<title>([\s\S]*?)<\/title>/i;
    let m: RegExpExecArray | null;
    while ((m = itemRe.exec(xml)) !== null) {
      const t = titleRe.exec(m[0]);
      if (!t) continue;
      const rawText = decodeEntities(t[1]).trim();
      if (!rawText) continue;
      // 스포츠 대진 제외
      if (SPORTS_MATCHUP.test(rawText)) continue;
      // 순수 중복 제거
      const key = rawText.replace(/\s+/g, ' ').toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(rawText);
    }
    return out;
  } catch {
    return [];
  }
}

// RSS title 안의 CDATA/기본 엔티티 정리.
function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}
