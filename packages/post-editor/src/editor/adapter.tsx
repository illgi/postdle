'use client';
// EditorAdapter — injects app-specific backend couplings into the ported editor
// (image upload, form listing, autosave). Default is an empty object so the
// editor renders fully standalone with those features gated off.
import { createContext, useContext } from 'react';

export type EditorForm = { id: string; title: string };

export type EditorAdapter = {
  /** Upload an image file, returning an accessible URL. */
  onImageUpload?: (file: File) => Promise<string>;
  /** List forms the current user can link to. When absent, the Form-link toolbar button is hidden. */
  listForms?: () => Promise<EditorForm[]>;
  /** Autosave callback. When absent, AutoSave renders nothing. */
  onAutoSave?: (html: string) => void;
};

export const EditorAdapterContext = createContext<EditorAdapter>({});

export function useEditorAdapter(): EditorAdapter {
  return useContext(EditorAdapterContext);
}
