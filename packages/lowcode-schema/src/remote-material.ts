import { CURRENT_SCHEMA_VERSION } from './defaults';
import { builtinComponentSchemaRegistry } from './registry';
import type {
  LowcodeComponentConfigMap,
  LowcodeComponentSchema,
} from './types';

export const REMOTE_MATERIAL_PROTOCOL_VERSION = '1' as const;

export interface RemoteMaterialDependencies {
  react: string;
  reactDom: string;
  antd?: string;
}

export interface RemoteMaterialDeclaration {
  name: string;
  displayName: string;
  category: string;
  allowedParents?: string[];
  acceptsChildren?: string[] | true;
}

export interface RemoteMaterialManifest {
  protocolVersion: typeof REMOTE_MATERIAL_PROTOCOL_VERSION;
  name: string;
  version: string;
  entry: string;
  integrity?: string;
  schemaVersion: string;
  dependencies: RemoteMaterialDependencies;
  materials: RemoteMaterialDeclaration[];
}

export interface RemoteMaterialManifestValidationResult {
  valid: boolean;
  errors: string[];
  manifest?: RemoteMaterialManifest;
}

export interface PageMaterialDependency {
  protocolVersion: typeof REMOTE_MATERIAL_PROTOCOL_VERSION;
  packageName: string;
  version: string;
  manifestUrl: string;
  entry: string;
  integrity?: string;
  schemaVersion: string;
  dependencies: RemoteMaterialDependencies;
  materials: RemoteMaterialDeclaration[];
}

export interface PageMaterialValidationContext {
  componentConfig: LowcodeComponentConfigMap;
  dependencies: PageMaterialDependency[];
  selectDependencies(components: LowcodeComponentSchema[]): PageMaterialDependency[];
}

export class RemoteMaterialContractError extends Error {
  constructor(
    readonly code: 'DEPENDENCY_INVALID' | 'PACKAGE_CONFLICT' | 'COMPONENT_CONFLICT',
    message: string,
  ) {
    super(message);
    this.name = 'RemoteMaterialContractError';
  }
}

export function validateRemoteMaterialManifest(
  value: unknown,
): RemoteMaterialManifestValidationResult {
  const errors: string[] = [];

  if (!isPlainObject(value)) {
    return { valid: false, errors: ['远程物料 manifest 必须是对象'] };
  }

  if (value.protocolVersion !== REMOTE_MATERIAL_PROTOCOL_VERSION) {
    errors.push(`manifest.protocolVersion 仅支持 ${REMOTE_MATERIAL_PROTOCOL_VERSION}`);
  }
  if (!isPackageName(value.name)) {
    errors.push('manifest.name 必须是合法且固定的包名');
  }
  if (!isExactVersion(value.version)) {
    errors.push('manifest.version 必须是 x.y.z 格式的固定版本，不能使用 latest 或版本范围');
  }
  if (!isEntry(value.entry)) {
    errors.push('manifest.entry 必须是相对路径或 http/https 地址');
  }
  if (value.integrity !== undefined && !isIntegrity(value.integrity)) {
    errors.push('manifest.integrity 必须是 sha256/sha384/sha512 SRI 值');
  }
  if (!isExactVersion(value.schemaVersion)) {
    errors.push('manifest.schemaVersion 必须是 x.y.z 格式');
  } else if (!isSchemaVersionCompatible(String(value.schemaVersion), CURRENT_SCHEMA_VERSION)) {
    errors.push(`manifest.schemaVersion ${value.schemaVersion} 与宿主 ${CURRENT_SCHEMA_VERSION} 不兼容`);
  }

  const dependencies = normalizeDependencies(value.dependencies, errors);
  const materials = normalizeMaterials(value.materials, errors);

  if (errors.length > 0 || !dependencies || !materials) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    manifest: {
      protocolVersion: REMOTE_MATERIAL_PROTOCOL_VERSION,
      name: String(value.name).trim(),
      version: String(value.version).trim(),
      entry: String(value.entry).trim(),
      ...(value.integrity === undefined ? {} : { integrity: String(value.integrity).trim() }),
      schemaVersion: String(value.schemaVersion).trim(),
      dependencies,
      materials,
    },
  };
}

export function assertRemoteMaterialManifest(value: unknown): RemoteMaterialManifest {
  const result = validateRemoteMaterialManifest(value);
  if (!result.valid || !result.manifest) {
    throw new Error(result.errors[0] || '远程物料 manifest 不合法');
  }
  return result.manifest;
}

