// Shim of pagedle's @/utils/validate — only isTouchOnlyDevice (copied verbatim).

/**
 * 터치 기기 판단 함수
 * @returns
 */
export const isTouchOnlyDevice = () => {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches;
};
