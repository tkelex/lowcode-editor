import { lazy, Suspense } from 'react';
import { ProjectRole, User } from '../../shared/api/types';
import type { AppView } from '../routes/types';
import { AppLoading } from './AppLoading';

const LowcodeEditor = lazy(() => import('../../editor/'));
const AuthView = lazy(() => import('../../features/auth/AuthView').then((module) => ({
  default: module.AuthView,
})));
const ProjectDashboard = lazy(() => import('../../features/projects/ProjectDashboard').then((module) => ({
  default: module.ProjectDashboard,
})));
const AdminDashboard = lazy(() => import('../../features/admin/AdminDashboard').then((module) => ({
  default: module.AdminDashboard,
})));

interface AppViewOutletProps {
  view: AppView;
  user: User | null;
  onAuthenticated: (user: User) => void;
  onOpenPage: (pageId: number, projectRole?: ProjectRole) => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onBackToDashboard: () => void;
}

export function AppViewOutlet({
  view,
  user,
  onAuthenticated,
  onOpenPage,
  onLogout,
  onOpenAdmin,
  onBackToDashboard,
}: AppViewOutletProps) {
  if (view.name === 'auth') {
    return <Suspense fallback={<AppLoading />}>
      <AuthView onAuthenticated={onAuthenticated} />
    </Suspense>;
  }

  if (view.name === 'editor') {
    return <Suspense fallback={<AppLoading />}>
      <LowcodeEditor
        pageId={view.pageId}
        projectId={view.projectId}
        projectRole={view.projectRole}
        onBack={onBackToDashboard}
      />
    </Suspense>;
  }

  if (!user) {
    return <AppLoading />;
  }

  if (view.name === 'admin') {
    return <Suspense fallback={<AppLoading />}>
      <AdminDashboard user={user} onBack={onBackToDashboard} onLogout={onLogout} />
    </Suspense>;
  }

  return <Suspense fallback={<AppLoading />}>
    <ProjectDashboard user={user} onOpenPage={onOpenPage} onLogout={onLogout} onOpenAdmin={onOpenAdmin} />
  </Suspense>;
}
