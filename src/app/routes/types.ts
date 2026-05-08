import type { ProjectRole } from '../../shared/api/types';

export type AppView =
  | { name: 'auth' }
  | { name: 'dashboard' }
  | { name: 'editor'; pageId: number; projectRole?: ProjectRole };
