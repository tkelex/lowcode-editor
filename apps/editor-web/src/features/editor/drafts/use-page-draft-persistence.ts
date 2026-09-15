import { createAiComponentTreeFingerprint } from '@lowcode/schema';
import type { LowcodeComponentSchema } from '@lowcode/schema';
import { useCallback, useEffect, useRef } from 'react';
import type { ProjectRole } from '../../projects';
import { useComponentsStore, type Component } from '../stores/editor-store';
import { clearBrowserPageDraft, saveBrowserPageDraft } from './browser-page-drafts';

const PAGE_DRAFT_SAVE_DELAY_MS = 500;

interface UsePageDraftPersistenceOptions {
  userId?: number;
  projectId?: number;
  pageId?: number;
  projectRole?: ProjectRole;
  baselineFingerprint?: string;
  serverUpdatedAt?: string;
}

export function usePageDraftPersistence(options: UsePageDraftPersistenceOptions) {
  const components = useComponentsStore((state) => state.components);
  const baselineFingerprintRef = useRef(options.baselineFingerprint);
  const serverUpdatedAtRef = useRef(options.serverUpdatedAt);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    baselineFingerprintRef.current = options.baselineFingerprint;
    serverUpdatedAtRef.current = options.serverUpdatedAt;
  }, [
    options.baselineFingerprint,
    options.pageId,
    options.projectId,
    options.serverUpdatedAt,
    options.userId,
  ]);

  useEffect(() => {
    window.clearTimeout(timerRef.current);
    const baselineFingerprint = baselineFingerprintRef.current;
    const serverUpdatedAt = serverUpdatedAtRef.current;
    const schemaComponents = asSchemaComponents(components);

    if (
      !options.userId
      || !options.projectId
      || !options.pageId
      || options.projectRole === 'viewer'
      || !baselineFingerprint
      || !serverUpdatedAt
      || createAiComponentTreeFingerprint(schemaComponents) === baselineFingerprint
    ) {
      return;
    }

    timerRef.current = window.setTimeout(() => {
      saveBrowserPageDraft({
        scope: {
          userId: options.userId!,
          projectId: options.projectId!,
          pageId: options.pageId!,
        },
        components: schemaComponents,
        baselineFingerprint,
        serverUpdatedAt,
      });
    }, PAGE_DRAFT_SAVE_DELAY_MS);

    return () => window.clearTimeout(timerRef.current);
  }, [
    components,
    options.pageId,
    options.projectId,
    options.projectRole,
    options.userId,
  ]);

  const markSaved = useCallback((savedComponents: Component[], serverUpdatedAt: string) => {
    if (!options.userId || !options.projectId || !options.pageId) return;

    window.clearTimeout(timerRef.current);
    const scope = {
      userId: options.userId,
      projectId: options.projectId,
      pageId: options.pageId,
    };
    const savedFingerprint = createAiComponentTreeFingerprint(asSchemaComponents(savedComponents));
    baselineFingerprintRef.current = savedFingerprint;
    serverUpdatedAtRef.current = serverUpdatedAt;
    clearBrowserPageDraft(scope);

    const currentComponents = useComponentsStore.getState().components;
    const currentSchemaComponents = asSchemaComponents(currentComponents);
    if (createAiComponentTreeFingerprint(currentSchemaComponents) !== savedFingerprint) {
      saveBrowserPageDraft({
        scope,
        components: currentSchemaComponents,
        baselineFingerprint: savedFingerprint,
        serverUpdatedAt,
      });
    }
  }, [options.pageId, options.projectId, options.userId]);

  return { markSaved };
}

function asSchemaComponents(components: Component[]) {
  return components as unknown as LowcodeComponentSchema[];
}
