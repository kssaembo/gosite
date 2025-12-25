
import { useState, useEffect } from 'react';
import { AuthState } from '../types';

export const useAuth = () => {
  const [auth, setAuth] = useState<AuthState>({
    isLoggedIn: false,
    teacherId: null,
    username: null,
  });

  useEffect(() => {
    const saved = localStorage.getItem('classlink_auth');
    if (saved) {
      setAuth(JSON.parse(saved));
    }
  }, []);

  const login = (teacherId: string, username: string) => {
    const newState = { isLoggedIn: true, teacherId, username };
    setAuth(newState);
    localStorage.setItem('classlink_auth', JSON.stringify(newState));
  };

  const logout = () => {
    const newState = { isLoggedIn: false, teacherId: null, username: null };
    setAuth(newState);
    localStorage.removeItem('classlink_auth');
  };

  return { auth, login, logout };
};
