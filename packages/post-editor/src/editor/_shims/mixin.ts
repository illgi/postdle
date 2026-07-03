// Shim of pagedle's @/styles/mixin — only the `layout` breakpoint object used by mdEditorStyle.

// ! 1200px  / 미만으로만 가기
export const MINI_MOBILE_SIZE = 360;
export const TABLET_SIZE = 720;
export const PC_SIZE = 1200;

export const layout = {
  $breakpointDesktop: `(max-width: ${PC_SIZE}px)`,
  $breakpointMobile: `(max-width: ${TABLET_SIZE}px)`,
  $breakpointMobileXs: `(max-width: ${MINI_MOBILE_SIZE}px)`,
};
