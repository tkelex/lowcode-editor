import { message } from 'antd';
import { useCallback, useState } from 'react';
import { createAiComponentTreeFingerprint, migratePageSchema } from '@lowcode/schema';
import {
  clearBrowserPageDraft,
  loadBrowserPageDraft,
  requestPageDraftRecovery,
  useComponentsStore,
  type EditorComponent,
} from '../../features/editor/public';
import { getPage, type ProjectRole } from '../../features/projects';

export interface LoadedEditorPageContext {
  pageId: number;
  projectId: number;
  projectRole?: ProjectRole;
  baselineFingerprint: string;
  serverUpdatedAt: string;
  serverRevision: number;
}

export function useEditorPageLoader(
  userId: number | undefined,
  onPageLoaded: (context: LoadedEditorPageContext) => void,
) {
  const [loadingPage, setLoadingPage] = useState(false);
  const setComponents = useComponentsStore((state) => state.setComponents);

  const openPage = useCallback(async (pageId: number, projectRole?: ProjectRole) => {
    setLoadingPage(true);
    try {
      const page = await getPage(pageId);
      const schema = migratePageSchema(page.schema, { pageId: page.id });
      const serverComponents = schema.components;
      const scope = userId && projectRole !== 'viewer'
        ? { userId, projectId: page.projectId, pageId: page.id }
        : undefined;
      let nextComponents = serverComponents as EditorComponent[];

      if (scope) {
        const draft = loadBrowserPageDraft({
          scope,
          serverComponents,
          serverUpdatedAt: page.updatedAt,
          serverRevision: page.revision,
        });

        if (draft.status === 'invalid') {
          message.warning(`本地草稿无法恢复，已使用服务端版本：${draft.reason}`);
        } else if (draft.status === 'recoverable') {
          const restore = await requestPageDraftRecovery(draft);
          if (restore) {
            nextComponents = draft.components as EditorComponent[];
          } else {
            clearBrowserPageDraft(scope);
          }
        }
      }

      setComponents(nextComponents, { recordHistory: false });
      onPageLoaded({
        pageId: page.id,
        projectId: page.projectId,
        projectRole,
        baselineFingerprint: createAiComponentTreeFingerprint(serverComponents),
        serverUpdatedAt: page.updatedAt,
        serverRevision: page.revision,
      });
    } catch {
      message.error('页面加载失败');
    } finally {
      setLoadingPage(false);
    }
  }, [onPageLoaded, setComponents, userId]);

  return {
    loadingPage,
    openPage,
  };
}
