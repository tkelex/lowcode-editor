import { Spin, message } from 'antd';
import { useEffect, useState } from 'react';
import { getCurrentUser, getStoredToken, logout } from './api/auth';
import { getPage } from './api/pages';
import { User } from './api/types';
import LowcodeEditor from './editor/';
import { Component, useComponetsStore } from './editor/stores/components';
import { AuthView } from './features/auth/AuthView';
import { ProjectDashboard } from './features/projects/ProjectDashboard';

type AppView =
  | { name: 'auth' }
  | { name: 'dashboard' }
  | { name: 'editor'; pageId: number };

function App() {
  const [user, setUser] = useState<User | null>(null);
  const initialView: AppView = getStoredToken() ? { name: 'dashboard' } : { name: 'auth' };
  const [view, setView] = useState<AppView>(initialView);
  const [initializing, setInitializing] = useState(Boolean(getStoredToken()));
  const [loadingPage, setLoadingPage] = useState(false);
  const setComponents = useComponetsStore((state) => state.setComponents);

  useEffect(() => {
    if (!getStoredToken()) return;

    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        setView({ name: 'dashboard' });
      })
      .catch(() => {
        logout();
        setView({ name: 'auth' });
      })
      .finally(() => setInitializing(false));
  }, []);

  async function handleOpenPage(pageId: number) {
    setLoadingPage(true);
    try {
      const page = await getPage(pageId);
      setComponents(page.schema.components as Component[]);
      setView({ name: 'editor', pageId });
    } catch (error) {
      message.error('页面加载失败');
    } finally {
      setLoadingPage(false);
    }
  }

  function handleLogout() {
    logout();
    setUser(null);
    setView({ name: 'auth' });
  }

  if (initializing || loadingPage) {
    return <div className="h-screen flex items-center justify-center"><Spin size="large" /></div>;
  }

  if (view.name === 'auth') {
    return <AuthView onAuthenticated={(nextUser) => {
      setUser(nextUser);
      setView({ name: 'dashboard' });
    }} />;
  }

  if (view.name === 'editor') {
    return <LowcodeEditor pageId={view.pageId} onBack={() => setView({ name: 'dashboard' })} />;
  }

  return <ProjectDashboard user={user!} onOpenPage={handleOpenPage} onLogout={handleLogout} />;
}

export default App
