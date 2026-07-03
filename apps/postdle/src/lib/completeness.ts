// 완성도 색상 헬퍼 — pagedle getCompletenessColor 와 동일한 임계값을 공유.
// 에디터 패키지(@repo/post-editor)에 의존하지 않도록 앱 lib 에 별도로 둔다.
export function getCompletenessColor(pct: number): string {
  if (pct < 40) return 'var(--gray-4, #9aa1aa)';
  if (pct < 80) return '#e8a33d';
  return '#0f9d6b';
}
