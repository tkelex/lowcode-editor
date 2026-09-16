import { useEffect, useState } from 'react';
import * as ReactShared from 'react';
import * as ReactDOMShared from 'react-dom';
import * as antdShared from 'antd';
import type { PageMaterialDependency } from '@lowcode/schema';
import {
  builtinRuntimeRegistry,
  createRemoteMaterialHost,
  createRemoteMaterialLoader,
  installRemoteMaterialHost,
  uninstallRemoteMaterialHost,
  type RuntimeComponentRegistry,
} from '@lowcode/runtime/client';
import { listProjectRemoteMaterials } from '../../projects';
import { useComponentConfigStore } from '../registry/component-registry-store';
import {
  createRemoteEditorComponentConfigs,
  createRemoteParentAccepts,
} from './editor-adapter';

export type EditorRemoteMaterialStatus = 'loading' | 'ready' | 'error';

export interface EditorRemoteMaterialState {
  status: EditorRemoteMaterialStatus;
  runtimeRegistry: RuntimeComponentRegistry;
  loadedCount: number;
  totalCount: number;
  error?: string;
}

const initialState: EditorRemoteMaterialState = {
  status: 'loading',
  runtimeRegistry: builtinRuntimeRegistry,
  loadedCount: 0,
  totalCount: 0,
};

export function useEditorRemoteMaterials(projectId?: number) {
  const replaceRemoteComponents = useComponentConfigStore(
    (state) => state.replaceRemoteComponents,
  );
  const [state, setState] = useState<EditorRemoteMaterialState>(initialState);

  useEffect(() => {
    let disposed = false;
    let installedHost: ReturnType<typeof createRemoteMaterialHost> | undefined;

    replaceRemoteComponents({});
    setState(initialState);

    if (!projectId) {
      setState({ ...initialState, status: 'ready' });
      return undefined;
    }

    void listProjectRemoteMaterials(projectId)
      .then(async (records) => {
        if (disposed) return;
        const dependencies = records
          .filter((record) => record.status === 'enabled')
          .map(toPageMaterialDependency);

        setState((current) => ({
          ...current,
          totalCount: dependencies.length,
        }));

        installedHost = createRemoteMaterialHost({
          trustedDependencies: dependencies,
          shared: {
            React: ReactShared,
            ReactDOM: ReactDOMShared,
            antd: antdShared,
          },
          sharedVersions: {
            react: ReactShared.version,
            reactDom: ReactDOMShared.version,
            antd: antdShared.version,
          },
          initialRegistry: builtinRuntimeRegistry,
        });
        installRemoteMaterialHost(window, installedHost);

        const loader = createRemoteMaterialLoader({
          host: installedHost,
          allowedOrigins: parseAllowedOrigins(
            import.meta.env.VITE_REMOTE_MATERIAL_ALLOWED_ORIGINS,
          ),
        });
        const results = await loader.loadAll(dependencies);
        if (disposed) return;

        replaceRemoteComponents(
          createRemoteEditorComponentConfigs(results),
          createRemoteParentAccepts(dependencies),
        );
        setState({
          status: 'ready',
          runtimeRegistry: installedHost.getRegistry(),
          loadedCount: results.length,
          totalCount: dependencies.length,
        });
      })
      .catch((error) => {
        if (disposed) return;
        if (installedHost) {
          uninstallRemoteMaterialHost(window, installedHost);
          installedHost = undefined;
        }
        replaceRemoteComponents({});
        setState((current) => ({
          ...current,
          status: 'error',
          runtimeRegistry: builtinRuntimeRegistry,
          loadedCount: 0,
          error: formatRemoteMaterialError(error),
        }));
      });

    return () => {
      disposed = true;
      replaceRemoteComponents({});
      if (installedHost) {
        uninstallRemoteMaterialHost(window, installedHost);
      }
    };
  }, [projectId, replaceRemoteComponents]);

  return state;
}

function toPageMaterialDependency(record: PageMaterialDependency): PageMaterialDependency {
  return {
    protocolVersion: record.protocolVersion,
    packageName: record.packageName,
    version: record.version,
    manifestUrl: record.manifestUrl,
    entry: record.entry,
    ...(record.integrity ? { integrity: record.integrity } : {}),
    schemaVersion: record.schemaVersion,
    dependencies: { ...record.dependencies },
    materials: record.materials.map((material) => ({
      ...material,
      ...(material.allowedParents ? { allowedParents: [...material.allowedParents] } : {}),
      ...(Array.isArray(material.acceptsChildren)
        ? { acceptsChildren: [...material.acceptsChildren] }
        : material.acceptsChildren === true
          ? { acceptsChildren: true as const }
          : {}),
    })),
  };
}

function parseAllowedOrigins(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function formatRemoteMaterialError(error: unknown) {
  return error instanceof Error ? error.message : '远程物料加载失败';
}
