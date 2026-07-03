// Shim of pagedle's @/utils/date — only DATE_FORMAT used by the editor subtree.
export const DATE_FORMAT = {
  formatYYYYMMDDHHmmss: 'YYYY.MM.DD HH:mm:ss',
} as const;

export type TDateFormat = (typeof DATE_FORMAT)[keyof typeof DATE_FORMAT];
