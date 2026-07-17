import type { ProjectRole } from '../../shared/api/types';

export type AppView =
  | { name: 'auth' }
  | { name: 'dashboard' }
  | { name: 'admin' }
  | { name: 'editor'; pageId: number; projectId?: number; projectRole?: ProjectRole };
