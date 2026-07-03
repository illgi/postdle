// Shim of pagedle's @/constants/commonCode + @/types/commonCode — PAGE_CONTENT_TYPE & TPageContentType.

export const PAGE_CONTENT_TYPE = {
  HTML: 'HTML',
  MARKDOWN: 'MARKDOWN',
} as const;

export type TPageContentType = (typeof PAGE_CONTENT_TYPE)[keyof typeof PAGE_CONTENT_TYPE];
