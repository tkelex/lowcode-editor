import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const configDir = path.join(rootDir, 'src/editor/registry/configs');
const strict = process.argv.includes('--strict');

const setterFactories = [
  'inputSetter',
  'numberSetter',
  'selectSetter',
  'switchSetter',
  'checkboxSetter',
  'jsonSetter',
  'urlSetter',
];

const configOnlyProps = new Map([
  [
    'Page',
    new Set([
      'variables',
      'dataSources',
      'seoTitle',
      'seoDescription',
      'favicon',
    ]),
  ],
]);

const modeOptionalProps = new Map([
  ['Drawer:dev', new Set(['placement', 'width', 'maskClosable'])],
  ['Notification:dev', new Set(['description', 'placement'])],
]);

const parentConsumers = new Map([
  ['TableColumn', ['Table']],
  ['FormItem', ['Form']],
]);

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function pathLabel(file) {
  return path.relative(rootDir, file).replaceAll(path.sep, '/');
}

function listFiles(dir, extensions) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(next, extensions);
    return extensions.includes(path.extname(entry.name)) ? [next] : [];
  });
}

function stripCommentsAndStrings(source, options = {}) {
  const preserveTemplateExpressions = options.preserveTemplateExpressions ?? false;
  let result = '';
  let i = 0;

  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];

    if (char === '/' && next === '/') {
      result += '  ';
      i += 2;
      while (i < source.length && source[i] !== '\n') {
        result += ' ';
        i += 1;
      }
      continue;
    }

    if (char === '/' && next === '*') {
      result += '  ';
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        result += source[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      if (i < source.length) {
        result += '  ';
        i += 2;
      }
      continue;
    }

    if (char === '`' && preserveTemplateExpressions) {
      result += ' ';
      i += 1;

      while (i < source.length) {
        const current = source[i];

        if (current === '\\') {
          result += '  ';
          i += 2;
          continue;
        }

        if (current === '`') {
          result += ' ';
          i += 1;
          break;
        }

        if (current === '$' && source[i + 1] === '{') {
          result += '  ';
          const expressionStart = i + 1;
          const expressionEnd = findMatching(source, expressionStart, '{', '}');
          if (expressionEnd === -1) {
            i += 2;
            continue;
          }

          result += stripCommentsAndStrings(source.slice(expressionStart + 1, expressionEnd), options);
          result += ' ';
          i = expressionEnd + 1;
          continue;
        }

        result += current === '\n' ? '\n' : ' ';
        i += 1;
      }

      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      result += ' ';
      i += 1;
      while (i < source.length) {
        const current = source[i];
        result += current === '\n' ? '\n' : ' ';
        if (current === '\\') {
          i += 2;
          result += i <= source.length ? ' ' : '';
          continue;
        }
        i += 1;
        if (current === quote) break;
      }
      continue;
    }

    result += char;
    i += 1;
  }

  return result;
}

function findMatching(source, start, openChar, closeChar) {
  let depth = 0;
  let i = start;

  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];

    if (char === '/' && next === '/') {
      i += 2;
      while (i < source.length && source[i] !== '\n') i += 1;
      continue;
    }

    if (char === '/' && next === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      i += 1;
      while (i < source.length) {
        if (source[i] === '\\') {
          i += 2;
          continue;
        }
        if (source[i] === quote) {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    if (char === openChar) depth += 1;
    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }

  return -1;
}

function findPropertyBlock(source, propertyName, openChar, closeChar) {
  const sanitized = stripCommentsAndStrings(source);
  const propertyPattern = new RegExp(`\\b${propertyName}\\s*:`, 'g');
  let match;

  while ((match = propertyPattern.exec(sanitized))) {
    const openIndex = sanitized.indexOf(openChar, match.index);
    if (openIndex === -1) continue;

    const between = sanitized.slice(match.index, openIndex).trim();
    if (!between.endsWith(`${propertyName}:`)) continue;

    const closeIndex = findMatching(source, openIndex, openChar, closeChar);
    if (closeIndex !== -1) {
      return source.slice(openIndex + 1, closeIndex);
    }
  }

  return '';
}

function parseImports(source, configFile) {
  const imports = new Map();
  const defaultImportPattern = /import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]/g;
  const namedImportPattern = /import\s+(?:type\s+)?\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = defaultImportPattern.exec(source))) {
    imports.set(match[1], {
      importPath: match[2],
      exportName: 'default',
      file: resolveImportFile(configFile, match[2], match[1]),
    });
  }

  while ((match = namedImportPattern.exec(source))) {
    for (const item of match[1].split(',')) {
      const raw = item.trim();
      if (!raw) continue;

      const [exportName, localName = exportName] = raw.split(/\s+as\s+/).map((part) => part.trim());
      imports.set(localName, {
        importPath: match[2],
        exportName,
        file: resolveImportFile(configFile, match[2], exportName),
      });
    }
  }

  return imports;
}

