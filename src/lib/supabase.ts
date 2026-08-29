import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Mobile SecureStore persistence adapter for Supabase Auth
// Warn if env vars are missing (helps debug “Failed to fetch” errors)
if (!supabaseUrl) {
  console.warn('⚠️ EXPO_PUBLIC_SUPABASE_URL not set – Supabase auth will fail. Add it to a .env file at the project root.');
}
if (!supabaseAnonKey) {
  console.warn('⚠️ EXPO_PUBLIC_SUPABASE_ANON_KEY not set – Supabase auth will fail. Add it to a .env file at the project root.');
}
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// Handle Node.js SSR WebSocket support if native WebSocket is absent
let customWebSocket: any = undefined;
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  try {
    customWebSocket = require('ws');
  } catch {
    // ws package fallback
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: customWebSocket
    ? {
        transport: customWebSocket,
      }
    : undefined,
});
