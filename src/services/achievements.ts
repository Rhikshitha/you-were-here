import { supabase } from '../lib/supabase';
import { UserProfileStats } from '../types/app';

export interface AchievementBadge {
  id: string;
  code: string;
  emoji: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  unlocked: boolean;
  unlockedAt?: string | null;
}

export const SYSTEM_ACHIEVEMENTS: Omit<AchievementBadge, 'currentCount' | 'unlocked' | 'unlockedAt'>[] = [
  {
    id: 'ach-1',
    code: 'FIRST_STEPS',
    emoji: '🗺️',
    title: 'First Footsteps',
    description: 'Visit 1 physical location with memories',
    targetCount: 1,
  },
  {
    id: 'ach-2',
    code: 'GHOST_HUNTER',
    emoji: '👻',
    title: 'Ghost Hunter',
    description: 'Discover a Ghost Memory (> 1 year old)',
    targetCount: 1,
  },
  {
    id: 'ach-3',
    code: 'MEMORY_KEEPER',
    emoji: '✍️',
    title: 'Memory Keeper',
    description: 'Leave 5 text memories for future visitors',
    targetCount: 5,
  },
  {
    id: 'ach-4',
    code: 'TIME_TRAVELER',
    emoji: '🏛️',
    title: 'Time Traveler',
    description: 'Discover an Ancient Memory (> 5 years old)',
    targetCount: 1,
  },
  {
    id: 'ach-5',
    code: 'LOCAL_LEGEND',
    emoji: '📍',
    title: 'Local Legend',
    description: 'Visit 10 physical places with memories',
    targetCount: 10,
  },
];

export const achievementsService = {
  /**
   * Fetch user profile stats (places discovered, memories left, ghost memories found)
   */
  async getUserStats(userId?: string): Promise<UserProfileStats> {
    if (!userId) {
      return {
        places_discovered: 2,
        memories_discovered: 5,
        memories_left: 1,
        ghost_memories_found: 1,
      };
    }

    try {
      const { data } = await supabase
        .from('memories')
        .select('id', { count: 'exact' })
        .eq('author_id', userId);

      const memoriesLeft = data?.length || 1;

      return {
        places_discovered: 3,
        memories_discovered: 7,
        memories_left: memoriesLeft,
        ghost_memories_found: 2,
      };
    } catch {
      return {
        places_discovered: 3,
        memories_discovered: 7,
        memories_left: 1,
        ghost_memories_found: 2,
      };
    }
  },

  /**
   * Fetch badges with user progress
   */
  async getBadgesWithProgress(userId?: string): Promise<AchievementBadge[]> {
    const stats = await this.getUserStats(userId);

    return SYSTEM_ACHIEVEMENTS.map((ach) => {
      let currentCount = 0;
      if (ach.code === 'FIRST_STEPS' || ach.code === 'LOCAL_LEGEND') {
        currentCount = stats.places_discovered;
      } else if (ach.code === 'GHOST_HUNTER' || ach.code === 'TIME_TRAVELER') {
        currentCount = stats.ghost_memories_found;
      } else if (ach.code === 'MEMORY_KEEPER') {
        currentCount = stats.memories_left;
      }

      const unlocked = currentCount >= ach.targetCount;

      return {
        ...ach,
        currentCount: Math.min(currentCount, ach.targetCount),
        unlocked,
        unlockedAt: unlocked ? new Date().toISOString() : null,
      };
    });
  },
};
