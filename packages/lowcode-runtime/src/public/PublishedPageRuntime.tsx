'use client';

import { useEffect, useMemo, useState } from 'react';
import * as ReactShared from 'react';
import * as ReactDOMShared from 'react-dom';
import * as antdShared from 'antd';
import { PageRuntime } from '../PageRuntime';
import { builtinRuntimeRegistry } from '../registry';
import {
  createRemoteMaterialHost,
  installRemoteMaterialHost,
  uninstallRemoteMaterialHost,
} from '../remote-material-host';
import { createRemoteMaterialLoader } from '../remote-material-loader';
import type {
  RuntimeComponent,
  RuntimeComponentRegistry,
  RuntimePolicy,
} from '../types';
import {
  preparePublishedPageSnapshot,
  type PublishedPageSnapshot,
} from './snapshot';

export interface PublishedPageRuntimeProps {
  snapshot: PublishedPageSnapshot;
  apiBaseUrl: string;
  allowedOrigins: string[];
  remoteMaterialAllowedOrigins?: string[];
  onError?: RuntimePolicy['onError'];
}

type RemoteMaterialRuntimeState =
  | { status: 'loading' }
  | { status: 'ready'; registry: RuntimeComponentRegistry }
  | { status: 'error'; message: string };

const EMPTY_REMOTE_MATERIAL_ALLOWED_ORIGINS: string[] = [];

export function PublishedPageRuntime({
  snapshot,
  apiBaseUrl,
  allowedOrigins,
  remoteMaterialAllowedOrigins = EMPTY_REMOTE_MATERIAL_ALLOWED_ORIGINS,
  onError,
}: PublishedPageRuntimeProps) {
  const prepared = useMemo(() => preparePublishedPageSnapshot(snapshot), [snapshot]);
  const hasRemoteMaterials = prepared.materialDependencies.length > 0;
  const [remoteMaterialState, setRemoteMaterialState] = useState<RemoteMaterialRuntimeState>(
    () => hasRemoteMaterials
      ? { status: 'loading' }
      : { status: 'ready', registry: builtinRuntimeRegistry },
  );

  useEffect(() => {
    if (!hasRemoteMaterials) {
      setRemoteMaterialState({ status: 'ready', registry: builtinRuntimeRegistry });
      return undefined;
    }

    let disposed = false;
    const host = createRemoteMaterialHost({
      trustedDependencies: prepared.materialDependencies,
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

    setRemoteMaterialState({ status: 'loading' });

    try {
      installRemoteMaterialHost(window, host);
      const loader = createRemoteMaterialLoader({
        host,
        allowedOrigins: remoteMaterialAllowedOrigins,
      });
      void loader.loadAll(prepared.materialDependencies)
        .then(() => {
          if (disposed) return;
          setRemoteMaterialState({ status: 'ready', registry: host.getRegistry() });
        })
        .catch((error) => {
          if (disposed) return;
          uninstallRemoteMaterialHost(window, host);
          onError?.(error, { source: 'render' });
          setRemoteMaterialState({
            status: 'error',
            message: formatRemoteMaterialError(error),
          });
        });
    } catch (error) {
      uninstallRemoteMaterialHost(window, host);
      onError?.(error, { source: 'render' });
      setRemoteMaterialState({
        status: 'error',
        message: formatRemoteMaterialError(error),
      });
    }

    return () => {
      disposed = true;
      uninstallRemoteMaterialHost(window, host);
    };
  }, [hasRemoteMaterials, onError, prepared, remoteMaterialAllowedOrigins]);

  if (remoteMaterialState.status === 'loading') {
    return <PublishedRemoteMaterialState
      title="正在加载页面物料"
      description="页面依赖正在进行来源、版本和完整性校验，请稍候。"
    />;
  }

  if (remoteMaterialState.status === 'error') {
    return <PublishedRemoteMaterialState
      title="页面物料加载失败"
      description={remoteMaterialState.message}
      error
    />;
  }

  return <PageRuntime
    components={prepared.schema.components as RuntimeComponent[]}
    registry={remoteMaterialState.registry}
    policy={{
      apiBaseUrl,
      allowedOrigins,
      getAuthToken: () => undefined,
      allowCustomJS: false,
      onError,
    }}
  />;
}

function PublishedRemoteMaterialState({
  title,
  description,
  error = false,
}: {
  title: string;
  description: string;
  error?: boolean;
}) {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
    <section className={`w-full max-w-[520px] rounded-lg border bg-white p-6 shadow-sm ${error ? 'border-red-200' : 'border-slate-200'}`}>
      <h1 className={`m-0 text-[18px] font-semibold ${error ? 'text-red-800' : 'text-slate-900'}`}>
        {title}
      </h1>
      <p className="mb-0 mt-2 text-[13px] leading-6 text-slate-600">
        {description}
      </p>
    </section>
  </main>;
}

function formatRemoteMaterialError(error: unknown) {
  return error instanceof Error
    ? error.message
    : '请稍后重试，或联系页面维护者检查物料配置。';
}
