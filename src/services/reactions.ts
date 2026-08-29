import { supabase } from '../lib/supabase';
import { ReactionEmoji } from '../types/database';
import { APP_CONFIG } from '../constants/config';

export const reactionsService = {
  /**
   * Toggle a reaction on a memory item (❤️, 😂, 🥲, 👀)
   */
  async toggleReaction(
    memoryId: string,
    userId: string,
    emoji: ReactionEmoji
  ): Promise<{ action: 'added' | 'removed'; error: string | null }> {
    try {
      if (!APP_CONFIG.REACTIONS.includes(emoji as any)) {
        return { action: 'removed', error: 'Invalid reaction emoji.' };
      }

      // Check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from('memory_reactions')
        .select('*')
        .eq('memory_id', memoryId)
        .eq('user_id', userId)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        // Delete reaction
        const { error: delError } = await supabase
          .from('memory_reactions')
          .delete()
          .eq('id', existing.id);

        if (delError) console.warn('Supabase reaction delete error:', delError.message);
        return { action: 'removed', error: null };
      } else {
        // Insert reaction
        const { error: insError } = await supabase
          .from('memory_reactions')
          .insert([{ memory_id: memoryId, user_id: userId, emoji }]);

        if (insError) console.warn('Supabase reaction insert error:', insError.message);
        return { action: 'added', error: null };
      }
    } catch (err: any) {
      return { action: 'removed', error: err.message || 'Could not save your reaction.' };
    }
  },

  /**
   * Submit a report against a memory
   */
  async reportMemory(
    memoryId: string,
    reporterId: string,
    reason: string,
    details?: string
  ): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.from('memory_reports').insert([
        {
          memory_id: memoryId,
          reporter_id: reporterId,
          reason,
          details: details || null,
        },
      ]);

      if (error) {
        console.warn('Report insert warning:', error.message);
      }

      // Check report count threshold (auto-flagging rule)
      const { count } = await supabase
        .from('memory_reports')
        .select('*', { count: 'exact', head: true })
        .eq('memory_id', memoryId);

      if (count && count >= 3) {
        await supabase
          .from('memories')
          .update({ moderation_status: 'hidden' })
          .eq('id', memoryId);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to submit report.' };
    }
  },
};
