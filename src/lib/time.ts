import { formatDistanceToNow, differenceInDays, isPast } from 'date-fns';
import { APP_CONFIG } from '../constants/config';
import { COLORS } from '../constants/theme';

export type AgeCategory = 'fresh' | 'recent' | 'old' | 'ghost' | 'ancient';

/**
 * Returns human-readable relative time (e.g., "11 minutes ago", "847 days ago")
 */
export function formatMemoryAge(createdAtIso: string): string {
  try {
    const date = new Date(createdAtIso);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'sometime ago';
  }
}

export function formatExactTimeAgo(createdAtIso: string): string {
  return formatMemoryAge(createdAtIso);
}

/**
 * Checks if a temporary memory has expired
 */
export function isMemoryExpired(expiresAtIso: string | null | undefined): boolean {
  if (!expiresAtIso) return false;
  try {
    return isPast(new Date(expiresAtIso));
  } catch {
    return false;
  }
}

/**
 * Classifies a memory's age based on deterministic time rules
 */
export function classifyMemoryAge(createdAtIso: string): AgeCategory {
  try {
    const created = new Date(createdAtIso);
    const daysOld = differenceInDays(new Date(), created);

    if (daysOld >= APP_CONFIG.ANCIENT_THRESHOLD_DAYS) {
      return 'ancient';
    }
    if (daysOld >= APP_CONFIG.GHOST_THRESHOLD_DAYS) {
      return 'ghost';
    }
    if (daysOld >= APP_CONFIG.OLD_THRESHOLD_DAYS) {
      return 'old';
    }
    if (daysOld >= 1) {
      return 'recent';
    }
    return 'fresh';
  } catch {
    return 'recent';
  }
}

export function getMemoryAgeCategory(createdAtIso: string): AgeCategory {
  return classifyMemoryAge(createdAtIso);
}

export function getAgeColor(category: AgeCategory): string {
  switch (category) {
    case 'fresh':
      return COLORS.secondary;
    case 'recent':
      return COLORS.primary;
    case 'old':
      return COLORS.textSecondary;
    case 'ghost':
      return COLORS.ghost;
    case 'ancient':
      return COLORS.ancient;
    default:
      return COLORS.textMuted;
  }
}

export function getAgeLabel(category: AgeCategory): string {
  switch (category) {
    case 'fresh':
      return 'Fresh';
    case 'recent':
      return 'Recent';
    case 'old':
      return 'Old';
    case 'ghost':
      return 'Ghost (1yr+)';
    case 'ancient':
      return 'Ancient (5yr+)';
  }
}
