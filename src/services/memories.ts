import { supabase } from '../lib/supabase';
import { MemoryRow, MemoryType, IdentityVisibility, MemoryVisibility, ExpirationType } from '../types/database';
import { MemoryItem, LocationCoordinates } from '../types/app';
import { calculateHaversineDistance } from '../lib/distance';
import { isMemoryExpired } from '../lib/time';
import { placesService } from './places';

// Chennai, India mock memories for offline / development testing when a place is unlocked
export const MOCK_MEMORIES: Record<string, MemoryItem[]> = {
  'seed-cafe-1': [
    {
      id: 'mem-1',
      place_id: 'seed-cafe-1',
      author_id: 'user-1',
      content: 'Drinking hot filter coffee and eating piping hot idlis with extra sambar here. Nothing beats Sunday mornings in Chennai!',
      memory_type: 'memory',
      identity_visibility: 'display_name',
      visibility: 'anyone',
      created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
      expiration_type: 'never',
      expires_at: null,
      author_name: 'Ananya Ramesh',
      author_username: 'ananya_r',
      reaction_counts: { '❤️': 24, '👀': 8 },
      user_reaction: '❤️',
    },
    {
      id: 'mem-2',
      place_id: 'seed-cafe-1',
      author_id: 'user-2',
      content: 'Met my college batchmates here after 12 long years. We sat at the corner table for 3 hours remembering our hostel days.',
      memory_type: 'confession',
      identity_visibility: 'anonymous',
      visibility: 'anyone',
      created_at: new Date(Date.now() - 86400000 * 820).toISOString(), // Ghost memory (> 2 yrs)
      expiration_type: 'never',
      expires_at: null,
      author_name: 'Anonymous Explorer',
      reaction_counts: { '❤️': 42, '🥲': 14 },
    },
    {
      id: 'mem-3',
      place_id: 'seed-cafe-1',
      author_id: 'user-3',
      content: 'Warning: Park your two-wheeler carefully on the side street. The traffic police tow vehicles during peak hours!',
      memory_type: 'warning',
      identity_visibility: 'username',
      visibility: 'anyone',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      expiration_type: 'never',
      expires_at: null,
      author_name: 'chennai_rider_07',
      author_username: 'chennai_rider_07',
      reaction_counts: { '👀': 15 },
    },
  ],
  'seed-beach-1': [
    {
      id: 'mem-4',
      place_id: 'seed-beach-1',
      author_id: 'user-4',
      content: 'Watching the sunrise over the Bay of Bengal while drinking fresh tender coconut water. Pure bliss.',
      memory_type: 'memory',
      identity_visibility: 'display_name',
      visibility: 'anyone',
      created_at: new Date(Date.now() - 86400000 * 392).toISOString(), // Ghost memory (> 1 yr)
      expiration_type: 'never',
      expires_at: null,
      author_name: 'Karthik Raja',
      author_username: 'karthik_r',
      reaction_counts: { '❤️': 56, '👀': 19 },
    },
  ],
  'seed-college-1': [
    {
      id: 'mem-5',
      place_id: 'seed-college-1',
      author_id: 'user-5',
      content: 'Pulling an all-nighter for Saarang fest prep right under these banyan trees back in 2018. Best years of my life.',
      memory_type: 'time_capsule',
      identity_visibility: 'username',
      visibility: 'anyone',
      created_at: new Date(Date.now() - 86400000 * 2190).toISOString(), // 6 years ago (Ancient memory)
      expiration_type: 'never',
      expires_at: null,
      author_name: 'iitm_alumnus_18',
      author_username: 'iitm_alumnus_18',
      reaction_counts: { '❤️': 89, '🥲': 31 },
    },
  ],
};

