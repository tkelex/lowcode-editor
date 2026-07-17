import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? process.cwd());
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const maxRecommendedLines = 500;
const ignoredDirectoryNames = new Set([
  '.git',
  '.next',
  '.codegraph',
  'coverage',
  'dist',
  'node_modules',
  'test-results',
]);

const importPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function isIgnored(relativePath) {
  const normalized = toPosix(relativePath);
  return normalized.split('/').some((segment) => ignoredDirectoryNames.has(segment));
}

async function collectFiles(directory, output = []) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(root, absolutePath);

    if (isIgnored(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      await collectFiles(absolutePath, output);
      continue;
    }

    if (sourceExtensions.has(path.extname(entry.name))) {
      output.push(absolutePath);
    }
  }

  return output;
}

function resolveImport(filePath, specifier) {
  let absolutePath;

  if (specifier.startsWith('.')) {
    absolutePath = path.resolve(path.dirname(filePath), specifier);
  } else if (specifier.startsWith('@root/')) {
    absolutePath = path.resolve(root, specifier.slice('@root/'.length));
  } else if (specifier.startsWith('@/')) {
    const relativeFile = toPosix(path.relative(root, filePath));
    if (relativeFile.startsWith('apps/editor-web/')) {
      absolutePath = path.resolve(root, 'apps/editor-web/src', specifier.slice('@/'.length));
    } else if (relativeFile.startsWith('apps/publisher-web/')) {
      absolutePath = path.resolve(root, 'apps/publisher-web/src', specifier.slice('@/'.length));
    } else {
      return null;
    }
  } else {
    return null;
  }

  return toPosix(path.relative(root, absolutePath));
}

function describeImport(filePath, specifier) {
  return `${toPosix(path.relative(root, filePath))} -> ${specifier}`;
}

function isUnder(resolvedPath, segment) {
  return resolvedPath === segment || resolvedPath.startsWith(`${segment}/`);
}

const violations = [];
const warnings = [];
const files = await collectFiles(root);

for (const filePath of files) {
  const relativeFile = toPosix(path.relative(root, filePath));
  const source = await readFile(filePath, 'utf8');
  const editorSourceRoot = 'apps/editor-web/src';
  const isCompatibilityApi = isUnder(relativeFile, `${editorSourceRoot}/api`);

  importPattern.lastIndex = 0;

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1] ?? match[2];
    const resolved = resolveImport(filePath, specifier);

    if (relativeFile.startsWith(`${editorSourceRoot}/`) && !isCompatibilityApi) {
      if (specifier.startsWith('../api') || specifier.startsWith('./api') || (resolved && isUnder(resolved, `${editorSourceRoot}/api`))) {
        violations.push(`${describeImport(filePath, specifier)}\n  New frontend code must import API modules from src/shared/api.`);
      }

      if (resolved && isUnder(resolved, 'apps/api-server')) {
        violations.push(`${describeImport(filePath, specifier)}\n  Frontend code must not import backend implementation files.`);
      }

      if (relativeFile.startsWith(`${editorSourceRoot}/features/`) && resolved && isUnder(resolved, `${editorSourceRoot}/app`)) {
        violations.push(`${describeImport(filePath, specifier)}\n  Feature modules must not depend on the app assembly layer. Move shared UI or helpers to src/shared.`);
      }

      if (relativeFile.startsWith(`${editorSourceRoot}/shared/`) && resolved && (
        isUnder(resolved, `${editorSourceRoot}/app`) ||
        isUnder(resolved, `${editorSourceRoot}/features`) ||
        isUnder(resolved, `${editorSourceRoot}/editor`)
      )) {
        violations.push(`${describeImport(filePath, specifier)}\n  Shared frontend code must not depend on app, feature, or editor implementation modules.`);
      }
    }

    if (relativeFile.startsWith('apps/api-server/') && resolved && (
      isUnder(resolved, 'apps/editor-web') || isUnder(resolved, 'apps/publisher-web')
    )) {
      violations.push(`${describeImport(filePath, specifier)}\n  Backend code must not import frontend implementation files.`);
    }

    if (relativeFile.startsWith('apps/publisher-web/') && resolved) {
      if (isUnder(resolved, 'apps/editor-web') || isUnder(resolved, 'apps/api-server')) {
        violations.push(
          `${describeImport(filePath, specifier)}\n  Publisher code must use workspace package exports instead of editor or backend source.`,
        );
      }
    }

    if (relativeFile.startsWith('packages/lowcode-schema/') && resolved && isUnder(resolved, 'apps')) {
      violations.push(`${describeImport(filePath, specifier)}\n  Shared schema package must stay independent from frontend and backend apps.`);
    }

    if (relativeFile.startsWith('packages/lowcode-runtime/') && resolved && isUnder(resolved, 'apps')) {
      violations.push(`${describeImport(filePath, specifier)}\n  Shared runtime package must not import application source.`);
    }

    if (relativeFile.startsWith(`${editorSourceRoot}/`) && resolved && isUnder(resolved, 'apps/api-server/prisma')) {
      violations.push(`${describeImport(filePath, specifier)}\n  Database schema and migrations belong behind the backend boundary.`);
    }
  }

  if (isCompatibilityApi && relativeFile !== `${editorSourceRoot}/api/index.ts`) {
    const forbidden = source
      .split('\n')
      .map((line, index) => ({ line: line.trim(), lineNo: index + 1 }))
      .filter(({ line }) => line && !line.startsWith('/**') && !line.startsWith('*') && !line.startsWith('*/') && !line.startsWith('export'));
    const unexpected = forbidden.filter(({ line }) => {
      return !line.startsWith('}') && !line.startsWith('from ') && !/^[A-Za-z_$][\w$]*(,)?$/.test(line);
    });

    if (unexpected.length > 0) {
      violations.push(
        `${relativeFile}\n  src/api is a deprecated compatibility layer. Keep files as re-export only. First unexpected line: ${unexpected[0].lineNo}`,
      );
    }
  }

  const lines = source.split(/\r?\n/).length;
  if (
    lines > maxRecommendedLines &&
    !relativeFile.startsWith('apps/api-server/prisma/migrations/') &&
    !relativeFile.endsWith('.d.ts')
  ) {
    warnings.push(`${relativeFile} has ${lines} lines. Consider splitting by feature, section, or registry group.`);
  }
}

if (violations.length > 0) {
  console.error(`Architecture boundary check failed with ${violations.length} violation(s):\n`);
  console.error(violations.join('\n\n'));
  process.exit(1);
}

console.log('Architecture boundary check passed.');

if (warnings.length > 0) {
  console.warn(`Architecture boundary warnings (${warnings.length}):`);
  console.warn(warnings.map((warning) => `- ${warning}`).join('\n'));
}
