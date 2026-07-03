// Shim of pagedle's @/stores/common — only the atoms used by the editor subtree.
import { detectLanguage, type SupportedLang } from './i18n';
import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

// Global language store — persists to localStorage, defaults to 'ko' on SSR
const langLocalStorage = createJSONStorage<SupportedLang>(() =>
  typeof window !== 'undefined' ? localStorage : (undefined as any),
);
export const langStore = atomWithStorage<SupportedLang>('pagedle_lang', 'ko', langLocalStorage);

// Flag atom to track whether language has been client-side detected
export const langDetectedStore = atom<boolean>(false);

// memberInfoStore — copied minimal (editor subtree does not read member fields,
// but provided for parity with pagedle's store surface).
export type TMemberInfo = { id?: string; nickname?: string } | null;
const tempSessionStorage = createJSONStorage<TMemberInfo>(() =>
  typeof window !== 'undefined' ? sessionStorage : (undefined as any),
);
export const memberInfoStore = atomWithStorage<TMemberInfo>('keytemp', null, tempSessionStorage);

export { detectLanguage };
export type { SupportedLang };
