import { useCallback, useEffect, useState } from 'react';
import { getCurrentUser, getStoredToken, logout } from '../../shared/api/auth';
import { User } from '../../shared/api/types';

type SessionStatus = 'checking' | 'authenticated' | 'anonymous';

interface UseAuthSessionOptions {
  disabled?: boolean;
}

export function useAuthSession({ disabled = false }: UseAuthSessionOptions = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>(() => (
    !disabled && getStoredToken() ? 'checking' : 'anonymous'
  ));

  useEffect(() => {
    if (disabled) {
      setStatus('anonymous');
      return;
    }

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
  }, [disabled]);

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
