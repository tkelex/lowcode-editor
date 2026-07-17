import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);

describe('Next.js publisher runtime helpers', () => {
  it('builds published page urls with publisher site fallback', async () => {
    const { buildPublishedPageUrl } = await loadModule('src/shared/publish/url.ts');

    assert.equal(buildPublishedPageUrl('abc 123', {
      siteUrl: 'https://pages.example.com/',
    }), 'https://pages.example.com/publish/abc%20123');
    assert.equal(buildPublishedPageUrl('abc', {
      origin: 'https://app.example.com/',
    }), 'https://app.example.com/publish/abc');
    assert.equal(buildPublishedPageUrl('abc'), '/publish/abc');
  });

  it('normalizes metadata text and rejects unsafe icon urls', async () => {
    const {
      createPublishedPageMetadata,
      normalizeSafeUrl,
      normalizeText,
    } = await loadModule('apps/publisher-next/src/published-pages/metadata.ts');

    process.env.PUBLISHER_SITE_URL = 'https://pages.example.com';

    assert.equal(normalizeText('  hello   world  ', 20), 'hello world');
    assert.equal(normalizeText('abcdef', 3), 'abc');
    assert.equal(normalizeSafeUrl('javascript:alert(1)', 'https://pages.example.com'), '');
    assert.equal(normalizeSafeUrl('/favicon.ico', 'https://pages.example.com'), 'https://pages.example.com/favicon.ico');

    const metadata = createPublishedPageMetadata({
      publicId: 'pub-1',
      name: '默认标题',
      routePath: '/demo',
      publishedAt: null,
      schema: {
        schemaVersion: '1.0.0',
        components: [
          {
            id: 1,
            name: 'Page',
            desc: '页面',
            props: {
              seoTitle: 'SEO 标题',
              seoDescription: '页面描述',
              favicon: '/favicon.ico',
            },
          },
        ],
      },
    });

    assert.equal(metadata.title, 'SEO 标题');
    assert.equal(metadata.description, '页面描述');
    assert.equal(metadata.alternates.canonical, 'https://pages.example.com/publish/pub-1');
    assert.deepEqual(metadata.icons, { icon: 'https://pages.example.com/favicon.ico' });
    assert.equal(metadata.openGraph.url, 'https://pages.example.com/publish/pub-1');
  });

  it('creates stable cache tags for public ids', async () => {
    const { createPublishedPageTag, parseCsv } = await loadModule('apps/publisher-next/src/published-pages/config.ts');

    assert.equal(createPublishedPageTag('abc'), 'published-page:abc');
    assert.deepEqual(parseCsv(' https://a.com, ,https://b.com '), ['https://a.com', 'https://b.com']);
  });
});

async function loadModule(entryPoint) {
  const outdir = path.resolve('node_modules/.tmp/publisher-runtime-test');
  await mkdir(outdir, { recursive: true });

  const outfile = path.join(outdir, `${path.basename(entryPoint)}-${Date.now()}-${Math.random().toString(16).slice(2)}.cjs`);
  const result = await build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    external: ['next', 'next/*', 'react', 'react-dom', 'react/jsx-runtime'],
  });

  await writeFile(outfile, result.outputFiles[0].text, 'utf8');
  return require(outfile);
}
