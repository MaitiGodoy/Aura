import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

let client: SupabaseClient | null = null;
let currentUser: User | null = null;

function getClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — running in local-only mode');
    return null;
  }
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    // Restore session on init
    client.auth.getSession().then(({ data }) => {
      currentUser = data.session?.user || null;
    });
    client.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
    });
  }
  return client;
}

export const SupabaseService = {
  /** Check if Supabase is configured */
  isAvailable: (): boolean => !!SUPABASE_URL && !!SUPABASE_ANON_KEY,

  /** Get current user or null */
  getUser: (): User | null => currentUser,

  /** Sign in with email + password */
  signIn: async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
    const c = getClient();
    if (!c) return { user: null, error: 'Supabase not configured' };
    const { data, error } = await c.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    currentUser = data.user;
    return { user: data.user, error: null };
  },

  /** Sign up with email + password */
  signUp: async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
    const c = getClient();
    if (!c) return { user: null, error: 'Supabase not configured' };
    const { data, error } = await c.auth.signUp({ email, password });
    if (error) return { user: null, error: error.message };
    currentUser = data.user;
    return { user: data.user, error: null };
  },

  /** Sign out */
  signOut: async (): Promise<void> => {
    currentUser = null;
    const c = getClient();
    if (!c) return;
    await c.auth.signOut();
  },

  /** Upsert user profile into profiles table */
  saveProfile: async (profile: { name: string; difficulty_level?: string; phase?: string }): Promise<void> => {
    const c = getClient();
    const user = currentUser;
    if (!c || !user) return;
    await c.from('profiles').upsert({
      id: user.id,
      email: user.email,
      name: profile.name,
      difficulty_level: profile.difficulty_level || 'AUTO',
      phase: profile.phase || 'PHASE_0',
      updated_at: new Date().toISOString(),
    });
  },

  /** Load user profile */
  loadProfile: async (): Promise<{ name: string; difficulty_level: string; phase: string } | null> => {
    const c = getClient();
    const user = currentUser;
    if (!c || !user) return null;
    const { data } = await c.from('profiles').select('*').eq('id', user.id).single();
    return data || null;
  },

  /** Save session report */
  saveSessionReport: async (report: any): Promise<void> => {
    const c = getClient();
    const user = currentUser;
    if (!c || !user) return;
    const { cardsCollected, ...rest } = report;
    await c.from('sessions').insert({
      user_id: user.id,
      ...rest,
      cards_collected: cardsCollected ? JSON.stringify(cardsCollected) : null,
      created_at: new Date().toISOString(),
    });
  },

  /** Load session history */
  loadSessionHistory: async (): Promise<any[]> => {
    const c = getClient();
    const user = currentUser;
    if (!c || !user) return [];
    const { data } = await c.from('sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
    return data || [];
  },
};
