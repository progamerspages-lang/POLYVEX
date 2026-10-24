import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Environment variables for client-side Supabase authentication
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Honest check: verify credentials are non-empty and not dummy placeholders
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder')
);

let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    supabaseInstance = null;
  }
}

export function getSupabase(): SupabaseClient | null {
  return supabaseInstance;
}

export interface AuthResponse {
  success: boolean;
  user?: User | null;
  session?: Session | null;
  error?: string;
  isConfirmationPending?: boolean;
}

/**
 * Real Supabase sign-up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResponse> {
  if (!isSupabaseConfigured || !supabaseInstance) {
    return {
      success: false,
      error: 'Supabase Auth is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  try {
    const { data, error } = await supabaseInstance.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Check if email confirmation is required before login
    const isConfirmationPending = !data.session && Boolean(data.user);

    return {
      success: true,
      user: data.user,
      session: data.session,
      isConfirmationPending,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred during signup.' };
  }
}

/**
 * Real Supabase sign-in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  if (!isSupabaseConfigured || !supabaseInstance) {
    return {
      success: false,
      error: 'Supabase Auth is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  try {
    const { data, error } = await supabaseInstance.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred during sign in.' };
  }
}

/**
 * Real Supabase password reset request
 */
export async function resetPasswordForEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabaseInstance) {
    return {
      success: false,
      error: 'Supabase Auth is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  try {
    const { error } = await supabaseInstance.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'An error occurred while requesting password reset.' };
  }
}

/**
 * Real Supabase sign out
 */
export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabaseInstance) {
    return { success: true };
  }

  try {
    const { error } = await supabaseInstance.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Get current session if configured
 */
export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured || !supabaseInstance) {
    return null;
  }
  try {
    const { data } = await supabaseInstance.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Subscribe to authentication state changes
 */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  if (!isSupabaseConfigured || !supabaseInstance) {
    return { unsubscribe: () => {} };
  }
  const { data: { subscription } } = supabaseInstance.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return subscription;
}
