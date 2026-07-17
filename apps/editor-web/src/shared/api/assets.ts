import { http } from './http';
import { Asset } from './types';

export async function listProjectAssets(projectId: number) {
  const { data } = await http.get<Asset[]>(`/projects/${projectId}/assets`);
  return data;
}

export async function uploadProjectAsset(projectId: number, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await http.post<Asset>(`/projects/${projectId}/assets`, formData, {
    headers: {
      'content-type': 'multipart/form-data',
    },
  });
  return data;
}

export async function deleteProjectAsset(projectId: number, assetId: number) {
  const { data } = await http.delete<{ success: boolean }>(`/projects/${projectId}/assets/${assetId}`);
  return data;
}