export function createPageMaterialDependency(
  manifestValue: unknown,
  manifestUrlValue: string,
): PageMaterialDependency {
  const manifest = assertRemoteMaterialManifest(manifestValue);
  const manifestUrl = normalizeAbsoluteHttpUrl(manifestUrlValue, 'manifestUrl');
  const entry = normalizeAbsoluteHttpUrl(
    new URL(manifest.entry, manifestUrl).toString(),
    'manifest.entry',
  );

  return {
    protocolVersion: manifest.protocolVersion,
    packageName: manifest.name,
    version: manifest.version,
    manifestUrl,
    entry,
    ...(manifest.integrity ? { integrity: manifest.integrity } : {}),
    schemaVersion: manifest.schemaVersion,
    dependencies: { ...manifest.dependencies },
    materials: manifest.materials.map((material) => ({
      ...material,
      ...(material.allowedParents ? { allowedParents: [...material.allowedParents] } : {}),
      ...(Array.isArray(material.acceptsChildren)
        ? { acceptsChildren: [...material.acceptsChildren] }
        : material.acceptsChildren === true
          ? { acceptsChildren: true as const }
          : {}),
    })),
  };
}

export function createPageMaterialValidationContext(
  dependencyValues: readonly unknown[],
): PageMaterialValidationContext {
  const dependencies = dependencyValues.map(normalizePageMaterialDependency);
  const componentConfig = cloneComponentConfig(builtinComponentSchemaRegistry);
  const dependencyByMaterialName = new Map<string, PageMaterialDependency>();
  const packages = new Set<string>();

  for (const dependency of dependencies) {
    if (packages.has(dependency.packageName)) {
      throw new RemoteMaterialContractError(
        'PACKAGE_CONFLICT',
        `页面物料依赖不能同时包含同一包的多个版本：${dependency.packageName}`,
      );
    }
    packages.add(dependency.packageName);

    for (const material of dependency.materials) {
      if (componentConfig[material.name] || dependencyByMaterialName.has(material.name)) {
        throw new RemoteMaterialContractError(
          'COMPONENT_CONFLICT',
          `远程物料组件名冲突：${material.name}`,
        );
      }
      componentConfig[material.name] = {
        name: material.name,
        ...(Array.isArray(material.acceptsChildren)
          ? { acceptsChildren: [...material.acceptsChildren] }
          : material.acceptsChildren === true
            ? { acceptsChildren: true as const }
            : {}),
      };
      dependencyByMaterialName.set(material.name, dependency);
    }
  }

  for (const dependency of dependencies) {
    for (const material of dependency.materials) {
      for (const parentName of material.allowedParents || []) {
        const parent = componentConfig[parentName];
        if (!parent?.acceptsChildren) {
          throw new RemoteMaterialContractError(
            'DEPENDENCY_INVALID',
            `${material.name} 声明了不可接收子组件的父物料：${parentName}`,
          );
        }
        if (parent.acceptsChildren !== true && !parent.acceptsChildren.includes(material.name)) {
          parent.acceptsChildren.push(material.name);
        }
      }

      if (Array.isArray(material.acceptsChildren)) {
        const unknownChild = material.acceptsChildren.find((name) => !componentConfig[name]);
        if (unknownChild) {
          throw new RemoteMaterialContractError(
            'DEPENDENCY_INVALID',
            `${material.name} 声明了未知子物料：${unknownChild}`,
          );
        }
      }
    }
  }

  return {
    componentConfig,
    dependencies,
    selectDependencies(components) {
      const usedPackages = new Set<string>();
      visitComponents(components, (component) => {
        const dependency = dependencyByMaterialName.get(component.name);
        if (dependency) usedPackages.add(dependency.packageName);
      });
      return dependencies.filter((dependency) => usedPackages.has(dependency.packageName));
    },
  };
}

export function isSchemaVersionCompatible(required: string, supported: string) {
  const requiredVersion = parseExactVersion(required);
  const supportedVersion = parseExactVersion(supported);
  if (!requiredVersion || !supportedVersion) return false;

  return requiredVersion.major === supportedVersion.major
    && compareVersions(requiredVersion, supportedVersion) <= 0;
}

function normalizeDependencies(
  value: unknown,
  errors: string[],
): RemoteMaterialDependencies | undefined {
  if (!isPlainObject(value)) {
    errors.push('manifest.dependencies 必须是对象');
    return undefined;
  }

  const react = normalizeVersionRange(value.react);
  const reactDom = normalizeVersionRange(value.reactDom);
  const antd = value.antd === undefined ? undefined : normalizeVersionRange(value.antd);

  if (!react) errors.push('manifest.dependencies.react 必须声明版本要求');
  if (!reactDom) errors.push('manifest.dependencies.reactDom 必须声明版本要求');
  if (value.antd !== undefined && !antd) {
    errors.push('manifest.dependencies.antd 必须声明版本要求');
  }
  if (!react || !reactDom) return undefined;

  return {
    react,
    reactDom,
    ...(antd ? { antd } : {}),
  };
}

