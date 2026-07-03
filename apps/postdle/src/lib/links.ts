// 제목 기반 2-depth 게시글 경로 헬퍼.
// 메인 도메인(/u/유저명/제목)과 서브도메인(미들웨어가 /u 통과) 양쪽에서 동작한다.
export function postHref(username: string, pageName?: string): string {
  return `/u/${encodeURIComponent(username)}/${encodeURIComponent(pageName ?? '')}`;
}
