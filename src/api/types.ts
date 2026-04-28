export interface User {
  id: number;
  email: string;
  username: string;
  nickname?: string | null;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Project {
  id: number;
  ownerId: number;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageSchema {
  schemaVersion: string;
  pageId?: number | null;
  components: unknown[];
  metadata?: Record<string, unknown>;
}

export interface EditorPage {
  id: number;
  projectId: number;
  createdById: number;
  name: string;
  routePath: string;
  schema: PageSchema;
  createdAt: string;
  updatedAt: string;
}

export interface PageVersion {
  id: number;
  pageId: number;
  createdById: number;
  versionNo: number;
  schema: PageSchema;
  source: 'save' | 'rollback' | string;
  message?: string | null;
  createdAt: string;
}
