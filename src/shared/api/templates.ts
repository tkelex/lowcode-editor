import { http } from './http';
import { PageSchema, PageTemplate } from './types';

export async function listProjectTemplates(projectId: number) {
  const { data } = await http.get<PageTemplate[]>(`/projects/${projectId}/templates`);
  return data;
}

export async function createProjectTemplate(
  projectId: number,
  input: {
    type: 'page' | 'block';
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    schema: PageSchema;
    visibility?: 'project' | 'private';
  },
) {
  const { data } = await http.post<PageTemplate>(`/projects/${projectId}/templates`, input);
  return data;
}

export async function deleteProjectTemplate(projectId: number, templateId: number) {
  const { data } = await http.delete<{ success: boolean }>(`/projects/${projectId}/templates/${templateId}`);
  return data;
}
