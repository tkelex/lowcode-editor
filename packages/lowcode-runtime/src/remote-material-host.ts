import type { ComponentType } from 'react';
import {
  REMOTE_MATERIAL_PROTOCOL_VERSION,
  createPageMaterialValidationContext,
  type PageMaterialDependency,
  type RemoteMaterialDependencies,
} from '@lowcode/schema';
import type { RuntimeComponentRegistry } from './types';

export interface RemoteMaterialHostShared {
  React: typeof import('react');
  ReactDOM: typeof import('react-dom');
  antd: typeof import('antd');
}

export interface RemoteMaterialBundle {
  protocolVersion: typeof REMOTE_MATERIAL_PROTOCOL_VERSION;
  name: string;
  version: string;
  schemaVersion: string;
  materials: Record<string, ComponentType<any>>;
  editorMaterials?: Record<string, RemoteEditorMaterialDefinition>;
}

export interface RemoteEditorMaterialDefinition {
  name: string;
  desc: string;
  category?: string;
  icon?: string;
  keywords?: string[];
  sort?: number;
  defaultProps: Record<string, unknown>;
  acceptsChildren?: string[] | true;
  setter?: Array<Record<string, unknown>>;
  stylesSetter?: Array<Record<string, unknown>>;
  events?: Array<Record<string, unknown>>;
  methods?: Array<Record<string, unknown>>;
  dev: ComponentType<any>;
  prod: ComponentType<any>;
}

export interface RemoteMaterialRegistrationResult {
  status: 'registered' | 'already_registered';
  key: string;
  materialNames: string[];
}

export interface RemoteMaterialRegistration {
  key: string;
  materialNames: string[];
  editorMaterials?: Record<string, RemoteEditorMaterialDefinition>;
}

export interface LowcodeMaterialHost {
  protocolVersion: typeof REMOTE_MATERIAL_PROTOCOL_VERSION;
  shared: RemoteMaterialHostShared;
  sharedVersions: Required<RemoteMaterialDependencies>;
  register(bundle: RemoteMaterialBundle): RemoteMaterialRegistrationResult;
  getRegistry(): RuntimeComponentRegistry;
  getRegistration(name: string, version: string): RemoteMaterialRegistration | undefined;
}

export interface CreateRemoteMaterialHostOptions {
  trustedDependencies: readonly PageMaterialDependency[];
  shared: RemoteMaterialHostShared;
  sharedVersions: Required<RemoteMaterialDependencies>;
  initialRegistry?: RuntimeComponentRegistry;
}

export class RemoteMaterialHostError extends Error {
  constructor(
    readonly code:
      | 'BUNDLE_NOT_TRUSTED'
      | 'PROTOCOL_INCOMPATIBLE'
      | 'SCHEMA_INCOMPATIBLE'
      | 'SHARED_DEPENDENCY_INCOMPATIBLE'
      | 'BUNDLE_DECLARATION_MISMATCH'
      | 'COMPONENT_CONFLICT',
    message: string,
  ) {
    super(message);
    this.name = 'RemoteMaterialHostError';
  }
}

export function createRemoteMaterialHost({
  trustedDependencies,
  shared,
  sharedVersions,
  initialRegistry = {},
}: CreateRemoteMaterialHostOptions): LowcodeMaterialHost {
  const context = createPageMaterialValidationContext(trustedDependencies);
  const dependenciesByKey = new Map(
    context.dependencies.map((dependency) => [materialKey(dependency.packageName, dependency.version), dependency]),
  );
  const registry: RuntimeComponentRegistry = { ...initialRegistry };
  const registered = new Map<string, RemoteMaterialRegistration>();

  return {
    protocolVersion: REMOTE_MATERIAL_PROTOCOL_VERSION,
    shared,
    sharedVersions,
    register(bundle) {
      const key = materialKey(bundle.name, bundle.version);
      const existingRegistration = registered.get(key);
      if (existingRegistration) {
        return {
          status: 'already_registered',
          key,
          materialNames: [...existingRegistration.materialNames],
        };
      }

      const dependency = dependenciesByKey.get(key);
      if (!dependency) {
        throw new RemoteMaterialHostError('BUNDLE_NOT_TRUSTED', `未信任远程物料包：${key}`);
      }
      if (bundle.protocolVersion !== dependency.protocolVersion) {
        throw new RemoteMaterialHostError(
          'PROTOCOL_INCOMPATIBLE',
          `远程物料协议不兼容：${bundle.protocolVersion}`,
        );
      }
      if (bundle.schemaVersion !== dependency.schemaVersion) {
        throw new RemoteMaterialHostError(
          'SCHEMA_INCOMPATIBLE',
          `远程物料 schema 版本不匹配：${bundle.schemaVersion}`,
        );
      }

      assertSharedDependencies(dependency, sharedVersions);
      const declaredMaterialNames = dependency.materials.map((material) => material.name).sort();
      const bundleMaterialNames = Object.keys(bundle.materials).sort();
      if (!sameStrings(declaredMaterialNames, bundleMaterialNames)) {
        throw new RemoteMaterialHostError(
          'BUNDLE_DECLARATION_MISMATCH',
          `远程物料实现与 manifest 声明不一致：${key}`,
        );
      }

      const editorMaterialNames = bundle.editorMaterials
        ? Object.keys(bundle.editorMaterials).sort()
        : [];
      if (bundle.editorMaterials && !sameStrings(declaredMaterialNames, editorMaterialNames)) {
        throw new RemoteMaterialHostError(
          'BUNDLE_DECLARATION_MISMATCH',
          `远程物料编辑态定义与 manifest 声明不一致：${key}`,
        );
      }

      for (const name of declaredMaterialNames) {
        if (registry[name]) {
          throw new RemoteMaterialHostError('COMPONENT_CONFLICT', `运行时组件名冲突：${name}`);
        }
        const component = bundle.materials[name];
        if (!isReactComponent(component)) {
          throw new RemoteMaterialHostError(
            'BUNDLE_DECLARATION_MISMATCH',
            `远程物料 ${name} 未提供有效 React 组件`,
          );
        }
        const editorMaterial = bundle.editorMaterials?.[name];
        if (editorMaterial && (
          editorMaterial.name !== name
          || !isReactComponent(editorMaterial.dev)
          || !isReactComponent(editorMaterial.prod)
        )) {
          throw new RemoteMaterialHostError(
            'BUNDLE_DECLARATION_MISMATCH',
            `远程物料 ${name} 的编辑态定义不合法`,
          );
        }
      }

      for (const material of dependency.materials) {
        registry[material.name] = {
          component: bundle.materials[material.name],
          acceptsChildren: Boolean(material.acceptsChildren),
        };
      }
      registered.set(key, {
        key,
        materialNames: declaredMaterialNames,
        ...(bundle.editorMaterials
          ? { editorMaterials: { ...bundle.editorMaterials } }
          : {}),
      });

      return {
        status: 'registered',
        key,
        materialNames: [...declaredMaterialNames],
      };
    },
    getRegistry() {
      return { ...registry };
    },
    getRegistration(name, version) {
      const registration = registered.get(materialKey(name, version));
      if (!registration) return undefined;
      return {
        key: registration.key,
        materialNames: [...registration.materialNames],
        ...(registration.editorMaterials
          ? { editorMaterials: { ...registration.editorMaterials } }
          : {}),
      };
    },
  };
}

