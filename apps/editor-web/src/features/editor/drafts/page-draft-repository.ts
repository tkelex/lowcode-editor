import {
  createAiComponentTreeFingerprint,
  migratePageSchema,
  validateComponentTree,
} from '@lowcode/schema';
import type {
  LowcodeComponentConfigMap,
  LowcodeComponentSchema,
} from '@lowcode/schema';

const PAGE_DRAFT_STORAGE_VERSION = 2;
const PAGE_DRAFT_STORAGE_PREFIX = 'lowcode-editor:draft';

export interface PageDraftScope {
  userId: number;
  projectId: number;
  pageId: number;
}

export interface PageDraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface LocalPageDraftEnvelope extends PageDraftScope {
  storageVersion: number;
  components: LowcodeComponentSchema[];
  baselineFingerprint: string;
  serverUpdatedAt: string;
  serverRevision: number;
  localUpdatedAt: string;
  dirty: true;
}

interface CreatePageDraftRepositoryOptions {
  storage: PageDraftStorage;
  now?: () => string;
}

interface SavePageDraftInput {
  scope: PageDraftScope;
  components: LowcodeComponentSchema[];
  baselineFingerprint: string;
  serverUpdatedAt: string;
  serverRevision: number;
  componentConfig: LowcodeComponentConfigMap;
}

interface LoadPageDraftInput {
  scope: PageDraftScope;
  serverComponents: LowcodeComponentSchema[];
  serverUpdatedAt: string;
  serverRevision: number;
  componentConfig: LowcodeComponentConfigMap;
}

export type PageDraftLoadResult =
  | { status: 'none' }
  | { status: 'invalid'; reason: string }
  | {
    status: 'recoverable';
    components: LowcodeComponentSchema[];
    localUpdatedAt: string;
    serverChanged: boolean;
  };

export function createPageDraftRepository(options: CreatePageDraftRepositoryOptions) {
  const now = options.now ?? (() => new Date().toISOString());

  return {
    save(input: SavePageDraftInput) {
      const validation = validateComponentTree(input.components, input.componentConfig);
      if (!validation.valid || !validation.components) {
        throw new Error(validation.errors[0] || '本地草稿组件树不合法');
      }

      const envelope: LocalPageDraftEnvelope = {
        storageVersion: PAGE_DRAFT_STORAGE_VERSION,
        ...input.scope,
        components: cloneComponents(validation.components),
        baselineFingerprint: input.baselineFingerprint,
        serverUpdatedAt: input.serverUpdatedAt,
        serverRevision: input.serverRevision,
        localUpdatedAt: now(),
        dirty: true,
      };

      options.storage.setItem(createPageDraftStorageKey(input.scope), JSON.stringify(envelope));
    },

    load(input: LoadPageDraftInput): PageDraftLoadResult {
      const key = createPageDraftStorageKey(input.scope);
      const raw = options.storage.getItem(key);
      if (!raw) return { status: 'none' };

      try {
        const envelope = parseEnvelope(raw, input.scope);
        const migrated = migratePageSchema(
          { components: envelope.components },
          { pageId: input.scope.pageId, now: now() },
        );
        const validation = validateComponentTree(migrated.components, input.componentConfig);
        if (!validation.valid || !validation.components) {
          throw new Error(validation.errors[0] || '本地草稿组件树不合法');
        }

        const components = cloneComponents(validation.components);
        const serverFingerprint = createAiComponentTreeFingerprint(input.serverComponents);
        if (createAiComponentTreeFingerprint(components) === serverFingerprint) {
          options.storage.removeItem(key);
          return { status: 'none' };
        }

        return {
          status: 'recoverable',
          components,
          localUpdatedAt: envelope.localUpdatedAt,
          serverChanged: envelope.baselineFingerprint !== serverFingerprint
            || envelope.serverUpdatedAt !== input.serverUpdatedAt
            || envelope.serverRevision !== input.serverRevision,
        };
      } catch (error) {
        options.storage.removeItem(key);
        return {
          status: 'invalid',
          reason: error instanceof Error ? error.message : '本地草稿无法解析',
        };
      }
    },

    clear(scope: PageDraftScope) {
      options.storage.removeItem(createPageDraftStorageKey(scope));
    },
  };
}

export function createPageDraftStorageKey(scope: PageDraftScope) {
  return `${PAGE_DRAFT_STORAGE_PREFIX}:${scope.userId}:${scope.projectId}:${scope.pageId}`;
}

function parseEnvelope(raw: string, scope: PageDraftScope): LocalPageDraftEnvelope {
  const value = JSON.parse(raw) as Partial<LocalPageDraftEnvelope>;
  if (
    !value
    || typeof value !== 'object'
    || value.storageVersion !== PAGE_DRAFT_STORAGE_VERSION
    || value.userId !== scope.userId
    || value.projectId !== scope.projectId
    || value.pageId !== scope.pageId
    || !Array.isArray(value.components)
    || !value.components.some((component) => component?.name === 'Page')
    || typeof value.baselineFingerprint !== 'string'
    || typeof value.serverUpdatedAt !== 'string'
    || !Number.isInteger(value.serverRevision)
    || Number(value.serverRevision) < 1
    || typeof value.localUpdatedAt !== 'string'
    || value.dirty !== true
  ) {
    throw new Error('本地草稿格式或作用域不合法');
  }

  return value as LocalPageDraftEnvelope;
}

function cloneComponents(components: LowcodeComponentSchema[]) {
  return JSON.parse(JSON.stringify(components)) as LowcodeComponentSchema[];
}
