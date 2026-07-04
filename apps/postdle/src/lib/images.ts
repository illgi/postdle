// 오늘의 이미지 — 시카고 미술관(Art Institute of Chicago) 공개도메인 API. 키 불필요.
// 실패 시 null 반환(랜딩에서 자동 대체). description 등은 저작권 안전한 사실 메타데이터.

export type Artwork = {
  id: number;
  imageUrl: string;
  title: string;
  artist: string;
  date: string;
  medium: string;
  origin: string;
  description: string;
  sourceUrl: string;
};

const strip = (s?: string | null): string =>
  (s || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

function toArtwork(a: any): Artwork | null {
  if (!a || !a.image_id) return null;
  return {
    id: Number(a.id),
    imageUrl: `https://www.artic.edu/iiif/2/${a.image_id}/full/843,/0/default.jpg`,
    title: strip(a.title) || '무제',
    artist: strip(a.artist_title),
    date: strip(a.date_display),
    medium: strip(a.medium_display),
    origin: strip(a.place_of_origin),
    description: strip(a.description),
    sourceUrl: `https://www.artic.edu/artworks/${a.id}`,
  };
}

const FIELDS = 'id,title,artist_title,date_display,medium_display,place_of_origin,description,image_id';

/** 오늘(seed 날짜)에 해당하는 공개도메인 작품 하나. 하루 단위로 안정적으로 선택. */
export async function getTodayImage(seed: Date = new Date()): Promise<Artwork | null> {
  try {
    const url =
      `https://api.artic.edu/api/v1/artworks/search?query[term][is_public_domain]=true` +
      `&query[exists][field]=image_id&fields=${FIELDS}&limit=100`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const j = await res.json();
    const list: any[] = Array.isArray(j?.data) ? j.data.filter((x: any) => x?.image_id) : [];
    if (list.length === 0) return null;
    // 연중 일자 기준으로 하루 동안 동일 작품
    const start = new Date(seed.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((seed.getTime() - start.getTime()) / 86400000);
    const pick = list[dayOfYear % list.length];
    return toArtwork(pick);
  } catch {
    return null;
  }
}

/** id 로 작품 상세 조회 (compose 프리필용). */
export async function getArtworkById(id: string | number): Promise<Artwork | null> {
  try {
    const res = await fetch(`https://api.artic.edu/api/v1/artworks/${encodeURIComponent(String(id))}?fields=${FIELDS}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const j = await res.json();
    return toArtwork(j?.data);
  } catch {
    return null;
  }
}

/** 미술관 메타데이터로 "이 이미지에 관한 정보" 글 자동 생성 (사실 기반, 저작권 안전). */
export function buildInfoHtml(a: Artwork): string {
  const head = [a.title, a.artist, a.date].filter(Boolean).join(' · ');
  const sub = [a.medium, a.origin].filter(Boolean).join(' · ');
  const parts: string[] = [];
  parts.push(`<p><img src="${a.imageUrl}" alt="${a.title}"></p>`);
  if (head) parts.push(`<p><strong>${head}</strong></p>`);
  if (sub) parts.push(`<p>${sub}</p>`);
  if (a.description) parts.push(`<p>${a.description}</p>`);
  parts.push(`<p>출처: 시카고 미술관 (공개도메인)</p>`);
  parts.push(`<p></p><p>이 작품을 보고 떠오른 생각은…</p><p></p>`);
  return parts.join('');
}