function resolveImportFile(fromFile, importPath, exportName) {
  if (!importPath.startsWith('.')) return null;

  const basePath = path.resolve(path.dirname(fromFile), importPath);
  const direct = resolveFileWithExtension(basePath);
  if (direct) {
    if (exportName !== 'default') {
      const reExportFile = resolveReExportFile(direct, exportName);
      if (reExportFile) return reExportFile;
    }

    return direct;
  }

  if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
    const index = resolveFileWithExtension(path.join(basePath, 'index'));
    if (index) return index;

    const exported = listFiles(basePath, ['.tsx', '.ts', '.jsx', '.js']).find((file) => {
      const text = readText(file);
      return new RegExp(`\\bexport\\s+(?:function|const|class)\\s+${escapeRegExp(exportName)}\\b`).test(text);
    });
    if (exported) return exported;
  }

  return null;
}

function resolveReExportFile(file, exportName, seen = new Set()) {
  const key = `${file}:${exportName}`;
  if (seen.has(key)) return null;
  seen.add(key);

  const source = readText(file);
  const reExportPattern = /export\s*\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = reExportPattern.exec(source))) {
    const exportedNames = match[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [originalName, aliasName = originalName] = item.split(/\s+as\s+/).map((part) => part.trim());
        return { originalName, aliasName };
      });
    const exported = exportedNames.find((item) => item.aliasName === exportName);
    if (!exported) continue;

    const candidate = resolveImportFile(file, match[2], exported.originalName);
    if (!candidate) continue;
    if (candidate === file) continue;

    return candidate;
  }

  return null;
}

