import { http } from '../../../shared/api/http';
import type { ProjectRemoteMaterial } from '../types';

export async function listProjectRemoteMaterials(projectId: number) {
  const { data } = await http.get<ProjectRemoteMaterial[]>(
    `/projects/${projectId}/remote-materials`,
  );
  return data;
}
