import type { User } from '../auth';

export interface AdminOverview {
  users: { total: number; active: number; disabled: number };
  projects: { total: number; active: number; disabled: number };
  pages: { total: number; published: number };
  assets: { total: number; totalSize: number };
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
