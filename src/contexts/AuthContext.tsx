import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');
    
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        apiClient.setToken(token);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await apiClient.login(username, password);
    apiClient.setToken(response.token);
    setUser(response.user);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('auth_token', response.token);
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await apiClient.register(username, email, password);
    apiClient.setToken(response.token);
    setUser(response.user);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('auth_token', response.token);
  };

  const logout = async () => {
    await apiClient.logout();
    apiClient.clearToken();
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
