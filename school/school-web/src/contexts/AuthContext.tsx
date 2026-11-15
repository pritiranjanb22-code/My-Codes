'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Role } from '@/types';
import { getAccessToken, getUser, isTokenExpired, clearTokens, setUser, refreshAccessToken } from '@/lib/auth';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      setUserState(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUserState(response.data);
      setUser(response.data);
    } catch {
      setUserState(null);
      clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token && !isTokenExpired(token)) {
        const storedUser = getUser();
        if (storedUser) {
          setUserState(storedUser);
        }
        await refreshUser();
      } else {
        setLoading(false);
      }
    };
    initAuth();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData, accessToken, refreshToken } = response.data;
    
    const { setTokens } = await import('@/lib/auth');
    setTokens(accessToken, refreshToken);
    setUser(userData);
    setUserState(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    } finally {
      clearTokens();
      setUserState(null);
    }
  };

  const hasRole = (roles: Role[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}