export function installRemoteMaterialHost(
  target: Pick<Window, '__LOWCODE_MATERIAL_HOST__'>,
  host: LowcodeMaterialHost,
) {
  if (target.__LOWCODE_MATERIAL_HOST__ && target.__LOWCODE_MATERIAL_HOST__ !== host) {
    throw new RemoteMaterialHostError(
      'PROTOCOL_INCOMPATIBLE',
      '全局远程物料宿主已由其他实例占用',
    );
  }
  target.__LOWCODE_MATERIAL_HOST__ = host;
  return host;
}

export function uninstallRemoteMaterialHost(
  target: Pick<Window, '__LOWCODE_MATERIAL_HOST__'>,
  host: LowcodeMaterialHost,
) {
  if (target.__LOWCODE_MATERIAL_HOST__ !== host) return false;
  target.__LOWCODE_MATERIAL_HOST__ = undefined;
  return true;
}

function assertSharedDependencies(
  dependency: PageMaterialDependency,
  actualVersions: Required<RemoteMaterialDependencies>,
) {
  const requirements: Array<[keyof RemoteMaterialDependencies, string | undefined]> = [
    ['react', dependency.dependencies.react],
    ['reactDom', dependency.dependencies.reactDom],
    ['antd', dependency.dependencies.antd],
  ];

  for (const [name, requirement] of requirements) {
    if (!requirement) continue;
    if (!matchesVersionRequirement(requirement, actualVersions[name])) {
      throw new RemoteMaterialHostError(
        'SHARED_DEPENDENCY_INCOMPATIBLE',
        `${name} 需要 ${requirement}，宿主提供 ${actualVersions[name]}`,
      );
    }
  }
}

export function matchesVersionRequirement(requirement: string, actual: string) {
  return requirement
    .split('||')
    .map((candidate) => candidate.trim())
    .filter(Boolean)
    .some((candidate) => matchesSingleVersionRequirement(candidate, actual));
}

function matchesSingleVersionRequirement(requirement: string, actual: string) {
  const actualVersion = parseVersion(actual);
  if (!actualVersion) return false;
  const normalized = requirement.trim();
  const base = parseVersion(normalized.replace(/^[~^>=<\s]+/, '').replace(/\.x$/i, '.0'));
  if (!base) return false;

  if (/^\^/.test(normalized)) {
    return actualVersion.major === base.major && compareVersion(actualVersion, base) >= 0;
  }
  if (/^~/.test(normalized)) {
    return actualVersion.major === base.major
      && actualVersion.minor === base.minor
      && compareVersion(actualVersion, base) >= 0;
  }
  if (/^>=/.test(normalized)) return compareVersion(actualVersion, base) >= 0;
  if (/^\d+\.x$/i.test(normalized)) return actualVersion.major === base.major;
  if (/^\d+\.\d+\.x$/i.test(normalized)) {
    return actualVersion.major === base.major && actualVersion.minor === base.minor;
  }
  return compareVersion(actualVersion, base) === 0;
}

function materialKey(name: string, version: string) {
  return `${name}@${version}`;
}

function sameStrings(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function isReactComponent(value: unknown): value is ComponentType<any> {
  return typeof value === 'function'
    || (!!value && typeof value === 'object' && '$$typeof' in value);
}

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
}

function parseVersion(value: string): ParsedVersion | undefined {
  const match = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-+][0-9A-Za-z.-]+)?$/.exec(value.trim());
  if (!match) return undefined;
  return {
    major: Number(match[1]),
    minor: Number(match[2] || 0),
    patch: Number(match[3] || 0),
  };
}

function compareVersion(left: ParsedVersion, right: ParsedVersion) {
  return left.major - right.major || left.minor - right.minor || left.patch - right.patch;
}

declare global {
  interface Window {
    __LOWCODE_MATERIAL_HOST__?: LowcodeMaterialHost;
  }
}
