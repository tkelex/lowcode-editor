import { message } from 'antd';
import { useCallback, useState } from 'react';
import { migratePageSchema } from '../../../packages/lowcode-schema/src';
import { Component, useComponetsStore } from '../../editor/stores/components';
import { getPage } from '../../shared/api/pages';

export function useEditorPageLoader(onPageLoaded: (pageId: number) => void) {
  const [loadingPage, setLoadingPage] = useState(false);
  const setComponents = useComponetsStore((state) => state.setComponents);

  const openPage = useCallback(async (pageId: number) => {
    setLoadingPage(true);
    try {
      const page = await getPage(pageId);
      const schema = migratePageSchema(page.schema, { pageId: page.id });
      setComponents(schema.components as Component[], { recordHistory: false });
      onPageLoaded(pageId);
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
