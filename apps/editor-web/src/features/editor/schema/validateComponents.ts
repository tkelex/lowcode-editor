import {
  assertValidComponentTree as assertValidLowcodeComponentTree,
  validateComponentTree as validateLowcodeComponentTree,
} from '@lowcode/schema';
import type {
  ComponentTreeValidationResult,
  LowcodeComponentConfigMap,
} from '@lowcode/schema';
import type { Component } from '../stores/editor-store';

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
