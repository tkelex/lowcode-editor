import { getStoredToken } from '../../features/auth';
import type { AppView } from './types';

export function getInitialAppView(): AppView {
  if (window.location.pathname === '/admin') {
    return getStoredToken() ? { name: 'admin' } : { name: 'auth' };
  }

  return getStoredToken() ? { name: 'dashboard' } : { name: 'auth' };
}
