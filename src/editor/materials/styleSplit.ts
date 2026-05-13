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
  'display',
  'flexDirection',
  'justifyContent',
  'alignItems',
  'gap',
  'rowGap',
  'columnGap',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'zIndex',
  'overflow',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
]);

const dualStyleNames = new Set([
  ...controlDimensionStyleNames,
  'opacity',
  'visibility',
]);

export function splitControlStyles(styles?: CSSProperties) {
  const shellStyles: CSSProperties = {};
  const controlStyles: CSSProperties = {};

  Object.entries(styles || {}).forEach(([name, value]) => {
    if (dualStyleNames.has(name)) {
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
