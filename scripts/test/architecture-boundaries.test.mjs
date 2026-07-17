import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';

describe('repository architecture policy', () => {
  it('rejects publisher imports from editor internals and allows the public runtime seam', async () => {
    const fixtureRoot = await mkdtemp(path.resolve('node_modules/.tmp/architecture-policy-'));
    const publisherFile = path.join(fixtureRoot, 'apps/publisher-next/src/example.ts');

    try {
      await mkdir(path.dirname(publisherFile), { recursive: true });
      await writeFile(
        publisherFile,
        "import '@root/src/editor/stores/components';\n",
        'utf8',
      );

      const rejected = runArchitectureCheck(fixtureRoot);
      assert.equal(rejected.status, 1);
      assert.match(`${rejected.stdout}\n${rejected.stderr}`, /publisher.*public runtime/i);

      await writeFile(
        publisherFile,
        "import '@root/src/editor/runtime/public';\n",
        'utf8',
      );

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
