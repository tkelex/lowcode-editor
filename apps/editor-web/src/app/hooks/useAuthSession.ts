import { useCallback, useEffect, useState } from 'react';
import { getCurrentUser, getStoredToken, logout, type User } from '../../features/auth';

type SessionStatus = 'checking' | 'authenticated' | 'anonymous';

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>(() => (
    getStoredToken() ? 'checking' : 'anonymous'
  ));

  useEffect(() => {
    if (!getStoredToken()) {
      setUser(null);
      setStatus('anonymous');
      return;
    }

    let ignore = false;
    setStatus('checking');

    getCurrentUser()
      .then((currentUser) => {
        if (ignore) return;
        setUser(currentUser);
        setStatus('authenticated');
      })
      .catch(() => {
        if (ignore) return;
        logout();
        setUser(null);
        setStatus('anonymous');
      });

    return () => {
      ignore = true;
    };
  }, []);

  const authenticate = useCallback((nextUser: User) => {
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(() => {
    logout();
    setUser(null);
    setStatus('anonymous');
  }, []);

  return {
    user,
    status,
    initializing: status === 'checking',
    authenticate,
    signOut,
  };
}
