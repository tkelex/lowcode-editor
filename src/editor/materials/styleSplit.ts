import type { CSSProperties } from 'react';

const controlDimensionStyleNames = new Set([
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
]);

const shellOnlyStyleNames = new Set([
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
    if (controlDimensionStyleNames.has(name)) {
      shellStyles[name as keyof CSSProperties] = value as never;
      controlStyles[name as keyof CSSProperties] = value as never;
      return;
    }

    if (shellOnlyStyleNames.has(name)) {
      shellStyles[name as keyof CSSProperties] = value as never;
      return;
    }

    controlStyles[name as keyof CSSProperties] = value as never;
  });

  return { shellStyles, controlStyles };
}
