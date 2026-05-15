# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Context Index

For low-token project onboarding or after context compaction, read these first:

- `docs/00-总览/AI快速上手.md` — AI-focused quick start, task routing, high-risk files, and validation strategy.
- `docs/00-总览/项目上下文索引.md` — project overview, reading order, current verified state.
- `docs/00-总览/UI需求表达指南.md` — how to describe UI targets, screenshots, layout specs, and visual acceptance criteria for Codex.
- `.claude/context/FILE_MAP.md` — key files, responsibilities, and edit risks.
- `docs/02-架构/架构说明.md` — frontend/backend/database architecture and data flow.
- `docs/03-接口/接口说明.md` — backend routes, auth, and schema persistence contracts.
- `docs/02-架构/技术决策记录.md` — product and technical decisions with rationale.

Use the `/context-index` skill to refresh these docs when project structure, API, or architecture changes.

GitHub Copilot and path-specific agent instructions live in `.github/copilot-instructions.md` and `.github/instructions/*.instructions.md`; keep them aligned when changing AI workflows or validation expectations.

## Language Policy

- Natural-language content must be written in Simplified Chinese by default, including assistant replies, project documentation, OpenSpec proposals/designs/specs/tasks, comments in planning docs, review notes, and user-facing explanatory text.
- Keep code identifiers, file paths, commands, API route names, dependency names, TypeScript types, and existing third-party terms in their original language when that is clearer or required by the toolchain.
- When editing an existing English-only tool template or generated instruction, preserve required keywords and machine-parsed headings, but write the human-authored body text in Chinese where possible.

## Commands

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build for production: `npm run build` (runs `tsc -b` before `vite build`)
- Lint: `npm run lint`
- Test: `npm run test`
- Preview production build: `npm run preview`
- Run full local check: `npm run check`

## AI Page Builder

- AI 页面搭建只生成当前低代码组件树 schema，不生成任意 React/Vue/HTML 源码。
- AI agent 只能生成低代码 schema 或 schema patch；不得绕过现有编辑器 store、保存、版本和发布流程。
- 模型调用必须走后端 AI 网关；前端不得保存或发送模型 API key。
- 后端 AI provider 使用 `AI_PROVIDER_BASE_URL`、`AI_PROVIDER_API_KEY`、`AI_PROVIDER_MODEL`、`AI_PROVIDER_TIMEOUT_MS` 配置；未配置 key 时返回本地规则生成的可编辑草稿。
- AI 输出写入编辑器前必须通过 `validateAiGeneratedComponents`，覆盖物料白名单、组件树、父子关系、事件动作和 custom JS 限制。
- AI agent 候选 patch 应用前必须通过 `applyAiComponentPatch` 或等效校验，覆盖 stale baseline、目标组件、父子关系、物料白名单和 custom JS 限制。
- AI 结果必须先展示摘要、warnings、assumptions、执行轨迹和预览，由用户确认后才能替换整页、插入当前容器或应用 patch。

## Project Overview

This is a Vite + React + TypeScript low-code editor. The app entry is `src/main.tsx`, which renders `src/app/App.tsx` through `src/app/providers/AppProviders.tsx`. `src/App.tsx` is only a compatibility re-export.

The editor has two modes stored in Zustand: `edit` and `preview`. In edit mode, `src/editor/index.tsx` uses `allotment` to split the UI into three panes: the left material/outline/source panel, the central edit canvas, and the right settings panel. In preview mode, it renders the production component tree only.

## Core State Model

- `src/editor/stores/components.tsx` is the main persisted Zustand store. It owns the component tree, current selection, and editor mode.
- Component nodes have `{ id, name, props, styles, desc, children?, parentId? }`. The initial tree is a single `Page` component with id `1`.
- Store mutations update component tree snapshots and maintain undo/redo history in memory. Do not persist history stacks.
- The store export is named `useComponetsStore` (typo is part of the current API). Avoid renaming it unless updating all imports.
- `src/editor/registry/component-config.tsx` is the registry for material metadata, default props, setters, events, methods, and the dev/prod React implementations. `src/editor/stores/component-config.tsx` is only a compatibility re-export.

## Rendering and Editing Flow

- `src/editor/components/EditArea/index.tsx` recursively renders the component tree using each registry entry's `dev` component. It selects and hovers components by walking the event `composedPath()` and reading `data-component-id` from rendered DOM.
- `src/editor/components/Preview/index.tsx` recursively renders using each registry entry's `prod` component and wires configured event actions. `src/editor/components/Preivew/index.tsx` is a compatibility re-export.
- Materials are shown by `src/editor/components/Material/index.tsx` from the component registry, excluding `Page`.
- Drag/drop behavior lives in `src/editor/hooks/useMaterialDrop.ts`; `src/editor/hooks/useMaterailDrop.ts` is a compatibility re-export. It supports adding new components and moving existing components.
- The settings panel reads `component-config` setters/events and writes changes back into the component tree through `useComponetsStore`.

## Materials

Each material under `src/editor/materials/<Name>/` generally has:

- `dev.tsx`: edit-canvas implementation; should expose `data-component-id` on its root/selectable DOM and call `useMaterialDrop` if it can accept children.
- `prod.tsx`: preview/runtime implementation; should support event props and refs when methods are configured.
- A registry entry in `src/editor/stores/component-config.tsx` with `defaultProps`, `desc`, optional `setter`, `stylesSetter`, `events`, `methods`, and `dev`/`prod` components.

When adding a new material, update the registry and ensure both edit and preview rendering paths work.

## Data Source Models and CRUD Generation

- 数据源模型只保存外部 API 配置、字段映射和生成选项；平台不托管用户业务记录，不按模型生成业务数据库表。
- CRUD 生成器必须输出普通 Page schema，并继续使用现有物料 registry、`props.onEvent[eventName].actions`、运行态数据源、页面保存、版本和发布链路。
- 列表/详情读取优先复用 Page `dataSources` 和物料 `dataSourceId`；新增、编辑、删除等写入动作复用 `http` event action。
- 项目级数据源模型 API 必须复用 `ProjectAccessService`，owner/editor 可写，viewer 只读，创建、更新和删除需要写入 AuditLog。

## Event Actions

Event configuration is stored under `props.onEvent[eventName].actions`. The runtime remains compatible with older `props.onClick.actions` style schema and migrates edited events toward `onEvent`.

Preview mode currently supports these action types:

- `toast`: shows Ant Design messages.
- `url`: opens or navigates to a normalized URL.
- `componentAction`: calls a method on another component ref.
- `confirm`: shows a confirmation dialog before nested actions.
- `condition`: runs nested actions by expression result.
- `http`: sends a fetch request and writes response/error to event data.
- `setComponentProps` / `setComponentStyles`: updates a target component at runtime.
- `custom`: executes configured code with `new Function` in editor preview only.

Be careful when changing `custom` behavior because it executes user-authored code in preview mode. Published pages must keep `allowCustomJS={false}`.

## Important Existing Typos

Several public file/import names are misspelled and should be preserved as compatibility exports unless doing a deliberate cleanup release:

- `useComponetsStore`
- `useMaterailDrop`
- `components/Preivew`
- `components/Sourse`

New code should prefer `useMaterialDrop`, `components/Preview`, and `components/Source`.

