import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);

describe('page draft repository', () => {
  it('restores an unsaved component tree for the same user, project and page', async () => {
    const { createPageDraftRepository } = await loadModule(
      'apps/editor-web/src/features/editor/drafts/page-draft-repository.ts',
    );
    const storage = new MemoryStorage();
    const repository = createPageDraftRepository({ storage, now: () => '2026-09-15T10:00:00.000Z' });
    const scope = { userId: 7, projectId: 11, pageId: 13 };
    const serverComponents = pageWithText('服务端内容');
    const localComponents = pageWithText('未保存内容');

    repository.save({
      scope,
      components: localComponents,
      baselineFingerprint: '[{"children":[{"desc":"按钮","id":2,"name":"Button","parentId":1,"props":{"text":"服务端内容"}}],"desc":"页面","id":1,"name":"Page","props":{}}]',
      serverUpdatedAt: '2026-09-15T09:00:00.000Z',
      serverRevision: 1,
      componentConfig: componentConfig(),
    });

    const result = repository.load({
      scope,
      serverComponents,
      serverUpdatedAt: '2026-09-15T09:00:00.000Z',
      serverRevision: 1,
      componentConfig: componentConfig(),
    });

    assert.equal(result.status, 'recoverable');
    assert.deepEqual(result.components, localComponents);
    assert.equal(result.localUpdatedAt, '2026-09-15T10:00:00.000Z');
    assert.equal(result.serverChanged, false);
  });

  it('detects a newer server revision even when the timestamp did not change', async () => {
    const { createPageDraftRepository } = await loadModule(
      'apps/editor-web/src/features/editor/drafts/page-draft-repository.ts',
    );
    const storage = new MemoryStorage();
    const repository = createPageDraftRepository({ storage, now: () => '2026-09-15T10:00:00.000Z' });
    const scope = { userId: 7, projectId: 11, pageId: 13 };
    const serverComponents = pageWithText('服务端内容');

    repository.save({
      scope,
      components: pageWithText('未保存内容'),
      baselineFingerprint: '[{"children":[{"desc":"按钮","id":2,"name":"Button","parentId":1,"props":{"text":"服务端内容"}}],"desc":"页面","id":1,"name":"Page","props":{}}]',
      serverUpdatedAt: '2026-09-15T09:00:00.000Z',
      serverRevision: 3,
      componentConfig: componentConfig(),
    });

    const result = repository.load({
      scope,
      serverComponents,
      serverUpdatedAt: '2026-09-15T09:00:00.000Z',
      serverRevision: 4,
      componentConfig: componentConfig(),
    });

    assert.equal(result.status, 'recoverable');
    assert.equal(result.serverChanged, true);
  });

  it('rejects a draft without a Page root before writing it', async () => {
    const { createPageDraftRepository } = await loadModule(
      'apps/editor-web/src/features/editor/drafts/page-draft-repository.ts',
    );
    const storage = new MemoryStorage();
    const repository = createPageDraftRepository({ storage });

    assert.throws(() => repository.save({
      scope: { userId: 7, projectId: 11, pageId: 13 },
      components: [{ id: 2, name: 'Button', desc: '按钮', props: {} }],
      baselineFingerprint: 'server-baseline',
      serverUpdatedAt: '2026-09-15T09:00:00.000Z',
      serverRevision: 1,
      componentConfig: componentConfig(),
    }), /Page 根节点/);
  });

  it('isolates drafts by user, project and page', async () => {
    const { createPageDraftRepository } = await loadModule(
      'apps/editor-web/src/features/editor/drafts/page-draft-repository.ts',
    );
    const storage = new MemoryStorage();
    const repository = createPageDraftRepository({ storage });
    const scope = { userId: 7, projectId: 11, pageId: 13 };

    repository.save({
      scope,
      components: pageWithText('当前页面草稿'),
      baselineFingerprint: 'server-baseline',
      serverUpdatedAt: '2026-09-15T09:00:00.000Z',
      serverRevision: 1,
      componentConfig: componentConfig(),
    });

    for (const otherScope of [
      { ...scope, userId: 8 },
      { ...scope, projectId: 12 },
      { ...scope, pageId: 14 },
    ]) {
      assert.deepEqual(repository.load({
        scope: otherScope,
        serverComponents: pageWithText('服务端内容'),
        serverUpdatedAt: '2026-09-15T09:00:00.000Z',
        serverRevision: 1,
        componentConfig: componentConfig(),
      }), { status: 'none' });
    }

    assert.equal(repository.load({
      scope,
      serverComponents: pageWithText('服务端内容'),
      serverUpdatedAt: '2026-09-15T09:00:00.000Z',
      serverRevision: 1,
      componentConfig: componentConfig(),
    }).status, 'recoverable');
  });

  it('removes an unsupported stored draft instead of loading it', async () => {
    const { createPageDraftRepository, createPageDraftStorageKey } = await loadModule(
      'apps/editor-web/src/features/editor/drafts/page-draft-repository.ts',
    );
    const storage = new MemoryStorage();
    const repository = createPageDraftRepository({ storage });
    const scope = { userId: 7, projectId: 11, pageId: 13 };
    const key = createPageDraftStorageKey(scope);
    storage.setItem(key, JSON.stringify({
      storageVersion: 1,
      ...scope,
      components: pageWithText('旧版草稿'),
      baselineFingerprint: 'server-baseline',
      serverUpdatedAt: '2026-09-15T09:00:00.000Z',
      serverRevision: 1,
      localUpdatedAt: '2026-09-15T10:00:00.000Z',
      dirty: true,
    }));

    const result = repository.load({
      scope,
      serverComponents: pageWithText('服务端内容'),
      serverUpdatedAt: '2026-09-15T09:00:00.000Z',
      serverRevision: 1,
      componentConfig: componentConfig(),
    });

    assert.equal(result.status, 'invalid');
    assert.equal(storage.getItem(key), null);
  });
});

class MemoryStorage {
  values = new Map();

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

function pageWithText(text) {
  return [{
    id: 1,
    name: 'Page',
    desc: '页面',
    props: {},
    children: [{ id: 2, parentId: 1, name: 'Button', desc: '按钮', props: { text } }],
  }];
}

function componentConfig() {
  return {
    Page: { acceptsChildren: true },
    Button: {},
  };
}

async function loadModule(entryPoint) {
  const outdir = path.resolve('node_modules/.tmp/page-draft-repository-test');
  await mkdir(outdir, { recursive: true });
  const outfile = path.join(outdir, `page-draft-repository-${Date.now()}-${Math.random().toString(16).slice(2)}.cjs`);
  const result = await build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
  });
  await writeFile(outfile, result.outputFiles[0].text, 'utf8');
  return require(outfile);
}
