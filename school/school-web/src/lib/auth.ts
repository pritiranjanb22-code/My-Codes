'use client';

import { jwtDecode } from 'jose';

const ACCESS_TOKEN_KEY = 'school_access_token';
const REFRESH_TOKEN_KEY = 'school_refresh_token';
const USER_KEY = 'school_user';

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setUser = (user: User) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode(token) as { exp: number };
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const getTokenExpiry = (token: string): number | null => {
  try {
    const decoded = jwtDecode(token) as { exp: number };
    return decoded.exp * 1000;
  } catch {
    return null;
  }
};

export const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
};

export const hasRole = (user: User | null, roles: string[]): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  return !!token && !isTokenExpired(token);
};

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  schoolId?: string;
  exp: number;
  iat: number;
}

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwtDecode(token) as JWTPayload;
  } catch {
    return null;
  }
};

import type { User } from '@/types';