import {
  createPageMaterialDependency,
  type PageMaterialDependency,
} from '@lowcode/schema';
import type {
  LowcodeMaterialHost,
  RemoteEditorMaterialDefinition,
} from './remote-material-host';
import type { RuntimeComponentRegistry } from './types';

export interface RemoteMaterialScriptElement {
  async: boolean;
  crossOrigin: string;
  integrity: string;
  onerror: ((event: Event) => void) | null;
  onload: ((event: Event) => void) | null;
  remove?: () => void;
  src: string;
}

export interface RemoteMaterialDocument {
  createElement(tagName: 'script'): RemoteMaterialScriptElement;
  head: {
    appendChild(script: RemoteMaterialScriptElement): unknown;
  };
}

export interface CreateRemoteMaterialLoaderOptions {
  host: LowcodeMaterialHost;
  allowedOrigins: readonly string[];
  fetchImpl?: typeof fetch;
  document?: RemoteMaterialDocument;
  cryptoImpl?: Pick<Crypto, 'subtle'>;
  timeoutMs?: number;
}

export interface RemoteMaterialLoadResult {
  key: string;
  materialNames: string[];
  registry: RuntimeComponentRegistry;
  editorMaterials?: Record<string, RemoteEditorMaterialDefinition>;
}

export interface RemoteMaterialLoader {
  load(dependency: PageMaterialDependency): Promise<RemoteMaterialLoadResult>;
  loadAll(dependencies: readonly PageMaterialDependency[]): Promise<RemoteMaterialLoadResult[]>;
}

export class RemoteMaterialLoaderError extends Error {
  constructor(
    readonly code:
      | 'ORIGIN_NOT_ALLOWED'
      | 'PROTOCOL_NOT_ALLOWED'
      | 'MANIFEST_FETCH_FAILED'
      | 'MANIFEST_MISMATCH'
      | 'ENTRY_LOAD_FAILED'
      | 'INTEGRITY_FAILED'
      | 'REGISTRATION_MISSING'
      | 'REGISTRATION_TIMEOUT',
    message: string,
  ) {
    super(message);
    this.name = 'RemoteMaterialLoaderError';
  }
}

export function createRemoteMaterialLoader({
  host,
  allowedOrigins,
  fetchImpl = fetch,
  document = globalThis.document as unknown as RemoteMaterialDocument,
  cryptoImpl = globalThis.crypto,
  timeoutMs = 10_000,
}: CreateRemoteMaterialLoaderOptions): RemoteMaterialLoader {
  const loadPromises = new Map<string, Promise<RemoteMaterialLoadResult>>();

  function load(dependency: PageMaterialDependency) {
    const cacheKey = `${dependency.packageName}@${dependency.version}:${dependency.entry}`;
    const cached = loadPromises.get(cacheKey);
    if (cached) return cached;

    const promise = loadUncached(dependency);
    loadPromises.set(cacheKey, promise);
    void promise.catch(() => {
      if (loadPromises.get(cacheKey) === promise) {
        loadPromises.delete(cacheKey);
      }
    });
    return promise;
  }

  async function loadUncached(dependency: PageMaterialDependency) {
    assertAllowedUrl(dependency.manifestUrl, allowedOrigins);
    assertAllowedUrl(dependency.entry, allowedOrigins);
    let response: Response;
    try {
      response = await fetchImpl(dependency.manifestUrl);
    } catch (error) {
      throw new RemoteMaterialLoaderError(
        'MANIFEST_FETCH_FAILED',
        `远程物料 manifest 请求失败：${formatErrorMessage(error)}`,
      );
    }
    if (!response.ok) {
      throw new RemoteMaterialLoaderError(
        'MANIFEST_FETCH_FAILED',
        `远程物料 manifest 请求失败：HTTP ${response.status}`,
      );
    }

    let fetchedDependency: PageMaterialDependency;
    try {
      const manifest = await response.json();
      fetchedDependency = createPageMaterialDependency(manifest, dependency.manifestUrl);
    } catch (error) {
      throw new RemoteMaterialLoaderError(
        'MANIFEST_MISMATCH',
        `远程物料 manifest 无法校验：${formatErrorMessage(error)}`,
      );
    }
    if (JSON.stringify(fetchedDependency) !== JSON.stringify(dependency)) {
      throw new RemoteMaterialLoaderError(
        'MANIFEST_MISMATCH',
        `远程物料 manifest 与固定依赖不一致：${dependency.packageName}@${dependency.version}`,
      );
    }

    await verifyEntryIntegrity(dependency, fetchImpl, cryptoImpl);
    await appendScript(document, dependency, timeoutMs);
    const registration = host.getRegistration(dependency.packageName, dependency.version);
    const materialNames = dependency.materials.map((material) => material.name).sort();
    if (!registration) {
      throw new RemoteMaterialLoaderError(
        'REGISTRATION_MISSING',
        `远程物料脚本未注册固定包 ${dependency.packageName}@${dependency.version}：${materialNames.join(', ')}`,
      );
    }
    const registry = host.getRegistry();
    const missingMaterial = materialNames.find((name) => !registry[name]);
    if (missingMaterial) {
      throw new RemoteMaterialLoaderError(
        'REGISTRATION_MISSING',
        `远程物料脚本未注册组件：${missingMaterial}`,
      );
    }

    return {
      key: `${dependency.packageName}@${dependency.version}`,
      materialNames,
      registry,
      ...(registration.editorMaterials
        ? { editorMaterials: registration.editorMaterials }
        : {}),
    };
  }

  return {
    load,
    loadAll(dependencies) {
      return Promise.all(dependencies.map(load));
    },
  };
}

