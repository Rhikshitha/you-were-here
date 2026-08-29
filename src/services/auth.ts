import { supabase } from '../lib/supabase';
import { ProfileRow } from '../types/database';

export interface AuthResponse<T = any> {
  data: T | null;
  error: string | null;
}

export const authService = {
  /**
   * Check if a username is already taken in the profiles table
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername) return false;

      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error checking username:', error.message);
        return true; // Fallback
      }

      return !data;
    } catch {
      return true;
    }
  },

  /**
   * Sign up a new user with Email, Password, Username, and Display Name
   */
  async signUp(
    email: string,
    password: string,
    username: string,
    displayName?: string
  ): Promise<AuthResponse<{ user: any; profile: ProfileRow }>> {
    try {
      const cleanUsername = username.trim().toLowerCase();
      
      // 1. Validate username format
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
        return {
          data: null,
          error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores.',
        };
      }

      // 2. Check username availability
      const available = await this.isUsernameAvailable(cleanUsername);
      if (!available) {
        return { data: null, error: 'Username is already taken. Please choose another.' };
      }

      // 3. Supabase Auth signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: displayName?.trim() || cleanUsername,
          },
        },
      });

      if (authError) {
        return { data: null, error: authError.message };
      }

      if (!authData.user) {
        return { data: null, error: 'Failed to create user account.' };
      }

      // 4. Create profile entry in database
      const newProfile: Partial<ProfileRow> = {
        id: authData.user.id,
        username: cleanUsername,
        display_name: displayName?.trim() || cleanUsername,
        avatar_url: null,
      };

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select()
        .single();

      if (profileError) {
        console.warn('Profile upsert warning:', profileError.message);
      }

      return {
        data: {
          user: authData.user,
          profile: (profileData as ProfileRow) || {
            id: authData.user.id,
            username: cleanUsername,
            display_name: displayName?.trim() || cleanUsername,
            avatar_url: null,
            created_at: new Date().toISOString(),
          },
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'An unexpected error occurred during signup.' };
    }
  },

  /**
   * Log in existing user with Email and Password
   */
  async signIn(
    email: string,
    password: string
  ): Promise<AuthResponse<{ session: any; profile: ProfileRow | null }>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      let profile: ProfileRow | null = null;
      if (data.user) {
        profile = await this.getProfile(data.user.id);
      }

      return {
        data: {
          session: data.session,
          profile,
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to log in.' };
    }
  },

  /**
   * Log out the current user session
   */
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Logout failed.' };
    }
  },

  /**
   * Fetch profile by User ID
   */
  async getProfile(userId: string): Promise<ProfileRow | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) return null;
      return data as ProfileRow;
    } catch {
      return null;
    }
  },
};
