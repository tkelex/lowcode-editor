import type { ActionType, LowcodeComponentConfigMap } from './types';
import { builtinComponentSchemaRegistry } from './registry';

export const AI_PAGE_BUILDER_ALLOWED_COMPONENTS = [
  'Page',
  'Container',
  'Card',
  'Space',
  'Flex',
  'Grid',
  'Tabs',
  'Steps',
  'Modal',
  'Drawer',
  'Text',
  'Image',
  'Divider',
  'Alert',
  'Button',
  'Link',
  'Icon',
  'Form',
  'FormItem',
  'Input',
  'Textarea',
  'Select',
  'Radio',
  'Checkbox',
  'DatePicker',
  'Switch',
  'Rate',
  'Upload',
  'Table',
  'TableColumn',
  'List',
  'Descriptions',
  'Statistic',
  'Pagination',
  'Chart',
  'Tooltip',
  'Popover',
  'Notification',
  'Result',
  'Empty',
] as const;

export const AI_PAGE_BUILDER_ALLOWED_ACTIONS: Exclude<ActionType, 'custom'>[] = [
  'toast',
  'url',
  'componentAction',
  'confirm',
  'condition',
  'http',
  'componentControl',
  'setComponentProps',
  'setComponentStyles',
  'setVariable',
];

export const aiPageBuilderAllowedComponentSet = new Set<string>(AI_PAGE_BUILDER_ALLOWED_COMPONENTS);
export const aiPageBuilderAllowedActionSet = new Set<string>(AI_PAGE_BUILDER_ALLOWED_ACTIONS);

export const aiPageBuilderComponentRegistry: LowcodeComponentConfigMap = Object.fromEntries(
  AI_PAGE_BUILDER_ALLOWED_COMPONENTS.map((name) => [name, builtinComponentSchemaRegistry[name]]),
) as LowcodeComponentConfigMap;
