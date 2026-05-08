import { useCallback, useEffect, useMemo, useState } from 'react';
import { PublishedPageView } from '../features/publish/PublishedPageView';
import { ProjectRole, User } from '../shared/api/types';
import { AppLoading } from './components/AppLoading';
import { AppViewOutlet } from './components/AppViewOutlet';
import { useAuthSession } from './hooks/useAuthSession';
import { useEditorPageLoader } from './hooks/useEditorPageLoader';
import { getInitialAppView } from './routes/initialView';
import { getPublishPublicId } from './routes/publicRoutes';
import type { AppView } from './routes/types';

function App() {
  const publishPublicId = useMemo(() => getPublishPublicId(), []);
  const isPublicRoute = Boolean(publishPublicId);
  const [view, setView] = useState<AppView>(() => getInitialAppView(isPublicRoute));
  const { user, status, initializing, authenticate, signOut } = useAuthSession({
    disabled: isPublicRoute,
  });

  const handlePageLoaded = useCallback((pageId: number, projectId?: number, projectRole?: ProjectRole) => {
    setView({ name: 'editor', pageId, projectId, projectRole });
  }, []);
  const { loadingPage, openPage } = useEditorPageLoader(handlePageLoaded);

  useEffect(() => {
    if (isPublicRoute) return;

    if (status === 'anonymous') {
      setView({ name: 'auth' });
      return;
    }

    if (status === 'authenticated') {
      setView((currentView) => currentView.name === 'auth' ? { name: 'dashboard' } : currentView);
    }
  }, [isPublicRoute, status]);

  const handleAuthenticated = useCallback((nextUser: User) => {
    authenticate(nextUser);
    setView({ name: 'dashboard' });
  }, [authenticate]);

  const handleLogout = useCallback(() => {
    signOut();
    setView({ name: 'auth' });
  }, [signOut]);

  const handleBackToDashboard = useCallback(() => {
    setView({ name: 'dashboard' });
  }, []);

  if (publishPublicId) {
    return <PublishedPageView publicId={publishPublicId} />;
  }

  if (initializing || loadingPage) {
    return <AppLoading />;
  }

  return <AppViewOutlet
    view={view}
    user={user}
    onAuthenticated={handleAuthenticated}
    onOpenPage={openPage}
    onLogout={handleLogout}
    onBackToDashboard={handleBackToDashboard}
  />;
}

export default App;
