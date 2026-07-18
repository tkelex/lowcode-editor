import { message } from 'antd';
import { useCallback, useState } from 'react';
import { migratePageSchema } from '@lowcode/schema';
import { useComponentsStore, type EditorComponent } from '../../features/editor/public';
import { getPage, type ProjectRole } from '../../features/projects';

export function useEditorPageLoader(onPageLoaded: (pageId: number, projectId?: number, projectRole?: ProjectRole) => void) {
  const [loadingPage, setLoadingPage] = useState(false);
  const setComponents = useComponentsStore((state) => state.setComponents);

  const openPage = useCallback(async (pageId: number, projectRole?: ProjectRole) => {
    setLoadingPage(true);
    try {
      const page = await getPage(pageId);
      const schema = migratePageSchema(page.schema, { pageId: page.id });
      setComponents(schema.components as EditorComponent[], { recordHistory: false });
      onPageLoaded(pageId, page.projectId, projectRole);
    } catch {
      message.error('页面加载失败');
    } finally {
      setLoadingPage(false);
    }
  }, [onPageLoaded, setComponents]);

  return {
    loadingPage,
    openPage,
  };
}
