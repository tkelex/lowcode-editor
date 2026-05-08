import {
  assertValidComponentTree as assertValidLowcodeComponentTree,
  validateComponentTree as validateLowcodeComponentTree,
} from '../../../packages/lowcode-schema/src/validate';
import type {
  ComponentTreeValidationResult,
  LowcodeComponentConfigMap,
} from '../../../packages/lowcode-schema/src/types';
import type { Component } from '../stores/components';

export type ComponentSchemaValidationResult = ComponentTreeValidationResult;

export function validateComponentTree(
  value: unknown,
  componentConfig: LowcodeComponentConfigMap,
): ComponentSchemaValidationResult {
  return validateLowcodeComponentTree(value, componentConfig);
}

export function assertValidComponentTree(
  value: unknown,
  componentConfig: LowcodeComponentConfigMap,
): Component[] {
  return assertValidLowcodeComponentTree(value, componentConfig) as Component[];
}
