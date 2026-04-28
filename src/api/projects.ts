import { http } from './http';
import { Project } from './types';

export async function listProjects() {
  const { data } = await http.get<Project[]>('/projects');
  return data;
}

export async function createProject(input: { name: string; description?: string }) {
  const { data } = await http.post<Project>('/projects', input);
  return data;
}
