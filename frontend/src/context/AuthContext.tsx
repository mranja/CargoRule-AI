'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, registerUser, getAuthMe } from '@/services/api';

export interface UserSession {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email?: string; password?: string; role?: 'admin' | 'user' }) => Promise<void>;
  signup: (details: { name: string; email: string; password?: string; role?: 'admin' | 'user' }) => Promise<void>;
  logout: () => void;
  loginAsRole: (role: 'admin' | 'user') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'cargorule_auth_token';
const USER_KEY = 'cargorule_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Initialize and verify authentication state on client mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (isMounted) {
              setToken(storedToken);
              setUser(parsedUser);
            }
          } catch {
            localStorage.removeItem(USER_KEY);
          }

          // Verify with backend
          const verifiedUser = await getAuthMe();
          if (isMounted) {
            if (verifiedUser) {
              setUser(verifiedUser);
              localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser));
            } else {
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(USER_KEY);
              setUser(null);
              setToken(null);
            }
          }
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (credentials: { email?: string; password?: string; role?: 'admin' | 'user' }) => {
      setIsLoading(true);
      try {
        const res = await loginUser(credentials);
        if (res.token && res.user) {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          setToken(res.token);
          setUser(res.user);
          router.push('/dashboard');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const signup = useCallback(
    async (details: { name: string; email: string; password?: string; role?: 'admin' | 'user' }) => {
      setIsLoading(true);
      try {
        const res = await registerUser(details);
        if (res.token && res.user) {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          setToken(res.token);
          setUser(res.user);
          router.push('/dashboard');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
    router.push('/login');
  }, [router]);

  const loginAsRole = useCallback(
    async (role: 'admin' | 'user') => {
      await login({ role });
    },
    [login]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        loginAsRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
