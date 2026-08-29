import {
  PlaceCategory,
  MemoryType,
  IdentityVisibility,
  MemoryVisibility,
  ExpirationType,
  ReactionEmoji,
} from './database';

export {
  PlaceCategory,
  MemoryType,
  IdentityVisibility,
  MemoryVisibility,
  ExpirationType,
  ReactionEmoji,
};

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

export interface MemoryItem {
  id: string;
  place_id: string;
  user_id?: string | null;
  author_id?: string | null;
  content: string;
  memory_type: MemoryType | string;
  identity_visibility: IdentityVisibility | string;
  visibility: MemoryVisibility | string;
  created_at: string;
  expiration_type: ExpirationType | string;
  expires_at?: string | null;
  author_name?: string | null;
  author_username?: string | null;
  reaction_counts?: Record<string, number>;
  user_reaction?: string | null;
}

export interface PlaceSummary {
  id: string;
  name: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  radius_meters: number;
  distance_meters?: number;
  is_unlocked?: boolean;
  memory_count: number;
  oldest_memory_created_at: string | null;
  newest_memory_created_at: string | null;
}

export interface UserProfileStats {
  places_discovered: number;
  memories_discovered: number;
  memories_left: number;
  ghost_memories_found: number;
}
