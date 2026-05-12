import type { CSSProperties } from 'react';

const shellStyleNames = new Set([
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
]);

export function splitControlStyles(styles?: CSSProperties) {
  const shellStyles: CSSProperties = {};
  const controlStyles: CSSProperties = {};

  Object.entries(styles || {}).forEach(([name, value]) => {
    if (shellStyleNames.has(name)) {
      shellStyles[name as keyof CSSProperties] = value as never;
      return;
    }

    controlStyles[name as keyof CSSProperties] = value as never;
  });

  return { shellStyles, controlStyles };
}