async function verifyEntryIntegrity(
  dependency: PageMaterialDependency,
  fetchImpl: typeof fetch,
  cryptoImpl: Pick<Crypto, 'subtle'>,
) {
  if (!dependency.integrity) return;

  let response: Response;
  try {
    response = await fetchImpl(dependency.entry);
  } catch (error) {
    throw new RemoteMaterialLoaderError(
      'ENTRY_LOAD_FAILED',
      `远程物料 entry 请求失败 ${dependency.entry}：${formatErrorMessage(error)}`,
    );
  }
  if (!response.ok) {
    throw new RemoteMaterialLoaderError(
      'ENTRY_LOAD_FAILED',
      `远程物料 entry 请求失败 ${dependency.entry}：HTTP ${response.status}`,
    );
  }

  const [algorithm, expectedDigest] = dependency.integrity.split('-', 2);
  const bytes = await response.arrayBuffer();
  let digest: ArrayBuffer;
  try {
    digest = await cryptoImpl.subtle.digest(toWebCryptoAlgorithm(algorithm), bytes);
  } catch (error) {
    throw new RemoteMaterialLoaderError(
      'INTEGRITY_FAILED',
      `远程物料 integrity 校验无法执行：${formatErrorMessage(error)}`,
    );
  }
  const actualDigest = arrayBufferToBase64(digest);
  if (actualDigest !== expectedDigest) {
    throw new RemoteMaterialLoaderError(
      'INTEGRITY_FAILED',
      `远程物料 integrity 校验失败：${dependency.entry}`,
    );
  }
}

function toWebCryptoAlgorithm(algorithm: string) {
  return algorithm.replace(/^sha(\d+)$/i, 'SHA-$1').toUpperCase();
}

function arrayBufferToBase64(value: ArrayBuffer) {
  let binary = '';
  for (const byte of new Uint8Array(value)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function formatErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function assertAllowedUrl(urlValue: string, allowedOrigins: readonly string[]) {
  const url = new URL(urlValue);
  const isLocalHttp = url.protocol === 'http:'
    && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !isLocalHttp) {
    throw new RemoteMaterialLoaderError(
      'PROTOCOL_NOT_ALLOWED',
      `远程物料只允许 HTTPS，本地开发可使用 localhost HTTP：${url.origin}`,
    );
  }
  const allowed = allowedOrigins.some((originValue) => {
    try {
      return new URL(originValue).origin === url.origin;
    } catch {
      return false;
    }
  });
  if (!allowed) {
    throw new RemoteMaterialLoaderError(
      'ORIGIN_NOT_ALLOWED',
      `远程物料来源未在 allowlist 中：${url.origin}`,
    );
  }
}

function appendScript(
  document: RemoteMaterialDocument,
  dependency: PageMaterialDependency,
  timeoutMs: number,
) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    const cleanup = () => {
      script.onload = null;
      script.onerror = null;
      script.remove?.();
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new RemoteMaterialLoaderError(
        'REGISTRATION_TIMEOUT',
        `远程物料在 ${timeoutMs}ms 内未完成加载和注册：${dependency.packageName}@${dependency.version}`,
      ));
    }, timeoutMs);
    script.async = true;
    script.src = dependency.entry;
    script.crossOrigin = 'anonymous';
    script.integrity = dependency.integrity || '';
    script.onload = () => {
      clearTimeout(timer);
      cleanup();
      resolve();
    };
    script.onerror = () => {
      clearTimeout(timer);
      cleanup();
      reject(new RemoteMaterialLoaderError(
        dependency.integrity ? 'INTEGRITY_FAILED' : 'ENTRY_LOAD_FAILED',
        dependency.integrity
          ? `浏览器拒绝执行未通过 integrity 校验的远程物料：${dependency.entry}`
          : `远程物料 entry 加载失败：${dependency.entry}`,
      ));
    };
    try {
      document.head.appendChild(script);
    } catch (error) {
      clearTimeout(timer);
      cleanup();
      reject(new RemoteMaterialLoaderError(
        'ENTRY_LOAD_FAILED',
        `远程物料 entry 注入失败：${formatErrorMessage(error)}`,
      ));
    }
  });
}
