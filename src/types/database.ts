export type MemoryType = 'memory' | 'warning' | 'confession' | 'question' | 'time_capsule' | 'mystery';
export type IdentityVisibility = 'anonymous' | 'display_name' | 'username';
export type MemoryVisibility = 'anyone' | 'friends' | 'invite';
export type ExpirationType = '24h' | '7d' | '30d' | 'never';
export type ModerationStatus = 'pending' | 'approved' | 'hidden' | 'removed' | 'reported';
export type ReactionEmoji = '❤️' | '😂' | '🥲' | '👀';

export type PlaceCategory =
  | 'Cafe'
  | 'Restaurant'
  | 'Park'
  | 'College'
  | 'Beach'
  | 'Concert'
  | 'Tourist Attraction'
  | 'Shopping'
  | 'Landmark'
  | 'Other';

export interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface PlaceRow {
  id: string;
  name: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  radius_meters: number;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface MemoryRow {
  id: string;
  place_id: string;
  author_id: string | null;
  content: string;
  memory_type: MemoryType;
  identity_visibility: IdentityVisibility;
  visibility: MemoryVisibility;
  expiration_type: ExpirationType;
  created_at: string;
  expires_at: string | null;
  moderation_status: ModerationStatus;
}

export interface MemoryReactionRow {
  id: string;
  memory_id: string;
  user_id: string;
  emoji: ReactionEmoji;
  created_at: string;
}

export interface MemoryReportRow {
  id: string;
  memory_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  created_at: string;
}

export interface AchievementRow {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
}

export interface UserAchievementRow {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}
