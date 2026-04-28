import { http } from './http';
import { EditorPage, PageSchema, PageVersion } from './types';

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

export async function listPageVersions(pageId: number) {
  const { data } = await http.get<PageVersion[]>(`/pages/${pageId}/versions`);
  return data;
}

export async function rollbackPage(pageId: number, versionId: number) {
  const { data } = await http.post<EditorPage>(`/pages/${pageId}/rollback`, { versionId });
  return data;
}
