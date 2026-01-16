import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { HRAdmin, AuthState } from '@/types';
import { authApi } from '@/services/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = 'hr_admin_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<HRAdmin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        setUser(parsed.user);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      
      if (response.success && response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: response.data }));
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Invalid credentials' };
      }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.logout();
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await authApi.forgotPassword(email);
      
      if (response.success) {
        return { success: true, message: response.message || 'Check your email for reset instructions' };
      } else {
        return { success: false, error: response.error || 'Failed to send reset email' };
      }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    forgotPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
