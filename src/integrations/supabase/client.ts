import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Project: cygkegywyqqajtaymdfw (Lovable-managed Supabase)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://cygkegywyqqajtaymdfw.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Z2tlZ3l3eXFxYWp0YXltZGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NzczNjUsImV4cCI6MjA5NzA1MzM2NX0._hzWe6Ja_Las836x93o_1oBokBQhqvMkxqcD2Ed8myw";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});
