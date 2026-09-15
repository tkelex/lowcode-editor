import type { ProjectRole } from '../../features/projects';

export type AppView =
  | { name: 'auth' }
  | { name: 'dashboard' }
  | { name: 'admin' }
  | {
    name: 'editor';
    pageId: number;
    projectId: number;
    projectRole?: ProjectRole;
    baselineFingerprint: string;
    serverUpdatedAt: string;
    serverRevision: number;
  };
