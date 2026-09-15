import { useCallback, useEffect, useState } from 'react';
import type { User } from '../features/auth';
import { AppLoading } from './components/AppLoading';
import { AppViewOutlet } from './components/AppViewOutlet';
import { useAuthSession } from './hooks/useAuthSession';
import { useEditorPageLoader } from './hooks/useEditorPageLoader';
import type { LoadedEditorPageContext } from './hooks/useEditorPageLoader';
import { getInitialAppView } from './routes/initialView';
import type { AppView } from './routes/types';

function App() {
  const [view, setView] = useState<AppView>(getInitialAppView);
  const { user, status, initializing, authenticate, signOut } = useAuthSession();

  const handlePageLoaded = useCallback((context: LoadedEditorPageContext) => {
    setView({ name: 'editor', ...context });
  }, []);
  const { loadingPage, openPage } = useEditorPageLoader(user?.id, handlePageLoaded);

  useEffect(() => {
    if (status === 'anonymous') {
      setView({ name: 'auth' });
      return;
    }

    if (status === 'authenticated') {
      setView((currentView) => currentView.name === 'auth' ? { name: 'dashboard' } : currentView);
    }
  }, [status]);

  const handleAuthenticated = useCallback((nextUser: User) => {
    authenticate(nextUser);
    if (window.location.pathname === '/admin' && nextUser.role === 'admin') {
      setView({ name: 'admin' });
      return;
    }

    if (window.location.pathname === '/admin') {
      window.history.pushState(null, '', '/');
    }
    setView({ name: 'dashboard' });
  }, [authenticate]);

  const handleLogout = useCallback(() => {
    if (window.location.pathname === '/admin') {
      window.history.pushState(null, '', '/');
    }
    signOut();
    setView({ name: 'auth' });
  }, [signOut]);

  const handleBackToDashboard = useCallback(() => {
    if (window.location.pathname === '/admin') {
      window.history.pushState(null, '', '/');
    }
    setView({ name: 'dashboard' });
  }, []);

  const handleOpenAdmin = useCallback(() => {
    window.history.pushState(null, '', '/admin');
    setView({ name: 'admin' });
  }, []);

  if (initializing || loadingPage) {
    return <AppLoading />;
  }

  return <AppViewOutlet
    view={view}
    user={user}
    onAuthenticated={handleAuthenticated}
    onOpenPage={openPage}
    onLogout={handleLogout}
    onOpenAdmin={handleOpenAdmin}
    onBackToDashboard={handleBackToDashboard}
  />;
}

export default App;
