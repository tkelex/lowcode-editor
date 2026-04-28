import { http } from './http';
import { EditorPage, PageSchema } from './types';

export async function listPages(projectId: number) {
  const { data } = await http.get<EditorPage[]>(`/projects/${projectId}/pages`);
  return data;
}

export async function createPage(projectId: number, input: { name: string; routePath: string; schema?: PageSchema }) {
  const { data } = await http.post<EditorPage>(`/projects/${projectId}/pages`, input);
  return data;
}

export async function getPage(pageId: number) {
  const { data } = await http.get<EditorPage>(`/pages/${pageId}`);
  return data;
}

export async function updatePage(pageId: number, input: { name?: string; routePath?: string; schema?: PageSchema }) {
  const { data } = await http.patch<EditorPage>(`/pages/${pageId}`, input);
  return data;
}