function resolveFileWithExtension(basePath) {
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) return basePath;

  for (const ext of ['.tsx', '.ts', '.jsx', '.js']) {
    const candidate = `${basePath}${ext}`;
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

function parseComponents(source, file) {
  const imports = parseImports(source, file);
  const exportIndex = source.indexOf('ComponentConfigs');
  const objectStart = source.indexOf('{', exportIndex);
  const objectEnd = objectStart === -1 ? -1 : findMatching(source, objectStart, '{', '}');

  if (objectStart === -1 || objectEnd === -1) return [];

  const objectSource = source.slice(objectStart + 1, objectEnd);
  const sanitized = stripCommentsAndStrings(objectSource);
  const components = [];
  let depth = 0;
  let i = 0;

  while (i < sanitized.length) {
    const char = sanitized[i];
    if (char === '{' || char === '[' || char === '(') depth += 1;
    if (char === '}' || char === ']' || char === ')') depth -= 1;

    if (depth === 0 && /[A-Za-z_$]/.test(char)) {
      const start = i;
      i += 1;
      while (i < sanitized.length && /[\w$]/.test(sanitized[i])) i += 1;
      const name = sanitized.slice(start, i);
      let cursor = i;
      while (/\s/.test(sanitized[cursor])) cursor += 1;

      if (sanitized[cursor] === ':' && sanitized[cursor + 1] !== ':') {
        const blockStart = sanitized.indexOf('{', cursor);
        const absoluteStart = objectStart + 1 + blockStart;
        const blockEnd = findMatching(source, absoluteStart, '{', '}');
        if (blockStart !== -1 && blockEnd !== -1) {
          const block = source.slice(absoluteStart + 1, blockEnd);
          components.push({
            name,
            file,
            block,
            setters: parseSetterNames(block),
            devSymbol: parseRenderSymbol(block, 'dev'),
            prodSymbol: parseRenderSymbol(block, 'prod'),
            imports,
          });
          i = blockEnd - objectStart;
          continue;
        }
      }
    }

    i += 1;
  }

  return components;
}

function parseSetterNames(block) {
  const setterBlock = findPropertyBlock(block, 'setter', '[', ']');
  const setterPattern = new RegExp(`\\b(?:${setterFactories.join('|')})\\s*\\(\\s*(['"\`])([^'"\`]+)\\1`, 'g');
  const names = new Set();
  let match;

  while ((match = setterPattern.exec(setterBlock))) {
    names.add(match[2]);
  }

  return [...names];
}

function parseRenderSymbol(block, propertyName) {
  const match = new RegExp(`\\b${propertyName}\\s*:\\s*([A-Za-z_$][\\w$]*)`).exec(stripCommentsAndStrings(block));
  return match?.[1] ?? null;
}

function isPropConsumed(source, propName) {
  const escaped = escapeRegExp(propName);
  const sanitized = stripCommentsAndStrings(source, { preserveTemplateExpressions: true });
  const patterns = [
    new RegExp(`\\b\\w+\\.props\\s*\\?\\.\\s*${escaped}\\b`),
    new RegExp(`\\b\\w+\\.props\\s*\\.\\s*${escaped}\\b`),
    new RegExp(`\\b(?:props|restProps)\\s*\\?\\.\\s*${escaped}\\b`),
    new RegExp(`\\b(?:props|restProps)\\s*\\.\\s*${escaped}\\b`),
    new RegExp(`\\b\\w+\\.props\\s*(?:\\?\\.)?\\[\\s*['"\`]${escaped}['"\`]\\s*\\]`),
    new RegExp(`\\b(?:props|restProps)\\s*(?:\\?\\.)?\\[\\s*['"\`]${escaped}['"\`]\\s*\\]`),
  ];

  if (patterns.some((pattern) => pattern.test(source))) return true;

  const shorthandDestructure = new RegExp(`[{,]\\s*${escaped}\\s*(?:=[^,}]*)?(?=[,}])`).test(sanitized);
  if (!shorthandDestructure) return false;

  const occurrences = sanitized.match(new RegExp(`\\b${escaped}\\b`, 'g'))?.length ?? 0;
  return occurrences > 1;
}

function getSourceForSymbol(importInfo) {
  if (!importInfo?.file) return '';
  const source = readText(importInfo.file);
  if (importInfo.exportName === 'default') return source;

  return extractExportSource(source, importInfo.exportName) || source;
}

function extractExportSource(source, exportName) {
  const startPattern = new RegExp(`\\bexport\\s+(?:function|const|class)\\s+${escapeRegExp(exportName)}\\b`);
  const match = startPattern.exec(source);
  if (!match) return '';

  const rest = source.slice(match.index + 1);
  const nextExport = /\nexport\s+(?:function|const|class)\s+/.exec(rest);
  const end = nextExport ? match.index + 1 + nextExport.index : source.length;

  return source.slice(match.index, end);
}

function getConsumerSources(component, mode) {
  const symbol = mode === 'dev' ? component.devSymbol : component.prodSymbol;
  const primary = component.imports.get(symbol);
  const sources = [];

  if (primary?.file) {
    sources.push({
      component: component.name,
      file: primary.file,
      source: getSourceForSymbol(primary),
    });
  }

  const parentNames = parentConsumers.get(component.name) ?? [];
  for (const parentName of parentNames) {
    const parent = allComponents.find((candidate) => candidate.name === parentName);
    const parentSymbol = mode === 'dev' ? parent?.devSymbol : parent?.prodSymbol;
    const parentImport = parent?.imports.get(parentSymbol);
    if (parentImport?.file) {
      sources.push({
        component: parentName,
        file: parentImport.file,
        source: getSourceForSymbol(parentImport),
      });
    }
  }

  return sources;
}

function classify(component, propName, mode, sources) {
  if (configOnlyProps.get(component.name)?.has(propName)) {
    return { status: 'config-only', detail: 'stored as page-level configuration' };
  }

  if (modeOptionalProps.get(`${component.name}:${mode}`)?.has(propName)) {
    return { status: 'manual', detail: `${mode} feedback is optional or intentionally indirect` };
  }

  const consumed = sources.some(({ source }) => isPropConsumed(source, propName));
  if (consumed) {
    const parentNames = parentConsumers.get(component.name) ?? [];
    const parentConsumed = sources.some(({ component: consumerName, source }) => {
      return parentNames.includes(consumerName) && isPropConsumed(source, propName);
    });
    return parentConsumed
      ? { status: 'parent-consumed', detail: `consumed by ${parentNames.join(', ')}` }
      : { status: 'ok', detail: 'directly consumed' };
  }

  return { status: 'missing', detail: `${mode} renderer does not reference this prop` };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const configFiles = listFiles(configDir, ['.tsx', '.ts']).sort();
const allComponents = configFiles.flatMap((file) => parseComponents(readText(file), file));
const rows = [];

for (const component of allComponents) {
  for (const propName of component.setters) {
    for (const mode of ['dev', 'prod']) {
      const symbol = mode === 'dev' ? component.devSymbol : component.prodSymbol;
      const importInfo = component.imports.get(symbol);
      const sources = getConsumerSources(component, mode);

      if (!symbol || !importInfo?.file) {
        rows.push({
          component: component.name,
          propName,
          mode,
          status: 'missing-renderer',
          detail: `cannot resolve ${mode} renderer`,
          files: [],
        });
        continue;
      }

      const result = classify(component, propName, mode, sources);
      rows.push({
        component: component.name,
        propName,
        mode,
        status: result.status,
        detail: result.detail,
        files: sources.map(({ file }) => pathLabel(file)),
      });
    }
  }
}

const statusOrder = ['missing', 'missing-renderer', 'manual', 'config-only', 'parent-consumed', 'ok'];
const counts = Object.fromEntries(statusOrder.map((status) => [status, rows.filter((row) => row.status === status).length]));
const componentsWithSetters = new Set(allComponents.filter((component) => component.setters.length > 0).map((component) => component.name));
const setterCount = allComponents.reduce((total, component) => total + component.setters.length, 0);

console.log('Editor prop contract audit');
console.log(`Components with setters: ${componentsWithSetters.size}`);
console.log(`Setter props: ${setterCount}`);
console.log(`Checks: ${rows.length}`);
console.log(`OK: ${counts.ok}, parent-consumed: ${counts['parent-consumed']}, config-only: ${counts['config-only']}, manual-review: ${counts.manual}, missing: ${counts.missing + counts['missing-renderer']}`);

for (const status of statusOrder.filter((item) => item !== 'ok')) {
  const group = rows.filter((row) => row.status === status);
  if (group.length === 0) continue;

  console.log('');
  console.log(status.toUpperCase());
  for (const row of group) {
    const files = row.files.length ? ` (${row.files.join(', ')})` : '';
    console.log(`- ${row.component}.${row.propName} [${row.mode}]: ${row.detail}${files}`);
  }
}

if (strict && (counts.missing > 0 || counts['missing-renderer'] > 0)) {
  process.exitCode = 1;
}
