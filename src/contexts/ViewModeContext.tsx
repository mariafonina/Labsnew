import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../api/client';

type ViewMode = 'admin' | 'user';

interface ViewModeContextType {
  viewMode: ViewMode;
  isUserViewMode: boolean;
  toggleViewMode: () => void;
  setViewMode: (mode: ViewMode) => void;
  canSwitchViewMode: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

const STORAGE_KEY = 'admin_view_mode';

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return (saved === 'user' ? 'user' : 'admin') as ViewMode;
    }
    return 'admin';
  });

  useEffect(() => {
    if (!isAdmin) {
      setViewModeState('admin');
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      sessionStorage.setItem(STORAGE_KEY, viewMode);
    }
  }, [viewMode, isAdmin]);

  useEffect(() => {
    const shouldEnableFullPreview = isAdmin && viewMode === 'user';
    apiClient.setAdminFullPreviewMode(shouldEnableFullPreview);
  }, [isAdmin, viewMode]);

  const toggleViewMode = useCallback(() => {
    if (!isAdmin) return;
    setViewModeState(prev => prev === 'admin' ? 'user' : 'admin');
  }, [isAdmin]);

  const setViewMode = useCallback((mode: ViewMode) => {
    if (!isAdmin) return;
    setViewModeState(mode);
  }, [isAdmin]);

  const isUserViewMode = isAdmin && viewMode === 'user';
  const canSwitchViewMode = isAdmin;

  return (
    <ViewModeContext.Provider
      value={{
        viewMode: isAdmin ? viewMode : 'user',
        isUserViewMode,
        toggleViewMode,
        setViewMode,
        canSwitchViewMode,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
