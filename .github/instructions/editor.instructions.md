---
applyTo: "src/editor/**, src/app/**, src/features/**, src/shared/**, packages/lowcode-schema/**"
---

# Editor And Frontend Instructions

Use these rules for frontend editor, schema, material, preview, and publish-page work.

## Core Model

- The editor component tree lives in `src/editor/stores/components.tsx`.
- Nodes use `{ id, name, props, styles, desc, children?, parentId? }`.
- The store export is intentionally named `useComponetsStore`.
- The registry lives in `src/editor/registry/component-config.tsx`; `src/editor/stores/component-config.tsx` is only a compatibility re-export.
- Edit mode renders registry `dev` components. Preview/runtime renders registry `prod` components.

## Material Changes

When adding or changing a material:

- Update `src/editor/materials/<Name>/dev.tsx`.
- Update `src/editor/materials/<Name>/prod.tsx`.
- Update `src/editor/registry/component-config.tsx`.
- Update shared schema rules under `packages/lowcode-schema/src/*` when children, defaults, migration, or validation behavior changes.
- Ensure editable roots expose `data-component-id`.
- Use `useMaterialDrop` for new code. Keep `useMaterailDrop` compatibility.

## Event And Preview Changes

- Prefer the current `props.onEvent[eventName].actions` event schema.
- Preserve compatibility with older `props.onClick.actions` data where existing runtime code supports it.
- Be careful with `custom` actions because they execute user-authored code in editor preview.
- Public published pages must keep custom JavaScript disabled.

## UI And State Safety

- Keep undo/redo history in memory; do not persist history stacks.
- Do not mutate component tree structures in place if existing store helpers expect immutable snapshots.
- For drag/drop, outline, selection, hover, and canvas changes, verify both edit mode and preview mode behavior.
- For responsive editor UI changes, check desktop and narrow viewport behavior.

