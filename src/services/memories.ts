import { supabase } from '../lib/supabase';
import { MemoryRow, MemoryType, IdentityVisibility, MemoryVisibility, ExpirationType } from '../types/database';
import { MemoryItem } from '../types/app';
import { isMemoryExpired } from '../lib/time';
import { placesService } from './places';

/**
 * `author_id` and `place_id` are foreign keys; a raw constraint name means
 * nothing to a user, so translate the ones we can actually hit.
 */
function friendlyMemoryError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('memories_author_id_fkey')) {
    return 'Your profile is still being set up. Reopen the app and try again.';
  }
  if (m.includes('memories_place_id_fkey')) {
    return 'This place no longer exists.';
  }
  if (m.includes('row-level security')) {
    return 'You need to be signed in to leave a memory.';
  }
  return message;
}

/**
 * Respect each memory's identity_visibility when naming its author.
 */
function authorLabel(
  visibility: string,
  author: { username?: string | null; display_name?: string | null } | null
): string {
  if (visibility === 'anonymous') return 'Anonymous Explorer';
  if (visibility === 'username') return author?.username ? `@${author.username}` : 'Explorer';
  return author?.display_name || author?.username || 'Explorer';
}

export const memoriesService = {
  /**
   * Fetch every memory left at a place. Memories are always readable — there is
   * no proximity gate.
   */
  async getMemoriesForPlace(
    placeId: string
  ): Promise<{ data: MemoryItem[] | null; error: string | null }> {
    try {
      const place = await placesService.getPlaceById(placeId);
      if (!place) {
        return { data: null, error: 'Place not found.' };
      }

      const { data, error } = await supabase
        .from('memories')
        .select('*, profiles:author_id (username, display_name)')
        .eq('place_id', placeId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }
      if (!data) {
        return { data: [], error: null };
      }

      const formatted: MemoryItem[] = (data as any[])
        .filter((m) => !isMemoryExpired(m.expires_at))
        .map((m) => {
          const author = m.profiles || null;
          return {
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
            // The author chose per-memory how much of themselves to show.
            author_name: authorLabel(m.identity_visibility, author),
            author_username:
              m.identity_visibility === 'username' ? author?.username ?? null : null,
            reaction_counts: {},
          };
        });

      return { data: formatted, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to fetch memories.' };
    }
  },

  /**
   * Delete one of your own memories. The `author_id` filter mirrors the RLS
   * policy, so another user's memory is never even attempted.
   */
  async deleteMemory(memoryId: string, userId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId)
        .eq('author_id', userId);

      if (error) return { error: friendlyMemoryError(error.message) };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Could not delete this memory.' };
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
        return { data: null, error: friendlyMemoryError(error.message) };
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
