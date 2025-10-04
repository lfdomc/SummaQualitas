'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function useAuthSimple() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  console.log('🚀 [useAuthSimple] Hook inicializado');

  useEffect(() => {
    console.log('⚡⚡⚡ [useAuthSimple] useEffect EJECUTÁNDOSE!!!');
    
    // Función simple para probar
    const testFunction = () => {
      console.log('🧪 [useAuthSimple] Función de prueba ejecutándose...');
      setLoading(false);
    };
    
    // Ejecutar inmediatamente
    testFunction();
    
    // También probar con timeout
    const timer = setTimeout(() => {
      console.log('⏰ [useAuthSimple] Timer ejecutándose...');
    }, 1000);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  return { user, profile, loading, isAuthenticated: !!user };
}