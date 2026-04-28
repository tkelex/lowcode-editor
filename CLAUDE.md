# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context Index

For low-token project onboarding or after context compaction, read these first:

- `docs/CONTEXT_INDEX.md` — project overview, reading order, current verified state.
- `.claude/context/FILE_MAP.md` — key files, responsibilities, and edit risks.
- `docs/ARCHITECTURE.md` — frontend/backend/database architecture and data flow.
- `docs/API.md` — backend routes, auth, and schema persistence contracts.
- `docs/DECISIONS.md` — product and technical decisions with rationale.

Use the `/context-index` skill to refresh these docs when project structure, API, or architecture changes.

## Commands

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build for production: `npm run build` (runs `tsc -b` before `vite build`)
- Lint: `npm run lint`
- Preview production build: `npm run preview`

There is no test script configured in `package.json`.

## Project Overview

This is a Vite + React + TypeScript low-code editor. The app entry is `src/main.tsx`, which wraps `App` in `react-dnd`'s `DndProvider`; `src/App.tsx` renders the editor from `src/editor/index.tsx`.

The editor has two modes stored in Zustand: `edit` and `preview`. In edit mode, `src/editor/index.tsx` uses `allotment` to split the UI into three panes: the left material/outline/source panel, the central edit canvas, and the right settings panel. In preview mode, it renders the production component tree only.

## Core State Model

- `src/editor/stores/components.tsx` is the main persisted Zustand store. It owns the component tree, current selection, and editor mode.
- Component nodes have `{ id, name, props, styles, desc, children?, parentId? }`. The initial tree is a single `Page` component with id `1`.
- Store mutations intentionally mutate nested component objects and then replace the top-level `components` array to trigger React updates.
- The store export is named `useComponetsStore` (typo is part of the current API). Avoid renaming it unless updating all imports.
- `src/editor/stores/component-config.tsx` is the registry for material metadata, default props, setters, events, methods, and the dev/prod React implementations.

## Rendering and Editing Flow

- `src/editor/components/EditArea/index.tsx` recursively renders the component tree using each registry entry's `dev` component. It selects and hovers components by walking the event `composedPath()` and reading `data-component-id` from rendered DOM.
- `src/editor/components/Preivew/index.tsx` recursively renders using each registry entry's `prod` component and wires configured event actions.
- Materials are shown by `src/editor/components/Material/index.tsx` from the component registry, excluding `Page`.
- Drag/drop behavior lives in `src/editor/hooks/useMaterailDrop.ts` (typo in filename and function name is current API). It supports adding new components and moving existing components.
- The settings panel reads `component-config` setters/events and writes changes back into the component tree through `useComponetsStore`.

## Materials

Each material under `src/editor/materials/<Name>/` generally has:

- `dev.tsx`: edit-canvas implementation; should expose `data-component-id` on its root/selectable DOM and call `useMaterailDrop` if it can accept children.
- `prod.tsx`: preview/runtime implementation; should support event props and refs when methods are configured.
- A registry entry in `src/editor/stores/component-config.tsx` with `defaultProps`, `desc`, optional `setter`, `stylesSetter`, `events`, `methods`, and `dev`/`prod` components.

When adding a new material, update the registry and ensure both edit and preview rendering paths work.

## Event Actions

Event configuration is stored on component props by event name, e.g. `{ onClick: { actions: [...] } }`. Preview mode currently supports these action types via `ActionConfig` in `src/editor/components/Setting/ActionModal.tsx`:

- `goToLink`: sets `window.location.href`
- `showMessage`: uses Ant Design `message`
- `customJS`: executes configured code with `new Function`
- `componentMethod`: calls a method on another component ref

Be careful when changing `customJS` behavior because it executes user-authored code in preview mode.

## Performance Panel

`src/editor/perf/zustandPerf.ts` and `src/editor/components/PerfPanel/index.tsx` implement render/update benchmarking for Zustand changes. Mutating component-store actions call `markZustandUpdate`, while `src/editor/index.tsx` wraps the editor in `React.Profiler` and records commits. Keep this instrumentation in sync when adding new store actions that should be measured.

## Important Existing Typos

Several public file/import names are misspelled and should be preserved unless doing a deliberate rename across the project:

- `useComponetsStore`
- `useMaterailDrop`
- `components/Preivew`
- `components/Sourse` appears alongside `components/Source`; current imports use `Source` and `Preivew`.