function normalizeMaterials(
  value: unknown,
  errors: string[],
): RemoteMaterialDeclaration[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push('manifest.materials 必须是非空数组');
    return undefined;
  }

  const names = new Set<string>();
  const materials: RemoteMaterialDeclaration[] = [];

  value.forEach((item, index) => {
    const path = `manifest.materials[${index}]`;
    if (!isPlainObject(item)) {
      errors.push(`${path} 必须是对象`);
      return;
    }

    const name = normalizeComponentName(item.name);
    const displayName = normalizeNonEmptyString(item.displayName);
    const category = normalizeNonEmptyString(item.category);
    const allowedParents = normalizeComponentNameArray(item.allowedParents, `${path}.allowedParents`, errors);
    const acceptsChildren = item.acceptsChildren === true
      ? true
      : normalizeComponentNameArray(item.acceptsChildren, `${path}.acceptsChildren`, errors);

    if (!name) errors.push(`${path}.name 必须是合法组件名`);
    if (!displayName) errors.push(`${path}.displayName 必须是非空字符串`);
    if (!category) errors.push(`${path}.category 必须是非空字符串`);
    if (!name || !displayName || !category) return;
    if (names.has(name)) {
      errors.push(`${path}.name 不能重复：${name}`);
      return;
    }
    names.add(name);

    materials.push({
      name,
      displayName,
      category,
      ...(allowedParents ? { allowedParents } : {}),
      ...(acceptsChildren ? { acceptsChildren } : {}),
    });
  });

  return materials;
}

function normalizeComponentNameArray(
  value: unknown,
  path: string,
  errors: string[],
): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} 必须是非空组件名数组`);
    return undefined;
  }

  const result: string[] = [];
  for (const item of value) {
    const name = normalizeComponentName(item);
    if (!name) {
      errors.push(`${path} 只能包含合法组件名`);
      return undefined;
    }
    if (!result.includes(name)) result.push(name);
  }
  return result;
}

function normalizeVersionRange(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (!normalized || normalized.toLowerCase() === 'latest') return undefined;
  return normalized;
}

function normalizeNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeComponentName(value: unknown) {
  const normalized = normalizeNonEmptyString(value);
  return normalized && /^[A-Z][A-Za-z0-9]*$/.test(normalized) ? normalized : undefined;
}

function isPackageName(value: unknown) {
  if (typeof value !== 'string') return false;
  return /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(value.trim());
}

function isEntry(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return false;
  const entry = value.trim();
  if (/^https?:\/\//i.test(entry)) return true;
  return /^(?:\.\.?\/|\/)[^\s]+$/.test(entry);
}

function isIntegrity(value: unknown) {
  return typeof value === 'string'
    && /^sha(?:256|384|512)-[A-Za-z0-9+/]+={0,2}$/.test(value.trim());
}

function isExactVersion(value: unknown) {
  return typeof value === 'string' && parseExactVersion(value.trim()) !== undefined;
}

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
}

function parseExactVersion(value: string): ParsedVersion | undefined {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) return undefined;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function compareVersions(left: ParsedVersion, right: ParsedVersion) {
  return left.major - right.major || left.minor - right.minor || left.patch - right.patch;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeAbsoluteHttpUrl(value: string, path: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(`${path} 必须是绝对 http/https 地址`);
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error(`${path} 必须是无凭证的绝对 http/https 地址`);
  }
  return url.toString();
}

function normalizePageMaterialDependency(value: unknown): PageMaterialDependency {
  if (!isPlainObject(value)) {
    throw new RemoteMaterialContractError('DEPENDENCY_INVALID', '页面物料依赖必须是对象');
  }

  try {
    return createPageMaterialDependency({
      protocolVersion: value.protocolVersion,
      name: value.packageName,
      version: value.version,
      entry: value.entry,
      integrity: value.integrity,
      schemaVersion: value.schemaVersion,
      dependencies: value.dependencies,
      materials: value.materials,
    }, String(value.manifestUrl || ''));
  } catch (error) {
    throw new RemoteMaterialContractError(
      'DEPENDENCY_INVALID',
      error instanceof Error ? error.message : '页面物料依赖不合法',
    );
  }
}

function cloneComponentConfig(source: LowcodeComponentConfigMap): LowcodeComponentConfigMap {
  return Object.fromEntries(Object.entries(source).map(([name, config]) => [
    name,
    {
      ...config,
      ...(Array.isArray(config.acceptsChildren)
        ? { acceptsChildren: [...config.acceptsChildren] }
        : {}),
    },
  ]));
}

function visitComponents(
  components: readonly LowcodeComponentSchema[],
  visit: (component: LowcodeComponentSchema) => void,
) {
  for (const component of components) {
    visit(component);
    if (component.children) visitComponents(component.children, visit);
  }
}
