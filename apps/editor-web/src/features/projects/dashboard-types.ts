import type { User } from '../auth';
import type { ProjectRole } from './types';

export interface ProjectDashboardProps {
  user: User;
  onOpenPage: (pageId: number, projectRole?: ProjectRole) => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
}

export type AddMemberFormValues = {
  email: string;
  role: Exclude<ProjectRole, 'owner'>;
};
