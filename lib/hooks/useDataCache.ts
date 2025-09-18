'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, Client } from '@/lib/types';
import { ProjectService } from '@/lib/supabase/database';
import { getActiveClients } from '@/lib/supabase/database';

interface CacheState {
  projects: Project[];
  clients: Client[];
  loading: {
    projects: boolean;
    clients: boolean;
  };
  lastFetch: {
    projects: number | null;
    clients: number | null;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useDataCache() {
  const [cache, setCache] = useState<CacheState>({
    projects: [],
    clients: [],
    loading: {
      projects: false,
      clients: false,
    },
    lastFetch: {
      projects: null,
      clients: null,
    },
  });

  const projectService = useMemo(() => new ProjectService(), []);

  const isCacheValid = useCallback((lastFetch: number | null): boolean => {
    if (!lastFetch) return false;
    return Date.now() - lastFetch < CACHE_DURATION;
  }, []);

  const fetchProjects = useCallback(async (force = false) => {
    if (!force && isCacheValid(cache.lastFetch.projects) && cache.projects.length > 0) {
      return cache.projects;
    }

    if (cache.loading.projects) {
      return cache.projects;
    }

    try {
      setCache(prev => ({
        ...prev,
        loading: { ...prev.loading, projects: true }
      }));

      const projects = await projectService.getAllProjects();
      
      setCache(prev => ({
        ...prev,
        projects,
        loading: { ...prev.loading, projects: false },
        lastFetch: { ...prev.lastFetch, projects: Date.now() }
      }));

      return projects;
    } catch (error) {
      setCache(prev => ({
        ...prev,
        loading: { ...prev.loading, projects: false }
      }));
      throw error;
    }
  }, [cache.lastFetch.projects, cache.projects, cache.loading.projects, isCacheValid, projectService]);

  const fetchClients = useCallback(async (force = false) => {
    if (!force && isCacheValid(cache.lastFetch.clients) && cache.clients.length > 0) {
      return cache.clients;
    }

    if (cache.loading.clients) {
      return cache.clients;
    }

    try {
      setCache(prev => ({
        ...prev,
        loading: { ...prev.loading, clients: true }
      }));

      const clients = await getActiveClients();
      
      setCache(prev => ({
        ...prev,
        clients,
        loading: { ...prev.loading, clients: false },
        lastFetch: { ...prev.lastFetch, clients: Date.now() }
      }));

      return clients;
    } catch (error) {
      setCache(prev => ({
        ...prev,
        loading: { ...prev.loading, clients: false }
      }));
      throw error;
    }
  }, [cache.lastFetch.clients, cache.clients, cache.loading.clients, isCacheValid]);

  const invalidateCache = useCallback((type?: 'projects' | 'clients') => {
    if (type) {
      setCache(prev => ({
        ...prev,
        lastFetch: { ...prev.lastFetch, [type]: null }
      }));
    } else {
      setCache(prev => ({
        ...prev,
        lastFetch: { projects: null, clients: null }
      }));
    }
  }, []);

  const addProject = useCallback((project: Project) => {
    setCache(prev => ({
      ...prev,
      projects: [...prev.projects, project]
    }));
  }, []);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    setCache(prev => ({
      ...prev,
      projects: prev.projects.map(p => 
        p.id === projectId ? { ...p, ...updates } : p
      )
    }));
  }, []);

  const removeProject = useCallback((projectId: string) => {
    setCache(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== projectId)
    }));
  }, []);

  return {
    // Data
    projects: cache.projects,
    clients: cache.clients,
    
    // Loading states
    isLoadingProjects: cache.loading.projects,
    isLoadingClients: cache.loading.clients,
    
    // Fetch functions
    fetchProjects,
    fetchClients,
    
    // Cache management
    invalidateCache,
    
    // Project mutations
    addProject,
    updateProject,
    removeProject,
    
    // Utility
    isCacheValid: (type: 'projects' | 'clients') => 
      isCacheValid(cache.lastFetch[type])
  };
}

export type DataCacheHook = ReturnType<typeof useDataCache>;