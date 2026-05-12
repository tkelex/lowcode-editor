import type { LowcodePageSchema } from '../../../packages/lowcode-schema/src';

export interface User {
  id: number;
  email: string;
  username: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'disabled';
  nickname?: string | null;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export type ProjectRole = 'owner' | 'editor' | 'viewer';

export interface Project {
  id: number;
  ownerId: number;
  name: string;
  description?: string | null;
  status: string;
  currentUserRole?: ProjectRole;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: ProjectRole;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  actorId?: number | null;
  actor?: User | null;
  projectId?: number | null;
  pageId?: number | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  summary?: string | null;
  metadata?: unknown;
  createdAt: string;
}

export interface AdminOverview {
  users: {
    total: number;
    active: number;
    disabled: number;
  };
  projects: {
    total: number;
    active: number;
    disabled: number;
  };
  pages: {
    total: number;
    published: number;
  };
  assets: {
    total: number;
    totalSize: number;
  };
}

export interface AdminUser extends User {
  role: 'user' | 'admin';
  status: 'active' | 'disabled';
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProject {
  id: number;
  name: string;
  description?: string | null;
  status: 'active' | 'disabled';
  owner: User;
  pageCount: number;
  assetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPublishedPage {
  id: number;
  name: string;
  routePath: string;
  publicId?: string | null;
  publishedAt?: string | null;
  projectId: number;
  projectName: string;
  projectStatus: 'active' | 'disabled';
  owner: User;
}

export type PageSchema = LowcodePageSchema;

export interface PageTemplate {
  id: number;
  projectId?: number | null;
  createdById: number;
  type: 'page' | 'block';
  title: string;
  description?: string | null;
  category?: string | null;
  tags: string[];
  schema: PageSchema;
  visibility: 'project' | 'private' | string;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: number;
  projectId: number;
  uploadedById: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  storageKey: string;
  category: 'image' | 'file' | string;
  createdAt: string;
}

export interface EditorPage {
  id: number;
  projectId: number;
  createdById: number;
  name: string;
  routePath: string;
  schema: PageSchema;
  publicId?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  publishedVersionId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublishedPage {
  publicId: string;
  name: string;
  routePath: string;
  schema: PageSchema;
  publishedAt?: string | null;
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
