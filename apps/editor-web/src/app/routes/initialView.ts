import { getStoredToken } from '../../shared/api/auth';
import type { AppView } from './types';

export function getInitialAppView(isPublicRoute: boolean): AppView {
  if (isPublicRoute) {
    return { name: 'auth' };
  }

  if (window.location.pathname === '/admin') {
    return getStoredToken() ? { name: 'admin' } : { name: 'auth' };
  }

  return getStoredToken() ? { name: 'dashboard' } : { name: 'auth' };
}
