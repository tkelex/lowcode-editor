import type { ProjectDataSourceModelConfig } from '@lowcode/schema';
import { http } from '../../../shared/api/http';

export type DataSourceModelInput = Omit<ProjectDataSourceModelConfig, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>;
export type DataSourceModelUpdateInput = Partial<DataSourceModelInput>;

export async function listDataSourceModels(projectId: number) {
  const { data } = await http.get<ProjectDataSourceModelConfig[]>(`/projects/${projectId}/data-source-models`);
  return data;
}

export async function createDataSourceModel(projectId: number, input: DataSourceModelInput) {
  const { data } = await http.post<ProjectDataSourceModelConfig>(`/projects/${projectId}/data-source-models`, input);
  return data;
}

export async function updateDataSourceModel(modelId: string | number, input: DataSourceModelUpdateInput) {
  const { data } = await http.patch<ProjectDataSourceModelConfig>(`/data-source-models/${modelId}`, input);
  return data;
}

export async function deleteDataSourceModel(modelId: string | number) {
  const { data } = await http.delete<{ success: boolean }>(`/data-source-models/${modelId}`);
  return data;
}
