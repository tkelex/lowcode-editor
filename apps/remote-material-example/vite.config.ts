import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { exampleMaterial } from './src/constants';

const outputDirectory = fileURLToPath(new URL('./dist/', import.meta.url));

function emitManifest(): Plugin {
  return {
    name: 'emit-remote-material-manifest',
    async closeBundle() {
      const entryPath = path.join(outputDirectory, exampleMaterial.entry.replace(/^\.\//, ''));
      const entry = await readFile(entryPath);
      const integrity = `sha384-${createHash('sha384').update(entry).digest('base64')}`;
      const manifest = {
        protocolVersion: exampleMaterial.protocolVersion,
        name: exampleMaterial.packageName,
        version: exampleMaterial.version,
        entry: exampleMaterial.entry,
        integrity,
        schemaVersion: exampleMaterial.schemaVersion,
        dependencies: {
          react: '^18.3.1 || ^19.0.0',
          reactDom: '^18.3.1 || ^19.0.0',
          antd: '^5.20.0',
        },
        materials: [{
          name: exampleMaterial.materialName,
          displayName: '客户指标卡',
          category: 'data',
          allowedParents: ['Page', 'Container'],
          acceptsChildren: true,
        }],
      };

      await writeFile(
        path.join(outputDirectory, 'manifest.json'),
        `${JSON.stringify(manifest, null, 2)}\n`,
        'utf8',
      );
    },
  };
}

export default defineConfig({
  plugins: [emitManifest()],
  build: {
    target: 'es2021',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'LowcodeRemoteMaterialExample',
      formats: ['iife'],
      fileName: () => 'remote-material-example.iife.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'antd'],
    },
  },
});
