import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';

describe('repository architecture policy', () => {
  it('rejects publisher imports from editor internals and allows the runtime package', async () => {
    const fixtureRoot = await mkdtemp(path.resolve('node_modules/.tmp/architecture-policy-'));
    const publisherFile = path.join(fixtureRoot, 'apps/publisher-web/src/example.ts');

    try {
      await mkdir(path.dirname(publisherFile), { recursive: true });
      await writeFile(
        publisherFile,
        "import '@root/apps/editor-web/src/features/editor/stores/editor-store';\n",
        'utf8',
      );

      const rejected = runArchitectureCheck(fixtureRoot);
      assert.equal(rejected.status, 1);
      assert.match(`${rejected.stdout}\n${rejected.stderr}`, /publisher.*workspace package exports/i);

      await writeFile(
        publisherFile,
        "import '@lowcode/runtime/client';\n",
        'utf8',
      );

      const accepted = runArchitectureCheck(fixtureRoot);
      assert.equal(accepted.status, 0, `${accepted.stdout}\n${accepted.stderr}`);
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });

  it('keeps business APIs inside their owning feature', async () => {
    const fixtureRoot = await mkdtemp(path.resolve('node_modules/.tmp/architecture-policy-'));
    const sharedApiFile = path.join(fixtureRoot, 'apps/editor-web/src/shared/api/projects.ts');
    const featureApiFile = path.join(fixtureRoot, 'apps/editor-web/src/features/projects/api/projects.ts');

    try {
      await mkdir(path.dirname(sharedApiFile), { recursive: true });
      await writeFile(sharedApiFile, 'export const listProjects = () => [];\n', 'utf8');

      const rejected = runArchitectureCheck(fixtureRoot);
      assert.equal(rejected.status, 1);
      assert.match(`${rejected.stdout}\n${rejected.stderr}`, /business APIs in their owning feature/i);

      await rm(sharedApiFile);
      await mkdir(path.dirname(featureApiFile), { recursive: true });
      await writeFile(featureApiFile, 'export const listProjects = () => [];\n', 'utf8');

      const accepted = runArchitectureCheck(fixtureRoot);
      assert.equal(accepted.status, 0, `${accepted.stdout}\n${accepted.stderr}`);
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });

  it('rejects cross-feature imports that bypass the public index', async () => {
    const fixtureRoot = await mkdtemp(path.resolve('node_modules/.tmp/architecture-policy-'));
    const editorFile = path.join(fixtureRoot, 'apps/editor-web/src/features/editor/example.ts');
    const projectApiFile = path.join(fixtureRoot, 'apps/editor-web/src/features/projects/api/pages.ts');
    const projectIndexFile = path.join(fixtureRoot, 'apps/editor-web/src/features/projects/index.ts');

    try {
      await mkdir(path.dirname(editorFile), { recursive: true });
      await mkdir(path.dirname(projectApiFile), { recursive: true });
      await writeFile(projectApiFile, 'export const getPage = () => null;\n', 'utf8');
      await writeFile(projectIndexFile, "export { getPage } from './api/pages';\n", 'utf8');
      await writeFile(editorFile, "import { getPage } from '../projects/api/pages';\nvoid getPage;\n", 'utf8');

      const rejected = runArchitectureCheck(fixtureRoot);
      assert.equal(rejected.status, 1);
      assert.match(`${rejected.stdout}\n${rejected.stderr}`, /cross-feature imports.*public index/i);

      await writeFile(editorFile, "import { getPage } from '../projects';\nvoid getPage;\n", 'utf8');

      const accepted = runArchitectureCheck(fixtureRoot);
      assert.equal(accepted.status, 0, `${accepted.stdout}\n${accepted.stderr}`);
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });
});

function runArchitectureCheck(fixtureRoot) {
  return spawnSync(
    process.execPath,
    [path.resolve('scripts/architecture/check-boundaries.mjs'), fixtureRoot],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
    },
  );
}
