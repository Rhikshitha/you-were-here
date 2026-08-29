export const APP_CONFIG = {
  // App Identity
  // APP_NAME: 'YOU WERE HERE',
  TAGLINE: 'The world has memories. Go find them.',

  // Place Radius Definitions (in meters)
  DEFAULT_PLACE_RADIUS: 50,
  CATEGORY_RADII: {
    Cafe: 50,
    Restaurant: 50,
    Park: 150,
    College: 200,
    Beach: 250,
    Concert: 300,
    'Tourist Attraction': 150,
    Shopping: 100,
    Landmark: 100,
    Other: 50,
  } as Record<string, number>,

  // Memory Rules & Limits
  MEMORY_MAX_CHARACTERS: 500,
  PAGINATION_LIMIT: 20,

  // Time & Age Thresholds (in days)
  FRESH_THRESHOLD_HOURS: 24,
  RECENT_THRESHOLD_DAYS: 7,
  OLD_THRESHOLD_DAYS: 30,
  GHOST_THRESHOLD_DAYS: 365,     // 1 Year
  ANCIENT_THRESHOLD_DAYS: 1825,  // 5 Years

  // Allowed Memory Reactions
  REACTIONS: ['❤️', '😂', '🥲', '👀'] as const,

  // Map Defaults (Center on initial load if location unavailable - e.g. San Francisco or default seed center)
  DEFAULT_MAP_REGION: {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
} as const;
