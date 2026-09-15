import type { LowcodeComponentSchema } from '@lowcode/schema';
import { useComponentConfigStore } from '../registry/component-registry-store';
import {
  createPageDraftRepository,
  type PageDraftLoadResult,
  type PageDraftScope,
} from './page-draft-repository';

interface LoadBrowserPageDraftInput {
  scope: PageDraftScope;
  serverComponents: LowcodeComponentSchema[];
  serverUpdatedAt: string;
  serverRevision: number;
}

interface SaveBrowserPageDraftInput {
  scope: PageDraftScope;
  components: LowcodeComponentSchema[];
  baselineFingerprint: string;
  serverUpdatedAt: string;
  serverRevision: number;
}

export function saveBrowserPageDraft(input: SaveBrowserPageDraftInput) {
  if (typeof window === 'undefined') return;

  createBrowserPageDraftRepository().save({
    ...input,
    componentConfig: useComponentConfigStore.getState().componentConfig,
  });
}

export function loadBrowserPageDraft(input: LoadBrowserPageDraftInput): PageDraftLoadResult {
  if (typeof window === 'undefined') return { status: 'none' };

  return createBrowserPageDraftRepository().load({
    ...input,
    componentConfig: useComponentConfigStore.getState().componentConfig,
  });
}

export function clearBrowserPageDraft(scope: PageDraftScope) {
  if (typeof window === 'undefined') return;
  createBrowserPageDraftRepository().clear(scope);
}

function createBrowserPageDraftRepository() {
  return createPageDraftRepository({ storage: window.localStorage });
}
