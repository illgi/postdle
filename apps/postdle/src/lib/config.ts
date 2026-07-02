// 전역 상수 (브랜드/도메인)
export const BRAND = {
  name: 'Postdle',
  nameKr: '포스트들',
} as const;

export const POSTDLE_CATEGORY = 'postdle';

export function rootDomain(): string {
  return (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'postdle.com').split(':')[0];
}

// 쿠키 도메인 (.postdle.com — 서브도메인 공유). localhost 계열은 undefined.
export function cookieDomain(): string | undefined {
  const root = rootDomain();
  if (root === 'localhost' || root.endsWith('.localhost') || /^\d+\.\d+\.\d+\.\d+$/.test(root)) return undefined;
  return root.includes('.') ? '.' + root : undefined;
}
