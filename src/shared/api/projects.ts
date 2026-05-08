import { http } from './http';
import { AuditLog, Project, ProjectMember, ProjectRole } from './types';

export async function listProjects() {
  const { data } = await http.get<Project[]>('/projects');
  return data;
}

export async function createProject(input: { name: string; description?: string }) {
  const { data } = await http.post<Project>('/projects', input);
  return data;
}

export async function listProjectMembers(projectId: number) {
  const { data } = await http.get<ProjectMember[]>(`/projects/${projectId}/members`);
  return data;
}

export async function addProjectMember(
  projectId: number,
  input: { email?: string; userId?: number; role: Exclude<ProjectRole, 'owner'> },
) {
  const { data } = await http.post<ProjectMember>(`/projects/${projectId}/members`, input);
  return data;
}

export async function updateProjectMember(
  projectId: number,
  memberId: number,
  input: { role: Exclude<ProjectRole, 'owner'> },
) {
  const { data } = await http.patch<ProjectMember>(`/projects/${projectId}/members/${memberId}`, input);
  return data;
}

export async function removeProjectMember(projectId: number, memberId: number) {
  const { data } = await http.delete<{ success: boolean }>(`/projects/${projectId}/members/${memberId}`);
  return data;
}

export async function listProjectAuditLogs(projectId: number) {
  const { data } = await http.get<AuditLog[]>(`/projects/${projectId}/audit-logs`);
  return data;
}
