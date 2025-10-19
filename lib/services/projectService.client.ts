import { createClient } from '@/lib/supabase/client';
import type { Client } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

// Client-only service functions for use in 'use client' components
// This file avoids importing server-only modules like next/headers.

export async function getActiveClients(): Promise<Client[]> {
  const supabase = createClient() as unknown as SupabaseClient;
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching clients (client service):', error);
    throw new Error('Error al obtener clientes');
  }

  return data || [];
}