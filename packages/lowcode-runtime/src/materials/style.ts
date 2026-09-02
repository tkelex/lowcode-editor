import type { CSSProperties } from 'react';

const layoutStyleKeys = new Set([
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'zIndex',
  'width',
  'minWidth',
  'maxWidth',
  'height',
  'minHeight',
  'maxHeight',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'justifySelf',
]);

export function splitControlStyles(styles?: CSSProperties) {
  const shellStyles: CSSProperties = {};
  const controlStyles: CSSProperties = {};

  Object.entries(styles || {}).forEach(([key, value]) => {
    if (layoutStyleKeys.has(key)) {
      (shellStyles as Record<string, unknown>)[key] = value;
    } else {
      (controlStyles as Record<string, unknown>)[key] = value;
    }
  });

  return { shellStyles, controlStyles };
}
