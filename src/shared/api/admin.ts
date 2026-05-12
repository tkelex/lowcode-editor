import { http } from './http';
import { AdminOverview, AdminProject, AdminPublishedPage, AdminUser, AuditLog } from './types';

export async function getAdminOverview() {
  const { data } = await http.get<AdminOverview>('/admin/overview');
  return data;
}

export async function listAdminUsers() {
  const { data } = await http.get<AdminUser[]>('/admin/users');
  return data;
}

export async function updateAdminUserStatus(userId: number, status: AdminUser['status']) {
  const { data } = await http.patch<AdminUser>(`/admin/users/${userId}/status`, { status });
  return data;
}

export async function listAdminProjects() {
  const { data } = await http.get<AdminProject[]>('/admin/projects');
  return data;
}

export async function updateAdminProjectStatus(projectId: number, status: AdminProject['status']) {
  const { data } = await http.patch<AdminProject>(`/admin/projects/${projectId}/status`, { status });
  return data;
}

export async function listAdminPublishedPages() {
  const { data } = await http.get<AdminPublishedPage[]>('/admin/published-pages');
  return data;
}

export async function adminUnpublishPage(pageId: number) {
  const { data } = await http.post<AdminPublishedPage>(`/admin/pages/${pageId}/unpublish`);
  return data;
}

export async function listAdminAuditLogs() {
  const { data } = await http.get<AuditLog[]>('/admin/audit-logs');
  return data;
}