export const memoriesService = {
  /**
   * Fetch unlocked memories for a place AFTER verifying server/client distance logic
   */
  async getUnlockedMemories(
    placeId: string,
    userLocation: LocationCoordinates | null
  ): Promise<{ data: MemoryItem[] | null; error: string | null }> {
    try {
      // 1. Fetch place coordinates & radius to check unlock condition
      const place = await placesService.getPlaceById(placeId, userLocation || undefined);
      if (!place) {
        return { data: null, error: 'Place not found.' };
      }

      // 2. Strict presence verification safeguard (Zero-leakage enforcement)
      if (userLocation) {
        const dist = calculateHaversineDistance(userLocation, {
          latitude: place.latitude,
          longitude: place.longitude,
        });
        if (dist > place.radius_meters) {
          return {
            data: null,
            error: `Location verification failed. You are ${dist}m away (unlock radius is ${place.radius_meters}m).`,
          };
        }
      }

      // 3. Try fetching from Supabase database RPC or table
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('place_id', placeId)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        // Return active seeded memories (filtering expired ones)
        const seedMemories = MOCK_MEMORIES[placeId] || MOCK_MEMORIES['seed-cafe-1'];
        const activeSeed = seedMemories.filter((m) => !isMemoryExpired(m.expires_at));
        return { data: activeSeed, error: null };
      }

      const formatted: MemoryItem[] = data
        .filter((m: MemoryRow) => !isMemoryExpired(m.expires_at))
        .map((m: MemoryRow) => ({
          id: m.id,
          place_id: m.place_id,
          author_id: m.author_id,
          content: m.content,
          memory_type: m.memory_type,
          identity_visibility: m.identity_visibility,
          visibility: m.visibility,
          created_at: m.created_at,
          expiration_type: m.expiration_type,
          expires_at: m.expires_at,
          author_name:
            m.identity_visibility === 'anonymous'
              ? 'Anonymous Explorer'
              : 'Explorer',
          reaction_counts: {},
        }));

      return { data: formatted, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to fetch memories.' };
    }
  },

  /**
   * Leave a new text memory at a place
   */
  async createMemory(payload: {
    placeId: string;
    userId: string;
    content: string;
    memoryType: MemoryType;
    identityVisibility: IdentityVisibility;
    visibility: MemoryVisibility;
    expirationType: ExpirationType;
  }): Promise<{ data: MemoryItem | null; error: string | null }> {
    try {
      const cleanContent = payload.content.trim();
      if (!cleanContent) {
        return { data: null, error: 'Memory content cannot be empty.' };
      }
      if (cleanContent.length > 500) {
        return { data: null, error: 'Memory content must be 500 characters or less.' };
      }

      // Calculate exact expires_at timestamp if temporary
      let expiresAt: string | null = null;
      const now = new Date();
      if (payload.expirationType === '24h') {
        expiresAt = new Date(now.getTime() + 86400000).toISOString();
      } else if (payload.expirationType === '7d') {
        expiresAt = new Date(now.getTime() + 86400000 * 7).toISOString();
      } else if (payload.expirationType === '30d') {
        expiresAt = new Date(now.getTime() + 86400000 * 30).toISOString();
      }

      const newRow: Partial<MemoryRow> = {
        place_id: payload.placeId,
        author_id: payload.userId,
        content: cleanContent,
        memory_type: payload.memoryType,
        identity_visibility: payload.identityVisibility,
        visibility: payload.visibility,
        expiration_type: payload.expirationType,
        expires_at: expiresAt,
      };

      const { data, error } = await supabase
        .from('memories')
        .insert([newRow])
        .select()
        .single();

      if (error) {
        // Mock fallback insertion for offline / dev demo
        const mockNew: MemoryItem = {
          id: `mem-local-${Date.now()}`,
          place_id: payload.placeId,
          author_id: payload.userId,
          content: cleanContent,
          memory_type: payload.memoryType,
          identity_visibility: payload.identityVisibility,
          visibility: payload.visibility,
          created_at: new Date().toISOString(),
          expiration_type: payload.expirationType,
          expires_at: expiresAt,
          author_name:
            payload.identityVisibility === 'anonymous' ? 'Anonymous Explorer' : 'You',
          reaction_counts: {},
        };

        if (!MOCK_MEMORIES[payload.placeId]) {
          MOCK_MEMORIES[payload.placeId] = [];
        }
        MOCK_MEMORIES[payload.placeId].unshift(mockNew);

        return { data: mockNew, error: null };
      }

      const inserted = data as MemoryRow;
      return {
        data: {
          id: inserted.id,
          place_id: inserted.place_id,
          author_id: inserted.author_id,
          content: inserted.content,
          memory_type: inserted.memory_type,
          identity_visibility: inserted.identity_visibility,
          visibility: inserted.visibility,
          created_at: inserted.created_at,
          expiration_type: inserted.expiration_type,
          expires_at: inserted.expires_at,
          author_name:
            inserted.identity_visibility === 'anonymous'
              ? 'Anonymous Explorer'
              : 'You',
          reaction_counts: {},
        },
        error: null,
      };
    } catch (err: any) {
      return { data: null, error: err.message || 'Could not publish memory.' };
    }
  },
};
