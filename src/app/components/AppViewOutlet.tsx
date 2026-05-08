import LowcodeEditor from '../../editor/';
import { AuthView } from '../../features/auth/AuthView';
import { ProjectDashboard } from '../../features/projects/ProjectDashboard';
import { ProjectRole, User } from '../../shared/api/types';
import type { AppView } from '../routes/types';
import { AppLoading } from './AppLoading';

interface AppViewOutletProps {
  view: AppView;
  user: User | null;
  onAuthenticated: (user: User) => void;
  onOpenPage: (pageId: number, projectRole?: ProjectRole) => void;
  onLogout: () => void;
  onBackToDashboard: () => void;
}

export function AppViewOutlet({
  view,
  user,
  onAuthenticated,
  onOpenPage,
  onLogout,
  onBackToDashboard,
}: AppViewOutletProps) {
  if (view.name === 'auth') {
    return <AuthView onAuthenticated={onAuthenticated} />;
  }

  if (view.name === 'editor') {
    return <LowcodeEditor pageId={view.pageId} projectRole={view.projectRole} onBack={onBackToDashboard} />;
  }

  if (!user) {
    return <AppLoading />;
  }

  return <ProjectDashboard user={user} onOpenPage={onOpenPage} onLogout={onLogout} />;
}
